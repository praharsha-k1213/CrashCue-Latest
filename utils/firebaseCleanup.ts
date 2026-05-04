import { auth, db } from '../firebase';
import { deleteUser, signOut } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
export const cleanupFirebaseUser = async (email: string) => {
    console.log('🧹 Starting Firebase cleanup for:', email);
    try {
        if (auth.currentUser) {
            await signOut(auth);
            console.log('✅ Signed out current user');
        }
        console.log('⚠️ To completely remove a user from Firebase Auth, you need to:');
        console.log('1. Go to Firebase Console → Authentication → Users');
        console.log('2. Find the user with email:', email);
        console.log('3. Click the three dots menu → Delete user');
        console.log('4. Or use Firebase Admin SDK (server-side only)');
        return true;
    } catch (error) {
        console.error('❌ Cleanup error:', error);
        return false;
    }
};
export const cleanupFirestoreUser = async (uid: string) => {
    try {
        console.log('🧹 Cleaning up Firestore data for UID:', uid);
        await deleteDoc(doc(db, 'users', uid));
        console.log('✅ Deleted user profile from Firestore');
        return true;
    } catch (error) {
        console.error('❌ Firestore cleanup error:', error);
        return false;
    }
};
export const debugFirebaseAuth = () => {
    console.log('🔍 === FIREBASE AUTH DEBUG ===');
    console.log('Current user:', auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified
    } : 'None');
    console.log('🔍 === END DEBUG ===');
};