#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use device_query::{DeviceQuery, DeviceState};
use std::time::{SystemTime, UNIX_EPOCH};

#[napi(object)]
#[derive(Default, Clone)]
pub struct KeyStats {
    pub total_keystrokes: i32,
    pub key_frequencies: HashMap<String, i32>,
    pub start_time: f64,
    pub last_keystroke_time: f64,
}

#[napi]
pub struct KeystrokeCounter {
    stats: Arc<Mutex<KeyStats>>,
    is_tracking: Arc<Mutex<bool>>,
}

#[napi]
impl KeystrokeCounter {
    #[napi(constructor)]
    pub fn new() -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs_f64();
            
        let mut stats = KeyStats::default();
        stats.start_time = now;
        stats.last_keystroke_time = now;
        
        KeystrokeCounter {
            stats: Arc::new(Mutex::new(stats)),
            is_tracking: Arc::new(Mutex::new(false)),
        }
    }

    #[napi]
    pub fn start_tracking(&mut self) {
        let mut is_tracking = self.is_tracking.lock().unwrap();
        if *is_tracking {
            return;
        }
        *is_tracking = true;
        
        let stats = Arc::clone(&self.stats);
        let is_tracking_clone = Arc::clone(&self.is_tracking);
        
        thread::spawn(move || {
            let device_state = DeviceState::new();
            let mut last_keys = device_state.get_keys();
            println!("Started tracking");
            while *is_tracking_clone.lock().unwrap() {
                let current_keys = device_state.get_keys();
                
                // Check for new keypresses
                for key in current_keys.iter() {
                    if !last_keys.contains(key) {
                        let mut stats = stats.lock().unwrap();
                        stats.total_keystrokes += 1;
                        stats.last_keystroke_time = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs_f64();
                        let key_str = format!("{:?}", key);
                        *stats.key_frequencies.entry(key_str).or_insert(0) += 1;
                    }
                }
                
                last_keys = current_keys;
                thread::sleep(std::time::Duration::from_millis(10));
            }
        });
    }

    #[napi]
    pub fn stop_tracking(&mut self) {
        let mut is_tracking = self.is_tracking.lock().unwrap();
        *is_tracking = false;
    }

    #[napi]
    pub fn get_total_keystrokes(&self) -> i32 {
        self.stats.lock().unwrap().total_keystrokes
    }

    #[napi]
    pub fn get_stats(&self) -> KeyStats {
        self.stats.lock().unwrap().clone()
    }

    #[napi]
    pub fn reset_stats(&mut self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs_f64();
            
        let mut stats = self.stats.lock().unwrap();
        *stats = KeyStats::default();
        stats.start_time = now;
        stats.last_keystroke_time = now;
    }
}
