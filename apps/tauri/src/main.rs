// OpenClaw Desktop – Tauri v2 backend
// Handles: system tray, IPC commands, deep-link, single-instance enforcement

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Manager, Runtime,
};
use tauri_plugin_deep_link::DeepLinkExt;

/// IPC command: return the app version from Cargo.toml
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// IPC command: read gateway URL from env or well-known config location.
/// Priority: OPENCLAW_GATEWAY_URL env > default localhost.
#[tauri::command]
fn get_gateway_url() -> String {
    if let Ok(url) = std::env::var("OPENCLAW_GATEWAY_URL") {
        if !url.trim().is_empty() {
            return url.trim().to_string();
        }
    }
    // Attempt to read ~/.openclaw/config.json if it exists
    if let Some(home) = dirs_next::home_dir() {
        let config_path = home.join(".openclaw").join("config.json");
        if let Ok(raw) = std::fs::read_to_string(&config_path) {
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&raw) {
                if let Some(url) = parsed
                    .get("gateway")
                    .and_then(|g| g.get("url"))
                    .and_then(|u| u.as_str())
                {
                    if !url.trim().is_empty() {
                        return url.trim().to_string();
                    }
                }
            }
        }
    }
    "ws://localhost:18789".to_string()
}

fn build_tray<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show Dashboard", true, None::<&str>)?;
    let status = MenuItem::with_id(app, "status", "Quick Status", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit OpenClaw", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show, &status, &sep, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("OpenClaw")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "status" => {
                // Emit event to frontend to show quick status
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray:status", ());
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Bring existing window to front when a second instance launches
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![get_app_version, get_gateway_url])
        .setup(|app| {
            // Register deep-link scheme
            #[cfg(desktop)]
            {
                app.deep_link().register_all()?;
            }

            // Forward deep-link events to the frontend
            let handle: AppHandle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                if let Some(window) = handle.get_webview_window("main") {
                    let urls: Vec<String> =
                        event.urls().iter().map(|u| u.to_string()).collect();
                    let _ = window.emit("deep-link", urls);
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            });

            build_tray(app)?;

            // Restore window state from previous session
            #[cfg(desktop)]
            {
                use tauri_plugin_window_state::{AppHandleExt, StateFlags};
                app.restore_state(StateFlags::all())?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running OpenClaw desktop app");
}

fn main() {
    run();
}
