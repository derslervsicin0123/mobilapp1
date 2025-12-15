import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@focus_sessions';


export const getSessions = async () => {
	try {
		const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
		return jsonValue != null ? JSON.parse(jsonValue) : [];
	} catch (e) {
		console.error('Session read error', e);
		return [];
	}
};


export const saveSession = async session => {
	try {
		const existingSessions = await getSessions();
		const updatedSessions = [...existingSessions, session];
		await AsyncStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(updatedSessions)
		);
	} catch (e) {
		console.error('Session save error', e);
	}
};


export const clearSessions = async () => {
	try {
		await AsyncStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.error('Session clear error', e);
	}
};
