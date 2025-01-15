use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::broadcast::Sender;
use tokio::sync::{broadcast, Mutex};
use webauthn_rs::prelude::*;

pub struct Data {
    pub name_to_id: HashMap<String, Uuid>,
    pub keys: HashMap<Uuid, Vec<Passkey>>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Poll {
    pub id: String,
    pub title: String,
    pub creator_id: Uuid,
    pub options: Vec<PollOption>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub is_closed: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct PollOption {
    pub id: String,
    pub text: String,
    pub votes: i32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct VoteRequest {
    pub option_id: String,
}

#[derive(Clone)]
pub struct AppState {
    pub webauthn: Arc<Webauthn>,
    pub users: Arc<Mutex<Data>>,
    pub polls: Arc<Mutex<HashMap<String, Poll>>>,
    pub poll_updates: broadcast::Sender<(String, Poll)>,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
impl AppState {
    pub fn new() -> Self {
        let rp_id =
            std::env::var("RP_ID").unwrap_or("voting-application-rust.vercel.app".to_string());
        let rp_origin = Url::parse(
            std::env::var("RP_ORIGIN")
                .unwrap_or("https://voting-application-rust.vercel.app".to_string())
                .as_str(),
        )
        .expect("Invalid URL");
        let builder = WebauthnBuilder::new(&rp_id, &rp_origin).expect("Invalid configuration");
        let builder = builder.rp_name("Polling Application");
        let webauthn = Arc::new(builder.build().expect("Invalid configuration"));
        let users = Arc::new(Mutex::new(Data {
            name_to_id: HashMap::new(),
            keys: HashMap::new(),
        }));
        let polls = Arc::new(Mutex::new(HashMap::new()));
        let (tx, _) = broadcast::channel(100);

        AppState {
            webauthn,
            users,
            polls,
            poll_updates: tx,
        }
    }
}
