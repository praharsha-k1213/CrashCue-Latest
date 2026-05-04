import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
export const debugAuthState = async () => {
    console.log('🔍 === AUTH DEBUG INFO ===');
    const firebaseUser = auth.currentUser;
    console.log('🔥 Firebase currentUser:', firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName
    } : 'null');
    try {
        const storedUser = await AsyncStorage.getItem('CRASHCUE_USER');
        const storedProfile = await AsyncStorage.getItem('CRASHCUE_USER_PROFILE');
        console.log('📱 AsyncStorage user:', storedUser ? JSON.parse(storedUser) : 'null');
        console.log('📱 AsyncStorage profile:', storedProfile ? JSON.parse(storedProfile) : 'null');
    } catch (error) {
        console.error('❌ Error reading AsyncStorage:', error);
    }
    console.log('🔍 === END AUTH DEBUG ===');
};
export const clearAuthStorage = async () => {
    try {
        await AsyncStorage.removeItem('CRASHCUE_USER');
        await AsyncStorage.removeItem('CRASHCUE_USER_PROFILE');
        console.log('🧹 Auth storage cleared');
    } catch (error) {
        console.error('❌ Error clearing auth storage:', error);
    }
};