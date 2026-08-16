// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.thegenapp.retreat',
  appName: 'The Gen Family',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // ✅ Add this to help with loading
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0A',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    }
  }
};

export default config;