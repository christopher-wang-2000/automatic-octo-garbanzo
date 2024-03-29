import { initializeApp } from "firebase/app";
import { initializeAuth, GoogleAuthProvider, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBu9aKJH7CmvYC1JatUN8uuUCAc7z9_jtI",
    authDomain: "socialtracker-d5908.firebaseapp.com",
    databaseURL: "https://socialtracker-d5908-default-rtdb.firebaseio.com",
    projectId: "socialtracker-d5908",
    storageBucket: "socialtracker-d5908.appspot.com",
    messagingSenderId: "566822880515",
    appId: "1:566822880515:web:b1391651e8c6c2e2b31536",
    measurementId: "G-M4QYH4FJL3"
  };

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
auth.useDeviceLanguage();