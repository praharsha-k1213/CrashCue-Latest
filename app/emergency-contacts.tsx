import { useThemeColor } from '@/hooks/useThemeColor';
import { useTimeBattery } from '@/hooks/useTimeBattery';
import { triggerHaptic } from '@/utils/hapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

type Contact = {
  id: string;
  name: string;
  phone: string;
  priority: number;
};

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { timeString, batteryLevel } = useTimeBattery();
  const [contacts, setContacts] = useState<Contact[]>([
    { id: 'c1', name: 'Daddy', phone: '+91 8639065155', priority: 1 },
    { id: 'c2', name: 'Mummy', phone: '+91 9121089549', priority: 2 },
    { id: 'c3', name: 'Emergency Services', phone: '911', priority: 3 },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPriority, setFormPriority] = useState<string>('1');

  const isEditing = useMemo(() => editingContactId !== null, [editingContactId]);

  const insets = useSafeAreaInsets();
  // Theme colors
  const { theme } = useTheme();
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'border');
  const background = useThemeColor({}, 'background');
  const backgroundCard = useThemeColor({}, 'backgroundCard');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const openAddModal = () => {
    setEditingContactId(null);
    setFormName('');
    setFormPhone('');
    setFormPriority('1');
    setIsModalVisible(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContactId(contact.id);
    setFormName(contact.name);
    setFormPhone(contact.phone);
    setFormPriority(String(contact.priority));
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleSave = () => {
    const trimmedName = formName.trim();
    const trimmedPhone = formPhone.trim();
    const prio = Number(formPriority);
    if (!trimmedName || !trimmedPhone || Number.isNaN(prio) || prio < 1) {
      Alert.alert('Invalid input', 'Please fill name, phone and a priority >= 1');
      return;
    }

    if (isEditing) {
      setContacts(prev => prev.map(c => c.id === editingContactId ? { ...c, name: trimmedName, phone: trimmedPhone, priority: prio } : c));
    } else {
      const newId = `c${Date.now()}`;
      setContacts(prev => [...prev, { id: newId, name: trimmedName, phone: trimmedPhone, priority: prio }]);
    }
    setIsModalVisible(false);
  };

  const handleCall = async (phone: string) => {
    const cleaned = phone.replace(/[^+\d]/g, '');
    const urlIOSPrompt = `telprompt:${cleaned}`;
    const urlTel = `tel:${cleaned}`;

    try {
      if (Platform.OS === 'ios') {
        const canPrompt = await Linking.canOpenURL(urlIOSPrompt);
        if (canPrompt) {
          await Linking.openURL(urlIOSPrompt);
          return;
        }
      }

      const canTel = await Linking.canOpenURL(urlTel);
      if (canTel) {
        if (Platform.OS === 'android') {
          await IntentLauncher.startActivityAsync('android.intent.action.CALL', {
            data: urlTel,
          });
          return;
        }
        await Linking.openURL(urlTel);
        return;
      }
    } catch (e) {
      // fall through to alert
    }

    Alert.alert(
      'Cannot place call',
      Platform.select({
        ios: 'Calling may not work on the iOS Simulator. Please try on a physical device.',
        android: 'Calling may not work on an emulator. Please try on a physical device.',
        default: 'Calling is not supported on this device.',
      }) as string,
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: background }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[background, backgroundCard, background]} className="absolute inset-0" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-5 border-b"
        style={{ paddingTop: Math.max(insets.top + 10, 60), borderBottomColor: border }}
      >
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="p-2">
          <Ionicons name="chevron-back" size={24} color={primary} />
        </TouchableOpacity>
        <Text className="text-sm font-black tracking-widest" style={{ color: textPrimary }}>TACTICAL_PROTOCOL_LINK</Text>
        <View className="items-end">
          <Text
            className="text-sm"
            style={{
              color: primary,
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
            }}
          >
            {timeString || '--:--:--'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Animated.Text
          entering={FadeInDown.duration(600)}
          className="text-[11px] font-black tracking-widest mb-6 opacity-80"
          style={{ color: primary }}
        >
          AUTHORIZED_PERSONNEL_DECK
        </Animated.Text>


        {contacts
          .sort((a, b) => a.priority - b.priority)
          .map((contact, index) => (
            <Animated.View
              key={contact.id}
              entering={FadeInDown.delay(index * 100).duration(600)}
              className="rounded-3xl p-5 mb-4 border"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0, 224, 255, 0.1)' }}
            >
              <View className="flex-row items-center mb-5">
                <View
                  className="w-13 h-13 rounded-full items-center justify-center border mr-4"
                  style={{ backgroundColor: 'rgba(0,224,255,0.05)', borderColor: 'rgba(0,224,255,0.2)' }}
                >
                  <Ionicons name="person-outline" size={24} color={primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold tracking-wide" style={{ color: '#FFF' }}>{contact.name.toUpperCase()}</Text>
                  <Text
                    className="text-[11px] mt-1"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
                    }}
                  >
                    FREQ: {contact.phone}
                  </Text>
                </View>
                <View
                  className="px-3 py-1.5 rounded-xl border"
                  style={{ backgroundColor: 'rgba(0,224,255,0.1)', borderColor: 'rgba(0,224,255,0.2)' }}
                >
                  <Text className="text-[10px] font-black tracking-wide" style={{ color: '#00E0FF' }}>LVL_{contact.priority}</Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl"
                  style={{ backgroundColor: '#00E0FF' }}
                  onPress={() => handleCall(contact.phone)}
                >
                  <Ionicons name="call" size={18} color="#000" />
                  <Text className="text-black text-[11px] font-black tracking-wide">INITIATE_COMMS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border"
                  style={{ backgroundColor: 'rgba(0,224,255,0.05)', borderColor: 'rgba(0,224,255,0.2)' }}
                  onPress={async () => {
                    await triggerHaptic('medium');
                    openEditModal(contact);
                  }}
                >
                  <Ionicons name="construct-outline" size={18} color={primary} />
                  <Text className="text-[11px] font-black tracking-wide" style={{ color: '#00E0FF' }}>RECONFIGURE</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}

        <TouchableOpacity
          className="flex-row items-center justify-center gap-3 py-4.5 rounded-3xl border border-dashed mt-2"
          style={{ borderColor: '#00E0FF', backgroundColor: 'rgba(0,224,255,0.02)' }}
          onPress={async () => {
            await triggerHaptic('light');
            openAddModal();
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color={primary} />
          <Text className="text-[12px] font-black tracking-widest" style={{ color: '#00E0FF' }}>ENLIST_NEW_OPERATOR</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View className="flex-1 justify-center p-6 bg-black/85">
          <Animated.View
            entering={FadeInUp.duration(400)}
            className="rounded-3xl p-6 border"
            style={{ backgroundColor: '#0A0A0F', borderColor: 'rgba(0, 224, 255, 0.3)' }}
          >
            <Text className="text-lg font-black tracking-widest mb-6 text-center" style={{ color: '#FFF' }}>{isEditing ? 'RECONFIGURE_LINK' : 'ENLIST_OPERATOR'}</Text>

            <View className="mb-5">
              <Text className="text-[10px] font-black tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>OPERATOR_NAME</Text>
              <TextInput
                placeholder="Target Designation"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="rounded-xl p-4 text-white text-sm border"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,224,255,0.2)' }}
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            <View className="mb-5">
              <Text className="text-[10px] font-black tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>SIGNAL_FREQUENCY</Text>
              <TextInput
                placeholder="+00 000 000 0000"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="rounded-xl p-4 text-white text-sm border"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,224,255,0.2)' }}
                keyboardType="phone-pad"
                value={formPhone}
                onChangeText={setFormPhone}
              />
            </View>

            <View className="mb-5">
              <Text className="text-[10px] font-black tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>PRIORITY_LEVEL</Text>
              <TextInput
                placeholder="Access Level (1-9)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="rounded-xl p-4 text-white text-sm border"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,224,255,0.2)' }}
                keyboardType="number-pad"
                value={formPriority}
                onChangeText={setFormPriority}
              />
            </View>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                className="flex-1 py-4 items-center rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                onPress={closeModal}
              >
                <Text className="text-[11px] font-black tracking-wide" style={{ color: '#00E0FF' }}>ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-4 items-center rounded-xl"
                style={{ backgroundColor: '#00E0FF' }}
                onPress={handleSave}
              >
                <Text className="text-black text-[11px] font-black tracking-wide">{isEditing ? 'OVERWRITE' : 'ENLIST'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
