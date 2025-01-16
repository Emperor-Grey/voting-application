use axum::extract::State;
use axum::{extract::Path, response::IntoResponse, Json};
use http::StatusCode;
use serde_json::json;
use tower_sessions::Session;
use uuid::Uuid;

use crate::error::WebauthnError;
use crate::models::poll::{CreatePollRequest, Poll, PollOption, VoteRequest};
use crate::state::AppState;

pub async fn create_poll(
    State(state): State<AppState>,
    session: Session,
    Json(req): Json<CreatePollRequest>,
) -> Result<impl IntoResponse, WebauthnError> {
    // Fix the error handling for session
    let user_id = session
        .get("user_id")
        .await
        .map_err(WebauthnError::InvalidSessionState)?
        .ok_or(WebauthnError::UserNotFound)?;

    let poll = Poll {
        id: Uuid::new_v4().to_string(),
        title: req.title,
        creator_id: user_id,
        total_votes: 0,
        options: req
            .options
            .into_iter()
            .map(|text| PollOption {
                id: Uuid::new_v4().to_string(),
                text,
                votes: 0,
            })
            .collect(),
        created_at: chrono::Utc::now(),
        is_closed: false,
    };

    let mut polls = state.polls.lock().await;
    polls.insert(poll.id.clone(), poll.clone());

    Ok(Json(poll))
}

pub async fn list_polls(State(state): State<AppState>) -> impl IntoResponse {
    let polls = state.polls.lock().await;
    let polls_vec: Vec<Poll> = polls.values().cloned().collect();
    Json(polls_vec)
}

pub async fn get_poll(
    State(state): State<AppState>,
    Path(poll_id): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    let polls = state.polls.lock().await;
    let poll = polls.get(&poll_id).cloned().ok_or(WebauthnError::Unknown)?;
    Ok(Json(poll))
}

pub async fn vote_poll(
    State(state): State<AppState>,
    Path(poll_id): Path<String>,
    Json(req): Json<VoteRequest>,
) -> Result<impl IntoResponse, WebauthnError> {
    let mut polls = state.polls.lock().await;
    let poll = polls.get_mut(&poll_id).ok_or(WebauthnError::Unknown)?;

    if poll.is_closed {
        return Err(WebauthnError::Unknown);
    }

    if let Some(option) = poll.options.iter_mut().find(|opt| opt.id == req.option_id) {
        option.votes += 1;
        // Broadcast the update
        let _ = state.poll_updates.send((poll_id.clone(), poll.clone()));
        Ok(Json(poll.clone()))
    } else {
        Err(WebauthnError::Unknown)
    }
}

pub async fn close_poll(
    State(state): State<AppState>,
    Path(poll_id): Path<String>,
    session: Session,
) -> Result<impl IntoResponse, WebauthnError> {
    let username: String = session
        .get("username")
        .await?
        .ok_or(WebauthnError::NotAuthenticated)?;

    let mut polls = state.polls.lock().await;
    let poll = polls.get_mut(&poll_id).ok_or(WebauthnError::Unknown)?;

    // Verify that the user is the poll creator
    if poll.creator_id != username.to_string() {
        return Err(WebauthnError::Unauthorized);
    }

    poll.is_closed = true;

    // Broadcast the update
    let _ = state.poll_updates.send((poll_id.clone(), poll.clone()));

    Ok(Json(poll.clone()))
}

pub async fn reset_poll_votes(
    State(state): State<AppState>,
    Path(poll_id): Path<String>,
    session: Session,
) -> Result<impl IntoResponse, WebauthnError> {
    let username: String = session
        .get("username")
        .await?
        .ok_or(WebauthnError::NotAuthenticated)?;

    let mut polls = state.polls.lock().await;
    let poll = polls.get_mut(&poll_id).ok_or(WebauthnError::Unknown)?;

    // Verify that the user is the poll creator
    if poll.creator_id != username.to_string() {
        return Err(WebauthnError::Unauthorized);
    }

    // Reset votes for all options
    for option in poll.options.iter_mut() {
        option.votes = 0;
    }

    // Broadcast the update
    let _ = state.poll_updates.send((poll_id.clone(), poll.clone()));

    Ok(Json(poll.clone()))
}

pub async fn delete_poll(
    State(state): State<AppState>,
    Path(poll_id): Path<String>,
    session: Session,
) -> Result<impl IntoResponse, WebauthnError> {
    let username: String = session
        .get("username")
        .await?
        .ok_or(WebauthnError::NotAuthenticated)?;

    let mut polls = state.polls.lock().await;

    // Clone the poll before removing it
    let poll = polls.get(&poll_id).cloned().ok_or(WebauthnError::Unknown)?;

    // Verify that the user is the poll creator
    if poll.creator_id != username.to_string() {
        return Err(WebauthnError::Unauthorized);
    }

    // Remove the poll
    polls.remove(&poll_id);

    // Broadcast the deletion
    let _ = state.poll_updates.send((
        poll_id.clone(),
        Poll {
            id: poll_id,
            title: "".to_string(),
            creator_id: "".to_string(),
            options: vec![],
            total_votes: 0,
            created_at: chrono::Utc::now(),
            is_closed: true,
        },
    ));

    Ok(StatusCode::NO_CONTENT)
}
