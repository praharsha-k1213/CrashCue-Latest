import { auth } from '../firebase';
import { SessionManager } from './sessionManager';
export const testAuthPersistence = () => {
    console.log('🧪 === FIREBASE AUTH PERSISTENCE TEST ===');
    console.log('🔍 Firebase Auth instance:', auth ? 'Initialized' : 'Not initialized');
    console.log('👤 Current Firebase user:', auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified
    } : 'None');
    SessionManager.checkFirebaseAuthPersistence();
    SessionManager.validateSession().then(isValid => {
        console.log('✅ Session validation result:', isValid ? 'Valid' : 'Invalid');
    }).catch(error => {
        console.error('❌ Session validation error:', error);
    });
    console.log('🧪 === END PERSISTENCE TEST ===');
};
export const startAuthStateMonitoring = () => {
    console.log('🔍 Starting auth state monitoring...');
    return auth.onAuthStateChanged((user) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] 🔥 Auth state change:`, user ? {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName
        } : 'User signed out');
    });
};