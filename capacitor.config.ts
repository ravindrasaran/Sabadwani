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
      clientId: "269129763640-o5mtq5b1lb7pjn7u61ju4dber0g109u6.apps.googleusercontent.com",
      androidClientId: "269129763640-fct6f8u2vdhpplpet47l2ec231qh7vin.apps.googleusercontent.com",
      serverClientId: "269129763640-o5mtq5b1lb7pjn7u61ju4dber0g109u6.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;

