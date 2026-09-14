import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { ModelContextProvider, useModelContext } from "./useModelContext";

const auth = vi.hoisted(() => ({ user: { id: "user-a" } as { id: string } | null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
vi.mock("@tanstack/react-query", () => ({
  // Disabled queries can still return cached data. Keep doing so to exercise the leak.
  useQuery: vi.fn(() => ({ data: [{ key: "data", label: "DATA", icon: "", route: "/slm-lab", complete: true }] })),
}));

const renderedNames: Array<string | null> = [];

function CurrentModel() {
  const { activeModel, setActiveDataset, selectedBaseModel } = useModelContext();
  renderedNames.push(activeModel?.datasetName ?? null);
  return <>
    <p>{activeModel?.datasetName ?? "No private dataset"}</p>
    <p>{selectedBaseModel}</p>
    <button onClick={() => setActiveDataset("dataset-a", "Private field notes")}>Select first dataset</button>
    <button onClick={() => setActiveDataset("dataset-b", "Second account notes")}>Select second dataset</button>
  </>;
}

const view = () => <ModelContextProvider><CurrentModel /></ModelContextProvider>;

describe("selected dataset ownership", () => {
  beforeEach(() => {
    auth.user = { id: "user-a" };
    renderedNames.length = 0;
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("soupy_base_model", "Qwen/Qwen3-0.6B");
  });
  afterEach(cleanup);

  it("hides the previous account's dataset on the first signed-out render and clears selection", () => {
    const { rerender } = render(view());
    fireEvent.click(screen.getByRole("button", { name: "Select first dataset" }));
    expect(screen.getByText("Private field notes")).toBeInTheDocument();

    renderedNames.length = 0;
    auth.user = null;
    rerender(view());
    expect(renderedNames.every(name => name === null)).toBe(true);
    expect(screen.getByText("No private dataset")).toBeInTheDocument();
    expect(vi.mocked(useQuery).mock.lastCall?.[0]).toMatchObject({ enabled: false });

    auth.user = { id: "user-a" };
    rerender(view());
    expect(screen.queryByText("Private field notes")).not.toBeInTheDocument();
    expect(screen.getByText("Qwen/Qwen3-0.6B")).toBeInTheDocument();
  });

  it("scopes pipeline queries to the account and never renders the old name during account switching", () => {
    const { rerender } = render(view());
    fireEvent.click(screen.getByRole("button", { name: "Select first dataset" }));
    expect(vi.mocked(useQuery).mock.lastCall?.[0]).toMatchObject({
      queryKey: ["pipeline-progress", "user-a", "dataset-a"], enabled: true,
    });

    renderedNames.length = 0;
    auth.user = { id: "user-b" };
    rerender(view());
    expect(renderedNames.every(name => name === null)).toBe(true);
    expect(vi.mocked(useQuery).mock.lastCall?.[0]).toMatchObject({ enabled: false });

    fireEvent.click(screen.getByRole("button", { name: "Select second dataset" }));
    expect(screen.getByText("Second account notes")).toBeInTheDocument();
    expect(vi.mocked(useQuery).mock.lastCall?.[0]).toMatchObject({
      queryKey: ["pipeline-progress", "user-b", "dataset-b"], enabled: true,
    });
    expect(localStorage.getItem("soupy_base_model")).toBe("Qwen/Qwen3-0.6B");
  });

  it("does not accept account dataset selection while signed out", () => {
    auth.user = null;
    render(view());
    fireEvent.click(screen.getByRole("button", { name: "Select first dataset" }));
    expect(screen.queryByText("Private field notes")).not.toBeInTheDocument();
    expect(vi.mocked(useQuery).mock.lastCall?.[0]).toMatchObject({ enabled: false });
  });
});
