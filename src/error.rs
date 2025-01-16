use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WebauthnError {
    #[error("unknown webauthn error")]
    Unknown,
    #[error("Corrupt Session")]
    CorruptSession,
    #[error("User Not Found")]
    UserNotFound,
    #[error("User Has No Credentials")]
    UserHasNoCredentials,
    #[error("Deserialising Session failed: {0}")]
    InvalidSessionState(#[from] tower_sessions::session::Error),
    #[error("Session Error: {0}")]
    SessionError(StatusCode, String),
    #[error("Not Authenticated")]
    NotAuthenticated,
    #[error("Unauthorized")]
    Unauthorized,
}
impl IntoResponse for WebauthnError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            WebauthnError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error occurred"),
            WebauthnError::NotAuthenticated => (StatusCode::UNAUTHORIZED, "Not authenticated"),
            WebauthnError::Unauthorized => (StatusCode::FORBIDDEN, "Not authorized"),
            WebauthnError::CorruptSession => (StatusCode::INTERNAL_SERVER_ERROR, "Corrupt Session"),
            WebauthnError::UserNotFound => (StatusCode::INTERNAL_SERVER_ERROR, "User Not Found"),
            WebauthnError::UserHasNoCredentials => {
                (StatusCode::INTERNAL_SERVER_ERROR, "User Has No Credentials")
            }
            WebauthnError::InvalidSessionState(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Deserialising Session failed",
            ),
            WebauthnError::SessionError(_, _msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Session Error")
            }
        };

        let body = Json(json!({
            "error": message
        }));

        (status, body).into_response()
    }
}
