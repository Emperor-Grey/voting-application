use http::{HeaderName, HeaderValue, Method, header::CONTENT_TYPE};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn setup_tracing() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| format!("{}=info", env!("CARGO_CRATE_NAME")).into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}

pub fn setup_cors() -> CorsLayer {
    let frontend_url = std::env::var("FRONTEND_URL").expect("Expected FRONTEND_URL");

    CorsLayer::new()
        .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
        .allow_credentials(true)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([
            CONTENT_TYPE,
            HeaderName::from_static("accept"),
            HeaderName::from_static("authorization"),
            HeaderName::from_static("x-requested-with"),
        ])
        .expose_headers([
            HeaderName::from_static("access-control-allow-credentials"),
            HeaderName::from_static("access-control-allow-origin"),
        ])
}
