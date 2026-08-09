// No mobile usamos o SDK nativo @react-native-firebase (não o firebase JS puro),
// pois ele integra melhor com o login Google nativo do Android/iOS.
// A config do projeto vem dos arquivos google-services.json (Android) e
// GoogleService-Info.plist (iOS), baixados do Firebase Console — não precisa
// duplicar firebaseConfig.js aqui.

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

export { auth, firestore };
