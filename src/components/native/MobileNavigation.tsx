import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brain, Home, LayoutGrid, NotebookPen } from "lucide-react";
import { isNativeApp } from "@/lib/native-navigation";
import { useAuth } from "@/hooks/useAuth";
import { WORKSPACE_TOOLS } from "@/lib/workspace-catalog";
import { readWorkspacePreferences, recordWorkspaceVisit, saveWorkspacePreferences } from "@/lib/workspace-preferences";
import "./mobile-navigation.css";

const links = [
  { path: "/launchpad", label: "Home", Icon: Home },
  { path: "/slm-lab", label: "Train", Icon: Brain },
  { path: "/offline-workbench", label: "Notebook", Icon: NotebookPen },
  { path: "/launchpad?view=tools", label: "Tools", Icon: LayoutGrid },
];

export function RouteActivity() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const signedIn = Boolean(user);
  useEffect(() => {
    // Record only known tool routes. Never store project IDs, queries, or content.
    const tool = WORKSPACE_TOOLS.find(item => item.path === pathname);
    if (tool && (tool.access === "public" || signedIn)) {
      const previous = readWorkspacePreferences();
      const next = recordWorkspaceVisit(previous, pathname);
      if (next.recent.join("|") !== previous.recent.join("|")) {
        if (saveWorkspacePreferences(next)) window.dispatchEvent(new Event("soupylab:workspace-preferences"));
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, signedIn]);
  return null;
}

export function MobileNavigation() {
  const { pathname } = useLocation();
  if (!isNativeApp() || pathname === "/launchpad") return null;
  return (
    <>
      <div className="soupy-mobile-nav-spacer" aria-hidden="true" />
      <nav className="soupy-mobile-nav" aria-label="Main navigation">
        {links.map(({ path, label, Icon }) => (
          <Link key={label} to={path} aria-current={pathname === path ? "page" : undefined}>
            <Icon size={21} aria-hidden="true" /><span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
