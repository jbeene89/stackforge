import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  canonicalPath?: string;
}

/**
 * Sets per-page <title>, <meta name="description">, and Open Graph tags for SEO.
 * Appends " | Soupy" to titles automatically.
 */
export function SEOHead({ title, description, ogTitle, ogDescription, ogType = "website", canonicalPath }: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | Soupy`
      : "Soupy — Design AI modules from plain English";
    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [key, val] = selector.match(/\[(.+?)="(.+?)"\]/)?.slice(1) || [];
        if (key && val) el.setAttribute(key, val);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", ogTitle || fullTitle);
    setMeta('meta[property="og:description"]', "content", ogDescription || description);
    setMeta('meta[property="og:type"]', "content", ogType);

    if (canonicalPath) {
      const url = `https://stackforge.lovable.app${canonicalPath}`;
      setMeta('meta[property="og:url"]', "content", url);
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = url;
    }
  }, [title, description, ogTitle, ogDescription, ogType, canonicalPath]);

  return null;
}
