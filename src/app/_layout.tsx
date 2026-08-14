import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import '@/i18n';
import { useAuthStore } from '@/store/auth';

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

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const restoreSession = useAuthStore((state) => state.restoreSession);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Đọc token đã lưu TRƯỚC khi hiện giao diện, nếu không màn hình đăng nhập
        // sẽ nháy lên một nhịp rồi biến mất với người dùng đã đăng nhập sẵn.
        restoreSession().finally(() => {
            setIsReady(true);
            void SplashScreen.hideAsync();
        });
    }, [restoreSession]);

    if (!isReady) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="place/[id]" options={{ title: '' }} />
                </Stack>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
