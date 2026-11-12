use chrono::{Local, NaiveDate, TimeZone};
use exif::{In, Reader, Tag, Value};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    io::{BufReader, Write},
    path::{Path, PathBuf},
};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImportedTextFile {
    path: String,
    content: String,
}

#[tauri::command]
async fn export_csv_file(app: tauri::AppHandle, content: String) -> Result<Option<String>, String> {
    let selected = app
        .dialog()
        .file()
        .add_filter("CSV", &["csv"])
        .set_file_name("rename-plan.csv")
        .blocking_save_file();
    let Some(selected) = selected else {
        return Ok(None);
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    fs::write(&path, content).map_err(|error| error.to_string())?;
    Ok(Some(path.to_string_lossy().into_owned()))
}

#[tauri::command]
async fn import_csv_file(app: tauri::AppHandle) -> Result<Option<ImportedTextFile>, String> {
    let selected = app
        .dialog()
        .file()
        .add_filter("CSV", &["csv"])
        .blocking_pick_file();
    let Some(selected) = selected else {
        return Ok(None);
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    if metadata.len() > 20 * 1024 * 1024 {
        return Err("CSV 文件超过 20 MB，已拒绝读取".into());
    }
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    Ok(Some(ImportedTextFile {
        path: path.to_string_lossy().into_owned(),
        content,
    }))
}

#[tauri::command]
fn log_message(level: String, message: String) {
    match level.as_str() {
        "error" => log::error!("{message}"),
        "warn" => log::warn!("{message}"),
        "debug" => log::debug!("{message}"),
        _ => log::info!("{message}"),
    }
}

#[tauri::command]
fn read_log_tail(app: tauri::AppHandle, limit: Option<usize>) -> Result<String, String> {
    let directory = app
        .path()
        .app_log_dir()
        .map_err(|error| error.to_string())?;
    let entries = match fs::read_dir(&directory) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(String::new()),
        Err(error) => return Err(error.to_string()),
    };
    let latest = entries
        .flatten()
        .filter(|entry| {
            entry
                .file_type()
                .map(|kind| kind.is_file())
                .unwrap_or(false)
        })
        .filter_map(|entry| {
            let modified = entry.metadata().ok()?.modified().ok()?;
            Some((modified, entry.path()))
        })
        .max_by_key(|(modified, _)| *modified);
    let Some((_, path)) = latest else {
        return Ok(String::new());
    };
    let bytes = fs::read(path).map_err(|error| error.to_string())?;
    let text = String::from_utf8_lossy(&bytes);
    let lines: Vec<&str> = text.lines().collect();
    let count = limit.unwrap_or(300).clamp(1, 2000);
    let start = lines.len().saturating_sub(count);
    Ok(lines[start..].join("\n"))
}

fn parse_exif_datetime(value: &Value, offset: Option<&Value>) -> Option<i64> {
    let Value::Ascii(values) = value else {
        return None;
    };
    let raw = values.first()?;
    let date = exif::DateTime::from_ascii(raw).ok()?;
    let naive = NaiveDate::from_ymd_opt(date.year.into(), date.month.into(), date.day.into())?
        .and_hms_opt(date.hour.into(), date.minute.into(), date.second.into())?;

    if let Some(Value::Ascii(offsets)) = offset {
        if let Some(raw_offset) = offsets.first() {
            if let Ok(text) = std::str::from_utf8(raw_offset) {
                let text = text.trim_end_matches('\0');
                let bytes = text.as_bytes();
                if bytes.len() == 6 && matches!(bytes[0], b'+' | b'-') && bytes[3] == b':' {
                    if let (Ok(hours), Ok(minutes)) =
                        (text[1..3].parse::<i32>(), text[4..6].parse::<i32>())
                    {
                        if hours <= 23 && minutes <= 59 {
                            let seconds = (hours * 3600 + minutes * 60)
                                * if bytes[0] == b'-' { -1 } else { 1 };
                            let zone = chrono::FixedOffset::east_opt(seconds)?;
                            return zone
                                .from_local_datetime(&naive)
                                .single()
                                .map(|time| time.timestamp_millis());
                        }
                    }
                }
            }
        }
    }
    Local
        .from_local_datetime(&naive)
        .earliest()
        .map(|time| time.timestamp_millis())
}

fn exif_taken_at(path: &Path) -> Option<i64> {
    let file = fs::File::open(path).ok()?;
    let metadata = Reader::new()
        .read_from_container(&mut BufReader::new(file))
        .ok()?;
    let captured = [Tag::DateTimeOriginal, Tag::DateTimeDigitized, Tag::DateTime]
        .into_iter()
        .find_map(|tag| metadata.get_field(tag, In::PRIMARY))?;
    let offset = metadata.get_field(Tag::OffsetTimeOriginal, In::PRIMARY);
    parse_exif_datetime(&captured.value, offset.map(|field| &field.value))
}

#[tauri::command]
fn read_exif_datetime(path: String) -> Option<i64> {
    exif_taken_at(Path::new(&path))
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RenameItem {
    file_id: String,
    original_path: String,
    final_path: String,
    #[serde(default)]
    temp_path: Option<String>,
    #[serde(default)]
    state: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PreflightRequest {
    entries: Vec<RenameItem>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PreflightIssue {
    file_id: String,
    message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PreflightResult {
    issues: Vec<PreflightIssue>,
    rename_order: Vec<usize>,
}

fn normalized_key(path: &str) -> String {
    // macOS 和 Windows 通常不区分大小写；Linux 保持原样。
    if cfg!(target_os = "linux") {
        path.to_owned()
    } else {
        path.to_lowercase()
    }
}

fn rust_preflight(entries: Vec<RenameItem>) -> PreflightResult {
    let mut issues = Vec::new();
    let mut source_keys = HashMap::<String, usize>::new();
    let mut destination_indices = HashMap::<String, Vec<usize>>::new();
    let mut external_existing = HashSet::<String>::new();

    for (index, entry) in entries.iter().enumerate() {
        let source_key = normalized_key(&entry.original_path);
        if source_keys.insert(source_key.clone(), index).is_some() {
            issues.push(PreflightIssue {
                file_id: entry.file_id.clone(),
                message: "同一个文件被重复加入批次".into(),
            });
        }

        if !Path::new(&entry.original_path).is_file() && !Path::new(&entry.original_path).is_dir() {
            issues.push(PreflightIssue {
                file_id: entry.file_id.clone(),
                message: "源文件不存在或无法访问".into(),
            });
        }

        let destination_key = normalized_key(&entry.final_path);
        destination_indices
            .entry(destination_key)
            .or_default()
            .push(index);

        if let Some(parent) = Path::new(&entry.final_path).parent() {
            if let Ok(read_dir) = fs::read_dir(parent) {
                for child in read_dir.flatten() {
                    external_existing.insert(normalized_key(&child.path().to_string_lossy()));
                }
            } else {
                issues.push(PreflightIssue {
                    file_id: entry.file_id.clone(),
                    message: "目标文件夹不存在或不可访问".into(),
                });
            }
        }
    }

    for (destination_key, indices) in &destination_indices {
        if indices.len() > 1 {
            // 同一个名称允许由一个源文件原地保留，其他文件不能再占用它。
            let same_source_index = source_keys.get(destination_key).copied();
            for &index in indices {
                if Some(index) != same_source_index {
                    issues.push(PreflightIssue {
                        file_id: entries[index].file_id.clone(),
                        message: "多个文件会生成相同的目标文件名".into(),
                    });
                }
            }
        } else {
            let index = indices[0];
            let source_key = normalized_key(&entries[index].original_path);
            if source_key != *destination_key
                && external_existing.contains(destination_key)
                && !source_keys.contains_key(destination_key)
            {
                issues.push(PreflightIssue {
                    file_id: entries[index].file_id.clone(),
                    message: "目标文件已存在，已阻止覆盖".into(),
                });
            }
        }
    }

    let mut remaining: HashSet<usize> = (0..entries.len()).collect();
    let mut rename_order = Vec::with_capacity(entries.len());

    while !remaining.is_empty() {
        let mut progressed = false;
        let candidates: Vec<usize> = remaining.iter().copied().collect();

        for index in candidates {
            let source_key = normalized_key(&entries[index].original_path);
            let destination_key = normalized_key(&entries[index].final_path);
            let occupied_by_batch = source_keys.contains_key(&destination_key);
            let occupied_externally = source_key != destination_key
                && external_existing.contains(&destination_key)
                && !source_keys.contains_key(&destination_key);

            if !occupied_by_batch && !occupied_externally {
                rename_order.push(index);
                remaining.remove(&index);
                progressed = true;
            }
        }

        if progressed {
            continue;
        }

        let break_index = remaining
            .iter()
            .copied()
            .find(|index| {
                let source_key = normalized_key(&entries[*index].original_path);
                remaining.iter().any(|other| {
                    *other != *index && normalized_key(&entries[*other].final_path) == source_key
                })
            })
            .or_else(|| remaining.iter().next().copied());

        let Some(index) = break_index else {
            break;
        };
        rename_order.push(index);
        remaining.remove(&index);
    }

    PreflightResult {
        issues,
        rename_order,
    }
}

#[cfg(any(target_os = "macos", target_os = "ios"))]
fn exclusive_rename(source: &Path, destination: &Path) -> Result<(), String> {
    use std::{ffi::CString, os::unix::ffi::OsStrExt};

    let source = CString::new(source.as_os_str().as_bytes())
        .map_err(|_| "源文件路径包含无效字符".to_string())?;
    let destination = CString::new(destination.as_os_str().as_bytes())
        .map_err(|_| "目标文件路径包含无效字符".to_string())?;

    let result =
        unsafe { libc::renamex_np(source.as_ptr(), destination.as_ptr(), libc::RENAME_EXCL) };

    if result == 0 {
        Ok(())
    } else {
        Err(std::io::Error::last_os_error().to_string())
    }
}

#[cfg(target_os = "linux")]
fn exclusive_rename(source: &Path, destination: &Path) -> Result<(), String> {
    use std::{ffi::CString, os::unix::ffi::OsStrExt};

    let source_path = CString::new(source.as_os_str().as_bytes())
        .map_err(|_| "源文件路径包含无效字符".to_string())?;
    let destination_path = CString::new(destination.as_os_str().as_bytes())
        .map_err(|_| "目标文件路径包含无效字符".to_string())?;

    let result = unsafe {
        libc::renameat2(
            libc::AT_FDCWD,
            source_path.as_ptr(),
            libc::AT_FDCWD,
            destination_path.as_ptr(),
            libc::RENAME_NOREPLACE,
        )
    };

    if result == 0 {
        return Ok(());
    }

    let error = std::io::Error::last_os_error();
    if error.raw_os_error() == Some(libc::ENOSYS) {
        if destination.exists() {
            return Err("目标文件已存在，已阻止覆盖".into());
        }
        fs::rename(source, destination).map_err(|err| err.to_string())
    } else {
        Err(error.to_string())
    }
}

#[cfg(target_os = "windows")]
fn exclusive_rename(source: &Path, destination: &Path) -> Result<(), String> {
    // std::fs::rename 在 Windows 上本身不会覆盖已有目标。
    fs::rename(source, destination).map_err(|err| err.to_string())
}

#[cfg(not(any(
    target_os = "macos",
    target_os = "ios",
    target_os = "linux",
    target_os = "windows"
)))]
fn exclusive_rename(source: &Path, destination: &Path) -> Result<(), String> {
    if destination.exists() {
        return Err("目标文件已存在，已阻止覆盖".into());
    }
    fs::rename(source, destination).map_err(|err| err.to_string())
}

#[tauri::command]
fn preflight_rename(request: PreflightRequest) -> Result<PreflightResult, String> {
    Ok(rust_preflight(request.entries))
}

#[tauri::command]
fn exclusive_rename_path(source: String, destination: String) -> Result<(), String> {
    exclusive_rename(Path::new(&source), Path::new(&destination))
}

fn snapshot_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_local_data_dir()
        .map_err(|err| err.to_string())?;
    fs::create_dir_all(&directory).map_err(|err| err.to_string())?;
    Ok(directory.join("rname-undo-snapshot.json"))
}

