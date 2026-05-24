# Phase 3: Execution & Undo - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 3-execution-undo
**Areas discussed:** Execute button position, Execution feedback, Error handling, Undo behavior

---

## Execute Button Position

| Option | Description | Selected |
|--------|-------------|----------|
| Right panel bottom | Add bottom action bar inside RenamePanel — below forms, with execute + undo + conflict count | ✓ |
| Full-width bottom bar | Fixed bar spanning both panels at the bottom of the app window | |
| Left panel bottom | Below the file list, near the data being modified | |

**User's choice:** Right panel bottom
**Notes:** Consistent with current right panel layout

---

| Option | Description | Selected |
|--------|-------------|----------|
| Execute button + conflict count | Simple: only execute + conflict count | |
| Execute + Undo + conflict count | Include undo button (disabled until after execution) | ✓ |

**User's choice:** Execute + Undo + conflict count

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full-width bar at bottom | Horizontal bar spanning entire right panel width | ✓ |
| Sticky to bottom of form area | Button attached below active form content, scrolls | |

**User's choice:** Full-width bar at bottom

---

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible, disabled before execute | Undo button always shows, grayed before execution | |
| Appears only after execution | Undo button hidden until after a successful rename | ✓ |

**User's choice:** Appears only after execution

---

| Option | Description | Selected |
|--------|-------------|----------|
| Direct execute (no confirmation) | Immediately rename files | ✓ |
| Confirmation dialog | One extra click but prevents accidental execution | |

**User's choice:** Direct execute (no confirmation)

---

## Execution Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Inline status update per file | Each file row shows ✓ or ✗ inline | |
| Success banner + inline status | Brief success banner top of right panel | |
| Toast notification + inline status | Toast appears briefly then fades + inline ✓/✗ per file | ✓ |

**User's choice:** Toast notification + inline status

---

| Option | Description | Selected |
|--------|-------------|----------|
| Instant (no progress) | No progress bar needed for typical batches | |
| Brief progress animation | Button shows '重命名中...' with spinner | ✓ |

**User's choice:** Brief progress animation

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Skip failures, continue | Skip failed files and continue with remaining | |
| Stop on first error | Stop immediately when any rename fails | ✓ |
| All-or-nothing with rollback | Roll back successfully renamed files on failure | |

**User's choice:** Stop on first error
**Notes:** Already-renamed files stay renamed (partial execution accepted)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Two-pass (temp names) | Rename to temp UUID-based names first, then to final names | ✓ |
| Ordered single-pass | Skip temp pass, handle collisions inline | |

**User's choice:** Two-pass (temp names)

---

## Undo Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory only | Store undo snapshot in React state | |
| Persistent (FileSystem) | Write JSON snapshot file to temp directory | ✓ |

**User's choice:** Persistent (FileSystem)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reverse two-pass undo | Restore via temp names first, then original names | ✓ |
| Direct restore (no temp) | Restore directly from original path snapshot | |

**User's choice:** Reverse two-pass undo

---

## Deferred Ideas

None.
