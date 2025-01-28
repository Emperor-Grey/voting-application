use axum::{http::StatusCode, Router};
use axum_test::TestServer;
use polling::{routes::create_router, state::AppState};
use serde_json::json;
use tower_sessions::MemoryStore;
use uuid::Uuid;

// Helper function to create a test app instance
async fn create_test_app() -> Router {
    std::env::set_var("FRONTEND_URL", "http://localhost:3000");
    std::env::set_var("RP_ID", "localhost");
    std::env::set_var("RP_ORIGIN", "http://localhost:3000");

    let state = AppState::new();
    let session_store = MemoryStore::default();
    create_router(state, session_store)
}

// Helper function to authenticate and get session token
async fn authenticate_user(server: &TestServer, username: &str) -> String {
    // Start registration
    let reg_start = server
        .post(&format!("/api/auth/register_start/{}", username))
        .await;
    assert_eq!(reg_start.status_code(), StatusCode::OK);

    // Get session cookie
    let session_cookie = reg_start
        .cookies()
        .iter()
        .find(|c| c.name() == "webauthn")
        .expect("No session cookie found")
        .to_string();

    // Create mock credential
    let credential_id = base64::encode(Uuid::new_v4().as_bytes());
    let mock_credential = json!({
        "id": credential_id.clone(),
        "rawId": credential_id,
        "response": {
            "clientDataJSON": base64::encode(r#"{"type":"webauthn.create","challenge":"","origin":"http://localhost:3000","crossOrigin":false}"#),
            "attestationObject": base64::encode(r#"{"fmt":"packed","attStmt":{"alg":-7,"sig":"","x5c":[]},"authData":"AUTHDATA"}"#)
        },
        "authenticatorAttachment": "platform",
        "type": "public-key",
        "clientExtensionResults": {}
    });

    // Complete registration
    let reg_finish = server
        .post("/api/auth/register_finish")
        .add_header("Cookie", &session_cookie)
        .json(&mock_credential)
        .await;
    assert_eq!(reg_finish.status_code(), StatusCode::OK);

    // Start authentication
    let auth_start = server
        .post(&format!("/api/auth/authenticate_start/{}", username))
        .await;
    assert_eq!(auth_start.status_code(), StatusCode::OK);

    let auth_session = auth_start
        .cookies()
        .iter()
        .find(|c| c.name() == "webauthn")
        .expect("No session cookie found")
        .to_string();

    // Complete authentication with same credential
    let auth_finish = server
        .post("/api/auth/authenticate_finish")
        .add_header("Cookie", &auth_session)
        .json(&mock_credential)
        .await;
    assert_eq!(auth_finish.status_code(), StatusCode::OK);

    // Get the final session cookie
    let final_cookie = auth_finish
        .cookies()
        .iter()
        .find(|c| c.name() == "webauthn")
        .expect("No session cookie found")
        .to_string();

    // Verify the session is properly set
    let me_response = server
        .get("/api/auth/me")
        .add_header("Cookie", &final_cookie)
        .await;
    assert_eq!(me_response.status_code(), StatusCode::OK);

    // Add debug logging
    tracing::info!("Session cookie: {}", final_cookie);
    tracing::info!("Me response: {:?}", me_response);

    final_cookie
}

/*
#[tokio::test]
async fn test_poll_creation() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();
    let auth_token = authenticate_user(&server, "test_user").await;

    // Test successful poll creation
    let response = server
        .post("/api/polls")
        .add_header("Cookie", auth_token)
        .json(&json!({
            "title": "Test Poll",
            "options": ["Option 1", "Option 2"]
        }))
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);
    let poll: Poll = response.json::<Poll>();
    assert_eq!(poll.title, "Test Poll");
    assert_eq!(poll.options.len(), 2);
}

#[tokio::test]
async fn test_poll_voting() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();
    let auth_token = authenticate_user(&server, "test_user").await;

    // Create a poll first
    let create_response = server
        .post("/api/polls")
        .add_header("Cookie", auth_token)
        .json(&json!({
            "title": "Voting Test",
            "options": ["Option 1", "Option 2"]
        }))
        .await;

    let poll: Poll = create_response.json::<Poll>();

    // Test voting
    let vote_response = server
        .post(&format!("/api/polls/{}/vote", poll.id))
        .json(&json!({
            "option_id": poll.options[0].id
        }))
        .await;

    assert_eq!(vote_response.status_code(), StatusCode::OK);
    let updated_poll: Poll = vote_response.json::<Poll>();
    assert_eq!(updated_poll.options[0].votes, 1);
}

#[tokio::test]
async fn test_poll_management() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();
    let auth_token = authenticate_user(&server, "test_user").await;

    // Create a poll
    let poll: Poll = server
        .post("/api/polls")
        .add_header("Cookie", auth_token.clone())
        .json(&json!({
            "title": "Management Test",
            "options": ["Option 1", "Option 2"]
        }))
        .await
        .json::<Poll>();

    // Test closing poll
    let close_response = server
        .post(&format!("/api/polls/{}/close", poll.id))
        .add_header("Cookie", auth_token.clone())
        .await;

    assert_eq!(close_response.status_code(), StatusCode::OK);
    let closed_poll: Poll = close_response.json::<Poll>();
    assert!(closed_poll.is_closed);

    // Test resetting votes
    let reset_response = server
        .post(&format!("/api/polls/{}/reset", poll.id))
        .add_header("Cookie", auth_token)
        .await;

    assert_eq!(reset_response.status_code(), StatusCode::OK);
    let reset_poll: Poll = reset_response.json::<Poll>();
    assert_eq!(
        reset_poll.options.iter().map(|opt| opt.votes).sum::<i32>(),
        0
    );
}
*/

#[tokio::test]
async fn test_unauthorized_access() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    // Try to create poll without authentication
    let response = server
        .post("/api/polls")
        .json(&json!({
            "title": "Unauthorized Poll",
            "options": ["Option 1", "Option 2"]
        }))
        .await;

    assert_eq!(response.status_code(), StatusCode::UNAUTHORIZED);
}
