import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { FirebaseAuthService, AuthUser } from '../services/firebaseAuth';
import { FirestoreService, UserProfile } from '../services/firestoreService';

const STORAGE_KEYS = {
    USER: 'CRASHCUE_USER',
    PROFILE: 'CRASHCUE_USER_PROFILE',
    SESSION_TIMESTAMP: 'CRASHCUE_SESSION_TIMESTAMP'
};

export class SessionManager {
    static async saveSession(user: AuthUser, profile: UserProfile | null) {
        try {
            const timestamp = Date.now();
            await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
                AsyncStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, timestamp.toString()),
                profile ? AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile)) : Promise.resolve()
            ]);
            console.log('💾 Session saved to AsyncStorage');
        } catch (error) {
            console.error('❌ Failed to save session:', error);
        }
    }
    static async restoreSession(): Promise<{ user: AuthUser | null; profile: UserProfile | null }> {
        try {
            const [storedUser, storedProfile, timestamp] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.USER),
                AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
                AsyncStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP)
            ]);
            if (!storedUser) {
                return { user: null, profile: null };
            }
            const sessionAge = Date.now() - (timestamp ? parseInt(timestamp) : 0);
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            if (sessionAge > maxAge) {
                console.log('🕐 Session expired, clearing storage');
                await this.clearSession();
                return { user: null, profile: null };
            }
            const user = JSON.parse(storedUser);
            const profile = storedProfile ? JSON.parse(storedProfile) : null;
            console.log('🔄 Session restored from AsyncStorage');
            return { user, profile };
        } catch (error) {
            console.error('❌ Failed to restore session:', error);
            await this.clearSession();
            return { user: null, profile: null };
        }
    }
    static async clearSession() {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.USER),
                AsyncStorage.removeItem(STORAGE_KEYS.PROFILE),
                AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP)
            ]);
            console.log('🧹 Session cleared from AsyncStorage');
        } catch (error) {
            console.error('❌ Failed to clear session:', error);
        }
    }
    static checkFirebaseAuthPersistence(): boolean {
        try {
            const authInstance = auth;
            return authInstance !== null;
        } catch (error) {
            console.error('❌ Firebase Auth persistence check failed:', error);
            return false;
        }
    }
    static async refreshAuthToken(): Promise<string | null> {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const token = await currentUser.getIdToken(true);
                console.log('🔄 Firebase Auth token refreshed');
                return token;
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to refresh auth token:', error);
            return null;
        }
    }
    static async validateSession(): Promise<boolean> {
        try {
            const currentUser = auth.currentUser;
            const { user: storedUser } = await this.restoreSession();
            if (!currentUser && !storedUser) {
                return false;
            }
            if (currentUser && storedUser && currentUser.uid === storedUser.uid) {
                return true;
            }
            if (!currentUser && storedUser) {
                console.log('⚠️ Firebase Auth lost session but AsyncStorage has data');
                return false;
            }
            return false;
        } catch (error) {
            console.error('❌ Session validation failed:', error);
            return false;
        }
    }
}