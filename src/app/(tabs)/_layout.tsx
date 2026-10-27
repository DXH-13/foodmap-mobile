import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { GlassTabBar } from '@/components/glass-tab-bar';
import { useIsSignedIn } from '@/store/auth';
import { useOnboardingStore } from '@/store/onboarding';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Icon đặc khi tab đang chọn, viền khi không — giống tab bar iOS. */
function tabIcon(active: IconName, inactive: IconName) {
    return function TabIcon({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
        return <Ionicons name={focused ? active : inactive} color={color} size={size} />;
    };
}

export default function TabsLayout() {
    const { t } = useTranslation();
    const isSignedIn = useIsSignedIn();
    const tourSeen = useOnboardingStore((s) => s.tourSeen);

    // Không vào thẳng app: phải đăng nhập (hoặc đăng ký) trước, rồi xem guide tour lần đầu.
    // Đăng xuất hay token bị thu hồi (401 → clearSession) cũng quay về đây và bị chuyển đi.
    if (!isSignedIn) return <Redirect href="/(auth)/welcome" />;
    if (!tourSeen) return <Redirect href="/onboarding" />;

    return (
        <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <GlassTabBar {...props} />}>
            {/* Bản đồ là màn hình mặc định: người dùng nghĩ theo không gian
                ("quanh đây có gì"), không theo danh sách. */}
            <Tabs.Screen
                name="index"
                options={{ title: t('tab.map'), tabBarIcon: tabIcon('map', 'map-outline') }}
            />
            <Tabs.Screen
                name="explore"
                options={{ title: t('tab.explore'), tabBarIcon: tabIcon('compass', 'compass-outline') }}
            />
            <Tabs.Screen
                name="favorites"
                options={{ title: t('tab.favorites'), tabBarIcon: tabIcon('heart', 'heart-outline') }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tab.profile'),
                    tabBarIcon: tabIcon('person-circle', 'person-circle-outline'),
                }}
            />
        </Tabs>
    );
}
