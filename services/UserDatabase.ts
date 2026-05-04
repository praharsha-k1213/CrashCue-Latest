import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = 'CRASHCUE_USERS_DB';

export interface UserProfile {
    firstName: string;
    lastName: string;
    email: string; // Added as primary identifier
    phone?: string;
    age: string;
    gender: string;
    bloodGroup: string;
    medicalRecords: string;
    medicalCondition: string;
    password: string; // Storing plain text for this mock DB as requested
    name: string;
    uniqueCode: string; // Generated code: FIRST3-LAST3
}

export const UserDatabase = {
    async getAllUsers(): Promise<UserProfile[]> {
        try {
            const json = await AsyncStorage.getItem(DB_KEY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('UserDatabase read error:', e);
            return [];
        }
    },

    async saveUser(user: UserProfile): Promise<UserProfile> {
        const users = await this.getAllUsers();

        // Check duplication (Email)
        const existing = users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
        if (existing) {
            throw new Error('User with this email already exists.');
        }

        // Generate Unique Code
        // Format: Frist 3 letters of First Name (Upper) + '-' + First 3 letters of Last Name (Upper)
        const fPart = (user.firstName || user.name.split(' ')[0] || 'XXX').substring(0, 3).toUpperCase();
        const lPart = (user.lastName || user.name.split(' ')[1] || 'XXX').substring(0, 3).toUpperCase();
        let code = `${fPart}-${lPart}`;

        // Handle code duplication (simple append count if needed, but for now assuming unique enough or just overwrite)
        // If code exists, maybe append a random digit? Let's keep it simple as per request first.
        // Checking if code exists to allow "Add only through code" implies uniqueness is important.
        let counter = 1;
        while (users.some(u => u.uniqueCode === code)) {
            code = `${fPart}-${lPart}${counter}`;
            counter++;
        }

        user.uniqueCode = code;

        // Add to DB
        users.push(user);
        await AsyncStorage.setItem(DB_KEY, JSON.stringify(users));
        return user;
    },

    async getUserByCode(code: string): Promise<UserProfile | null> {
        const users = await this.getAllUsers();
        return users.find(u => u.uniqueCode === code) || null;
    },

    async validateUser(identifier: string, password: string): Promise<UserProfile | null> {
        const users = await this.getAllUsers();
        // Identifier can be email or name
        const user = users.find((u) =>
            (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) &&
            u.password === password
        );
        return user || null;
    },

    async userExists(identifier: string): Promise<boolean> {
        const users = await this.getAllUsers();
        return users.some((u) => u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier);
    }
};