fn read_snapshot(app: &tauri::AppHandle) -> Result<Vec<RenameItem>, String> {
    let path = snapshot_path(app)?;
    let content = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    let value: serde_json::Value = serde_json::from_str(&content).map_err(|err| err.to_string())?;
    let files = value
        .get("entries")
        .or_else(|| value.get("files"))
        .ok_or_else(|| "撤销快照缺少文件列表".to_string())?;
    serde_json::from_value(files.clone()).map_err(|err| err.to_string())
}

#[tauri::command]
fn save_undo_snapshot(app: tauri::AppHandle, entries: Vec<RenameItem>) -> Result<(), String> {
    let path = snapshot_path(&app)?;
    let value = serde_json::json!({
        "version": 2,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "entries": entries,
    });
    write_json_atomically(&path, &value)
}

fn write_json_atomically(path: &Path, value: &serde_json::Value) -> Result<(), String> {
    let temporary_path = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec(value).map_err(|err| err.to_string())?;
    let mut file = fs::File::create(&temporary_path).map_err(|err| err.to_string())?;
    file.write_all(&bytes).map_err(|err| err.to_string())?;
    file.sync_all().map_err(|err| err.to_string())?;

    #[cfg(target_os = "windows")]
    if path.exists() {
        fs::remove_file(path).map_err(|err| err.to_string())?;
    }

    fs::rename(&temporary_path, path).map_err(|err| err.to_string())
}

