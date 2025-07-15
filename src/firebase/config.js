import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBidbjl5-0iyAmYXqUphFXwr9OUOkcK2Cc",
  authDomain: "e-id-zimbabwe.firebaseapp.com",
  projectId: "e-id-zimbabwe",
  storageBucket: "e-id-zimbabwe.firebasestorage.app",
  messagingSenderId: "210756764091",
  appId: "1:210756764091:web:a648dceb340885352f849e",
  measurementId: "G-X1N6DWDKQE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
