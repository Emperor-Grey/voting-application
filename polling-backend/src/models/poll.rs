use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct Poll {
    pub id: String,
    pub title: String,
    pub creator_id: String,
    pub options: Vec<PollOption>,
    pub created_at: DateTime<Utc>,
    pub is_closed: bool,
    pub total_votes: i32,
}

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
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
