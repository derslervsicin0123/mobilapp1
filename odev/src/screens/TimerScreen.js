import { saveSession } from '../storage/sessionStorage';
import {
	View,
	Text,
	AppState,
	Modal,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import CategoryPicker from '../components/CategoryPicker';

const DEFAULT_DURATION = 25 * 60;
const MIN_DURATION = 60;
const MAX_DURATION = 600 * 60;
const STEP = 60;

const HOLD_DELAY_MS = 500;
const REPEAT_MS = 80;

export default function TimerScreen() {
	const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_DURATION);
	const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
	const [status, setStatus] = useState('idle');
	const [distractionCount, setDistractionCount] = useState(0);
	const [category, setCategory] = useState('Genel');
	const [sessionSummary, setSessionSummary] = useState(null);

	const intervalRef = useRef(null);
	const appState = useRef(AppState.currentState);

	const startSecondsRef = useRef(null);

	const adjustIntervalRef = useRef(null);
	const pressTimeoutRef = useRef(null);
	const isLongPressActive = useRef(false);


	const startTimer = () => {
		startSecondsRef.current = remainingSeconds;
		setStatus('running');

		intervalRef.current = setInterval(() => {
			setRemainingSeconds(prev => {
				if (prev <= 1) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
					finishSession(0);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const pauseTimer = () => {
		clearInterval(intervalRef.current);
		intervalRef.current = null;
		setStatus('paused');
	};

	const resumeTimer = () => {
		setStatus('running');
		intervalRef.current = setInterval(() => {
			setRemainingSeconds(prev => {
				if (prev <= 1) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
					finishSession(0);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const stopTimer = () => {
		finishSession(remainingSeconds);
	};

	const resetTimer = () => {
		clearInterval(intervalRef.current);
		intervalRef.current = null;

		if (adjustIntervalRef.current) {
			clearInterval(adjustIntervalRef.current);
			adjustIntervalRef.current = null;
		}
		if (pressTimeoutRef.current) {
			clearTimeout(pressTimeoutRef.current);
			pressTimeoutRef.current = null;
		}
		isLongPressActive.current = false;

		setSelectedDuration(DEFAULT_DURATION);
		setRemainingSeconds(DEFAULT_DURATION);
		setDistractionCount(0);
		setCategory('Genel');
		setStatus('idle');
	};

	const finishSession = async endSeconds => {
		if (status === 'finished') return;

		clearInterval(intervalRef.current);
		intervalRef.current = null;

		if (adjustIntervalRef.current) {
			clearInterval(adjustIntervalRef.current);
			adjustIntervalRef.current = null;
		}
		if (pressTimeoutRef.current) {
			clearTimeout(pressTimeoutRef.current);
			pressTimeoutRef.current = null;
		}
		isLongPressActive.current = false;

		const start = startSecondsRef.current ?? selectedDuration;
		const actualDuration = Math.max(0, start - endSeconds);

		const session = {
			id: Date.now().toString(),
			category,
			actualDuration,
			distractionCount,
			createdAt: new Date().toISOString(),
		};

		await saveSession(session);

		setSessionSummary(session);
		setStatus('finished');
	};


	useEffect(() => {
		const sub = AppState.addEventListener('change', next => {
			if (status === 'running' && next !== 'active') {
				pauseTimer();
				setDistractionCount(prev => prev + 1);
			}
			appState.current = next;
		});

		return () => sub.remove();
	}, [status]);

	useEffect(() => {
		return () => {
			if (adjustIntervalRef.current) {
				clearInterval(adjustIntervalRef.current);
				adjustIntervalRef.current = null;
			}
			if (pressTimeoutRef.current) {
				clearTimeout(pressTimeoutRef.current);
				pressTimeoutRef.current = null;
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, []);


	const adjustDuration = delta => {
		if (status !== 'idle') return;

		setSelectedDuration(prev => {
			const next = prev + delta;
			if (next < MIN_DURATION || next > MAX_DURATION) return prev;
			setRemainingSeconds(next);
			return next;
		});
	};

	const startAdjustRepeat = delta => {
		if (status !== 'idle') return;

		isLongPressActive.current = true;

		adjustDuration(delta);

		if (adjustIntervalRef.current) {
			clearInterval(adjustIntervalRef.current);
			adjustIntervalRef.current = null;
		}

		adjustIntervalRef.current = setInterval(() => {
			adjustDuration(delta);
		}, REPEAT_MS);
	};

	const handlePressIn = delta => {
		if (status !== 'idle') return;

		if (pressTimeoutRef.current) {
			clearTimeout(pressTimeoutRef.current);
			pressTimeoutRef.current = null;
		}

		pressTimeoutRef.current = setTimeout(() => {
			startAdjustRepeat(delta);
			pressTimeoutRef.current = null;
		}, HOLD_DELAY_MS);
	};

	const handlePressOut = () => {
		if (pressTimeoutRef.current) {
			clearTimeout(pressTimeoutRef.current);
			pressTimeoutRef.current = null;
		}

		if (isLongPressActive.current) {
			if (adjustIntervalRef.current) {
				clearInterval(adjustIntervalRef.current);
				adjustIntervalRef.current = null;
			}
			isLongPressActive.current = false;
		}
	};

	const handlePress = delta => {
		if (isLongPressActive.current) return;
		adjustDuration(delta);
	};

	const primaryLabel =
		status === 'running' ? 'Duraklat' : status === 'paused' ? 'Devam Ettir' : 'Başlat';

	const minutes = Math.floor(remainingSeconds / 60);
	const seconds = remainingSeconds % 60;

	const summaryMinutes = Math.floor((sessionSummary?.actualDuration || 0) / 60);
	const summarySeconds = (sessionSummary?.actualDuration || 0) % 60;


	return (
		<View style={styles.container}>
			<View style={styles.pickerContainer}>
				<CategoryPicker
					selectedCategory={category}
					onSelect={setCategory}
					disabled={status !== 'idle'}
				/>
			</View>

			<View style={styles.timerContainer}>
				<View style={styles.adjustRow}>
					<TouchableOpacity
						onPressIn={() => handlePressIn(-STEP)}
						onPressOut={handlePressOut}
						onPress={() => handlePress(-STEP)}
						activeOpacity={status === 'idle' ? 0.7 : 1}
						disabled={status !== 'idle'}
						style={[
							styles.adjustButton,
							status === 'idle' ? styles.adjustButtonActive : styles.adjustButtonDisabled,
						]}
					>
						<Text style={styles.adjustButtonText}>−</Text>
					</TouchableOpacity>

					<View style={styles.timerCenter}>
						<Text style={styles.timerText}>
							{minutes}:{seconds.toString().padStart(2, '0')}
						</Text>

						<Text style={styles.setDurationText}>
							Belirlenen Süre: {Math.floor(selectedDuration / 60)} dakika
						</Text>
						<Text style={styles.distractionText}>Dikkat Dağınıklığı Sayısı: {distractionCount}</Text>
					</View>

					<TouchableOpacity
						onPressIn={() => handlePressIn(STEP)}
						onPressOut={handlePressOut}
						onPress={() => handlePress(STEP)}
						activeOpacity={status === 'idle' ? 0.7 : 1}
						disabled={status !== 'idle'}
						style={[
							styles.adjustButton,
							status === 'idle' ? styles.adjustButtonActive : styles.adjustButtonDisabled,
						]}
					>
						<Text style={styles.adjustButtonText}>+</Text>
					</TouchableOpacity>
				</View>

			</View>

			<View style={styles.actionRow}>
				<TouchableOpacity
					onPress={() => {
						if (status === 'running') pauseTimer();
						else if (status === 'paused') resumeTimer();
						else startTimer();
					}}
					style={styles.primaryButton}
					activeOpacity={0.85}
				>
					<Text style={styles.primaryButtonText}>
						{status === 'running' ? 'Duraklat' : status === 'paused' ? 'Devam Ettir' : 'Başlat'}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={stopTimer}
					disabled={status === 'idle'}
					style={[
						styles.secondaryButton,
						status === 'idle' ? styles.secondaryButtonDisabled : null,
					]}
					activeOpacity={status === 'idle' ? 1 : 0.85}
				>
					<Text style={styles.secondaryButtonText}>Bitir</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity
				onPress={resetTimer}
				style={styles.resetButton}
				activeOpacity={0.85}
			>
				<Text style={styles.resetButtonText}>Sıfırla</Text>
			</TouchableOpacity>

			<Modal visible={!!sessionSummary} transparent animationType="fade">
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Seans Özeti:</Text>

						{sessionSummary && (
							<>
								<Text>Kategori:  {category}</Text>
								<Text>Odaklı Geçen Süre:  {summaryMinutes} dakika {summarySeconds} saniye</Text>
								<Text>Dikkat Dağınıklığı Sayısı:  {sessionSummary.distractionCount}</Text>
							</>
						)}

						<TouchableOpacity
							activeOpacity={0.85}
							onPress={() => {
								setSessionSummary(null);
								resetTimer();
							}}
							style={styles.modalCloseButton}
						>
							<Text style={styles.modalCloseButtonText}>Kapat</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
		backgroundColor: '#fff',
	},

	pickerContainer: {
		marginBottom: 12,
		padding: 14,
		borderRadius: 10,
		backgroundColor: '#f9f9f9',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},

	timerContainer: {
		marginBottom: 12,
		marginTop: 12,
		justifyContent: 'center',
		height: 200,
		padding: 12,
		borderRadius: 10,
		backgroundColor: '#f9f9f9',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},

	adjustRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
	},

	adjustButton: {
		width: 72,
		height: 72,
		borderRadius: 36,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},

	adjustButtonActive: {
		backgroundColor: '#9b75c5',
	},

	adjustButtonDisabled: {
		backgroundColor: '#999',
	},

	adjustButtonText: {
		fontSize: 36,
		color: '#fff',
	},

	timerCenter: {
		alignItems: 'center',
		minWidth: 180,
	},

	timerText: {
		fontSize: 48,
		marginTop: 8,
	},

	setDurationText: {
		marginTop: 8,
		color: '#111',
	},

	distractionText: {
		textAlign: 'center',
		marginBottom: 4,
		color: '#111',
	},

	actionRow: {
		flexDirection: 'row',
		marginTop: 12,
	},

	primaryButton: {
		flex: 1,
		paddingVertical: 20,
		borderRadius: 10,
		backgroundColor: '#4CAF50',
		marginRight: 8,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},

	primaryButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 20,
	},

	secondaryButton: {
		flex: 1,
		paddingVertical: 20,
		borderRadius: 10,
		backgroundColor: '#d9534f',
		marginLeft: 8,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},

	secondaryButtonDisabled: {
		backgroundColor: '#888',
	},

	secondaryButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 20,
	},

	resetButton: {
		marginTop: 14,
		paddingVertical: 18,
		borderRadius: 10,
		backgroundColor: 'hsla(204, 62%, 49%, 1.00)',
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},

	resetButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 20,
	},

	modalBackdrop: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)',
	},

	modalCard: {
		backgroundColor: '#fff',
		margin: 20,
		padding: 20,
		borderRadius: 8,
	},

	modalTitle: {
		fontWeight: 'bold',
		marginBottom: 10,
	},

	modalCloseButton: {
		marginTop: 12,
		paddingVertical: 12,
		borderRadius: 8,
		backgroundColor: '#4CAF50',
		alignItems: 'center',
	},

	modalCloseButtonText: {
		color: '#fff',
		fontWeight: '600',
	},
});
