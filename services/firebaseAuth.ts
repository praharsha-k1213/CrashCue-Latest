import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth } from '../firebase';
export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
}
export class FirebaseAuthService {
    static async createAccount(email: string, password: string, displayName: string): Promise<AuthUser> {
        try {
            console.log('🔥 Creating Firebase account for:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('✅ Firebase user created:', user.uid);
            await updateProfile(user, { displayName });
            console.log('✅ Display name updated');
            try {
                await sendEmailVerification(user);
                console.log('✅ Verification email sent to:', email);
            } catch (emailError: any) {
                console.error('⚠️ Email verification failed:', emailError);
                if (emailError.code === 'auth/too-many-requests') {
                    console.warn('Too many verification emails sent. User can request another later.');
                } else if (emailError.code === 'auth/invalid-email') {
                    console.warn('Invalid email format for verification.');
                } else {
                    console.warn('Unknown email verification error:', emailError.message);
                }
            }
            return {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
            };
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.warn('⚠️ Create account warning:', error.message);
            } else {
                console.error('❌ Create account error:', error);
            }
            throw new Error(this.getErrorMessage(error.code));
        }
    }
    static async signIn(email: string, password: string): Promise<AuthUser> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
            };
        } catch (error: any) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                console.warn('⚠️ Sign in warning:', error.message);
            } else {
                console.error('❌ Sign in error:', error);
            }
            throw new Error(this.getErrorMessage(error.code));
        }
    }
    static async signInWithGoogle(idToken: string): Promise<AuthUser> {
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
            };
        } catch (error: any) {
            console.error('Google sign in error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }
    static async signOut(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error: any) {
            console.error('Sign out error:', error);
            throw new Error('Failed to sign out');
        }
    }
    static async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            console.error('Password reset error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }
    static async resendEmailVerification(): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is currently signed in');
        }
        if (user.emailVerified) {
            throw new Error('Email is already verified');
        }
        try {
            await sendEmailVerification(user);
        } catch (error: any) {
            console.error('Resend verification error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }
    static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
        return onAuthStateChanged(auth, (user: User | null) => {
            if (user) {
                callback({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified
                });
            } else {
                callback(null);
            }
        });
    }
    static getCurrentUser(): AuthUser | null {
        const user = auth.currentUser;
        if (user) {
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
            };
        }
        return null;
    }
    static async getIdToken(): Promise<string | null> {
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }
    private static getErrorMessage(errorCode: string): string {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters long.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            default:
                return 'An error occurred. Please try again.';
        }
    }
}