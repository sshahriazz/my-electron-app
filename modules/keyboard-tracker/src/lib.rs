#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use device_query::{DeviceQuery, DeviceState};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::time::{sleep, Duration};
use lazy_static::lazy_static;
use tokio::runtime::Runtime;

lazy_static! {
    static ref RUNTIME: Runtime = Runtime::new().unwrap();
}

const MAX_MOUSE_POSITIONS: usize = 1000; // Store last 1000 positions

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
    stats: Arc<RwLock<KeyStats>>,
    is_tracking: Arc<RwLock<bool>>,
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
            stats: Arc::new(RwLock::new(stats)),
            is_tracking: Arc::new(RwLock::new(false)),
        }
    }

    #[napi]
    pub fn start_tracking(&mut self) -> napi::Result<()> {
        let mut is_tracking = RUNTIME.block_on(async { self.is_tracking.write().await });
            
        if *is_tracking {
            return Ok(());
        }
        *is_tracking = true;
        
        let stats = Arc::clone(&self.stats);
        let is_tracking_clone = Arc::clone(&self.is_tracking);
        
        RUNTIME.spawn(async move {
            let device_state = DeviceState::new();
            let mut last_keys = device_state.get_keys();
            println!("Started tracking");
            
            while *is_tracking_clone.read().await {
                let current_keys = device_state.get_keys();
                
                // Check for new keypresses
                for key in current_keys.iter() {
                    if !last_keys.contains(key) {
                        let mut stats = stats.write().await;
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
                sleep(Duration::from_millis(10)).await;
            }
        });
        
        Ok(())
    }

    #[napi]
    pub fn stop_tracking(&mut self) -> napi::Result<()> {
        RUNTIME.block_on(async {
            let mut is_tracking = self.is_tracking.write().await;
            *is_tracking = false;
        });
        Ok(())
    }

    #[napi]
    pub fn get_total_keystrokes(&self) -> i32 {
        RUNTIME.block_on(async {
            self.stats.read().await.total_keystrokes
        })
    }

    #[napi]
    pub fn get_stats(&self) -> napi::Result<KeyStats> {
        Ok(RUNTIME.block_on(async {
            self.stats.read().await.clone()
        }))
    }

    #[napi]
    pub fn reset_stats(&mut self) -> napi::Result<()> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs_f64();
            
        RUNTIME.block_on(async {
            let mut stats = self.stats.write().await;
            *stats = KeyStats::default();
            stats.start_time = now;
            stats.last_keystroke_time = now;
        });
        Ok(())
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

#[napi]
pub struct MouseTracker {
    stats: Arc<RwLock<MouseStats>>,
    is_tracking: Arc<RwLock<bool>>,
}

#[napi]
impl MouseTracker {
    #[napi(constructor)]
    pub fn new() -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs_f64();
            
        MouseTracker {
            stats: Arc::new(RwLock::new(MouseStats {
                total_clicks: 0,
                mouse_positions: Vec::with_capacity(MAX_MOUSE_POSITIONS),
                click_positions: Vec::new(),
                button_frequencies: HashMap::new(),
                last_click_time: now,
                last_move_time: now,
            })),
            is_tracking: Arc::new(RwLock::new(false)),
        }
    }

    #[napi]
    pub fn start_tracking(&mut self) -> napi::Result<()> {
        let mut is_tracking = RUNTIME.block_on(async { self.is_tracking.write().await });
            
        if *is_tracking {
            return Ok(());
        }
        *is_tracking = true;
        
        let stats = Arc::clone(&self.stats);
        let is_tracking_clone = Arc::clone(&self.is_tracking);
        
        RUNTIME.spawn(async move {
            let device_state = DeviceState::new();
            let mut last_mouse = device_state.get_mouse();
            
            while *is_tracking_clone.read().await {
                let current_mouse = device_state.get_mouse();
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs_f64();
                
                let mut stats = stats.write().await;
                
                // Track mouse movement
                if current_mouse.coords != last_mouse.coords {
                    stats.mouse_positions.push(Position {
                        x: current_mouse.coords.0 as i32,
                        y: current_mouse.coords.1 as i32,
                    });
                    if stats.mouse_positions.len() > MAX_MOUSE_POSITIONS {
                        stats.mouse_positions.remove(0);
                    }
                    stats.last_move_time = now;
                }
                
                // Track mouse clicks
                for button in current_mouse.button_pressed.iter() {
                    if !last_mouse.button_pressed.contains(button) {
                        stats.total_clicks += 1;
                        stats.click_positions.push(Position {
                            x: current_mouse.coords.0 as i32,
                            y: current_mouse.coords.1 as i32,
                        });
                        let button_str = format!("{:?}", button);
                        *stats.button_frequencies.entry(button_str).or_insert(0) += 1;
                        stats.last_click_time = now;
                    }
                }
                
                last_mouse = current_mouse;
                sleep(Duration::from_millis(10)).await;
            }
        });
        
        Ok(())
    }

    #[napi]
    pub fn stop_tracking(&mut self) -> napi::Result<()> {
        RUNTIME.block_on(async {
            let mut is_tracking = self.is_tracking.write().await;
            *is_tracking = false;
        });
        Ok(())
    }

    #[napi]
    pub fn get_stats(&self) -> napi::Result<MouseStats> {
        Ok(RUNTIME.block_on(async {
            self.stats.read().await.clone()
        }))
    }

    #[napi]
    pub fn reset_stats(&mut self) -> napi::Result<()> {
        RUNTIME.block_on(async {
            let mut stats = self.stats.write().await;
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs_f64();
            *stats = MouseStats {
                total_clicks: 0,
                mouse_positions: Vec::with_capacity(MAX_MOUSE_POSITIONS),
                click_positions: Vec::new(),
                button_frequencies: HashMap::new(),
                last_click_time: now,
                last_move_time: now,
            };
        });
        Ok(())
    }
}
