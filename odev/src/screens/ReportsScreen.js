import { Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useState, useCallback } from 'react';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { getSessions } from '../storage/sessionStorage';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;


const isToday = isoDate => {
	const d = new Date(isoDate);
	const today = new Date();
	return (
		d.getFullYear() === today.getFullYear() &&
		d.getMonth() === today.getMonth() &&
		d.getDate() === today.getDate()
	);
};

const formatDuration = seconds => {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m} dk ${s} sn`;
};


export default function ReportsScreen() {
	const [sessions, setSessions] = useState([]);

	useFocusEffect(
		useCallback(() => {
			getSessions().then(setSessions);
		}, [])
	);


	const todayTotal = sessions
		.filter(s => isToday(s.createdAt))
		.reduce((sum, s) => sum + s.actualDuration, 0);

	const allTimeTotal = sessions.reduce((sum, s) => sum + s.actualDuration, 0);

	const totalDistractions = sessions.reduce((sum, s) => sum + s.distractionCount, 0);


	const last7Days = [...Array(7)].map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		return d;
	});

	const barLabels = last7Days.map(d => `${d.getDate()}/${d.getMonth() + 1}`);

	const barRawData = last7Days.map(d => {
		return (
			sessions
				.filter(s => {
					const sd = new Date(s.createdAt);
					return (
						sd.getFullYear() === d.getFullYear() &&
						sd.getMonth() === d.getMonth() &&
						sd.getDate() === d.getDate()
					);
				})
				.reduce((sum, s) => sum + s.actualDuration, 0) / 60
		);
	});

	const barMaxValue = Math.max(...barRawData, 1);


	const totalDuration = sessions.reduce((sum, s) => sum + s.actualDuration, 0);

	const categoryMap = {};
	sessions.forEach(s => {
		categoryMap[s.category] = (categoryMap[s.category] || 0) + s.actualDuration;
	});

	const pieData = Object.keys(categoryMap).map((cat, index) => {
		const percentage = totalDuration === 0 ? 0 : (categoryMap[cat] / totalDuration) * 100;

		return {
			name: `${cat} (${percentage.toFixed(2)}%)`,
			population: percentage || 0.01,
			color: `hsl(${index * 60}, 70%, 60%)`,
			legendFontColor: '#333',
			legendFontSize: 11,
		};
	});


	return (
		<ScrollView style={styles.container}>
			<Text style={styles.header}>Genel İstatistikler</Text>

			<Text style={styles.statText}>Odaklı Toplam Süre - Bugün : {formatDuration(todayTotal)}</Text>
			<Text style={styles.statText}>Odaklı Toplam Süre - Tüm Zamanlar: {formatDuration(allTimeTotal)}</Text>
			<Text style={styles.statText}>Toplam Dikkat Dağınıklığı Sayısı - Tüm Zamanlar : {totalDistractions}</Text>

			<Text style={styles.sectionTitle}>Son 7 Gün Odaklanma Süreleri</Text>

			<BarChart
				style={styles.barChart}
				data={{
					labels: barLabels,
					datasets: [{ data: barRawData }],
				}}
				width={screenWidth - 40}
				height={230}
				fromZero
				segments={4}
				yAxisSuffix=" dk"
				chartConfig={{
					backgroundGradientFrom: '#ffffff',
					backgroundGradientTo: '#ffffff',
					fillShadowGradient: '#4CAF50',
					fillShadowGradientOpacity: 1,
					decimalPlaces: 2,
					color: () => '#4CAF50',
					labelColor: () => '#333',
					propsForBackgroundLines: {
						stroke: '#e0e0e0',
						strokeDasharray: '',
					},
				}}
			/>

			<Text style={styles.sectionTitle}>Kategori Dağılımı</Text>

			{pieData.length > 0 ? (
				<PieChart
					data={pieData}
					width={screenWidth - 30}
					height={200}
					accessor="population"
					backgroundColor="transparent"
					paddingLeft="0"
					chartConfig={{
						color: () => '#000',
					}}
					style={styles.pieChart}
				/>
			) : (
				<Text style={styles.statText}>Henüz veri yok.</Text>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},

	header: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 15,
	},

	statText: {
		marginBottom: 6,
		color: '#111',
	},

	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginVertical: 20,
	},

	barChart: {
		borderRadius: 10,
		marginRight: 0,
	},

	pieChart: {
		marginLeft: 0,
		marginRight: 0,
	},
});
