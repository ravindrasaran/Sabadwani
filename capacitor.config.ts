import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ravindrasaran.sabadwani',
  appName: 'Sabadwani',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      forceCodeForRefreshToken: true
    }
  }
};

export default config;

