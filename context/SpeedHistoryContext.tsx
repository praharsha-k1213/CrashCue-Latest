import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { detectCrashWithSensorFusion, type SensorData } from '../utils/crashDetectionAlgorithms';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask';

interface SpeedData {
  timestamp: number;
  speed: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
  };
  address?: string;
  city?: string;
  country?: string;
  roadName?: string;
}

interface SpeedHistoryContextType {
  speedHistory: SpeedData[];
  safetyScore: number;
  addSpeedData: (data: SpeedData) => void;
  clearHistory: () => void;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  crashDetected: boolean;
  triggerSOS: () => void;
  resetCrashDetection: () => void;
  exportSpeedLogs: () => Promise<string | null>;
  getStorageStats: () => Promise<any>;
  currentSpeed: number;
  currentLocation: { latitude: number; longitude: number } | null;
}

const SpeedHistoryContext = createContext<SpeedHistoryContextType | undefined>(undefined);

export const useSpeedHistory = () => {
  const context = useContext(SpeedHistoryContext);
  if (!context) {
    throw new Error('useSpeedHistory must be used within a SpeedHistoryProvider');
  }
  return context;
};

interface SpeedHistoryProviderProps {
  children: ReactNode;
}

export const SpeedHistoryProvider: React.FC<SpeedHistoryProviderProps> = ({ children }) => {
  const [speedHistory, setSpeedHistory] = useState<SpeedData[]>([]);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [safetyScore, setSafetyScore] = useState<number>(100);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [crashDetected, setCrashDetected] = useState<boolean>(false);
  const [lastSpeeds, setLastSpeeds] = useState<number[]>([]);
  const [speedBuffer, setSpeedBuffer] = useState<number[]>([]);

  // Hydrate from background storage continuously when foregrounded
  useEffect(() => {
    const hydrateBackgroundSpeeds = async () => {
      try {
        const storedLogs = await AsyncStorage.getItem('CRASHCUE_SPEED_HISTORY');
        if (storedLogs) {
          const bgHistory: SpeedData[] = JSON.parse(storedLogs);
          setSpeedHistory(prev => {
            if (bgHistory.length === 0) return prev;
            // Merge logic to avoid massive duplicates
            const latestPrevTimestamp = prev.length > 0 ? prev[prev.length - 1].timestamp : 0;
            const newLogs = bgHistory.filter(log => log.timestamp > latestPrevTimestamp);
            const merged = [...prev, ...newLogs];
            // keep last 500
            return merged.slice(-500);
          });
        }
      } catch (err) {
        console.error('Failed to sync background logs', err);
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        hydrateBackgroundSpeeds();
      }
    });
    hydrateBackgroundSpeeds();
    return () => sub.remove();
  }, []);

  // Multi-sensor crash detection state
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroscopeData, setGyroscopeData] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [previousGForce, setPreviousGForce] = useState(1.0);
  const [impactStartTime, setImpactStartTime] = useState<number | null>(null);
  const [crashSeverity, setCrashSeverity] = useState<'minor' | 'moderate' | 'severe'>('minor');
  const [crashConfidence, setCrashConfidence] = useState(0);

  // Advanced GPS tracking state
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [gpsSignalStrength, setGpsSignalStrength] = useState<'excellent' | 'good' | 'fair' | 'poor'>('poor');
  const [lastValidLocation, setLastValidLocation] = useState<Location.LocationObject | null>(null);
  const [speedHistoryBuffer, setSpeedHistoryBuffer] = useState<SpeedData[]>([]);
  const [kalmanFilter, setKalmanFilter] = useState({ speed: 0, variance: 100 });
  const [gpsQuality, setGpsQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('poor');
  const [locationCache, setLocationCache] = useState<Map<string, any>>(new Map());
  const lastGeocodePos = React.useRef<{ lat: number, lon: number } | null>(null);
  const lastGeocodeTime = React.useRef<number>(0);

  // Haversine formula for manual distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Load speed history from storage on mount
  useEffect(() => {
    loadSpeedHistory();
  }, []);

  // Load speed history from AsyncStorage with backup recovery
  const loadSpeedHistory = async () => {
    try {
      // Try to load primary storage first
      const stored = await AsyncStorage.getItem('speedHistory');
      if (stored) {
        const parsedData = JSON.parse(stored);
        setSpeedHistory(parsedData);
        console.log(`Loaded speed history: ${parsedData.length} entries`);
        return;
      }

      // If primary storage is empty, try to restore from backup
      console.log('Primary storage empty, attempting backup recovery...');
      await restoreFromBackup();

    } catch (error) {
      console.error('Error loading speed history:', error);
      // Try to restore from backup on error
      await restoreFromBackup();
    }
  };

  // Restore speed history from backup
  const restoreFromBackup = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('speedHistory_backup_'));

      if (backupKeys.length === 0) {
        console.log('No backup found, starting with empty history');
        return;
      }

      // Get the most recent backup
      const sortedBackups = backupKeys.sort().reverse();
      const latestBackup = sortedBackups[0];

      const backupData = await AsyncStorage.getItem(latestBackup);
      if (backupData) {
        const parsedData = JSON.parse(backupData);
        setSpeedHistory(parsedData);

        // Restore to primary storage
        await AsyncStorage.setItem('speedHistory', backupData);
        console.log(`Restored speed history from backup: ${parsedData.length} entries`);
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
    }
  };

  // Save speed history to storage with backup
  const saveSpeedHistory = async (history: SpeedData[]) => {
    try {
      // Keep more entries for better historical data (5000 entries)
      const trimmedHistory = history.slice(-5000);

      // Save primary storage
      await AsyncStorage.setItem('speedHistory', JSON.stringify(trimmedHistory));

      // Create backup storage for redundancy
      const backupKey = `speedHistory_backup_${new Date().toISOString().split('T')[0]}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(trimmedHistory));

      // Clean up old backups (keep last 7 days)
      await cleanupOldBackups();

      console.log(`Speed history saved: ${trimmedHistory.length} entries`);
    } catch (error) {
      console.error('Error saving speed history:', error);
      // Try to save a minimal version if full save fails
      try {
        const minimalHistory = history.slice(-1000).map(entry => ({
          timestamp: entry.timestamp,
          speed: entry.speed
        }));
        await AsyncStorage.setItem('speedHistory_minimal', JSON.stringify(minimalHistory));
      } catch (minimalError) {
        console.error('Failed to save even minimal speed history:', minimalError);
      }
    }
  };

  // Clean up old backup files
  const cleanupOldBackups = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('speedHistory_backup_'));

      // Keep only last 7 days of backups
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const key of backupKeys) {
        const dateStr = key.replace('speedHistory_backup_', '');
        const backupDate = new Date(dateStr);

        if (backupDate < sevenDaysAgo) {
          await AsyncStorage.removeItem(key);
          console.log(`Cleaned up old backup: ${key}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  };

  // Enhanced crash detection with sensor fusion
  const detectCrash = (newSpeed: number) => {
    setLastSpeeds(prev => {
      const updatedSpeeds = [...prev, newSpeed].slice(-5); // Keep last 5 speeds

      // Only check for crash if we have enough data points
      if (updatedSpeeds.length >= 3) {
        const recentSpeeds = updatedSpeeds.slice(-3); // Last 3 speeds
        const avgRecentSpeed = recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length;
        const previousSpeed = updatedSpeeds[updatedSpeeds.length - 2] || 0;

        // Calculate impact duration if high G-force detected
        let impactDuration = 0;
        if (impactStartTime) {
          impactDuration = Date.now() - impactStartTime;
        }

        // Prepare sensor data for fusion algorithm
        const sensorData: SensorData = {
          currentSpeed: newSpeed,
          previousSpeed: previousSpeed,
          averageRecentSpeed: avgRecentSpeed,
          accelerationX: accelerometerData.x,
          accelerationY: accelerometerData.y,
          accelerationZ: accelerometerData.z,
          rotationAlpha: gyroscopeData.alpha,
          rotationBeta: gyroscopeData.beta,
          rotationGamma: gyroscopeData.gamma,
          timestamp: Date.now(),
          impactDuration
        };

        // Use sensor fusion for crash detection
        const crashResult = detectCrashWithSensorFusion(sensorData, previousGForce);

        if (crashResult.isCrash) {
          console.log('🚨 CRASH DETECTED!', {
            confidence: crashResult.confidence,
            severity: crashResult.severity,
            reasons: crashResult.reasons,
            gForce: crashResult.gForce,
            speedDrop: crashResult.speedDrop,
            rotationRate: crashResult.rotationRate
          });

          setCrashDetected(true);
          setCrashSeverity(crashResult.severity);
          setCrashConfidence(crashResult.confidence);
          triggerSOS();
        }

        // Update previous G-force for next comparison
        if (crashResult.gForce) {
          setPreviousGForce(crashResult.gForce);
        }
      }

      return updatedSpeeds;
    });
  };

  const triggerSOS = () => {
    // This will be handled by the UI component
    console.log('🚨 CRASH DETECTED! Triggering SOS...');
  };

  const resetCrashDetection = () => {
    setCrashDetected(false);
    setLastSpeeds([]);
  };

  const addSpeedData = (data: SpeedData) => {
    try {
      // Validate data before processing
      if (!data || typeof data.speed !== 'number' || data.speed < 0 || data.speed > 300) {
        console.warn('Invalid speed data received:', data);
        return;
      }

      // Detect crash before adding to history
      detectCrash(data.speed);

      setSpeedHistory(prev => {
        try {
          const newHistory = [...prev, data];

          // Keep all speed logs - no time filtering for persistent storage
          // Only limit total entries to prevent memory issues
          // Increased to 30,000 to support ~7 days of driving history (at 1-2 hours/day)
          const maxEntries = 30000;
          const trimmedHistory = newHistory.length > maxEntries
            ? newHistory.slice(-maxEntries)
            : newHistory;

          // OPTIMIZED: Don't save to storage on every update!
          // We will save periodically or on backgrounding/exit
          // saveSpeedHistory(trimmedHistory); <--- REMOVED

          return trimmedHistory;
        } catch (error) {
          console.error('Error updating speed history:', error);
          return prev; // Return previous state on error
        }
      });
    } catch (error) {
      console.error('Error adding speed data:', error);
    }
  };

  // Optimization: Periodic saving (every 30 seconds) and on background
  const lastSavedLength = React.useRef(0);
  const appState = React.useRef(AppState.currentState);

  useEffect(() => {
    // 1. Periodic Save Interval
    const saveInterval = setInterval(() => {
      if (speedHistory.length > lastSavedLength.current) {
        console.log('🔄 Periodic save of speed history...');
        saveSpeedHistory(speedHistory);
        lastSavedLength.current = speedHistory.length;
      }
    }, 30000); // Save every 30 seconds if changed

    // 2. App State Listener (Save on minimize/background)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('💾 App backgrounded - Saving speed history...');
        if (speedHistory.length > 0) {
          saveSpeedHistory(speedHistory);
          lastSavedLength.current = speedHistory.length;
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(saveInterval);
      subscription.remove();
    };
  }, [speedHistory]);

  const clearHistory = async () => {
    setSpeedHistory([]);
    try {
      await AsyncStorage.removeItem('speedHistory');
      // Also clear backups
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('speedHistory_backup_'));
      for (const key of backupKeys) {
        await AsyncStorage.removeItem(key);
      }
      console.log('Speed history cleared');
    } catch (error) {
      console.error('Error clearing speed history:', error);
    }
  };

  // Export speed logs for backup/sharing
  const exportSpeedLogs = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalEntries: speedHistory.length,
        data: speedHistory,
        metadata: {
          appVersion: '1.0.0',
          exportFormat: 'json',
          dataTypes: ['speed', 'location', 'address', 'roadName']
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting speed logs:', error);
      return null;
    }
  };

  // Get storage statistics
  const getStorageStats = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const speedKeys = keys.filter(key => key.startsWith('speedHistory'));

      let totalSize = 0;
      const stats = {
        primaryEntries: speedHistory.length,
        backupCount: speedKeys.filter(key => key.includes('backup')).length,
        totalStorageKeys: speedKeys.length,
        estimatedSizeMB: 0
      };

      for (const key of speedKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }

      stats.estimatedSizeMB = Math.round((totalSize / (1024 * 1024)) * 100) / 100;
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  };

  // Advanced Kalman Filter for speed smoothing
  const applyKalmanFilter = (newSpeed: number, measurementNoise: number = 1.0, acceleration: number = 0) => {
    // Dynamic process noise based on acceleration
    // If accelerating/braking (high acceleration), trust the model less (higher process noise) to adapt faster
    const baseProcessNoise = 0.05;
    const dynamicProcessNoise = baseProcessNoise * (1 + Math.abs(acceleration) * 1.5);

    const measurementNoiseVar = measurementNoise * measurementNoise;

    // Prediction step
    const predictedSpeed = kalmanFilter.speed;
    const predictedVariance = kalmanFilter.variance + dynamicProcessNoise;

    // Update step
    const kalmanGain = predictedVariance / (predictedVariance + measurementNoiseVar);
    const updatedSpeed = predictedSpeed + kalmanGain * (newSpeed - predictedSpeed);
    const updatedVariance = (1 - kalmanGain) * predictedVariance;

    setKalmanFilter({ speed: updatedSpeed, variance: updatedVariance });
    return updatedSpeed;
  };

  // Advanced GPS quality assessment
  const assessGpsQuality = (location: Location.LocationObject) => {
    const accuracy = location.coords.accuracy || 100;
    const speed = location.coords.speed || 0;

    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';

    if (accuracy <= 5 && speed >= 0) {
      quality = 'excellent';
    } else if (accuracy <= 10 && speed >= 0) {
      quality = 'good';
    } else if (accuracy <= 20 && speed >= 0) {
      quality = 'fair';
    }

    setGpsQuality(quality);
    setGpsAccuracy(accuracy);

    // Update signal strength based on accuracy
    if (accuracy <= 5) {
      setGpsSignalStrength('excellent');
    } else if (accuracy <= 10) {
      setGpsSignalStrength('good');
    } else if (accuracy <= 20) {
      setGpsSignalStrength('fair');
    } else {
      setGpsSignalStrength('poor');
    }

    return quality;
  };

  // Advanced speed validation and filtering
  const validateAndFilterSpeed = (rawSpeed: number, location: Location.LocationObject, lastSpeed: number) => {
    const accuracy = location.coords.accuracy || 100;
    const quality = assessGpsQuality(location);

    // Quality-based filtering
    let filteredSpeed = rawSpeed;

    if (quality === 'poor' && rawSpeed < 8.0) {
      filteredSpeed = 0; // Don't trust low speeds with poor GPS
    } else if (quality === 'fair' && rawSpeed < 5.0) {
      filteredSpeed = 0; // Don't trust very low speeds with fair GPS
    } else if (quality === 'good' && rawSpeed < 2.0) {
      filteredSpeed = 0; // Don't trust very low speeds with good GPS
    } else if (quality === 'excellent' && rawSpeed < 1.0) {
      filteredSpeed = 0; // Only trust very low speeds with excellent GPS
    }

    // Advanced jump detection with quality consideration
    if (speedHistory.length > 0) {
      const speedDifference = Math.abs(filteredSpeed - lastSpeed);
      const maxAllowedJump = quality === 'excellent' ? 25 : quality === 'good' ? 18 : quality === 'fair' ? 12 : 6;

      if (speedDifference > maxAllowedJump) {
        // Use Kalman filter prediction instead of raw speed
        filteredSpeed = applyKalmanFilter(rawSpeed, (accuracy / 5) + 2);
      }
    }

    // Additional validation based on acceleration
    if (speedHistory.length > 1) {
      const prevSpeed = speedHistory[speedHistory.length - 1].speed;
      const acceleration = Math.abs(filteredSpeed - prevSpeed);

      // Reject unrealistic accelerations (> 2g)
      if (acceleration > 70) { // 70 km/h/s = ~2g
        filteredSpeed = prevSpeed;
      }
    }

    return filteredSpeed;
  };

  // Professional-grade stationary detection
  const detectStationaryState = (speeds: number[]) => {
    if (speeds.length < 5) return true;

    const recentSpeeds = speeds.slice(-10);
    const avgSpeed = recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length;
    const maxSpeed = Math.max(...recentSpeeds);
    const minSpeed = Math.min(...recentSpeeds);
    const variance = recentSpeeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / recentSpeeds.length;

    // Advanced stationary detection
    const isStationary = (
      (avgSpeed < 0.8 && maxSpeed < 1.5) || // Very low average and max
      (variance < 0.2 && avgSpeed < 1.2) || // Extremely stable low speed
      (recentSpeeds.filter(s => s < 0.5).length >= recentSpeeds.length * 0.6) // 60% are near zero
    );

    return isStationary;
  };

  // Reverse geocoding to get address information
  const getLocationInfo = async (latitude: number, longitude: number) => {
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return {
        address: 'Invalid Location',
        city: 'Unknown City',
        country: 'Unknown Country',
        roadName: 'Unknown Road',
        postalCode: '',
        region: '',
        subregion: ''
      };
    }

    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

    // Distance-based geocoding throttle: only geocode if moved > 50 meters from last geocode
    if (lastGeocodePos.current) {
      const distFromLast = calculateDistance(latitude, longitude, lastGeocodePos.current.lat, lastGeocodePos.current.lon);
      const timeSinceLast = Date.now() - lastGeocodeTime.current;

      // Only re-geocode if moved > 50m AND it's been at least 20 seconds
      if (distFromLast < 50 && timeSinceLast < 20000) {
        if (locationCache.has(cacheKey)) {
          return locationCache.get(cacheKey);
        }
      }
    }

    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const location = reverseGeocode[0];

        // Extract road name from multiple possible fields with better logic
        let roadName = 'Unknown Road';
        if (location.street) {
          roadName = location.street;
        } else if (location.name) {
          roadName = location.name;
        } else if (location.city) {
          roadName = location.city;
        }

        const locationInfo = {
          address: [
            location.street,
            location.streetNumber,
            location.district,
            location.subregion,
            location.region,
            location.country
          ].filter(Boolean).join(', '),
          city: location.city || location.subregion || location.region || 'Unknown City',
          country: location.country || 'Unknown Country',
          roadName: roadName,
          postalCode: location.postalCode || '',
          region: location.region || '',
          subregion: location.subregion || ''
        };

        // Update cache refs
        lastGeocodePos.current = { lat: latitude, lon: longitude };
        lastGeocodeTime.current = Date.now();

        // Cache the result
        setLocationCache(prev => new Map(prev.set(cacheKey, locationInfo)));
        return locationInfo;
      }
    } catch (error) {
      console.log('Reverse geocoding failed, using coordinates instead:', error);
    }

    // Return default if geocoding fails
    return {
      address: 'Unknown Location',
      city: 'Unknown City',
      country: 'Unknown Country',
      roadName: 'Location Unavailable',
      postalCode: '',
      region: '',
      subregion: ''
    };
  };

  const startTracking = async () => {
    if (isTracking) return;

    try {
      // Check if permission is already granted
      let { status } = await Location.getForegroundPermissionsAsync();

      // If not granted, request permission
      if (status !== 'granted') {
        const permissionResponse = await Location.requestForegroundPermissionsAsync();
        status = permissionResponse.status;

        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Location permission is required for speed tracking. Please enable it in your device settings.');
          return;
        }
      }

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert('Location Services Disabled', 'Location services are disabled. Please enable them in your device settings to use speed tracking.');
        return;
      }

      // Get initial location for reference
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLastValidLocation(initialLocation);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Optimized for high-speed travel
          distanceInterval: 1, // 1 meter threshold to filter out static jitter
          timeInterval: 800, // Slightly faster updates for smoother needle movement
        },
        (location) => {
          let rawSpeed = 0;
          let calculatedSpeed = 0;

          // 1. Primary Source: GPS Doppler Speed
          if (location.coords.speed !== null && location.coords.speed >= 0) {
            rawSpeed = location.coords.speed * 3.6; // Convert m/s to km/h
          }
          // 2. Fallback Source: Calculated Speed (Distance / Time)
          else if (lastValidLocation) {
            const dist = calculateDistance(
              lastValidLocation.coords.latitude, lastValidLocation.coords.longitude,
              location.coords.latitude, location.coords.longitude
            );
            const timeDiff = (location.timestamp - lastValidLocation.timestamp) / 1000; // seconds
            if (timeDiff > 0) {
              calculatedSpeed = (dist / timeDiff) * 3.6;
              // Only use calculated speed if it's reasonable (< 300 km/h) and dist is significant (> 2m to avoid noise)
              if (calculatedSpeed < 300 && dist > 2) {
                rawSpeed = calculatedSpeed;
                console.log('Using calculated fallback speed:', rawSpeed.toFixed(1));
              }
            }
          }

          // Ensure non-negative
          rawSpeed = Math.max(0, rawSpeed);

          // Get last speed for comparison
          const lastSpeed = speedHistory.length > 0 ? speedHistory[speedHistory.length - 1].speed : 0;

          // Calculate acceleration for dynamic Kalman filter
          const speedDiff = rawSpeed - lastSpeed;
          const acceleration = Math.abs(speedDiff); // Approximate acceleration in km/h/step

          // Update Dynamic Safety Score based on driving pattern
          if (acceleration > 15) { // Severe harsh braking / acceleration
            setSafetyScore(prev => Math.max(0, prev - 3));
          } else if (acceleration > 7) { // Moderate irregularity
            setSafetyScore(prev => Math.max(0, prev - 1));
          } else if (rawSpeed > 120) { // Extreme speeding penalty
            setSafetyScore(prev => Math.max(0, prev - 2));
          } else if (acceleration < 2 && rawSpeed > 15 && rawSpeed <= 100) {
            // Reward smooth driving
            setSafetyScore(prev => Math.min(100, prev + 0.2));
          }

          // Apply advanced validation and filtering
          const filteredSpeed = validateAndFilterSpeed(rawSpeed, location, lastSpeed);

          // Apply Kalman filter with dynamic process noise
          const kalmanFilteredSpeed = applyKalmanFilter(filteredSpeed, location.coords.accuracy || 10, acceleration);

          // Update speed buffer with advanced averaging
          setSpeedBuffer(prev => {
            const newBuffer = [...prev, kalmanFilteredSpeed].slice(-10); // Keep last 10 speeds

            // Advanced averaging with weighted values: 0.75 factor for better responsiveness
            const weights = newBuffer.map((_, index) => Math.pow(0.75, newBuffer.length - 1 - index));
            const weightedSum = newBuffer.reduce((sum, speed, index) => sum + speed * weights[index], 0);
            const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
            const weightedAverage = weightedSum / weightSum;

            // Apply stationary detection
            const isStationary = detectStationaryState(newBuffer);
            const finalSpeed = isStationary ? 0 : Math.round(weightedAverage * 10) / 10;
            
            setCurrentSpeed(finalSpeed);
            setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });

            // Only add to history if we have enough data and it's meaningful
            if (newBuffer.length >= 5) {
              // Process location information asynchronously outside the state update
              setTimeout(() => {
                getLocationInfo(location.coords.latitude, location.coords.longitude).then(locationInfo => {
                  addSpeedData({
                    timestamp: Date.now(),
                    speed: finalSpeed,
                    location: {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      accuracy: location.coords.accuracy ?? undefined,
                      altitude: location.coords.altitude ?? undefined,
                      heading: location.coords.heading ?? undefined,
                    },
                    address: locationInfo.address,
                    city: locationInfo.city,
                    country: locationInfo.country,
                    roadName: locationInfo.roadName,
                  });
                });
              }, 0);
            }

            return newBuffer;
          });

          // Update last valid location
          setLastValidLocation(location);
        }
      );

      setLocationSubscription(subscription);
      
      try {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
          foregroundService: {
            notificationTitle: "CrashCue Live",
            notificationBody: "Monitoring your speed and safety",
            notificationColor: "#EF4444",
          },
          showsBackgroundLocationIndicator: true,
        });
      } catch (err) {
        console.log('Background task could not be started', err);
      }

      setIsTracking(true);
    } catch (error) {
      // Error starting location tracking
    }
  };

  const stopTracking = async () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    try {
      const hasTask = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasTask) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (err) {
      console.log('Failed to stop bg task');
    }

    setIsTracking(false);
  };

  // Start/stop sensor monitoring when tracking state changes
  useEffect(() => {
    let accelerometerSubscription: any;
    let gyroscopeSubscription: any;

    const startSensors = async () => {
      // Check for sensor availability
      const isAccelAvailable = await Accelerometer.isAvailableAsync();
      const isGyroAvailable = await Gyroscope.isAvailableAsync();

      if (isTracking) {
        // Set sensor update intervals (100ms = 10 Hz)
        if (isAccelAvailable) Accelerometer.setUpdateInterval(100);
        if (isGyroAvailable) Gyroscope.setUpdateInterval(100);

        // Start accelerometer monitoring
        if (isAccelAvailable && Platform.OS !== 'web') {
          try {
            accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
              setAccelerometerData({ x, y, z });

              // Track impact start time for duration calculation
              const gForce = Math.sqrt(x * x + y * y + z * z) / 9.81;
              if (gForce > 2.0 && !impactStartTime) {
                setImpactStartTime(Date.now());
              } else if (gForce < 1.5 && impactStartTime) {
                setImpactStartTime(null);
              }
            });
          } catch (e) {
            console.log('Failed to add accelerometer listener');
          }
        }

        // Start gyroscope monitoring
        if (isGyroAvailable && Platform.OS !== 'web') {
          try {
            gyroscopeSubscription = Gyroscope.addListener(({ x, y, z }) => {
              // Convert to degrees per second
              const alpha = x * (180 / Math.PI);
              const beta = y * (180 / Math.PI);
              const gamma = z * (180 / Math.PI);
              setGyroscopeData({ alpha, beta, gamma });
            });
          } catch (e) {
            console.log('Failed to add gyroscope listener');
          }
        }

        console.log('🎯 Multi-sensor crash detection activated');
      }
    };

    startSensors();

    // Cleanup function
    return () => {
      if (accelerometerSubscription) {
        accelerometerSubscription.remove();
      }
      if (gyroscopeSubscription) {
        gyroscopeSubscription.remove();
      }
    };
  }, [isTracking, impactStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  const value: SpeedHistoryContextType = {
    speedHistory,
    currentSpeed,
    currentLocation,
    addSpeedData,
    clearHistory,
    isTracking,
    startTracking,
    stopTracking,
    crashDetected,
    triggerSOS,
    resetCrashDetection,
    exportSpeedLogs,
    getStorageStats,
    safetyScore,
  };

  return (
    <SpeedHistoryContext.Provider value={value}>
      {children}
    </SpeedHistoryContext.Provider>
  );
};
