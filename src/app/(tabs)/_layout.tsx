import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
    const { t } = useTranslation();

    return (
        <Tabs screenOptions={{ headerShown: false }}>
            {/* Bản đồ là màn hình mặc định: người dùng nghĩ theo không gian
                ("quanh đây có gì"), không theo danh sách. */}
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tab.map'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: t('tab.explore'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: t('tab.favorites'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tab.profile'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
