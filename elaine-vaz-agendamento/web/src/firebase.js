import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "../../shared/firebaseConfig";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Algumas redes de celular (principalmente com "Economia de dados"/proxy
// da operadora ativado) bloqueiam o tipo de conexão que o Firestore usa
// por padrão (WebSockets). experimentalAutoDetectLongPolling faz o SDK
// detectar isso sozinho e usar um modo alternativo (long-polling), que
// funciona em praticamente qualquer rede.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export const googleProvider = new GoogleAuthProvider();