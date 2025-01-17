use axum::extract::{Path, State, WebSocketUpgrade};
use axum::response::IntoResponse;
use futures::stream::SplitSink;
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::WebSocketStream;
use tokio_tungstenite::{accept_async, tungstenite::Message};

use crate::{models::poll::Poll, state::AppState};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    Subscribe { poll_id: String },
    Vote { poll_id: String, option_id: String },
    PollUpdate { poll: Poll },
}

pub async fn start_ws_server(state: AppState) {
    let addr = SocketAddr::from(([0, 0, 0, 0], 3003));
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");
    tracing::info!("WebSocket server listening on: ws://{}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        let state = state.clone();
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream, state).await {
                eprintln!("Error processing connection: {}", e);
            }
        });
    }
}

pub async fn handle_connection(
    stream: TcpStream,
    state: AppState,
) -> Result<(), Box<dyn std::error::Error>> {
    let ws_stream = accept_async(stream).await?;
    let (write, mut read) = ws_stream.split();
    let write = std::sync::Arc::new(tokio::sync::Mutex::new(write));
    let mut poll_updates_rx = state.poll_updates.subscribe();

    // Spawn a task to handle receiving messages from the client
    let state_clone = state.clone();
    let write_clone = write.clone();
    tokio::spawn(async move {
        while let Some(Ok(msg)) = read.next().await {
            if let Message::Text(text) = msg {
                let ws_msg: WsMessage = serde_json::from_str(&text).unwrap();
                let mut write_guard = write_clone.lock().await;
                handle_ws_message(ws_msg, &state_clone, &mut write_guard).await;
            }
        }
    });

    // sending poll updates to the client
    while let Ok((_poll_id, poll)) = poll_updates_rx.recv().await {
        let update = WsMessage::PollUpdate { poll };
        if let Ok(msg) = serde_json::to_string(&update) {
            let _ = write.lock().await.send(Message::Text(msg.into())).await;
        }
    }

    Ok(())
}

pub async fn handle_ws_message(
    message: WsMessage,
    state: &AppState,
    write: &mut SplitSink<WebSocketStream<TcpStream>, Message>,
) {
    match message {
        WsMessage::Subscribe { poll_id } => {
            if let Some(poll) = state.polls.lock().await.get(&poll_id) {
                let update = WsMessage::PollUpdate { poll: poll.clone() };
                if let Ok(msg) = serde_json::to_string(&update) {
                    let _ = write.send(Message::Text(msg.into())).await;
                }
            }
        }
        WsMessage::Vote { poll_id, option_id } => {
            let mut polls = state.polls.lock().await;
            if let Some(poll) = polls.get_mut(&poll_id) {
                if let Some(option) = poll.options.iter_mut().find(|opt| opt.id == option_id) {
                    option.votes += 1;
                    let _ = state.poll_updates.send((poll_id, poll.clone()));
                }
            }
        }
        _ => {
            tracing::info!(
                "I don't want to handle this, Unknown message: {:?}",
                message
            );
        }
    }
}

pub async fn poll_websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(poll_id): Path<String>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state, poll_id))
}

async fn handle_socket(socket: axum::extract::ws::WebSocket, state: AppState, poll_id: String) {
    let (mut sender, _receiver) = socket.split();
    let mut rx = state.poll_updates.subscribe();

    while let Ok((updated_poll_id, poll)) = rx.recv().await {
        if updated_poll_id == poll_id {
            if let Ok(msg) = serde_json::to_string(&poll) {
                if sender
                    .send(axum::extract::ws::Message::Text(msg.into()))
                    .await
                    .is_err()
                {
                    break;
                }
            }
        }
    }
}
