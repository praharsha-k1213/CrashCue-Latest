/**
 * 
 * 1. FOR EXPO GO MODE (npx expo start + Expo Go app):
 *    UNCOMMENT the "EXPO GO MODE" section below
 *    COMMENT OUT the "DEVELOPMENT BUILD MODE" section
 * 
 * 2. FOR DEVELOPMENT BUILD MODE (eas build / npx expo run:android):
 *    COMMENT OUT the "EXPO GO MODE" section
 *    UNCOMMENT the "DEVELOPMENT BUILD MODE" section below
 * 
 */
// ============================================================================
// EXPO GO MODE - Uncomment this section for Expo Go
// ============================================================================
// export function useGoogleAuth() {
//     return {
//         promptAsync: () => {
//             console.warn("Google Sign-In disabled (not supported in Expo Go)");
//         },
//         user: null,
//         signOut: async () => { },
//         loading: false,
//         isAvailable: false,
//     };
// }
// ============================================================================
// DEVELOPMENT BUILD MODE - Uncomment this section for Development Build
// ============================================================================
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    User,
    Auth
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
GoogleSignin.configure({
    webClientId: '519432433636-u77fv5bg9i627df25gf0vo416hrkruiu.apps.googleusercontent.com',
});
export function useGoogleAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const token = await user.getIdToken();
                setFirebaseToken(token);
            } else {
                setFirebaseToken(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    const promptAsync = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signOut();
            const userInfo = await GoogleSignin.signIn();
            console.log('Google Sign-In Response:', userInfo);
            const idToken = (userInfo.data as any)?.idToken;
            if (!idToken) {
                console.error('No idToken received');
                setLoading(false);
                return;
            }
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
            setLoading(false);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            setLoading(false);
        }
    };
    const signOut = async () => {
        try {
            await GoogleSignin.signOut();
            await firebaseSignOut(auth);
            setFirebaseToken(null);
        } catch (error) {
            console.error("Sign Out Error:", error);
        }
    };
    return {
        user,
        firebaseToken,
        promptAsync,
        signOut,
        loading,
        isAvailable: true,
    };
}



