/**
 * Enhanced Crash Detection Algorithms
 * 
 * Multi-sensor crash detection using:
 * - GPS speed monitoring
 * - Accelerometer (G-force impact detection)
 * - Gyroscope (rollover detection)
 * - Sensor fusion with confidence scoring
 */

export interface CrashDetectionResult {
    isCrash: boolean;
    confidence: number;
    severity: 'minor' | 'moderate' | 'severe';
    reasons: string[];
    gForce?: number;
    speedDrop?: number;
    rotationRate?: number;
}

export interface SensorData {
    // GPS data
    currentSpeed: number;
    previousSpeed: number;
    averageRecentSpeed: number;

    // Accelerometer data
    accelerationX: number;
    accelerationY: number;
    accelerationZ: number;

    // Gyroscope data
    rotationAlpha: number;
    rotationBeta: number;
    rotationGamma: number;

    // Timing
    timestamp: number;
    impactDuration?: number;
}

/**
 * Calculate total G-force from accelerometer data
 */
export const calculateGForce = (x: number, y: number, z: number): number => {
    // Calculate magnitude of acceleration vector
    const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

    // Convert to G-force (1g = 9.81 m/s²)
    const gForce = totalAcceleration / 9.81;

    return gForce;
};

/**
 * Calculate rotation rate from gyroscope data
 */
export const calculateRotationRate = (alpha: number, beta: number, gamma: number): number => {
    // Calculate magnitude of rotation vector (degrees per second)
    const rotationRate = Math.sqrt(alpha * alpha + beta * beta + gamma * gamma);

    return rotationRate;
};

/**
 * Detect impact based on accelerometer data
 */
export const detectAccelerometerImpact = (
    gForce: number,
    previousGForce: number,
    impactDuration: number = 0
): { detected: boolean; confidence: number; severity: 'minor' | 'moderate' | 'severe' } => {
    const deltaG = Math.abs(gForce - previousGForce);

    // Ignore brief spikes (pothole/phone drop filter)
    if (impactDuration > 0 && impactDuration < 200) {
        return { detected: false, confidence: 0, severity: 'minor' };
    }

    // Severe impact (> 3.5g)
    if (deltaG > 3.5 || gForce > 4.0) {
        return { detected: true, confidence: 40, severity: 'severe' };
    }

    // Moderate impact (2.0g - 3.5g)
    if (deltaG > 2.0 || gForce > 3.0) {
        return { detected: true, confidence: 25, severity: 'moderate' };
    }

    // Minor impact (1.5g - 2.0g)
    if (deltaG > 1.5 || gForce > 2.5) {
        return { detected: true, confidence: 15, severity: 'minor' };
    }

    return { detected: false, confidence: 0, severity: 'minor' };
};

/**
 * Detect rollover based on gyroscope data
 */
export const detectRollover = (
    rotationRate: number
): { detected: boolean; confidence: number; severity: 'minor' | 'moderate' | 'severe' } => {
    // Severe rollover (> 360°/s)
    if (rotationRate > 360) {
        return { detected: true, confidence: 30, severity: 'severe' };
    }

    // Moderate rollover (180°/s - 360°/s)
    if (rotationRate > 180) {
        return { detected: true, confidence: 15, severity: 'moderate' };
    }

    return { detected: false, confidence: 0, severity: 'minor' };
};

/**
 * Detect crash based on GPS speed drop
 */
export const detectSpeedDrop = (
    currentSpeed: number,
    averageRecentSpeed: number,
    previousSpeed: number
): { detected: boolean; confidence: number; severity: 'minor' | 'moderate' | 'severe' } => {
    const speedDrop = averageRecentSpeed - currentSpeed;

    // Severe speed drop (> 40 km/h)
    if (averageRecentSpeed > 30 && currentSpeed < 5 && speedDrop > 40) {
        return { detected: true, confidence: 30, severity: 'severe' };
    }

    // Moderate speed drop (20-40 km/h)
    if (averageRecentSpeed > 20 && currentSpeed < 10 && speedDrop > 20) {
        return { detected: true, confidence: 20, severity: 'moderate' };
    }

    // Minor speed drop (15-20 km/h)
    if (averageRecentSpeed > 15 && currentSpeed < 5 && speedDrop > 15) {
        return { detected: true, confidence: 15, severity: 'minor' };
    }

    return { detected: false, confidence: 0, severity: 'minor' };
};

/**
 * Apply failsafes to prevent false positives
 */