fn update_snapshot_state(app: &tauri::AppHandle, file_id: &str, state: &str) -> Result<(), String> {
    let path = snapshot_path(app)?;
    let content = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    let mut value: serde_json::Value =
        serde_json::from_str(&content).map_err(|err| err.to_string())?;
    let files = value
        .get_mut("entries")
        .and_then(serde_json::Value::as_array_mut)
        .ok_or_else(|| "撤销快照缺少文件列表".to_string())?;
    let entry = files
        .iter_mut()
        .find(|entry| entry.get("fileId").and_then(|id| id.as_str()) == Some(file_id))
        .ok_or_else(|| "撤销快照中找不到该文件".to_string())?;
    entry["state"] = serde_json::Value::String(state.to_owned());
    write_json_atomically(&path, &value)
}

#[tauri::command]
fn read_undo_snapshot(app: tauri::AppHandle) -> Result<Vec<RenameItem>, String> {
    read_snapshot(&app)
}

#[tauri::command]
fn mark_undo_entry(app: tauri::AppHandle, file_id: String, state: String) -> Result<(), String> {
    update_snapshot_state(&app, &file_id, &state)
}

#[tauri::command]
fn finish_undo_snapshot(app: tauri::AppHandle) -> Result<bool, String> {
    let path = snapshot_path(&app)?;
    let content = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    let value: serde_json::Value = serde_json::from_str(&content).map_err(|err| err.to_string())?;
    let entries = value
        .get("entries")
        .and_then(serde_json::Value::as_array)
        .ok_or_else(|| "撤销快照缺少文件列表".to_string())?;
    let all_restored = !entries.is_empty()
        && entries
            .iter()
            .all(|entry| entry.get("state").and_then(|state| state.as_str()) == Some("rolledBack"));

    if all_restored {
        fs::remove_file(path).map_err(|err| err.to_string())?;
    }
    Ok(all_restored)
}

