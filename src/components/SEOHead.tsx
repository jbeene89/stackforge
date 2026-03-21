import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
}

/**
 * Sets per-page <title> and <meta name="description"> for SEO.
 * Appends " | StackForge" to titles automatically.
 */
export function SEOHead({ title, description }: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | StackForge`
      : "StackForge — Build AI Modules & Stacks from Plain English";
    document.title = fullTitle;

    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
}
