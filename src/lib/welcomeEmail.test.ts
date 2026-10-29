import { describe, expect, it } from "vitest";
import { welcomeRequest } from "./welcomeEmail";

const now = Date.parse("2026-10-29T04:38:00Z");
const account = { id: "new-account", email: "test@example.invalid", created_at: new Date(now - 60000).toISOString(), email_confirmed_at: new Date(now).toISOString() };
describe("welcome email eligibility", () => {
  it("uses one stable key for a new confirmed account", () => {
    expect(welcomeRequest(account, now)?.idempotencyKey).toBe("welcome-new-account");
  });
  it("does not send an old user a re-engagement email", () => {
    expect(welcomeRequest({ ...account, created_at: new Date(now - 86400001).toISOString() }, now)).toBeNull();
  });
  it("waits until the address is confirmed", () => {
    expect(welcomeRequest({ ...account, email_confirmed_at: undefined }, now)).toBeNull();
  });
});