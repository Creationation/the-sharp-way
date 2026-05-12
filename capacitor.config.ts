import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'at.sitdownwien.app',
  appName: 'Sitdown Wien',
  webDir: 'dist',
  server: {
    url: 'https://sitdownvienna.app?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
