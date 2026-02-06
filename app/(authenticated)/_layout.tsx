import { Tabs } from 'expo-router';
import { Clock, HeartHandshake, Map, User } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';

export default function AuthenticatedLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.darkGray,
        tabBarStyle: {
            borderTopColor: COLORS.gray,
            backgroundColor: COLORS.white,
        }
      }}
    >
      <Tabs.Screen 
        name="map" 
        options={{
            title: "Nearby",
            tabBarIcon: ({ color, size }) => <Map color={color} size={size} />
        }}
      />
      <Tabs.Screen 
        name="requests" 
        options={{
            title: "Requests",
            tabBarIcon: ({ color, size }) => <HeartHandshake color={color} size={size} />
        }}
      />
      <Tabs.Screen 
        name="request/[id]" 
        options={{
            href: null,
            tabBarStyle: { display: 'none' }
        }}
      />
      <Tabs.Screen 
        name="history" 
        options={{
            title: "History",
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
