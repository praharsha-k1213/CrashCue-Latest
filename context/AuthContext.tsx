import { createContext, useContext, useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { FirebaseAuthService, AuthUser } from '../services/firebaseAuth';
import { FirestoreService, UserProfile } from '../services/firestoreService';
import { debugAuthState } from '../utils/authDebug';
import { SessionManager } from '../utils/sessionManager';
import { testAuthPersistence, startAuthStateMonitoring } from '../utils/authPersistenceTest';
import { FirebaseAuthConfig } from '../utils/firebaseAuthConfig';
import { auth } from '../firebase';
interface AuthContextType {
    user: AuthUser | null;
    userProfile: UserProfile | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string, additionalData?: Partial<UserProfile>) => Promise<void>;
    signInWithGoogle: (idToken: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    resendEmailVerification: () => Promise<void>;
    completeOnboarding: (onboardingData: Partial<UserProfile>) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: any) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningUp, setIsSigningUp] = useState(false);
    useEffect(() => {
        testAuthPersistence();
        const authMonitorUnsubscribe = startAuthStateMonitoring();
        FirebaseAuthConfig.initializeEnhancedPersistence(auth);
        const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (authUser) => {
            console.log('🔥 Auth state changed:', authUser?.email || 'No user');
            await debugAuthState();
            if (isSigningUp) {
                console.log('⏸️ Ignoring auth state change during signup');
                return;
            }
            try {
                if (authUser) {
                    setUser(authUser);
                    let profile = await FirestoreService.getUserProfile(authUser.uid);
                    if (!profile && authUser.email) {
                        console.log('🆕 New user detected, creating profile...');
                        const isGoogleUser = authUser.photoURL ||
                            authUser.email.includes('@gmail.com') ||
                            authUser.displayName;
                        if (isGoogleUser) {
                            console.log('🔍 Creating Google user profile...');
                            const uniqueCode = FirestoreService.generateUniqueCode(
                                authUser.displayName?.split(' ')[0] || '',
                                authUser.displayName?.split(' ')[1] || ''
                            );
                            const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
                                uid: authUser.uid,
                                email: authUser.email || '',
                                displayName: authUser.displayName || '',
                                profilePicture: authUser.photoURL || undefined,
                                authProvider: 'google.com',
                                uniqueCode,
                                isOnboarded: false
                            };
                            await FirestoreService.createUserProfile(userProfile);
                            profile = await FirestoreService.getUserProfile(authUser.uid);
                            console.log('✅ Google user profile created');
                        }
                    }
                    setUserProfile(profile);
                    await SessionManager.saveSession(authUser, profile);
                    console.log('✅ User session restored:', authUser.email);
                } else {
                    console.log('Primary storage empty, attempting backup recovery...');
                    const { user: storedUser, profile: storedProfile } = await SessionManager.restoreSession();
                    if (storedUser && storedProfile) {
                        console.log('🔄 Attempting to restore session from backup...');
                        setUser(storedUser);
                        setUserProfile(storedProfile);
                        console.log('⚠️ Session restored from backup, but Firebase Auth may require re-authentication');
                    } else {
                        console.log('No backup found, starting with empty history');
                        setUser(null);
                        setUserProfile(null);
                        await SessionManager.clearSession();
                        console.log('❌ User session cleared');
                    }
                }
            } catch (error) {
                console.error('❌ Error in auth state change:', error);
                setUser(null);
                setUserProfile(null);
            } finally {
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
            authMonitorUnsubscribe();
        };
    }, []);
    const signIn = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            await FirebaseAuthService.signIn(email, password);
        } catch (error: any) {
            setIsLoading(false);
            throw error;
        }
    };
    const signUp = async (
        email: string,
        password: string,
        displayName: string,
        additionalData?: Partial<UserProfile>
    ) => {
        setIsSigningUp(true);
        try {
            setIsLoading(true);
            console.log('🔥 Starting Firebase signup for:', email);
            const authUser = await FirebaseAuthService.createAccount(email, password, displayName);
            console.log('✅ Firebase auth user created:', authUser.uid);
            const uniqueCode = FirestoreService.generateUniqueCode(
                additionalData?.firstName || displayName.split(' ')[0] || '',
                additionalData?.lastName || displayName.split(' ')[1] || ''
            );
            const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
                uid: authUser.uid,
                email: authUser.email || email,
                displayName: authUser.displayName || displayName,
                authProvider: 'email',
                uniqueCode,
                isOnboarded: true,
                ...additionalData
            };
            console.log('💾 Creating Firestore profile...');
            await FirestoreService.createUserProfile(userProfile);
            console.log('✅ Firestore profile created');
        } catch (error: any) {
            if (error.message && error.message.includes('already exists')) {
                console.warn('⚠️ Signup warning:', error.message);
            } else {
                console.error('❌ Signup error:', error);
            }
            setIsLoading(false);
            if (FirebaseAuthService.getCurrentUser()) {
                try {
                    await FirebaseAuthService.signOut();
                    console.log('🧹 Signed out user due to signup error');
                } catch (signOutError) {
                    console.error('Error signing out after signup failure:', signOutError);
                }
            }
            throw error;
        } finally {
            setIsSigningUp(false);
        }
    };
    const signInWithGoogle = async (idToken: string) => {
        try {
            setIsLoading(true);
            const authUser = await FirebaseAuthService.signInWithGoogle(idToken);
            let profile = await FirestoreService.getUserProfile(authUser.uid);
            if (!profile) {
                const uniqueCode = FirestoreService.generateUniqueCode(
                    authUser.displayName?.split(' ')[0] || '',
                    authUser.displayName?.split(' ')[1] || ''
                );
                const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
                    uid: authUser.uid,
                    email: authUser.email || '',
                    displayName: authUser.displayName || '',
                    profilePicture: authUser.photoURL || undefined,
                    authProvider: 'google.com',
                    uniqueCode,
                    isOnboarded: false
                };
                await FirestoreService.createUserProfile(userProfile);
            }
        } catch (error: any) {
            setIsLoading(false);
            throw error;
        }
    };
    const signOut = async () => {
        try {
            await FirebaseAuthService.signOut();
            await SessionManager.clearSession();
        } catch (error: any) {
            throw error;
        }
    };
    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) throw new Error('No user logged in');
        try {
            await FirestoreService.updateUserProfile(user.uid, updates);
            if (userProfile) {
                const updatedProfile = { ...userProfile, ...updates };
                setUserProfile(updatedProfile);
                await SessionManager.saveSession(user, updatedProfile);
            }
        } catch (error: any) {
            throw error;
        }
    };
    const resetPassword = async (email: string) => {
        try {
            await FirebaseAuthService.resetPassword(email);
        } catch (error: any) {
            throw error;
        }
    };
    const completeOnboarding = async (onboardingData: Partial<UserProfile>) => {
        if (!user) throw new Error('No user logged in');
        try {
            const updates = {
                ...onboardingData,
                isOnboarded: true,
                onboardedAt: Timestamp.now()
            };
            await FirestoreService.updateUserProfile(user.uid, updates);
            if (userProfile) {
                const updatedProfile = { ...userProfile, ...updates };
                setUserProfile(updatedProfile);
                await SessionManager.saveSession(user, updatedProfile);
            }
        } catch (error: any) {
            throw error;
        }
    };
    const resendEmailVerification = async () => {
        try {
            await FirebaseAuthService.resendEmailVerification();
        } catch (error: any) {
            throw error;
        }
    };
    const value: AuthContextType = {
        user,
        userProfile,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        resetPassword,
        resendEmailVerification,
        completeOnboarding
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};