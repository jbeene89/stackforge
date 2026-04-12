# `to-train/` — Shared Local Data Bus Specification

**Version:** 1.0  
**Status:** Active  
**Maintained by:** Soupy Ecosystem

---

## Overview

`to-train/` is a **shared folder convention** used across all Soupy ecosystem apps as a local-first data bus for AI training pipelines. Any app that produces training data writes to this folder. Any app that consumes training data reads from it.

No APIs. No cloud sync. No database. Just JSONL files in a folder.

```
to-train/
├── soupy_cdpt_cooking-dataset.jsonl      ← Soupy CDPT pipeline output
├── lifecard_daily-reflections.jsonl       ← LifeCard personal data pairs
├── sace_emotion-tagged.jsonl             ← SACE Affect Radar emotion context
├── openair_expanded.jsonl                ← Open Air Popcorn enriched data
├── cleaned_filtered.jsonl                ← Garbage filter cleaned output
├── manifest.json                         ← Tracks who wrote what
├── README.md                             ← Human-readable guide
└── .gitkeep
```

---

## File Naming Convention

All files MUST follow this pattern:

```
{source}_{descriptor}.jsonl
```

| Segment       | Description                                          | Examples                              |
|--------------|------------------------------------------------------|---------------------------------------|
| `{source}`   | App or tool that produced the file (lowercase, no spaces) | `soupy`, `lifecard`, `sace`, `openair`, `manual` |
| `{descriptor}` | What the data contains (kebab-case)                  | `cdpt-pairs`, `emotion-tagged`, `dpo-garbage`, `daily-reflections` |

**Rules:**
- Always `.jsonl` or `.json` extension
- Never overwrite another app's files
- Use unique descriptors — if you need to version, append `_v2`, `_v3`, etc.
- Temporary/intermediate files should use `_tmp` suffix and be cleaned up

---

## Supported Record Formats

Every file must contain one of these record shapes per line:

### 1. Messages (OpenAI chat format) — **preferred**
```json
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

### 2. DPO Preference Pairs
```json
{"prompt": "...", "chosen": "good answer", "rejected": "bad answer"}
```

### 3. Input/Output Pairs
```json
{"input": "...", "output": "..."}
```

### 4. Plain Text
```json
{"text": "raw content here"}
```

### 5. CDPT Enriched (Soupy native format)
```json
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "<BUILDER>...</BUILDER>\n\n<RED_TEAM>...</RED_TEAM>\n\n<SYNTHESIS>...</SYNTHESIS>"}]}
```

All formats are auto-detected by `train.py` and `inject.py --mode open-air`.

---

## Manifest File

Each app SHOULD update `manifest.json` when writing to the folder:

```json
{
  "version": "1.0",
  "last_updated": "2026-04-12T10:30:00Z",
  "entries": [
    {
      "file": "soupy_cdpt-cooking.jsonl",
      "source": "soupy",
      "app_version": "1.0.0",
      "record_count": 147,
      "format": "messages",
      "created": "2026-04-12T10:30:00Z",
      "description": "CDPT pipeline output for cooking domain"
    },
    {
      "file": "lifecard_daily-reflections.jsonl",
      "source": "lifecard",
      "app_version": "0.8.0",
      "record_count": 52,
      "format": "messages",
      "created": "2026-04-11T18:00:00Z",
      "description": "Personal reflection training pairs from LifeCard"
    }
  ]
}
```

**Rules:**
- Each app only modifies its own entries in `manifest.json`
- Read-merge-write pattern: load existing manifest, add/update your entry, write back
- If manifest doesn't exist, create it
- `record_count` is approximate (for display purposes)

---

## App Responsibilities

### Producer Apps (write to to-train/)
| App | Source Prefix | Typical Output |
|-----|--------------|----------------|
| **Soupy** (this app) | `soupy_` | CDPT pairs, smelted data, scraped content |
| **LifeCard** | `lifecard_` | Personal knowledge pairs, daily reflections |
| **SACE Affect Radar** | `sace_` | Emotion-tagged content, affect-enriched pairs |
| **Open Air Popcorn** | `openair_` | Perspective-expanded seed data |
| **DPO Generator** | `dpo_` | Preference pairs for untraining |
| **Manual drops** | `manual_` | User-provided files |

### Consumer Apps (read from to-train/)
| App | What It Does |
|-----|-------------|
| **train.py** | Merges all files → trains model |
| **inject.py --mode open-air** | Reads seeds → expands through CDPT perspectives |
| **Garbage filter** | Reads → filters low-quality → writes cleaned version |
| **Quality scorer** | Reads → scores → writes scored version |

### Transformer Apps (read AND write)
Apps that read from `to-train/`, transform the data, and write back should:
1. Read from source files (e.g., `soupy_raw-pairs.jsonl`)
2. Write to a NEW file with their own prefix (e.g., `sace_emotion-tagged.jsonl`)
3. Never modify the original source file

---

## Integration Pattern

For any new app joining the ecosystem:

```python
import json, os, glob
from datetime import datetime

