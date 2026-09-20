import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppSettingsPage from "./AppSettingsPage";
vi.mock("@/lib/native-navigation", () => ({ isNativeApp: () => false }));
afterEach(cleanup);
it("rates the SoupyLab package and keeps feedback as an explicit email draft", () => {
  render(<MemoryRouter><AppSettingsPage /></MemoryRouter>);
  expect(screen.getByRole("link", { name: "Rate SoupyLab" })).toHaveAttribute("href", "https://play.google.com/store/apps/details?id=com.soupylab.app");
  fireEvent.change(screen.getByLabelText("What worked, or what should we improve?"), { target: { value: "Photos & previews\nNeed help?" } });
  const url = screen.getByRole("link", { name: "Open email draft" }).getAttribute("href")!;
  expect(url).toContain("mailto:support@soupy.com?");
  expect(decodeURIComponent(url)).toContain("Photos & previews\nNeed help?");
});
it("allows the guide to be skipped and replayed from step one", () => {
  render(<MemoryRouter><AppSettingsPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Quick start guide" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Start with your knowledge")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Skip guide" }));
  fireEvent.click(screen.getByRole("button", { name: "Quick start guide" }));
  expect(screen.getByText("Find a tool")).toBeInTheDocument();
});
