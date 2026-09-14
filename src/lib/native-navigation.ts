import { Capacitor } from "@capacitor/core";

export const isNativeApp = () => Capacitor.isNativePlatform();

function isAppPath(value: unknown): value is string {
  if (value === "/") return true;
  return typeof value === "string" && /^\/[a-z0-9][a-z0-9/_?=&.%+-]*$/i.test(value)
    && !value.includes("//") && !/%(?:2f|5c|0[ad])/i.test(value);
}

/** Only app-relative paths may become navigation destinations. */
export function getSignInDestination(value: unknown): string {
  if (!isAppPath(value)) return "/dashboard";
  const path = value.split("?")[0];
  if (["/login", "/signup", "/forgot-password", "/reset-password"].includes(path)) return "/dashboard";
  return value;
}

export function appHref(path: string): string {
  const destination = isAppPath(path) ? path : "/launchpad";
  return isNativeApp() ? `/#${destination}` : destination;
}

export function navigateApp(path: string): void {
  window.location.assign(appHref(path));
}
