import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalStore } from '../store/LocalStore';
import { useAuth } from '../context/AuthContext';

export const CONTACTS_SETUP_DONE_KEY = 'CRASHCUE_CONTACTS_SETUP_DONE';

interface ContactEntry {
  name: string;
  phone: string;
}

const TOTAL_CONTACTS = 5;
const REQUIRED_COUNT = 3;

export default function EmergencyContactsSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUserNumbers } = useLocalStore();
  const { signOut } = useAuth();

  const emptyContact = (): ContactEntry => ({ name: '', phone: '' });

  const [contacts, setContacts] = useState<ContactEntry[]>(
    Array.from({ length: TOTAL_CONTACTS }, emptyContact)
  );
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Animated shield pulse
  const glowValue = useSharedValue(0.6);
  useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowValue.value }));

  const updateContact = (index: number, field: 'name' | 'phone', value: string) => {
    setContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const pickContact = async (index: number) => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow contact access to pick a contact natively.');
        return;
      }
      
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        if (contact.name) {
           updateContact(index, 'name', contact.name);
        }
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
           const phone = contact.phoneNumbers[0].number || '';
           updateContact(index, 'phone', phone);
        }
      }
    } catch (e) {
      console.log('Error picking contact', e);
    }
  };

  const validateAndSave = async () => {
    // Validate required contacts (first 3)
    for (let i = 0; i < REQUIRED_COUNT; i++) {
      const c = contacts[i];
      if (!c.name.trim()) {
        Alert.alert('Required', `Please enter a name for Contact ${i + 1}.`);
        return;
      }
      
      let digits = c.phone.replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      }

      if (digits.length !== 10) {
        Alert.alert('Invalid Number', `Contact ${i + 1} must have exactly 10 digits.`);
        return;
      }
    }

    try {
      // Build valid contacts list (include optional ones if filled)
      const validContacts = contacts
        .map(c => {
          let digits = c.phone.replace(/\D/g, '');
          if (digits.length === 12 && digits.startsWith('91')) {
            digits = digits.slice(2);
          }
          return {
            name: c.name.trim(),
            phone: digits.length === 10 ? `+91${digits}` : '',
          };
        })
        .filter(c => c.name && c.phone);

      // Duplicate contact validation
      const uniqueNumbers = new Set();
      for (const contact of validContacts) {
        if (uniqueNumbers.has(contact.phone)) {
          Alert.alert('Duplicate Contact', `The number ${contact.phone} has been selected multiple times. Please ensure all emergency contacts are unique.`);
          return;
        }
        uniqueNumbers.add(contact.phone);
      }

      setIsSaving(true);

      // Save to LocalStore
      setUserNumbers(validContacts);

      // Mark contacts setup as done
      await AsyncStorage.setItem(CONTACTS_SETUP_DONE_KEY, 'true');

      // Navigate forward
      router.replace('/onboarding');
    } catch (e) {
      console.error('Failed to save contacts:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(CONTACTS_SETUP_DONE_KEY, 'true');
    router.replace('/onboarding');
  };

  const handleBack = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  // Reference for phone fields to auto-focus
  const phoneRefs = useRef<(TextInput | null)[]>([]);
  const nameRefs = useRef<(TextInput | null)[]>([]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <LinearGradient
        colors={['#0D0B2A', '#0A0A0F', '#0A0A0F']}
        style={{ position: 'absolute', inset: 0 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 16, 50),
            paddingBottom: Math.max(insets.bottom + 24, 40),
            paddingHorizontal: 22,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ width: '100%', marginBottom: 10, alignItems: 'flex-start' }}>
            <TouchableOpacity 
              onPress={handleBack}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
              }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInUp.duration(700)} style={{ alignItems: 'center', marginBottom: 30 }}>
            <Animated.View
              style={[
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(239,68,68,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.25)',
                },
                glowStyle,
              ]}
            >
              <Ionicons name="people" size={38} color="#EF4444" />
            </Animated.View>

            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8,
                letterSpacing: 0.5,
              }}
            >
              Emergency Contacts
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center',
                lineHeight: 21,
                maxWidth: 300,
              }}
            >
              These people will be called, SMS'd and WhatsApp'd instantly if a crash is detected.
            </Text>
          </Animated.View>

          {/* Legend */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Required (1–3)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' }} />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Optional (4–5)</Text>
            </View>
          </Animated.View>

          {/* Contact Cards */}
          {contacts.map((contact, index) => {
            const isRequired = index < REQUIRED_COUNT;
            const accentColor = isRequired ? '#EF4444' : '#6366F1';
            const delay = index * 80;

            return (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(150 + delay).duration(600)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: `${accentColor}33`,
                }}
              >
                {/* Card Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: `${accentColor}22`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ color: accentColor, fontWeight: '900', fontSize: 16 }}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                      Contact {index + 1}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>
                      {isRequired ? '★ Required' : '○ Optional'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => pickContact(index)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: `${accentColor}1A`,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: `${accentColor}33`,
                    }}
                  >
                    <Ionicons name="book" size={14} color={accentColor} style={{ marginRight: 6 }} />
                    <Text style={{ color: accentColor, fontSize: 12, fontWeight: '700' }}>Pick</Text>
                  </TouchableOpacity>

                  {(() => {
                    let digits = contact.phone.replace(/\D/g, '');
                    if (digits.length === 12 && digits.startsWith('91')) {
                      digits = digits.slice(2);
                    }
                    return contact.name.trim() && digits.length === 10;
                  })() && (
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  )}
                </View>

                {/* Name Input */}
                <View style={{ marginBottom: 10 }}>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    NAME
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: focusedField === `name-${index}` ? accentColor : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={focusedField === `name-${index}` ? accentColor : 'rgba(255,255,255,0.3)'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      ref={el => { nameRefs.current[index] = el; }}
                      placeholder={`e.g., Mom, ${['Dad', 'Sibling', 'Friend', 'Partner'][index] || 'Friend'}...`}
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={contact.name}
                      onChangeText={v => updateContact(index, 'name', v)}
                      onFocus={() => setFocusedField(`name-${index}`)}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="next"
                      onSubmitEditing={() => phoneRefs.current[index]?.focus()}
                      style={{
                        flex: 1,
                        color: '#FFFFFF',
                        fontSize: 15,
                        paddingVertical: 12,
                      }}
                    />
                  </View>
                </View>

                {/* Phone Input */}
                <View>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    PHONE NUMBER
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: focusedField === `phone-${index}` ? accentColor : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={focusedField === `phone-${index}` ? accentColor : 'rgba(255,255,255,0.3)'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      ref={el => { phoneRefs.current[index] = el; }}
                      placeholder="+91 98765 43210"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={contact.phone}
                      onChangeText={v => updateContact(index, 'phone', v)}
                      onFocus={() => setFocusedField(`phone-${index}`)}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="phone-pad"
                      returnKeyType={index < TOTAL_CONTACTS - 1 ? 'next' : 'done'}
                      onSubmitEditing={() => {
                        if (index < TOTAL_CONTACTS - 1) nameRefs.current[index + 1]?.focus();
                      }}
                      style={{
                        flex: 1,
                        color: '#FFFFFF',
                        fontSize: 15,
                        paddingVertical: 12,
                      }}
                    />
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {/* Info note */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
            style={{
              backgroundColor: 'rgba(16,185,129,0.07)',
              borderRadius: 14,
              padding: 14,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'flex-start',
              borderWidth: 1,
              borderColor: 'rgba(16,185,129,0.15)',
              marginTop: 4,
            }}
          >
            <Ionicons
              name="information-circle"
              size={18}
              color="#10B981"
              style={{ marginRight: 10, marginTop: 1 }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 18, flex: 1 }}>
              These contacts will also appear in your Driver Profile and can be updated anytime from there.
            </Text>
          </Animated.View>

          {/* Save Button */}
          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <TouchableOpacity
              onPress={validateAndSave}
              disabled={isSaving}
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                opacity: isSaving ? 0.7 : 1,
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
                elevation: 8,
                marginBottom: 14,
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="white" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }}>
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }}>
                Skip for now (you can add contacts later in Driver Profile)
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
