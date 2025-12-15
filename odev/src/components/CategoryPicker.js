import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CATEGORIES = [
	'Genel',
	'Ders Çalışma',
	'Kodlama',
	'Proje',
	'Kitap Okuma',
	'Diğer',
];

export default function CategoryPicker({ selectedCategory, onSelect, disabled = false }) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Kategori</Text>

			<View style={styles.row}>
				{CATEGORIES.map(cat => {
					const isSelected = selectedCategory === cat;

					const buttonStyle = [
						styles.categoryButton,
						isSelected ? (disabled ? styles.categoryButtonSelectedDisabled : styles.categoryButtonSelected) : styles.categoryButtonDefault,
					];

					const textStyle = [
						styles.categoryText,
						isSelected ? styles.categoryTextSelected : null,
					];

					return (
						<TouchableOpacity
							key={cat}
							disabled={disabled}
							onPress={() => onSelect(cat)}
							style={buttonStyle}
							activeOpacity={0.85}
						>
							<Text style={textStyle}>{cat}</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 0,
	},

	title: {
		marginBottom: 8,
		fontWeight: 'bold',
	},

	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},

	categoryButton: {
		width: '32%',
		marginBottom: 10,
		paddingVertical: 10,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},

	categoryButtonDefault: {
		backgroundColor: '#dbdbdb',
	},

	categoryButtonSelected: {
		backgroundColor: '#4CAF50',
	},

	categoryButtonSelectedDisabled: {
		backgroundColor: '#838383',
	},

	categoryText: {
		color: '#000',
		textAlign: 'center',
		fontSize: 13,
	},

	categoryTextSelected: {
		color: '#fff',
	},
});
