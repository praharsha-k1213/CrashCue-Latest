const admin = require('firebase-admin');
let firebaseApp;
try {
    firebaseApp = admin.initializeApp({
        projectId: 'crashcue-projectid01',
    });
    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
}
/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token with user info
 */
const verifyFirebaseToken = async (idToken) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            emailVerified: decodedToken.email_verified,
            provider: decodedToken.firebase.sign_in_provider
        };
    } catch (error) {
        console.error('Firebase token verification error:', error);
        throw new Error('Invalid Firebase token');
    }
};
/**
 * Get user by UID
 * @param {string} uid - Firebase user UID
 * @returns {Promise<Object>} User record
 */
const getUserByUid = async (uid) => {
    try {
        const userRecord = await admin.auth().getUser(uid);
        return userRecord;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};
module.exports = {
    admin,
    verifyFirebaseToken,
    getUserByUid
};
