#![allow(dead_code, unused)]
use axum::http::HeaderName;
use axum::{
    extract::{Extension, Path},
    http::{HeaderValue, StatusCode},
    response::IntoResponse,
    routing::{get, post, trace_service},
    Json, Router,
};
use error::WebauthnError;
use http::Method;
use reqwest::{header::CONTENT_TYPE, Url};
use sqlx::{mysql::MySqlPoolOptions, MySqlPool};
use startup::AppState;
use std::{net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_sessions::{
    cookie::{time::Duration, SameSite},
    Expiry, MemoryStore, Session, SessionManagerLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;
use webauthn_rs::{
    prelude::{PasskeyAuthentication, PublicKeyCredential, RegisterPublicKeyCredential},
    Webauthn, WebauthnBuilder,
};
use websocket::{
    create_poll, get_poll, list_polls, poll_routes, poll_websocket_handler, websocket_routes,
};

mod error;
mod startup;
mod websocket;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    // let db_url = std::env::var("DATABASE_URL").expect("Expected DATABASE_URL");
    let frontend_url = std::env::var("FRONTEND_URL").expect("Expected FRONTEND_URL");
    set_up_tracing();

    let app_state = AppState::new();

    // Dummy clones one for websockets and one for the main app
    let new_app_state = app_state.clone();
    let ws_app_state = new_app_state.clone();

    let session_store = MemoryStore::default();

    // let pool = connect_database(&db_url)
    //     .await
    //     .expect("Failed to connect to database");

    let cors = CorsLayer::new()
        .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
        // Allow credentials (cookies, authorization headers, etc.)
        .allow_credentials(true)
        // Allow common HTTP methods
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        // Allow specific headers that the browser will send
        .allow_headers([
            CONTENT_TYPE,
            HeaderName::from_static("accept"),
            HeaderName::from_static("authorization"),
            HeaderName::from_static("x-requested-with"),
        ])
        // Expose specific headers that we want the browser to access
        .expose_headers([
            HeaderName::from_static("access-control-allow-credentials"),
            HeaderName::from_static("access-control-allow-origin"),
        ]);

    let app: Router = Router::new()
        .layer(cors)
        .merge(poll_routes())
        .merge(websocket_routes())
        .route("/", get(root))
        .route("/api/auth/register_start/{username}", post(start_register))
        .route("/api/auth/register_finish", post(finish_register))
        .route(
            "/api/auth/login_start/{username}",
            post(start_authentication),
        )
        .route("/api/auth/login_finish", post(finish_authentication))
        .layer(Extension(app_state))
        .layer(
            SessionManagerLayer::new(session_store)
                .with_name("webauthn")
                .with_same_site(SameSite::Strict)
                // TODO change this to true when running on an HTTPS/production server instead of locally
                .with_secure(false)
                .with_expiry(Expiry::OnInactivity(Duration::seconds(560))),
        )
        .with_state(new_app_state)
        .fallback(handler_404);

    tokio::spawn(async move {
        websocket::start_ws_server(ws_app_state).await;
    });

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    let listener = TcpListener::bind(&addr)
        .await
        .expect("Failed to bind to address");
    tracing::info!("Listening on http://{}", addr);

    axum::serve(listener, app.into_make_service())
        .await
        .expect("Failed to serve");
}

async fn handler_404() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        "nothing to see here mate just go to /login or register to start the flow...",
    )
}

fn set_up_tracing() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| format!("{}=info", env!("CARGO_CRATE_NAME")).into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}

async fn connect_database(db_url: &str) -> Result<MySqlPool, sqlx::Error> {
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(db_url)
        .await
        .expect("Failed to connect to database");

    Ok(pool)
}

async fn root() -> &'static str {
    "Hello, World!"
}

struct UserPayload {
    name: String,
    display_name: String,
}

