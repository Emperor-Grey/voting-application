use http::{header::CONTENT_TYPE, HeaderName, HeaderValue, Method};
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
    let frontend_urls: Vec<String> = std::env::var("FRONTEND_URL")
        .unwrap_or_else(|_| "http://13.61.25.120:3002".to_string())
        .split(',')
        .map(|s| s.to_string())
        .collect();

    let origins = frontend_urls
        .iter()
        .map(|url| url.parse::<HeaderValue>().unwrap())
        .collect::<Vec<HeaderValue>>();

    CorsLayer::new()
        .allow_credentials(true)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([
            CONTENT_TYPE,
            HeaderName::from_static("accept"),
            HeaderName::from_static("authorization"),
            HeaderName::from_static("x-requested-with"),
        ])
        .allow_origin(origins)
        .expose_headers([
            HeaderName::from_static("access-control-allow-credentials"),
            HeaderName::from_static("access-control-allow-origin"),
        ])
}
