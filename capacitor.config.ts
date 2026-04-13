import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'at.thesharpcut.app',
  appName: 'Sitdown Wien',
  webDir: 'dist',
  server: {
    url: 'https://the-sharp-way.lovable.app',
    cleartext: false,
  },
};

export default config;
