import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { Palette } from '@/constants/theme';
import '@/i18n';
import { useAuthStore, useIsSignedIn } from '@/store/auth';
import { useOnboardingStore } from '@/store/onboarding';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Mạng di động ở Việt Nam hay chập chờn: thử lại một lần là đủ để vượt
            // qua lỗi thoáng qua, nhưng không khiến người dùng chờ quá lâu khi mất mạng.
            retry: 1,
            staleTime: 60_000,
            refetchOnWindowFocus: false,
        },
    },
});

/**
 * Chỉ có giao diện sáng — thiết kế Liquid Glass chưa có biến thể tối (stitch-screens.md).
 * Ép theme sáng để header/nền của Stack không lệch tông với nội dung khi máy bật dark mode.
 */
const NAV_THEME = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: Palette.brand, background: Palette.surface, text: Palette.onSurface },
};

export default function RootLayout() {
    const restoreSession = useAuthStore((state) => state.restoreSession);
    const restoreOnboarding = useOnboardingStore((state) => state.restore);
    const [isReady, setIsReady] = useState(false);
    const isSignedIn = useIsSignedIn();

    useEffect(() => {
        // Đọc token đã lưu TRƯỚC khi hiện giao diện, nếu không màn hình đăng nhập
        // sẽ nháy lên một nhịp rồi biến mất với người dùng đã đăng nhập sẵn.
        // Cờ "đã xem tour" cũng phải có trước, nếu không tour sẽ nháy lên rồi biến mất.
        Promise.all([restoreSession(), restoreOnboarding()]).finally(() => {
            setIsReady(true);
            void SplashScreen.hideAsync();
        });
    }, [restoreSession, restoreOnboarding]);

    if (!isReady) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={NAV_THEME}>
                <StatusBar style="dark" />
                <Stack>
                    {/* Mọi màn sau đăng nhập. Mất phiên (đăng xuất, 401 → clearSession) thì các màn này bị gỡ
                        dù đang mở ở đâu (Cài đặt, chi tiết quán…), router tự về màn chào bên dưới. */}
                    <Stack.Protected guard={isSignedIn}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
                        <Stack.Screen name="place/[id]" options={{ headerShown: false }} />
                        <Stack.Screen
                            name="settings"
                            options={{
                                headerShown: true,
                                headerShadowVisible: false,
                                headerStyle: { backgroundColor: Palette.surface },
                                headerTintColor: Palette.onSurface,
                            }}
                        />
                    </Stack.Protected>
                    {/* Luồng vào app: chào → đăng ký/đăng nhập → guide tour (chặn tour ở (tabs)/_layout) → tab. */}
                    <Stack.Screen name="(auth)/welcome" options={{ headerShown: false, animation: 'fade' }} />
                    <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
                </Stack>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
