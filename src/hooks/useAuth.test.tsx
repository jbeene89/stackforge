import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "./useAuth";
import { isNativeApp } from "@/lib/native-navigation";
import { toast } from "sonner";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: { signInWithOAuth: vi.fn() } } }));
vi.mock("@/lib/native-navigation", () => ({ isNativeApp: vi.fn(() => true) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function SessionState() {
  const { loading, user } = useAuth();
  return <p>{loading ? "Restoring session" : user ? "Signed in" : "Signed out"}</p>;
}

describe("session restoration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNativeApp).mockReturnValue(true);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
  });

  it("settles an initial session error without granting authenticated access", async () => {
    vi.mocked(supabase.auth.getSession).mockRejectedValueOnce(new Error("Storage unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      render(<AuthProvider><SessionState /></AuthProvider>);
      await waitFor(() => expect(screen.getByText("Signed out")).toBeInTheDocument());
      expect(screen.queryByText("Restoring session")).not.toBeInTheDocument();
      expect(screen.queryByText("Signed in")).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it.each([true, false])("uses reachable email confirmation and reset URLs (native: %s)", async (native) => {
    vi.mocked(isNativeApp).mockReturnValue(native);
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // All auth methods are mocked; no account or email is created by this test.
    await act(async () => {
      await result.current.signUp("tester@example.invalid", "test-only-password");
      await result.current.resetPassword("tester@example.invalid");
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({
        emailRedirectTo: native ? "https://www.soupylab.com/" : window.location.origin,
      }),
    }));
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("tester@example.invalid", {
      redirectTo: `${native ? "https://www.soupylab.com" : window.location.origin}/reset-password`,
    });
    if (native) {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("return to this app to sign in"));
    }
  });
});
