#[allow(dead_code, unused)]
use polling::{
    config::{setup_cors, setup_tracing},
    routes::create_router,
    state::AppState,
    websocket::start_ws_server,
};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_sessions::MemoryStore;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    setup_tracing();

    let app_state = AppState::new();
    let ws_app_state = app_state.clone();
    let session_store = MemoryStore::default();

    let app = create_router(app_state.clone(), session_store);

    tokio::spawn(async move {
        start_ws_server(ws_app_state).await;
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
