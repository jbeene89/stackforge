import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SpriteSettings {
  visible: boolean;
  setVisible: (v: boolean) => void;
  sizeMultiplier: number;
  setSizeMultiplier: (v: number) => void;
  spellsEnabled: boolean;
  setSpellsEnabled: (v: boolean) => void;
}

const SpriteSettingsContext = createContext<SpriteSettings>({
  visible: true,
  setVisible: () => {},
  sizeMultiplier: 1.4,
  setSizeMultiplier: () => {},
  spellsEnabled: true,
  setSpellsEnabled: () => {},
});

export const useSpriteSettings = () => useContext(SpriteSettingsContext);

const STORAGE_KEY = "soupy-sprite-settings";

export function SpriteSettingsProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [sizeMultiplier, setSizeMultiplier] = useState(1.4);
  const [spellsEnabled, setSpellsEnabled] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.visible === "boolean") setVisible(parsed.visible);
        if (typeof parsed.sizeMultiplier === "number") setSizeMultiplier(parsed.sizeMultiplier);
        if (typeof parsed.spellsEnabled === "boolean") setSpellsEnabled(parsed.spellsEnabled);
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ visible, sizeMultiplier, spellsEnabled }));
  }, [visible, sizeMultiplier, spellsEnabled]);

  return (
    <SpriteSettingsContext.Provider value={{ visible, setVisible, sizeMultiplier, setSizeMultiplier, spellsEnabled, setSpellsEnabled }}>
      {children}
    </SpriteSettingsContext.Provider>
  );
}