pub async fn start_register(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Path(username): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    tracing::info!("Start register");
    let user_unique_id = {
        let users_guard = app_state.users.lock().await;
        users_guard
            .name_to_id
            .get(&username)
            .copied()
            .unwrap_or_else(Uuid::new_v4)
    };

    let _ = session.remove_value("reg_state").await;

    let exclude_credentials = {
        let users_guard = app_state.users.lock().await;
        users_guard
            .keys
            .get(&user_unique_id)
            .map(|keys| keys.iter().map(|sk| sk.cred_id().clone()).collect())
    };

    let res = match app_state.webauthn.start_passkey_registration(
        user_unique_id,
        &username,
        &username,
        exclude_credentials,
    ) {
        Ok((ccr, reg_state)) => {
            // sessions are safer than cookies
            session
                .insert("reg_state", (username, user_unique_id, reg_state))
                .await
                .expect("Failed to insert");
            tracing::info!("Registration Successful!");

            Json(ccr)
        }
        Err(e) => {
            tracing::info!("challenge_register -> {:?}", e);
            return Err(WebauthnError::Unknown);
        }
    };

    Ok(res)
}

// verify them and persist them.

pub async fn finish_register(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Json(reg): Json<RegisterPublicKeyCredential>,
) -> Result<impl IntoResponse, WebauthnError> {
    let (username, user_unique_id, reg_state) = match session.get("reg_state").await? {
        Some((username, user_unique_id, reg_state)) => (username, user_unique_id, reg_state),
        None => {
            tracing::info!("Failed to get session");
            return Err(WebauthnError::CorruptSession);
        }
    };

    let _ = session.remove_value("reg_state").await;

    let res = match app_state
        .webauthn
        .finish_passkey_registration(&reg, &reg_state)
    {
        Ok(sk) => {
            let mut users_guard = app_state.users.lock().await;

            // TODO This is where we would store the credential in a db, or persist them in some other way.
            users_guard
                .keys
                .entry(user_unique_id)
                .and_modify(|keys| keys.push(sk.clone()))
                .or_insert_with(|| vec![sk.clone()]);

            users_guard.name_to_id.insert(username, user_unique_id);

            StatusCode::OK
        }
        Err(e) => {
            tracing::info!("challenge_register -> {:?}", e);
            StatusCode::BAD_REQUEST
        }
    };

    Ok(res)
}

pub async fn start_authentication(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Path(username): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    tracing::info!("Start Authentication");
    // Remove any before stuff
    let _ = session.remove_value("auth_state").await;

    let users_guard = app_state.users.lock().await;

    let user_unique_id = users_guard
        .name_to_id
        .get(&username)
        .copied()
        .ok_or(WebauthnError::UserNotFound)?;

    let allow_credentials = users_guard
        .keys
        .get(&user_unique_id)
        .ok_or(WebauthnError::UserHasNoCredentials)?;

    let res = match app_state
        .webauthn
        .start_passkey_authentication(allow_credentials)
    {
        Ok((rcr, auth_state)) => {
            // Drop the mutex to allow the mut borrows below to proceed
            drop(users_guard);

            // sessions are safer than cookies
            session
                .insert("auth_state", (user_unique_id, auth_state))
                .await
                .expect("Failed to insert");
            Json(rcr)
        }
        Err(e) => {
            tracing::info!("challenge_authenticate -> {:?}", e);
            return Err(WebauthnError::Unknown);
        }
    };
    Ok(res)
}

pub async fn finish_authentication(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Json(auth): Json<PublicKeyCredential>,
) -> Result<impl IntoResponse, WebauthnError> {
    let (user_unique_id, auth_state): (Uuid, PasskeyAuthentication) = session
        .get("auth_state")
        .await?
        .ok_or(WebauthnError::CorruptSession)?;

    let _ = session.remove_value("auth_state").await;

    let res = match app_state
        .webauthn
        .finish_passkey_authentication(&auth, &auth_state)
    {
        Ok(auth_result) => {
            let mut users_guard = app_state.users.lock().await;

            users_guard
                .keys
                .get_mut(&user_unique_id)
                .map(|keys| {
                    keys.iter_mut().for_each(|k| {
                        k.update_credential(&auth_result);
                    })
                })
                .ok_or(WebauthnError::UserHasNoCredentials)?;

            session.insert("user_id", user_unique_id).await?;

            // Returning 201 for some reason i always forget this syntax only for this place...
            StatusCode::OK
        }
        Err(e) => {
            tracing::info!("challenge_register -> {:?}", e);
            StatusCode::BAD_REQUEST
        }
    };
    tracing::info!("Authentication Successful!");
    Ok(res)
}
