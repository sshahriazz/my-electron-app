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
pub struct Position {
    pub x: i32,
    pub y: i32,
}

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

#[napi(object)]
#[derive(Default, Clone)]
pub struct MouseStats {
    pub total_clicks: i32,
    pub mouse_positions: Vec<Position>,
    pub click_positions: Vec<Position>,
    pub button_frequencies: HashMap<String, i32>,
    pub last_click_time: f64,
    pub last_move_time: f64,
}

#[napi(object)]
#[derive(Default, Clone)]
pub struct CombinedStats {
    pub key_stats: KeyStats,
    pub mouse_stats: MouseStats,
}

#[napi]
pub struct InputTracker {
    key_stats: Arc<Mutex<KeyStats>>,
    mouse_stats: Arc<Mutex<MouseStats>>,
    is_tracking: Arc<Mutex<bool>>,
}

#[napi]
impl InputTracker {
    #[napi(constructor)]
    pub fn new() -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs_f64();
            
        let mut key_stats = KeyStats::default();
        key_stats.start_time = now;
        key_stats.last_keystroke_time = now;
        
        let mut mouse_stats = MouseStats::default();
        mouse_stats.last_click_time = now;
        mouse_stats.last_move_time = now;
        
        InputTracker {
            key_stats: Arc::new(Mutex::new(key_stats)),
            mouse_stats: Arc::new(Mutex::new(mouse_stats)),
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
        
        let key_stats = Arc::clone(&self.key_stats);
        let mouse_stats = Arc::clone(&self.mouse_stats);
        let is_tracking_clone = Arc::clone(&self.is_tracking);
        
        thread::spawn(move || {
            let device_state = DeviceState::new();
            let mut last_keys = device_state.get_keys();
            let mut last_mouse = device_state.get_mouse();
            let mut last_position = (0, 0);
            
            while *is_tracking_clone.lock().unwrap() {
                let current_keys = device_state.get_keys();
                let current_mouse = device_state.get_mouse();
                let current_position = current_mouse.coords;
                
                // Track keypresses
                for key in current_keys.iter() {
                    if !last_keys.contains(key) {
                        let mut stats = key_stats.lock().unwrap();
                        stats.total_keystrokes += 1;
                        stats.last_keystroke_time = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs_f64();
                        let key_str = format!("{:?}", key);
                        *stats.key_frequencies.entry(key_str).or_insert(0) += 1;
                    }
                }
                
                // Track mouse movement
                if current_position != last_position {
                    let mut stats = mouse_stats.lock().unwrap();
                    stats.mouse_positions.push(Position {
                        x: current_position.0,
                        y: current_position.1,
                    });
                    stats.last_move_time = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs_f64();
                }
                
                // Track mouse clicks
                for button in current_mouse.button_pressed.iter() {
                    if !last_mouse.button_pressed.contains(button) {
                        let mut stats = mouse_stats.lock().unwrap();
                        stats.total_clicks += 1;
                        stats.click_positions.push(Position {
                            x: current_position.0,
                            y: current_position.1,
                        });
                        stats.last_click_time = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs_f64();
                        let button_str = format!("{:?}", button);
                        *stats.button_frequencies.entry(button_str).or_insert(0) += 1;
                    }
                }
                
                last_keys = current_keys;
                last_mouse = current_mouse;
                last_position = current_position;
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
    pub fn get_stats(&self) -> CombinedStats {
        CombinedStats {
            key_stats: self.key_stats.lock().unwrap().clone(),
            mouse_stats: self.mouse_stats.lock().unwrap().clone(),
        }
    }

    #[napi]
    pub fn reset_stats(&mut self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs_f64();
            
        let mut key_stats = self.key_stats.lock().unwrap();
        *key_stats = KeyStats::default();
        key_stats.start_time = now;
        key_stats.last_keystroke_time = now;
        
        let mut mouse_stats = self.mouse_stats.lock().unwrap();
        *mouse_stats = MouseStats::default();
        mouse_stats.last_click_time = now;
        mouse_stats.last_move_time = now;
    }
}
