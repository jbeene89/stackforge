import { WORKSPACE_PATHS } from "./workspace-catalog";

export const WORKSPACE_PREFERENCES_KEY = "soupylab.workspace.v1";
const MAX_RECENT = 4;

export interface WorkspacePreferences {
  version: 1;
  favorites: string[];
  recent: string[];
}

export function emptyWorkspacePreferences(): WorkspacePreferences {
  return { version: 1, favorites: [], recent: [] };
}

function knownPaths(value: unknown, maximum = WORKSPACE_PATHS.size): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && WORKSPACE_PATHS.has(item)))].slice(0, maximum);
}

/** Stores tool paths only. Never accepts prompts, project contents, or arbitrary URLs. */
export function parseWorkspacePreferences(raw: string | null): WorkspacePreferences {
  if (!raw) return emptyWorkspacePreferences();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("version" in parsed) || parsed.version !== 1) return emptyWorkspacePreferences();
    return {
      version: 1,
      favorites: knownPaths("favorites" in parsed ? parsed.favorites : []),
      recent: knownPaths("recent" in parsed ? parsed.recent : [], MAX_RECENT),
    };
  } catch {
    return emptyWorkspacePreferences();
  }
}

export function readWorkspacePreferences(): WorkspacePreferences {
  try {
    return parseWorkspacePreferences(window.localStorage.getItem(WORKSPACE_PREFERENCES_KEY));
  } catch {
    return emptyWorkspacePreferences();
  }
}

export function saveWorkspacePreferences(preferences: WorkspacePreferences): boolean {
  try {
    const safe = parseWorkspacePreferences(JSON.stringify(preferences));
    window.localStorage.setItem(WORKSPACE_PREFERENCES_KEY, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}

export function toggleWorkspaceFavorite(preferences: WorkspacePreferences, path: string): WorkspacePreferences {
  if (!WORKSPACE_PATHS.has(path)) return preferences;
  return {
    ...preferences,
    favorites: preferences.favorites.includes(path)
      ? preferences.favorites.filter(favorite => favorite !== path)
      : [...preferences.favorites, path],
  };
}

export function recordWorkspaceVisit(preferences: WorkspacePreferences, path: string): WorkspacePreferences {
  if (!WORKSPACE_PATHS.has(path)) return preferences;
  return { ...preferences, recent: [path, ...preferences.recent.filter(recent => recent !== path)].slice(0, MAX_RECENT) };
}
