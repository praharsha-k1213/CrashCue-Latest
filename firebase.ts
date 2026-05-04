import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBiY0MCxeBAkSUu-a3UDtIg2ghzPaDh34w",
  authDomain: "crashcue-projectid01.firebaseapp.com",
  projectId: "crashcue-projectid01",
  storageBucket: "crashcue-projectid01.firebasestorage.app",
  messagingSenderId: "519432433636",
  appId: "1:519432433636:web:4f60e6454cc6d2b36161f1",
  measurementId: "G-L6HFGKLS3J"
};
const app: FirebaseApp = initializeApp(firebaseConfig);
let auth: Auth;
const initializeFirebaseAuth = () => {
  try {
    let getReactNativePersistence: any;
    try {
      const authModule = require('firebase/auth');
      getReactNativePersistence = authModule.getReactNativePersistence;
    } catch (e) {
      try {
        const firebaseAuthModule = require('@firebase/auth');
        getReactNativePersistence = firebaseAuthModule.getReactNativePersistence;
      } catch (e2) {
        try {
          const rnAuthModule = require('firebase/auth/react-native');
          getReactNativePersistence = rnAuthModule.getReactNativePersistence;
        } catch (e3) {
          console.warn('⚠️ Could not find getReactNativePersistence in any import path');
          throw new Error('getReactNativePersistence not found');
        }
      }
    }
    if (getReactNativePersistence) {
      console.log('✅ Initializing Firebase Auth with AsyncStorage persistence');
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } else {
      throw new Error('getReactNativePersistence is not available');
    }
  } catch (error) {
    console.warn('⚠️ Failed to initialize Firebase Auth with AsyncStorage persistence:', error);
    console.log('🔄 Falling back to default auth initialization');
    console.log('📝 Note: Auth state will use memory persistence and may not persist between sessions');
    return getAuth(app);
  }
};
auth = initializeFirebaseAuth();

export const db: Firestore = getFirestore(app);
export { auth };
