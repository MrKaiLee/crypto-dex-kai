import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7s_sdr9X72MHndrYu1WPkjp9c0zjwOtw",
  authDomain: "crypto-dex-admin.firebaseapp.com",
  projectId: "crypto-dex-admin",
  storageBucket: "crypto-dex-admin.appspot.com",
  messagingSenderId: "804505596197",
  appId: "1:804505596197:web:e7de23af1ab505224aaacc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);