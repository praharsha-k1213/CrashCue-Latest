import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendEmergencySMS, sendEmergencyWhatsApp } from '../services/twilioService';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background Location Error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const location = locations[0];
      let speed = 0;

      if (location.coords.speed !== null && location.coords.speed >= 0) {
        speed = location.coords.speed * 3.6; // Convert m/s to km/h
      }

      if (speed <= 0) return;

      const newEntry = {
        timestamp: Date.now(),
        speed: Math.round(speed * 10) / 10,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
          altitude: location.coords.altitude ?? undefined,
          heading: location.coords.heading ?? undefined,
        },
      };

      try {
        const storedLogs = await AsyncStorage.getItem('CRASHCUE_SPEED_HISTORY');
        const history = storedLogs ? JSON.parse(storedLogs) : [];
        
        // 24/7 Crash Detection Logic (Headless GPS Deceleration)
        if (history.length > 0) {
          const lastLog = history[history.length - 1];
          const timeDiff = newEntry.timestamp - lastLog.timestamp;

          // If last log was recent (< 5 seconds ago) 
          if (timeDiff < 5000) {
             const speedDrop = lastLog.speed - newEntry.speed;
             // Sudden deceleration > 50km/h in under 5 seconds indicates a major crash
             if (speedDrop >= 50 && lastLog.speed > 60) {
                console.log('🚨 DEADLY CRASH DETECTED IN BACKGROUND (GPS) 🚨', speedDrop);
                
                // Get Emergency Contracts directly from persistent storage
                const profileStr = await AsyncStorage.getItem('CRASHCUE_USER_PROFILE');
                const familyStr = await AsyncStorage.getItem('CRASHCUE_FAMILY');
                
                const profile = profileStr ? JSON.parse(profileStr) : { name: 'CrashCue User' };
                const family = familyStr ? JSON.parse(familyStr) : [];

                if (family.length > 0) {
                   for (const contact of family) {
                      if (contact.phone) {
                         try {
                           // Route TWILIO natively without UI rendering!
                           await sendEmergencySMS({
                             toPhoneNumber: contact.phone,
                             userName: profile.name,
                             location: {
                               latitude: newEntry.location.latitude,
                               longitude: newEntry.location.longitude
                             }
                           });
                           
                           await sendEmergencyWhatsApp({
                             toPhoneNumber: contact.phone,
                             userName: profile.name,
                             location: {
                               latitude: newEntry.location.latitude,
                               longitude: newEntry.location.longitude
                             }
                           });
                         } catch (sosErr) {
                           console.log('Background SOS Delivery Failed:', sosErr);
                         }
                      }
                   }
                }
             }
          }
        }

        history.push(newEntry);
        
        // Keep only recent 1000 items in background storage to prevent memory bloat
        if (history.length > 1000) history.shift();
        
        await AsyncStorage.setItem('CRASHCUE_SPEED_HISTORY', JSON.stringify(history));
      } catch (err) {
        console.error('Failed to save background speed', err);
      }
    }
  }
});
