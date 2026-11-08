import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'VOTILT',
  slug: 'votilt',
  version: '0.1.0',
  scheme: 'votilt',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  platforms: ['android', 'ios'],
  icon: './assets/icons/icon.png',
  android: {
    package: 'com.antetempo.votilt',
    permissions: [],
    adaptiveIcon: { foregroundImage: './assets/icons/adaptive.png', backgroundColor: '#090711' },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-build-properties',
      { android: {...(process.platform === 'win32' ? { cmakeVersion: '3.31.6' } : {}),usesCleartextTraffic:true} },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Scegli un’immagine da proporre a VOTILT.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    [
      'expo-splash-screen',
      { image: './assets/icons/splash.png', imageWidth: 150, backgroundColor: '#090711' },
    ],
  ],
  experiments: { typedRoutes: true },
};
export default config;