#[tauri::command]
fn clear_undo_snapshot(app: tauri::AppHandle) -> Result<(), String> {
    let path = snapshot_path(&app)?;
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            preflight_rename,
            exclusive_rename_path,
            save_undo_snapshot,
            read_undo_snapshot,
            mark_undo_entry,
            finish_undo_snapshot,
            clear_undo_snapshot,
            read_exif_datetime,
            export_csv_file,
            import_csv_file,
            log_message,
            read_log_tail
        ])
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            let _ = app;

            #[cfg(debug_assertions)]
            {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{exclusive_rename, exif_taken_at, parse_exif_datetime, rust_preflight, RenameItem};
    use exif::Value;
    use std::{
        fs,
        path::{Path, PathBuf},
        time::{SystemTime, UNIX_EPOCH},
    };

    fn test_directory() -> PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be valid")
            .as_nanos();
        let directory = std::env::temp_dir().join(format!("rname-test-{suffix}"));
        fs::create_dir_all(&directory).expect("test directory should be created");
        directory
    }

    fn rename_item(file_id: &str, original: &Path, final_path: &Path) -> RenameItem {
        RenameItem {
            file_id: file_id.into(),
            original_path: original.to_string_lossy().into_owned(),
            final_path: final_path.to_string_lossy().into_owned(),
            temp_path: None,
            state: None,
        }
    }

    #[test]
    fn exif_date_rejects_invalid_calendar_values() {
        let invalid = Value::Ascii(vec![b"2025:02:30 12:00:00".to_vec()]);
        assert_eq!(parse_exif_datetime(&invalid, None), None);
    }

    #[test]
    fn exif_date_honors_timezone_offset() {
        let date = Value::Ascii(vec![b"2025:01:02 03:04:05".to_vec()]);
        let offset = Value::Ascii(vec![b"+08:00".to_vec()]);
        assert_eq!(
            parse_exif_datetime(&date, Some(&offset)),
            Some(1735758245000)
        );
    }

    #[test]
    fn non_photo_has_no_exif_date() {
        let directory = test_directory();
        let path = directory.join("plain.jpg");
        fs::write(&path, b"not an image").expect("fixture should be written");
        assert_eq!(exif_taken_at(&path), None);
        fs::remove_dir_all(directory).expect("fixture should be removed");
    }

    #[test]
    fn exclusive_rename_refuses_existing_destination() {
        let directory = test_directory();
        let source = directory.join("source.txt");
        let destination = directory.join("destination.txt");
        fs::write(&source, "source").expect("source should be written");
        fs::write(&destination, "destination").expect("destination should be written");

        let result = exclusive_rename(&source, &destination);

        assert!(result.is_err());
        assert_eq!(
            fs::read_to_string(&destination).expect("destination should remain"),
            "destination"
        );
        assert_eq!(
            fs::read_to_string(&source).expect("source should remain"),
            "source"
        );
        fs::remove_dir_all(directory).expect("test directory should be removed");
    }

    #[test]
    fn exclusive_rename_moves_to_free_destination() {
        let directory = test_directory();
        let source = directory.join("source.txt");
        let destination = directory.join("destination.txt");
        fs::write(&source, "source").expect("source should be written");

        exclusive_rename(&source, &destination).expect("rename should succeed");

        assert!(!source.exists());
        assert_eq!(
            fs::read_to_string(&destination).expect("destination should exist"),
            "source"
        );
        fs::remove_dir_all(directory).expect("test directory should be removed");
    }

    #[test]
    fn preflight_releases_target_names_before_relinking_chain() {
        let directory = test_directory();
        let first = directory.join("a.txt");
        let second = directory.join("b.txt");
        let third = directory.join("c.txt");
        fs::write(&first, "a").expect("first should be written");
        fs::write(&second, "b").expect("second should be written");

        let plan = rust_preflight(vec![
            rename_item("a", &first, &second),
            rename_item("b", &second, &third),
        ]);

        assert!(plan.issues.is_empty());
        assert_eq!(plan.rename_order, vec![1, 0]);
        fs::remove_dir_all(directory).expect("test directory should be removed");
    }

    #[test]
    fn preflight_blocks_existing_unselected_destination() {
        let directory = test_directory();
        let source = directory.join("a.txt");
        let destination = directory.join("existing.txt");
        fs::write(&source, "a").expect("source should be written");
        fs::write(&destination, "existing").expect("destination should be written");

        let plan = rust_preflight(vec![rename_item("a", &source, &destination)]);

        assert_eq!(plan.issues.len(), 1);
        assert!(plan.issues[0].message.contains("已存在"));
        fs::remove_dir_all(directory).expect("test directory should be removed");
    }
}