TO_TRAIN = os.environ.get("SOUPY_TRAIN_DIR", "to-train")
APP_NAME = "myapp"  # your app's source prefix

def write_pairs(pairs, descriptor="output"):
    """Write training pairs to the shared folder."""
    os.makedirs(TO_TRAIN, exist_ok=True)
    filename = f"{APP_NAME}_{descriptor}.jsonl"
    filepath = os.path.join(TO_TRAIN, filename)
    
    with open(filepath, "w", encoding="utf-8") as f:
        for pair in pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")
    
    # Update manifest
    update_manifest(filename, len(pairs), descriptor)
    return filepath

def read_all_pairs():
    """Read all training data from the shared folder."""
    files = sorted(
        glob.glob(os.path.join(TO_TRAIN, "*.json")) +
        glob.glob(os.path.join(TO_TRAIN, "*.jsonl"))
    )
    all_pairs = []
    for fp in files:
        with open(fp, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        all_pairs.append(json.loads(line))
                    except json.JSONDecodeError:
                        all_pairs.append({"text": line})
    return all_pairs

def update_manifest(filename, count, description):
    """Update the shared manifest file."""
    manifest_path = os.path.join(TO_TRAIN, "manifest.json")
    manifest = {"version": "1.0", "last_updated": "", "entries": []}
    
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            try:
                manifest = json.load(f)
            except:
                pass
    
    # Remove existing entry for this file
    manifest["entries"] = [e for e in manifest["entries"] if e.get("file") != filename]
    
    # Add new entry
    manifest["entries"].append({
        "file": filename,
        "source": APP_NAME,
        "record_count": count,
        "format": "messages",
        "created": datetime.now().isoformat(),
        "description": description,
    })
    manifest["last_updated"] = datetime.now().isoformat()
    
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
```

---

## Environment Variable

Apps can override the default folder path via:

```bash
export SOUPY_TRAIN_DIR="/path/to/shared/to-train"
```

Default: `to-train/` relative to the app's working directory.

For cross-app setups where multiple apps share the same folder, point them all to the same absolute path:

```bash
# In each app's .env or startup script:
export SOUPY_TRAIN_DIR="$HOME/ai-training/to-train"
```

---

## Quick Reference

| Question | Answer |
|----------|--------|
| Where do I put training data? | `to-train/` |
| What format? | JSONL (one JSON object per line) |
| How to name files? | `{source}_{descriptor}.jsonl` |
| Can I overwrite other apps' files? | **No** — write your own, prefix with your app name |
| How does training pick it up? | `train.py` auto-scans the entire folder |
| How does Open Air Popcorn use it? | `inject.py --mode open-air` reads everything in `to-train/` |
| Shared across apps? | Set `SOUPY_TRAIN_DIR` env var to the same path |

---

*Generated by Soupy — the local-first AI training ecosystem.*
