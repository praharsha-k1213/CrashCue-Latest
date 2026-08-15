import React from 'react';
import { Linking } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { EmergencyWidget } from './Widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { 
  makeEmergencyCall, 
  sendEmergencyWhatsApp, 
  makeSafeCall, 
  sendSafeWhatsApp 
} from '../services/twilioService';

export async function widgetTaskHandler(props: any) {
  const widgetInfo = props.widgetInfo;
  const widgetAction = props.widgetAction;

  if (
    widgetAction === 'WIDGET_ADDED' ||
    widgetAction === 'WIDGET_UPDATE' ||
    widgetAction === 'WIDGET_RESIZED'
  ) {
    requestWidgetUpdate({
      widgetName: 'EmergencyWidget',
      renderWidget: () => <EmergencyWidget />,
    });
  }
  
  if (widgetAction === 'WIDGET_CLICK') {
    const action = props.clickActionData?.action;
    
    if (action === 'trigger_sos') {
      try {
        const profileStr = await AsyncStorage.getItem('CRASHCUE_USER_PROFILE');
        const numbersStr = await AsyncStorage.getItem('CRASHCUE_USER_NUMBERS');
        const doctorStr = await AsyncStorage.getItem('CRASHCUE_DOCTOR');
        
        const userProfile = profileStr ? JSON.parse(profileStr) : { name: 'A user' };
        const userNumbers = numbersStr ? JSON.parse(numbersStr) : [];
        const doctor = doctorStr ? JSON.parse(doctorStr) : null;
        
        const allContacts: { name: string; phone: string }[] = [...userNumbers];
        if (doctor?.name && doctor?.phone) allContacts.push({ name: doctor.name, phone: doctor.phone });

        if (allContacts.length === 0) {
          await Linking.openURL('crashcue://');
          return;
        }

        let location = null;
        try {
          const locResult = await Location.getCurrentPositionAsync({});
          location = { latitude: locResult.coords.latitude, longitude: locResult.coords.longitude };
        } catch (e) {
          try {
            const lastLoc = await Location.getLastKnownPositionAsync({});
            if (lastLoc) location = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
          } catch (e2) {}
        }
        
        if (!location) {
          await Linking.openURL('crashcue://');
          return;
        }
        
        const targets = allContacts.map(c => {
            const raw = c.phone.replace(/[\s\-\(\)]/g, '');
            const phone = raw.startsWith('+') ? raw : raw.startsWith('91') && raw.length > 10 ? `+${raw}` : `+91${raw}`;
            return { name: c.name, phone };
        });

        const params = {
            userName: userProfile.name || 'A user',
            location: location,
            address: undefined
        };

        await Promise.all([
            ...targets.map(t => makeEmergencyCall({ ...params, toPhoneNumber: t.phone }).catch(console.log)),
            ...targets.map(t => sendEmergencyWhatsApp({ ...params, toPhoneNumber: t.phone }).catch(console.log))
        ]);
        
        // Open the app after successful background SOS
        await Linking.openURL('crashcue://sos');
      } catch (err) {
        console.log("Widget SOS Error: ", err);
        await Linking.openURL('crashcue://');
      }
    } else if (action === 'mark_safe') {
      try {
        const profileStr = await AsyncStorage.getItem('CRASHCUE_USER_PROFILE');
        const numbersStr = await AsyncStorage.getItem('CRASHCUE_USER_NUMBERS');
        
        const userProfile = profileStr ? JSON.parse(profileStr) : { name: 'A user' };
        const userNumbers = numbersStr ? JSON.parse(numbersStr) : [];
        
        if (userNumbers.length === 0) {
          await Linking.openURL('crashcue://');
          return;
        }

        let location = null;
        try {
          const locResult = await Location.getCurrentPositionAsync({});
          location = { latitude: locResult.coords.latitude, longitude: locResult.coords.longitude };
        } catch (e) {
          try {
            const lastLoc = await Location.getLastKnownPositionAsync({});
            if (lastLoc) location = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
          } catch (e2) {}
        }
        
        if (!location) {
          await Linking.openURL('crashcue://');
          return;
        }
        
        const targets = userNumbers.map((c: any) => {
            const raw = c.phone.replace(/[\s\-\(\)]/g, '');
            const phone = raw.startsWith('+') ? raw : raw.startsWith('91') && raw.length > 10 ? `+${raw}` : `+91${raw}`;
            return { name: c.name, phone };
        });

        const params = {
            userName: userProfile.name || 'A user',
            location: location,
            address: undefined
        };

        await Promise.all(targets.map(async (t: any) => {
            await Promise.all([
                makeSafeCall({ ...params, toPhoneNumber: t.phone }).catch(console.log),
                sendSafeWhatsApp({ ...params, toPhoneNumber: t.phone }).catch(console.log),
            ]);
        }));
        
        // Open the app
        await Linking.openURL('crashcue://');
      } catch (err) {
        console.log("Widget Safe Error: ", err);
        await Linking.openURL('crashcue://');
      }
    }
  }
}
