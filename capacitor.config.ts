import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soupylab.app',
  appName: 'SoupyLab',
  webDir: 'dist',
  plugins: {
    SystemBars: { style: 'DARK', insetsHandling: 'css' },
  },
};

export default config;
