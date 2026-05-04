import { FirebaseAuthService } from './firebaseAuth';
import { FirestoreService, UserProfile, Conversation, CrashReport } from './firestoreService';
export class FirebaseIntegration {
    static async signUpWithEmail(
        email: string,
        password: string,
        profileData: {
            firstName: string;
            lastName: string;
            age?: string;
            gender?: string;
            bloodGroup?: string;
            medicalRecords?: string;
            medicalCondition?: string;
            phone?: string;
        }
    ) {
        try {
            const displayName = `${profileData.firstName} ${profileData.lastName}`;
            const authUser = await FirebaseAuthService.createAccount(email, password, displayName);
            const uniqueCode = FirestoreService.generateUniqueCode(
                profileData.firstName,
                profileData.lastName
            );
            const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
                uid: authUser.uid,
                email: authUser.email || email,
                displayName: authUser.displayName || displayName,
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                age: profileData.age,
                gender: profileData.gender,
                bloodGroup: profileData.bloodGroup,
                medicalRecords: profileData.medicalRecords,
                medicalCondition: profileData.medicalCondition,
                phone: profileData.phone,
                authProvider: 'email',
                uniqueCode,
                emergencyContacts: [],
                isOnboarded: false
            };
            await FirestoreService.createUserProfile(userProfile);
            return { authUser, userProfile };
        } catch (error) {
            console.error('Firebase signup error:', error);
            throw error;
        }
    }
    static async signInWithEmail(email: string, password: string) {
        try {
            const authUser = await FirebaseAuthService.signIn(email, password);
            const userProfile = await FirestoreService.getUserProfile(authUser.uid);
            return { authUser, userProfile };
        } catch (error) {
            console.error('Firebase signin error:', error);
            throw error;
        }
    }
    static async signInWithGoogle(idToken: string) {
        try {
            const authUser = await FirebaseAuthService.signInWithGoogle(idToken);
            let userProfile = await FirestoreService.getUserProfile(authUser.uid);
            if (!userProfile) {
                const uniqueCode = FirestoreService.generateUniqueCode(
                    authUser.displayName?.split(' ')[0] || '',
                    authUser.displayName?.split(' ')[1] || ''
                );
                const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
                    uid: authUser.uid,
                    email: authUser.email || '',
                    displayName: authUser.displayName || '',
                    profilePicture: authUser.photoURL || undefined,
                    authProvider: 'google.com',
                    uniqueCode,
                    emergencyContacts: [],
                    isOnboarded: false
                };
                await FirestoreService.createUserProfile(newProfile);
                userProfile = await FirestoreService.getUserProfile(authUser.uid);
            }
            return { authUser, userProfile };
        } catch (error) {
            console.error('Firebase Google signin error:', error);
            throw error;
        }
    }
    static async updateUserProfile(uid: string, updates: Partial<UserProfile>) {
        try {
            await FirestoreService.updateUserProfile(uid, updates);
            return await FirestoreService.getUserProfile(uid);
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
    static async addEmergencyContact(
        userId: string,
        contact: { name: string; phone: string; relationship: string; isPrimary: boolean }
    ) {
        try {
            await FirestoreService.addEmergencyContact(userId, contact);
        } catch (error) {
            console.error('Add emergency contact error:', error);
            throw error;
        }
    }
    static async saveAIConversation(
        userId: string,
        userMessage: string,
        aiResponse: string,
        category: string,
        confidence: number,
        processingTime?: number,
        context?: any
    ) {
        try {
            const conversationId = await FirestoreService.saveConversation({
                userId,
                userMessage,
                aiResponse,
                category,
                confidence,
                processingTime,
                context
            });
            return conversationId;
        } catch (error) {
            console.error('Save conversation error:', error);
            throw error;
        }
    }
    static async getUserConversations(userId: string, limit: number = 50) {
        try {
            const result = await FirestoreService.getUserConversations(userId, limit);
            return result.conversations;
        } catch (error) {
            console.error('Get conversations error:', error);
            throw error;
        }
    }
    static async reportCrash(
        userId: string,
        location: { latitude: number; longitude: number; address?: string },
        severity: 'low' | 'medium' | 'high' | 'critical',
        sensorData: {
            acceleration: number[];
            gyroscope: number[];
            magnetometer: number[];
        }
    ) {
        try {
            const crashReportId = await FirestoreService.saveCrashReport({
                userId,
                location,
                severity,
                sensorData,
                emergencyContactsNotified: [],
                status: 'detected'
            });
            return crashReportId;
        } catch (error) {
            console.error('Report crash error:', error);
            throw error;
        }
    }
    static async updateCrashStatus(
        crashReportId: string,
        status: 'detected' | 'confirmed' | 'false_alarm' | 'resolved'
    ) {
        try {
            await FirestoreService.updateCrashReportStatus(crashReportId, status);
        } catch (error) {
            console.error('Update crash status error:', error);
            throw error;
        }
    }
    static async getUserCrashReports(userId: string) {
        try {
            return await FirestoreService.getUserCrashReports(userId);
        } catch (error) {
            console.error('Get crash reports error:', error);
            throw error;
        }
    }
    static async getUserStats(userId: string) {
        try {
            return await FirestoreService.getUserStats(userId);
        } catch (error) {
            console.error('Get user stats error:', error);
            throw error;
        }
    }

    static onUserProfileChange(uid: string, callback: (profile: UserProfile | null) => void) {
        return FirestoreService.onUserProfileChange(uid, callback);
    }
    static onCrashReportsChange(userId: string, callback: (reports: CrashReport[]) => void) {
        return FirestoreService.onCrashReportsChange(userId, callback);
    }
    static async getCurrentUser() {
        const authUser = FirebaseAuthService.getCurrentUser();
        if (authUser) {
            const userProfile = await FirestoreService.getUserProfile(authUser.uid);
            return { authUser, userProfile };
        }
        return null;
    }
    static async signOut() {
        try {
            await FirebaseAuthService.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }
    static async resetPassword(email: string) {
        try {
            await FirebaseAuthService.resetPassword(email);
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }
}