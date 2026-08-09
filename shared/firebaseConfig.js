// Config do Firebase para o WEB.
// O Vite expõe variáveis de ambiente via import.meta.env, e só as que
// começam com VITE_ ficam disponíveis no navegador (por segurança).
// Os valores reais ficam em web/.env, nunca commitados.
// Pegue esses valores em: Firebase Console > Configurações do projeto > Seus apps
//
// Obs.: o mobile NÃO usa este arquivo — ele lê a config nativa direto de
// google-services.json (Android) e GoogleService-Info.plist (iOS).

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
