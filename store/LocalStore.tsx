import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const storage = {
  async get(key: string) {
    if (Platform.OS === 'web') {
      const value = localStorage.getItem(key);
      return value;
    }
    return await AsyncStorage.getItem(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
};

const StoreContext = createContext<any>(null);

const FAMILY_KEY = 'CRASHCUE_FAMILY';
const DOCTOR_KEY = 'CRASHCUE_DOCTOR';
const USER_PROFILE_KEY = 'CRASHCUE_USER_PROFILE';
const NAV_STYLE_KEY = 'CRASHCUE_NAV_STYLE';
const LAST_TRIP_KEY = 'CRASHCUE_LAST_TRIP';
const USER_NUMBERS_KEY = 'CRASHCUE_USER_NUMBERS';

export function LocalStoreProvider({ children }: any) {

  const [mode, setMode] = useState<'highway' | 'city'>('city');

  const [family, setFamily] = useState<any[]>([]);
  const [doctor, setDoctorState] = useState<{ name: string; phone: string }>({
    name: '',
    phone: '',
  });
  const [userProfile, setUserProfile] = useState<{ name: string; phone: string; photoURL?: string }>({
    name: '',
    phone: '',
  });
  const [navStyle, setNavStyle] = useState<'modern' | 'classic'>('modern');

  // LAST TRIP DATA
  const [lastTrip, setLastTrip] = useState<{ timestamp: number; distance: number; duration: number }>({
    timestamp: Date.now(),
    distance: 0,
    duration: 0
  });

  // USER NUMBERS
  const [userNumbers, setUserNumbers] = useState<{ name: string; phone: string }[]>([]);


  const isLoaded = useRef(false);

  // LOAD FAMILY FROM LOCAL STORAGE
  useEffect(() => {
    const loadFamily = async () => {
      const stored = await storage.get(FAMILY_KEY);
      if (stored) {
        const loaded = JSON.parse(stored);
        // Clean up legacy data: Only keep members with a uniqueCode (added via new system)
        const validMembers = Array.isArray(loaded) ? loaded.filter((m: any) => m.uniqueCode) : [];
        setFamily(validMembers);
      }
    };
    loadFamily();
  }, []);

  // SAVE FAMILY TO LOCAL STORAGE
  useEffect(() => {
    if (isLoaded.current) {
      storage.set(FAMILY_KEY, JSON.stringify(family));
    }
  }, [family]);

  // LOAD DOCTOR FROM LOCAL STORAGE
  useEffect(() => {
    const loadDoctor = async () => {
      const stored = await storage.get(DOCTOR_KEY);
      if (stored) {
        setDoctorState(JSON.parse(stored));
      }
    };
    loadDoctor();
  }, []);

  // SAVE DOCTOR TO LOCAL STORAGE
  useEffect(() => {
    if (isLoaded.current) {
      storage.set(DOCTOR_KEY, JSON.stringify(doctor));
    }
  }, [doctor]);

  // LOAD ALL PERSISTENT DATA
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [f, d, p, n, l, un] = await Promise.all([
          storage.get(FAMILY_KEY),
          storage.get(DOCTOR_KEY),
          storage.get(USER_PROFILE_KEY),
          storage.get(NAV_STYLE_KEY),
          storage.get(LAST_TRIP_KEY),
          storage.get(USER_NUMBERS_KEY)
        ]);

        if (f) setFamily(JSON.parse(f));
        if (d) setDoctorState(JSON.parse(d));
        if (p) setUserProfile(JSON.parse(p));
        if (n) setNavStyle(n as any);
        if (l) setLastTrip(JSON.parse(l));
        if (un) setUserNumbers(JSON.parse(un));

        isLoaded.current = true;
      } catch (e) {
        console.error('Error loading store:', e);
        isLoaded.current = true; // Still set to true so user can save new data
      }
    };
    loadAll();
  }, []);

  // SAVE LAST TRIP
  useEffect(() => {
    if (isLoaded.current) {
      storage.set(LAST_TRIP_KEY, JSON.stringify(lastTrip));
    }
  }, [lastTrip]);

  // SAVE USER PROFILE
  useEffect(() => {
    if (isLoaded.current) {
      storage.set(USER_PROFILE_KEY, JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // SAVE NAV STYLE
  useEffect(() => {
    if (isLoaded.current) {
      storage.set(NAV_STYLE_KEY, navStyle);
    }
  }, [navStyle]);
  useEffect(() => {
    if (isLoaded.current) {
      storage.set(USER_NUMBERS_KEY, JSON.stringify(userNumbers));
    }
  }, [userNumbers]);


  return (
    <StoreContext.Provider
      value={{
        mode,
        setMode,
        family,
        setFamily,
        doctor,
        setDoctor: setDoctorState,
        userProfile,
        setUserProfile,
        navStyle,
        setNavStyle,
        lastTrip,
        setLastTrip,
        userNumbers,
        setUserNumbers,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useLocalStore = () => useContext(StoreContext);