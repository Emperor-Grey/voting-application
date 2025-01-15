use crate::{
    config::setup_cors,
    handlers::{
        auth,
        poll::{create_poll, get_poll, list_polls, vote_poll},
    },
    state::AppState,
};
use axum::{
    extract::Extension,
    http::{HeaderValue, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use http::Method;
use tower_http::cors::CorsLayer;
use tower_sessions::{
    cookie::{time::Duration, SameSite},
    Expiry, MemoryStore, SessionManagerLayer,
};

use super::websocket::poll_websocket_handler;

pub fn create_router(app_state: AppState, session_store: MemoryStore) -> Router {
    let cors: CorsLayer = setup_cors();

    Router::new()
        .layer(cors)
        .merge(auth_routes())
        .merge(poll_routes())
        .merge(websocket_routes())
        .layer(Extension(app_state.clone()))
        .layer(
            SessionManagerLayer::new(session_store)
                .with_name("webauthn")
                .with_same_site(SameSite::Strict)
                .with_secure(true)
                .with_expiry(Expiry::OnInactivity(Duration::seconds(560))),
        )
        .with_state(app_state)
        .fallback(handler_404)
}

fn auth_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/api/auth/register_start/{username}",
            post(auth::start_register),
        )
        .route("/api/auth/register_finish", post(auth::finish_register))
        .route(
            "/api/auth/login_start/{username}",
            post(auth::start_authentication),
        )
        .route("/api/auth/login_finish", post(auth::finish_authentication))
}

pub fn poll_routes() -> Router<AppState> {
    Router::new()
        .route("/api/polls", post(create_poll))
        .route("/api/polls", get(list_polls))
        .route("/api/polls/{id}", get(get_poll))
        .route("/api/polls/{id}/vote", post(vote_poll))
}

pub fn websocket_routes() -> Router<AppState> {
    // CORS configuration specific to WebSocket routes
    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or("http://localhost:3000".to_string());

    let websocket_cors = CorsLayer::new()
        .allow_methods([Method::GET]) // Otherwise can't deploy
        .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
        .allow_credentials(true);

    Router::new()
        .layer(websocket_cors)
        .route("/ws/polls/{poll_id}", get(poll_websocket_handler))
}

pub async fn handler_404() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        "nothing to see here mate just go to /login or register to start the flow...",
    )
}