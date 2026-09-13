/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite/client" />

interface Window {
  gtag: (...args: any[]) => void;
}

