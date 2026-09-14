import { afterEach, describe, expect, it, vi } from "vitest";
import { searchWorkspaceTools } from "./workspace-catalog";
import {
  emptyWorkspacePreferences, parseWorkspacePreferences, readWorkspacePreferences,
  recordWorkspaceVisit, saveWorkspacePreferences, toggleWorkspaceFavorite,
  WORKSPACE_PREFERENCES_KEY,
} from "./workspace-preferences";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("workspace navigation preferences", () => {
  it("keeps only recognized tool paths, without arbitrary URLs or user content", () => {
    const parsed = parseWorkspacePreferences(JSON.stringify({
      version: 1,
      favorites: ["/slm-lab", "/slm-lab", "https://example.com", "/projects/private-id", { prompt: "private" }, "/offline-workbench"],
      recent: ["/capture", "/capture", "/models", "/deploy", "/modules", "/stacks", "a personal note"],
      prompt: "do not retain this",
    }));
    expect(parsed).toEqual({
      version: 1,
      favorites: ["/slm-lab", "/offline-workbench"],
      recent: ["/capture", "/models", "/deploy", "/modules"],
    });
  });

  it.each([null, "broken JSON", "null", "42", '{"version":2,"favorites":["/slm-lab"]}', '{"favorites":["/slm-lab"]}'])("recovers safely from unsupported or corrupt storage: %s", raw => {
    expect(parseWorkspacePreferences(raw)).toEqual(emptyWorkspacePreferences());
  });

  it("starring a tool does not add it to navigation history", () => {
    const initial = emptyWorkspacePreferences();
    const starred = toggleWorkspaceFavorite(initial, "/slm-lab");
    expect(initial.favorites).toEqual([]);
    expect(starred).toEqual({ version: 1, favorites: ["/slm-lab"], recent: [] });
    expect(toggleWorkspaceFavorite(starred, "/slm-lab").favorites).toEqual([]);
    expect(toggleWorkspaceFavorite(starred, "javascript:alert(1)")).toBe(starred);
  });

  it("moves revisited tools to the front and bounds recent history", () => {
    let preferences = emptyWorkspacePreferences();
    for (const path of ["/slm-lab", "/capture", "/models", "/deploy", "/capture", "/modules"]) {
      preferences = recordWorkspaceVisit(preferences, path);
    }
    expect(preferences.recent).toEqual(["/modules", "/capture", "/deploy", "/models"]);
    expect(recordWorkspaceVisit(preferences, "/login")).toBe(preferences);
    expect(recordWorkspaceVisit(preferences, "/slm-lab?prompt=private")).toBe(preferences);
  });

  it("persists favorites through a new read", () => {
    expect(saveWorkspacePreferences(toggleWorkspaceFavorite(emptyWorkspacePreferences(), "/slm-lab"))).toBe(true);
    expect(readWorkspacePreferences().favorites).toEqual(["/slm-lab"]);
    expect(JSON.parse(localStorage.getItem(WORKSPACE_PREFERENCES_KEY)!).version).toBe(1);
  });

  it("handles unavailable browser storage without breaking the launcher", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    expect(readWorkspacePreferences()).toEqual(emptyWorkspacePreferences());
    expect(saveWorkspacePreferences(emptyWorkspacePreferences())).toBe(false);
  });
});

describe("tool discovery", () => {
  it("finds tools by a task and respects the selected subject", () => {
    expect(searchWorkspaceTools("  FIELD notes ", "Create").map(tool => tool.id)).toContain("demo-builder");
    expect(searchWorkspaceTools("field notes", "Deploy")).toEqual([]);
    expect(searchWorkspaceTools("jsonl").map(tool => tool.id)).toEqual(["offline-workbench"]);
  });
});
