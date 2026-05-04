import { Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
export class FirebaseAuthConfig {
    private static readonly AUTH_STATE_KEY = 'FIREBASE_AUTH_STATE';
    private static readonly TOKEN_KEY = 'FIREBASE_ID_TOKEN';
    static async checkPersistenceStatus(auth: Auth): Promise<boolean> {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                console.log('✅ Firebase Auth has active session');
                return true;
            }
            const storedState = await AsyncStorage.getItem(this.AUTH_STATE_KEY);
            if (storedState) {
                console.log('📱 Found stored auth state in AsyncStorage');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error checking persistence status:', error);
            return false;
        }
    }
    static async saveAuthState(auth: Auth): Promise<void> {
        try {
            const user = auth.currentUser;
            if (user) {
                const authState = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified,
                    timestamp: Date.now()
                };
                await AsyncStorage.setItem(this.AUTH_STATE_KEY, JSON.stringify(authState));
                const idToken = await user.getIdToken();
                await AsyncStorage.setItem(this.TOKEN_KEY, idToken);
                console.log('💾 Auth state manually saved to AsyncStorage');
            }
        } catch (error) {
            console.error('❌ Error saving auth state:', error);
        }
    }
    static async clearAuthState(): Promise<void> {
        try {
            await Promise.all([
                AsyncStorage.removeItem(this.AUTH_STATE_KEY),
                AsyncStorage.removeItem(this.TOKEN_KEY)
            ]);
            console.log('🧹 Auth state cleared from AsyncStorage');
        } catch (error) {
            console.error('❌ Error clearing auth state:', error);
        }
    }
    static async getStoredAuthState(): Promise<any | null> {
        try {
            const storedState = await AsyncStorage.getItem(this.AUTH_STATE_KEY);
            if (storedState) {
                const authState = JSON.parse(storedState);
                const maxAge = 7 * 24 * 60 * 60 * 1000;
                const age = Date.now() - authState.timestamp;
                if (age > maxAge) {
                    console.log('🕐 Stored auth state is too old, clearing...');
                    await this.clearAuthState();
                    return null;
                }
                return authState;
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting stored auth state:', error);
            return null;
        }
    }
    static async validateStoredToken(): Promise<boolean> {
        try {
            const storedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
            if (!storedToken) return false;
            const tokenParts = storedToken.split('.');
            if (tokenParts.length !== 3) return false;
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp > currentTime;
        } catch (error) {
            console.error('❌ Error validating stored token:', error);
            return false;
        }
    }
    static setupAuthStateMonitoring(auth: Auth): () => void {
        console.log('🔍 Setting up enhanced auth state monitoring...');
        return auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.saveAuthState(auth);
            } else {
                await this.clearAuthState();
            }
        });
    }
    static async initializeEnhancedPersistence(auth: Auth): Promise<void> {
        console.log('🚀 Initializing enhanced Firebase Auth persistence...');
        this.setupAuthStateMonitoring(auth);
        if (!auth.currentUser) {
            const storedState = await this.getStoredAuthState();
            const tokenValid = await this.validateStoredToken();
            if (storedState && tokenValid) {
                console.log('🔄 Found valid stored auth state, but Firebase Auth session is missing');
                console.log('⚠️ User may need to re-authenticate for full functionality');
            }
        }
        console.log('✅ Enhanced persistence initialized');
    }
}