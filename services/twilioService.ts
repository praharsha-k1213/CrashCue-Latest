// Using environment variables (EXPO_PUBLIC_) is crucial for security.
// The hardcoded values below are kept as a temporary fallback to prevent immediate crashes,
// but MUST be removed after adding them to your .env file.
const TWILIO_ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID || 'AC1e32d652fe67f939b9fdcf5cd7b40cff';
const TWILIO_AUTH_TOKEN = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN || '5f6f574b12c7d7e08dfc25da94a2db4a';
const TWILIO_PHONE_NUMBER = process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER || '+19478370884';
const TWILIO_WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+14155238886';

interface EmergencyCallParams {
    toPhoneNumber: string;
    userName: string;
    location: {
        latitude: number;
        longitude: number;
    };
    address?: string;
}

interface EmergencySMSParams {
    toPhoneNumber: string;
    userName: string;
    location: {
        latitude: number;
        longitude: number;
    };
    address?: string;
}

export const makeEmergencyCall = async (params: EmergencyCallParams): Promise<boolean> => {
    const { toPhoneNumber, userName, location, address } = params;

    try {
        let locationText = '';
        if (address && address !== 'Locating...' && address !== 'Waiting for GPS...') {
            locationText = `${address}. GPS coordinates: latitude ${location.latitude.toFixed(6)}, longitude ${location.longitude.toFixed(6)}`;
        } else {
            locationText = `GPS coordinates: latitude ${location.latitude.toFixed(6)}, longitude ${location.longitude.toFixed(6)}`;
        }

        const message = `Emergency alert! ${userName} has activated an emergency alert at ${locationText}. Please respond immediately. I repeat, ${userName} needs help at ${locationText}. This is an automated emergency alert from CrashCue.`;
        const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">${message}</Say><Say voice="Polly.Aditi" language="en-IN">${message}</Say></Response>`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;


        const credentials = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const base64Credentials = btoa(credentials);


        const formData = new URLSearchParams();
        formData.append('To', toPhoneNumber);
        formData.append('From', TWILIO_PHONE_NUMBER);
        formData.append('Twiml', twimlResponse);

        console.log('=== TWILIO CALL DEBUG ===');
        console.log('To:', toPhoneNumber);
        console.log('From:', TWILIO_PHONE_NUMBER);
        console.log('TwiML:', twimlResponse);
        console.log('Message:', message);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const responseText = await response.text();
        console.log('Twilio Response Status:', response.status);
        console.log('Twilio Response:', responseText);

        if (!response.ok) {
            let errorData: any;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }
            console.log('Twilio API Error:', errorData);
            throw new Error(`Twilio API error: ${errorData.message || response.statusText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Emergency call initiated successfully:', data);
        console.log('Call SID:', data.sid);
        console.log('Call Status:', data.status);

        return true;

    } catch (error) {
        console.log('Error making emergency call:', error);
        throw error;
    }
};

export const sendEmergencySMS = async (params: EmergencySMSParams): Promise<boolean> => {
    const { toPhoneNumber, userName, location, address } = params;

    try {
        const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

        const locationText = address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        const message = `🚨 EMERGENCY ALERT 🚨\n\n${userName} has activated an emergency alert!\n\nLocation: ${locationText}\n\nMap: ${mapsUrl}\n\nPlease respond immediately!\n\n- CrashCue Emergency System`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const credentials = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const base64Credentials = btoa(credentials);

        const formData = new URLSearchParams();
        formData.append('To', toPhoneNumber);
        formData.append('From', TWILIO_PHONE_NUMBER);
        formData.append('Body', message);

        console.log('=== TWILIO SMS DEBUG ===');
        console.log('To:', toPhoneNumber);
        console.log('From:', TWILIO_PHONE_NUMBER);
        console.log('Message:', message);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const responseText = await response.text();
        console.log('Twilio SMS Response Status:', response.status);
        console.log('Twilio SMS Response:', responseText);

        if (!response.ok) {
            let errorData: any;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }
            console.log('Twilio SMS API Error:', errorData);
            throw new Error(`Twilio SMS API error: ${errorData.message || response.statusText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Emergency SMS sent successfully:', data);
        console.log('Message SID:', data.sid);
        console.log('Message Status:', data.status);

        return true;

    } catch (error) {
        console.log('Error sending emergency SMS:', error);
        throw error;
    }
};


interface EmergencyWhatsAppParams {
    toPhoneNumber: string;
    userName: string;
    location: {
        latitude: number;
        longitude: number;
    };
    address?: string;
}

export const sendEmergencyWhatsApp = async (params: EmergencyWhatsAppParams): Promise<boolean> => {
    const { toPhoneNumber, userName, location, address } = params;

    try {

        const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        const locationText = address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        const message = `🚨 *EMERGENCY ALERT* 🚨\n\n*${userName}* has activated an emergency alert!\n\n📍 *Location:* ${locationText}\n\n🗺️ *Map:* ${mapsUrl}\n\n⚠️ Please respond immediately!\n\n_- CrashCue Emergency System_`;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const credentials = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const base64Credentials = btoa(credentials);
        const formData = new URLSearchParams();
        formData.append('To', `whatsapp:${toPhoneNumber}`);
        formData.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
        formData.append('Body', message);
        console.log('=== TWILIO WHATSAPP DEBUG ===');
        console.log('To:', `whatsapp:${toPhoneNumber}`);
        console.log('From:', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
        console.log('Message:', message);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const responseText = await response.text();
        console.log('Twilio WhatsApp Response Status:', response.status);
        console.log('Twilio WhatsApp Response:', responseText);

        if (!response.ok) {
            let errorData: any;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }
            console.log('Twilio WhatsApp API Error:', errorData);
            throw new Error(`Twilio WhatsApp API error: ${errorData.message || response.statusText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Emergency WhatsApp sent successfully:', data);
        console.log('Message SID:', data.sid);
        console.log('Message Status:', data.status);

        return true;

    } catch (error) {
        console.log('Error sending emergency WhatsApp:', error);
        throw error;
    }
};

export const sendSafeWhatsApp = async (params: EmergencyWhatsAppParams): Promise<boolean> => {
    const { toPhoneNumber, userName, location, address } = params;

    try {
        const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        const locationText = address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        const message = `✅ *SAFE UPDATE* ✅\n\n*${userName}* has marked themselves as SAFE.\n\n📍 *Current Location:* ${locationText}\n\n🗺️ *Map:* ${mapsUrl}\n\nNo further emergency action is required.\n\n_- CrashCue Safety System_`;
        
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const credentials = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const base64Credentials = btoa(credentials);
        
        const formData = new URLSearchParams();
        formData.append('To', `whatsapp:${toPhoneNumber}`);
        formData.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
        formData.append('Body', message);
        
        console.log('=== TWILIO SAFE WHATSAPP DEBUG ===');
        console.log('To:', `whatsapp:${toPhoneNumber}`);
        console.log('From:', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const responseText = await response.text();
        if (!response.ok) {
            let errorData: any;
            try { errorData = JSON.parse(responseText); } catch { errorData = { message: responseText }; }
            throw new Error(`Twilio WhatsApp API error: ${errorData.message || response.statusText}`);
        }

        return true;
    } catch (error) {
        console.log('Error sending safe WhatsApp:', error);
        throw error;
    }
};

export const makeSafeCall = async (params: EmergencyCallParams): Promise<boolean> => {
    const { toPhoneNumber, userName, location, address } = params;

    try {
        let locationText = '';
        if (address && address !== 'Locating...' && address !== 'Waiting for GPS...') {
            locationText = `${address}. GPS coordinates: latitude ${location.latitude.toFixed(6)}, longitude ${location.longitude.toFixed(6)}`;
        } else {
            locationText = `GPS coordinates: latitude ${location.latitude.toFixed(6)}, longitude ${location.longitude.toFixed(6)}`;
        }

        const message = `Safe update. ${userName} has marked themselves as safe. Their current location is ${locationText}. No emergency action is required. I repeat, ${userName} is safe at ${locationText}. This is an automated safe alert from Crash cue.`;
        const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">${message}</Say><Say voice="Polly.Aditi" language="en-IN">${message}</Say></Response>`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

        const credentials = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const base64Credentials = btoa(credentials);

        const formData = new URLSearchParams();
        formData.append('To', toPhoneNumber);
        formData.append('From', TWILIO_PHONE_NUMBER);
        formData.append('Twiml', twimlResponse);

        console.log('=== TWILIO SAFE CALL DEBUG ===');
        console.log('To:', toPhoneNumber);
        console.log('From:', TWILIO_PHONE_NUMBER);
        console.log('TwiML:', twimlResponse);
        console.log('Message:', message);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const responseText = await response.text();
        console.log('Twilio Safe Call Response Status:', response.status);
        
        if (!response.ok) {
            let errorData: any;
            try { errorData = JSON.parse(responseText); } catch { errorData = { message: responseText }; }
            console.log('Twilio Safe Call API Error:', errorData);
            throw new Error(`Twilio API error: ${errorData.message || response.statusText}`);
        }

        return true;
    } catch (error) {
        console.log('Error making safe call:', error);
        throw error;
    }
};
