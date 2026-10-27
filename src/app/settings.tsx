import { useMutation, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';

import { api } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { InsetGroup, InsetRow } from '@/components/inset-group';
import { Palette, Space } from '@/constants/theme';
import { changeLocale, getCurrentLocale, SUPPORTED_LOCALES } from '@/i18n';
import { useAuthStore } from '@/store/auth';

/** Màn Cài đặt (mở từ nút bánh răng ở Hồ sơ): Ngôn ngữ, Giới thiệu, Đăng xuất. */
export default function SettingsScreen() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const refreshToken = useAuthStore((s) => s.refreshToken);
    const clearSession = useAuthStore((s) => s.clearSession);
    const current = getCurrentLocale();

    const logout = useMutation({
        // Thu hồi refresh token ở server; lỗi mạng cũng không giữ người dùng lại — vẫn đăng xuất.
        mutationFn: async () => {
            if (refreshToken) await api.POST('/api/v1/auth/logout', { body: { refreshToken } });
        },
        onSettled: () => {
            clearSession();
            for (const key of [qk.me.profile, qk.reviews.mine, qk.favorites.all, qk.visits.mine]) {
                queryClient.removeQueries({ queryKey: key });
            }
        },
    });

    const confirmLogout = () =>
        Alert.alert(t('profile.logout_confirm_title'), t('profile.logout_confirm_message'), [
            { text: t('common.action.cancel'), style: 'cancel' },
            { text: t('profile.logout'), style: 'destructive', onPress: () => logout.mutate() },
        ]);

    const onChangeLocale = async (locale: (typeof SUPPORTED_LOCALES)[number]) => {
        await changeLocale(locale);
        // Tên quán, danh mục… được backend dịch theo Accept-Language — tải lại cho đúng ngôn ngữ.
        void queryClient.invalidateQueries();
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
            <Stack.Screen options={{ title: t('profile.settings') }} />
            <InsetGroup header={t('profile.language')}>
                {SUPPORTED_LOCALES.map((locale) => (
                    <InsetRow
                        key={locale}
                        icon="language"
                        iconColor={locale === 'vi' ? '#E2725B' : '#5B8DEF'}
                        label={t(`profile.locale_name.${locale}`)}
                        checked={current === locale}
                        onPress={() => void onChangeLocale(locale)}
                    />
                ))}
            </InsetGroup>

            <InsetGroup header={t('profile.about')}>
                <InsetRow
                    icon="information-circle"
                    iconColor="#8E8E93"
                    label={t('profile.version')}
                    value={Constants.expoConfig?.version ?? '–'}
                />
            </InsetGroup>

            <InsetGroup>
                <InsetRow
                    icon="log-out-outline"
                    iconColor={Palette.error}
                    label={t('profile.logout')}
                    destructive
                    onPress={confirmLogout}
                />
            </InsetGroup>
            {logout.isPending && <ActivityIndicator color={Palette.brand} />}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Palette.surface },
    content: { gap: Space.xxl, paddingVertical: Space.xl },
});
