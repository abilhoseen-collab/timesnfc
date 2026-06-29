import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.26abe0ecb26d4d6b9a21689a0e9c13d2',
  appName: 'timesnfc',
  webDir: 'dist',
  server: {
    url: 'https://26abe0ec-b26d-4d6b-9a21-689a0e9c13d2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0218',
    },
  },
};

export default config;
