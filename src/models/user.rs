use std::collections::HashMap;
use uuid::Uuid;
use webauthn_rs::prelude::Passkey;

pub struct Data {
    pub name_to_id: HashMap<String, Uuid>,
    pub keys: HashMap<Uuid, Vec<Passkey>>,
}
