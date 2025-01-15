use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Poll {
    pub id: String,
    pub title: String,
    pub creator_id: Uuid,
    pub options: Vec<PollOption>,
    pub created_at: DateTime<Utc>,
    pub is_closed: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct PollOption {
    pub id: String,
    pub text: String,
    pub votes: i32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CreatePollRequest {
    pub title: String,
    pub options: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct VoteRequest {
    pub option_id: String,
}
