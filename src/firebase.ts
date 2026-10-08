import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDCVoZJyK5cXdrNGrO-dDIZWrgGOlCmUOY",
  authDomain: "hrms-d9d43.firebaseapp.com",
  projectId: "hrms-d9d43",
  storageBucket: "hrms-d9d43.firebasestorage.app",
  messagingSenderId: "994091951279",
  appId: "1:994091951279:web:d2c7f55c41360ea1a5205a"
};

// Initialize Firebase only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
