import { useKeepAwake } from 'expo-keep-awake';

export function useScreenAwake() {
    try {
        useKeepAwake('main-screen');
    } catch (e) {
        console.log('KeepAwake activation failed (handled):', e);
    }
}
