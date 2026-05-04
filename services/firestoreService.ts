import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    serverTimestamp,
    onSnapshot,
    DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    age?: string;
    gender?: string;
    bloodGroup?: string;
    medicalRecords?: string;
    medicalCondition?: string;
    profilePicture?: string;
    authProvider: 'email' | 'google.com';
    uniqueCode?: string;
    emergencyContacts?: EmergencyContact[];
    isOnboarded: boolean;
    onboardedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
}
export interface Conversation {
    id?: string;
    userId: string;
    userMessage: string;
    aiResponse: string;
    category: string;
    confidence: number;
    processingTime?: number;
    context?: any;
    rating?: number;
    createdAt: Timestamp;
}
export interface CrashReport {
    id?: string;
    userId: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    sensorData: {
        acceleration: number[];
        gyroscope: number[];
        magnetometer: number[];
    };
    emergencyContactsNotified: string[];
    status: 'detected' | 'confirmed' | 'false_alarm' | 'resolved';
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
}

export class FirestoreService {
    static async createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
        try {
            const userRef = doc(db, 'users', profile.uid);
            await setDoc(userRef, {
                ...profile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw new Error('Failed to create user profile');
        }
    }
    static async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                    id: userSnap.id,
                    ...userData
                } as unknown as UserProfile;
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw new Error('Failed to get user profile');
        }
    }
    static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw new Error('Failed to update user profile');
        }
    }
    static generateUniqueCode(firstName: string, lastName: string): string {
        const fPart = (firstName || 'XXX').substring(0, 3).toUpperCase();
        const lPart = (lastName || 'XXX').substring(0, 3).toUpperCase();
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${fPart}-${lPart}-${randomNum}`;
    }
    static async getUserByUniqueCode(uniqueCode: string): Promise<UserProfile | null> {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('uniqueCode', '==', uniqueCode));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const userData = docSnap.data();
                return {
                    id: docSnap.id,
                    ...userData
                } as unknown as UserProfile;
            }
            return null;
        } catch (error) {
            console.error('Error finding user by code:', error);
            throw new Error('Failed to find user');
        }
    }
    static async saveConversation(conversation: Omit<Conversation, 'id' | 'createdAt'>): Promise<string> {
        try {
            const conversationsRef = collection(db, 'conversations');
            const docRef = await addDoc(conversationsRef, {
                ...conversation,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving conversation:', error);
            throw new Error('Failed to save conversation');
        }
    }
    static async getUserConversations(
        userId: string,
        limitCount: number = 50,
        lastDoc?: DocumentSnapshot
    ): Promise<{ conversations: Conversation[], lastDoc: DocumentSnapshot | null }> {
        try {
            const conversationsRef = collection(db, 'conversations');
            let q = query(
                conversationsRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }
            const querySnapshot = await getDocs(q);
            const conversations = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Conversation[];
            const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
            return { conversations, lastDoc: lastDocument };
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw new Error('Failed to get conversations');
        }
    }
    static async saveCrashReport(crashReport: Omit<CrashReport, 'id' | 'createdAt'>): Promise<string> {
        try {
            const crashReportsRef = collection(db, 'crashReports');
            const docRef = await addDoc(crashReportsRef, {
                ...crashReport,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving crash report:', error);
            throw new Error('Failed to save crash report');
        }
    }
    static async getUserCrashReports(userId: string): Promise<CrashReport[]> {
        try {
            const crashReportsRef = collection(db, 'crashReports');
            const q = query(
                crashReportsRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CrashReport[];
        } catch (error) {
            console.error('Error getting crash reports:', error);
            throw new Error('Failed to get crash reports');
        }
    }
    static async updateCrashReportStatus(
        crashReportId: string,
        status: CrashReport['status']
    ): Promise<void> {
        try {
            const crashReportRef = doc(db, 'crashReports', crashReportId);
            const updates: any = { status };

            if (status === 'resolved') {
                updates.resolvedAt = serverTimestamp();
            }

            await updateDoc(crashReportRef, updates);
        } catch (error) {
            console.error('Error updating crash report:', error);
            throw new Error('Failed to update crash report');
        }
    }
    static async addEmergencyContact(
        userId: string,
        contact: Omit<EmergencyContact, 'id'>
    ): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data() as UserProfile;
                const emergencyContacts = userData.emergencyContacts || [];
                const newContact: EmergencyContact = {
                    ...contact,
                    id: Date.now().toString()
                };
                emergencyContacts.push(newContact);
                await updateDoc(userRef, {
                    emergencyContacts,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error adding emergency contact:', error);
            throw new Error('Failed to add emergency contact');
        }
    }
    static async removeEmergencyContact(userId: string, contactId: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data() as UserProfile;
                const emergencyContacts = (userData.emergencyContacts || [])
                    .filter(contact => contact.id !== contactId);
                await updateDoc(userRef, {
                    emergencyContacts,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error removing emergency contact:', error);
            throw new Error('Failed to remove emergency contact');
        }
    }
    static onUserProfileChange(uid: string, callback: (profile: UserProfile | null) => void): () => void {
        const userRef = doc(db, 'users', uid);
        return onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                callback({
                    id: docSnap.id,
                    ...userData
                } as unknown as UserProfile);
            } else {
                callback(null);
            }
        });
    }
    static onCrashReportsChange(userId: string, callback: (reports: CrashReport[]) => void): () => void {
        const crashReportsRef = collection(db, 'crashReports');
        const q = query(
            crashReportsRef,
            where('userId', '==', userId),
            where('status', 'in', ['detected', 'confirmed']),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (querySnapshot) => {
            const reports = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CrashReport[];
            callback(reports);
        });
    }
    static async getUserStats(userId: string): Promise<{
        totalConversations: number;
        totalCrashReports: number;
        resolvedCrashes: number;
        averageResponseTime: number;
    }> {
        try {
            const conversationsRef = collection(db, 'conversations');
            const conversationsQuery = query(conversationsRef, where('userId', '==', userId));
            const conversationsSnap = await getDocs(conversationsQuery);
            const crashReportsRef = collection(db, 'crashReports');
            const crashReportsQuery = query(crashReportsRef, where('userId', '==', userId));
            const crashReportsSnap = await getDocs(crashReportsQuery);
            const crashReports = crashReportsSnap.docs.map(doc => doc.data()) as CrashReport[];
            const resolvedCrashes = crashReports.filter(report => report.status === 'resolved').length;
            const conversationsWithTime = conversationsSnap.docs
                .map(doc => doc.data())
                .filter(conv => conv.processingTime) as Conversation[];
            const averageResponseTime = conversationsWithTime.length > 0
                ? conversationsWithTime.reduce((sum, conv) => sum + (conv.processingTime || 0), 0) / conversationsWithTime.length
                : 0;
            return {
                totalConversations: conversationsSnap.size,
                totalCrashReports: crashReportsSnap.size,
                resolvedCrashes,
                averageResponseTime
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw new Error('Failed to get user statistics');
        }
    }
}