// ANPT Toolkit v1.0.0 — Tauri backend with authorized Nmap agent

use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
struct NmapCheckResult {
    installed: bool,
    version: Option<String>,
    path: Option<String>,
    message: String,
    profiles: Vec<ProfileInfo>,
}

#[derive(Serialize)]
struct ProfileInfo {
    id: String,
    label: String,
}

#[derive(Serialize)]
struct NmapRunResult {
    ok: bool,
    error: Option<String>,
    scan_id: Option<String>,
    target: Option<String>,
    profile: Option<String>,
    xml: Option<String>,
    stderr: Option<String>,
}

fn profiles() -> Vec<ProfileInfo> {
    vec![
        ProfileInfo {
            id: "quick".into(),
            label: "Quick Discovery".into(),
        },
        ProfileInfo {
            id: "standard".into(),
            label: "Standard Service Scan".into(),
        },
        ProfileInfo {
            id: "top100".into(),
            label: "Top 100 Ports + Version".into(),
        },
    ]
}

fn profile_args(profile_id: &str) -> Vec<&'static str> {
    match profile_id {
        "quick" => vec!["-T4", "-F", "-oX", "-"],
        "top100" => vec!["-T4", "--top-ports", "100", "-sV", "--version-light", "-oX", "-"],
        _ => vec!["-T4", "-sV", "--version-light", "-oX", "-"], // standard
    }
}

fn is_valid_target(target: &str) -> bool {
    let t = target.trim();
    if t.is_empty() || t.len() > 253 {
        return false;
    }
    // Block shell metacharacters — target is appended as a single argv element,
    // but we still reject suspicious characters defensively.
    if t.chars().any(|c| {
        matches!(c, ';' | '|' | '&' | '`' | '$' | '\n' | '\r' | '<' | '>' | '"' | '\'')
    }) {
        return false;
    }
    true
}

fn find_nmap() -> String {
    // Prefer PATH; Windows installers usually add Nmap to PATH.
    "nmap".to_string()
}

#[tauri::command]
fn nmap_check() -> NmapCheckResult {
    let nmap = find_nmap();
    match Command::new(&nmap).arg("--version").output() {
        Ok(out) => {
            let text = format!(
                "{}{}",
                String::from_utf8_lossy(&out.stdout),
                String::from_utf8_lossy(&out.stderr)
            );
            if text.to_lowercase().contains("nmap") {
                let version = text
                    .lines()
                    .find(|l| l.to_lowercase().contains("nmap version"))
                    .and_then(|l| l.split_whitespace().nth(2))
                    .map(|s| s.to_string());
                NmapCheckResult {
                    installed: true,
                    version,
                    path: Some(nmap),
                    message: "Nmap is available".into(),
                    profiles: profiles(),
                }
            } else {
                NmapCheckResult {
                    installed: false,
                    version: None,
                    path: None,
                    message: "Nmap check returned unexpected output".into(),
                    profiles: profiles(),
                }
            }
        }
        Err(_) => NmapCheckResult {
            installed: false,
            version: None,
            path: None,
            message: "Nmap not found. Install Nmap and ensure it is on PATH.".into(),
            profiles: profiles(),
        },
    }
}

#[tauri::command]
fn nmap_run(
    target: String,
    profile_id: String,
    authorization_confirmed: bool,
    scan_id: Option<String>,
) -> NmapRunResult {
    if !authorization_confirmed {
        return NmapRunResult {
            ok: false,
            error: Some("Authorization not confirmed. Scan blocked.".into()),
            scan_id: None,
            target: None,
            profile: None,
            xml: None,
            stderr: None,
        };
    }

    if !is_valid_target(&target) {
        return NmapRunResult {
            ok: false,
            error: Some("Invalid target. Use IPv4, hostname, or CIDR only.".into()),
            scan_id: None,
            target: None,
            profile: None,
            xml: None,
            stderr: None,
        };
    }

    let nmap = find_nmap();
    let mut args: Vec<String> = profile_args(&profile_id)
        .into_iter()
        .map(|s| s.to_string())
        .collect();
    args.push(target.trim().to_string());

    let id = scan_id.unwrap_or_else(|| format!("scan-{}", chrono_like_id()));

    match Command::new(&nmap).args(&args).output() {
        Ok(out) => {
            let xml = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();

            if !xml.contains("<nmaprun") && !out.status.success() {
                return NmapRunResult {
                    ok: false,
                    error: Some(format!(
                        "Nmap failed (code {:?}). {}",
                        out.status.code(),
                        stderr.chars().take(300).collect::<String>()
                    )),
                    scan_id: Some(id),
                    target: Some(target),
                    profile: Some(profile_id),
                    xml: None,
                    stderr: Some(stderr.chars().take(2000).collect()),
                };
            }

            NmapRunResult {
                ok: true,
                error: None,
                scan_id: Some(id),
                target: Some(target),
                profile: Some(profile_id),
                xml: Some(xml),
                stderr: Some(stderr.chars().take(2000).collect()),
            }
        }
        Err(e) => NmapRunResult {
            ok: false,
            error: Some(format!(
                "Failed to start Nmap: {}. Is Nmap installed and on PATH?", e
            )),
            scan_id: Some(id),
            target: Some(target),
            profile: Some(profile_id),
            xml: None,
            stderr: None,
        },
    }
}

fn chrono_like_id() -> u128 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![nmap_check, nmap_run])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
