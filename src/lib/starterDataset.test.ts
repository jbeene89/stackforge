import { describe, expect, it } from "vitest";
import { starterSampleRows } from "./starterDataset";

describe("starter dataset", () => {
  it("creates exactly 10 usable pairs", () => {
    const rows = starterSampleRows("dataset", "owner");
    expect(rows).toHaveLength(10);
    expect(rows.every(row => row.input.length > 0 && row.output.length > 0)).toBe(true);
    expect(new Set(rows.map(row => row.input)).size).toBe(10);
  });
  it("assigns every pair to the signed-in owner and selected dataset", () => {
    expect(starterSampleRows("dataset-123", "owner-456").every(row => row.dataset_id === "dataset-123" && row.user_id === "owner-456")).toBe(true);
  });
});