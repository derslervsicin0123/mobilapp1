import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TimerScreen from '../screens/TimerScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { Ionicons } from '@expo/vector-icons';


const Tab = createBottomTabNavigator();

export default function TabNavigator() {
	return (
		<Tab.Navigator>
			<Tab.Screen

				name="Ana Sayfa"
				component={TimerScreen}
				options={{
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="home" color={color} size={size} />
					),
				}}
			/>


			<Tab.Screen

				name="Raporlar"
				component={ReportsScreen}
				options={{
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="bar-chart" color={color} size={size} />
					),
				}}
			/>

		</Tab.Navigator>
	);
}
