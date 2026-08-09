import { useEffect, useState, useCallback } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { auth, firestore } from "../firebase";

GoogleSignin.configure({
  // webClientId vem do Firebase Console > Authentication > Sign-in method > Google
  webClientId: process.env.FIREBASE_WEB_CLIENT_ID,
});

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(googleCredential);

    const { uid, displayName, email, photoURL } = result.user;
    await firestore()
      .collection("usuarios")
      .doc(uid)
      .set(
        { nome: displayName, email, fotoUrl: photoURL, atualizadoEm: firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

    return result.user;
  }, []);

  const logout = useCallback(() => auth().signOut(), []);

  return { user, loading, login, logout };
}
