import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Space, Type } from '@/constants/theme';

type Props = {
    title: string;
    subtitle: string;
    /** Thông báo lỗi dưới form (lỗi nhập hoặc lỗi server đã dịch). */
    error?: string | null;
    children: ReactNode;
    /** Nút chính + link chuyển màn, đặt dưới lỗi. */
    footer: ReactNode;
};

/** Khung chung của màn đăng nhập / đăng ký: nút quay lại, logo, tiêu đề, form, lỗi, nút. */
export function AuthScaffold({ title, subtitle, error, children, footer }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + Space.sm }]}
                keyboardShouldPersistTaps="handled">
                <View style={styles.topBar}>
                    {router.canGoBack() && (
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={8}
                            style={styles.back}
                            accessibilityRole="button"
                            accessibilityLabel={t('common.action.back')}>
                            <Ionicons name="chevron-back" size={22} color={Palette.onSurface} />
                        </Pressable>
                    )}
                </View>

                <View style={styles.brand}>
                    <Ionicons name="restaurant" size={30} color={Palette.brand} />
                </View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                {children}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.footer}>{footer}</View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

/** Link chữ phụ dưới nút chính: "Chưa có tài khoản? Đăng ký". */
export function AuthLink({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link" style={styles.link}>
            <Text style={styles.linkLabel}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Palette.surface },
    content: { paddingHorizontal: Space.xxl, paddingBottom: Space.xxxl, gap: Space.md },
    topBar: { height: 36, flexDirection: 'row' },
    back: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Palette.fill,
    },
    brand: {
        alignSelf: 'center',
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(226,114,91,0.12)',
        marginTop: Space.lg,
    },
    title: { ...Type.largeTitle, color: Palette.onSurface, textAlign: 'center' },
    subtitle: { ...Type.subheadline, color: Palette.textSecondary, textAlign: 'center', marginBottom: Space.lg },
    error: { ...Type.footnote, color: Palette.error, paddingHorizontal: Space.xs },
    footer: { marginTop: Space.sm, gap: Space.lg },
    link: { alignSelf: 'center', paddingVertical: Space.xs },
    linkLabel: { ...Type.subheadline, color: Palette.primary, fontWeight: '500' },
});
