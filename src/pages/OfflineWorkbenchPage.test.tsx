import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cacheDelete, cacheGetAll } from "@/lib/offlineCache";
import OfflineWorkbenchPage from "./OfflineWorkbenchPage";

vi.mock("@/lib/offlineCache", () => ({
  cacheGetAll: vi.fn(),
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  cachePut: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/native-navigation", () => ({ isNativeApp: () => true }));
vi.mock("@/components/native/LocalTrainingNotebook", () => ({
  LocalTrainingNotebook: () => <div>Training notebook</div>,
}));
vi.mock("@/components/SEOHead", () => ({ SEOHead: () => null }));

const demoRecord = {
  id: "offline-demo-project-test", user_id: "offline-local-user", name: "Example storage record", updated_at: "2026-01-01",
};

describe("public offline storage check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cacheGetAll).mockImplementation(async (store) => store === "projects" ? [
      demoRecord,
      { id: "private-project", user_id: "account-owner", name: "Private customer project" },
      { id: "offline-demo-project-real", user_id: "account-owner", name: "Private matching-prefix project" },
    ] : []);
  });

  it("does not render cached account records on the public workbench", async () => {
    render(<MemoryRouter><OfflineWorkbenchPage /></MemoryRouter>);
    expect(await screen.findByText("Example storage record")).toBeInTheDocument();
    expect(screen.queryByText("Private customer project")).not.toBeInTheDocument();
    expect(screen.queryByText("Private matching-prefix project")).not.toBeInTheDocument();
  });

  it("clears only the storage check's demo records", async () => {
    render(<MemoryRouter><OfflineWorkbenchPage /></MemoryRouter>);
    await screen.findByText("Example storage record");
    fireEvent.click(screen.getByText("Clear demo workspace"));
    await waitFor(() => expect(cacheDelete).toHaveBeenCalledWith("projects", demoRecord.id));
    expect(cacheDelete).toHaveBeenCalledTimes(1);
  });
});
