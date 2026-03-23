

## Refine Light Mode Contrast

Darken muted text and borders in the light-mode `:root` variables for better readability.

### Changes in `src/index.css`

| Variable | Current | New | Effect |
|---|---|---|---|
| `--muted-foreground` | `220 8% 46%` | `220 10% 38%` | Darker muted text |
| `--border` | `220 15% 90%` | `220 15% 84%` | More visible borders |
| `--input` | `220 15% 90%` | `220 15% 84%` | Match border |
| `--sidebar-border` | `220 15% 91%` | `220 15% 84%` | Consistent sidebar borders |

Four lines changed in the light-mode `:root` block. No other files affected.