export const applyFailsafes = (
    sensorData: SensorData,
    gForce: number,
    speedDrop: number
): { shouldIgnore: boolean; reason: string } => {
    // Speed bump filter (low speed + moderate G-force)
    if (sensorData.currentSpeed < 15 && gForce < 2.5 && gForce > 1.5) {
        return { shouldIgnore: true, reason: 'Speed bump detected' };
    }

    // Pothole filter (brief spike)
    if (sensorData.impactDuration && sensorData.impactDuration < 200) {
        return { shouldIgnore: true, reason: 'Brief impact (pothole)' };
    }

    // Phone drop filter (high G-force but no speed change)
    if (gForce > 2.0 && speedDrop < 5 && sensorData.currentSpeed < 5) {
        return { shouldIgnore: true, reason: 'Phone drop detected' };
    }

    // Normal braking (gradual deceleration)
    if (speedDrop > 10 && speedDrop < 25 && gForce < 1.8) {
        return { shouldIgnore: true, reason: 'Normal braking' };
    }

    return { shouldIgnore: false, reason: '' };
};

/**
 * Sensor Fusion: Combine all detection methods with confidence scoring
 */
export const detectCrashWithSensorFusion = (
    sensorData: SensorData,
    previousGForce: number = 1.0
): CrashDetectionResult => {
    let totalConfidence = 0;
    const reasons: string[] = [];
    let maxSeverity: 'minor' | 'moderate' | 'severe' = 'minor';

    // Calculate derived values
    const gForce = calculateGForce(
        sensorData.accelerationX,
        sensorData.accelerationY,
        sensorData.accelerationZ
    );

    const rotationRate = calculateRotationRate(
        sensorData.rotationAlpha,
        sensorData.rotationBeta,
        sensorData.rotationGamma
    );

    const speedDrop = sensorData.averageRecentSpeed - sensorData.currentSpeed;

    // 1. GPS Speed Drop Detection (0-30 points)
    const speedResult = detectSpeedDrop(
        sensorData.currentSpeed,
        sensorData.averageRecentSpeed,
        sensorData.previousSpeed
    );

    if (speedResult.detected) {
        totalConfidence += speedResult.confidence;
        reasons.push(`Speed drop: ${speedDrop.toFixed(1)} km/h`);
        if (speedResult.severity === 'severe') maxSeverity = 'severe';
        else if (speedResult.severity === 'moderate') maxSeverity = 'moderate';
    }

    // 2. Accelerometer Impact Detection (0-40 points)
    const accelResult = detectAccelerometerImpact(
        gForce,
        previousGForce,
        sensorData.impactDuration
    );

    if (accelResult.detected) {
        totalConfidence += accelResult.confidence;
        reasons.push(`G-force: ${gForce.toFixed(2)}g`);
        if (accelResult.severity === 'severe') maxSeverity = 'severe';
        else if (accelResult.severity === 'moderate' && maxSeverity !== 'severe') maxSeverity = 'moderate';
    }

    // 3. Gyroscope Rollover Detection (0-30 points)
    const gyroResult = detectRollover(rotationRate);

    if (gyroResult.detected) {
        totalConfidence += gyroResult.confidence;
        reasons.push(`Rotation: ${rotationRate.toFixed(1)}°/s`);
        if (gyroResult.severity === 'severe') maxSeverity = 'severe';
        else if (gyroResult.severity === 'moderate' && maxSeverity !== 'severe') maxSeverity = 'moderate';
    }

    // 4. Apply Failsafes
    const failsafe = applyFailsafes(sensorData, gForce, speedDrop);

    if (failsafe.shouldIgnore) {
        return {
            isCrash: false,
            confidence: 0,
            severity: 'minor',
            reasons: [failsafe.reason],
            gForce,
            speedDrop,
            rotationRate
        };
    }

    // 5. Determine if crash detected (threshold: 50 confidence)
    const isCrash = totalConfidence >= 50;

    // Adjust severity based on confidence
    if (totalConfidence >= 80) {
        maxSeverity = 'severe';
    } else if (totalConfidence >= 65) {
        if (maxSeverity === 'minor') maxSeverity = 'moderate';
    }

    return {
        isCrash,
        confidence: totalConfidence,
        severity: maxSeverity,
        reasons,
        gForce,
        speedDrop,
        rotationRate
    };
};

/**
 * Auto-calibrate sensitivity based on driving style
 */
export const calibrateSensitivity = (
    averageSpeed: number,
    speedVariance: number,
    hardBrakeCount: number
): { gForceThreshold: number; speedDropThreshold: number } => {
    // Aggressive driving style (high variance, frequent hard braking)
    if (speedVariance > 15 || hardBrakeCount > 5) {
        return {
            gForceThreshold: 2.5, // Higher threshold to reduce false positives
            speedDropThreshold: 25
        };
    }

    // Normal driving style
    return {
        gForceThreshold: 2.0,
        speedDropThreshold: 20
    };
};
