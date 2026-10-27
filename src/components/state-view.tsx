import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Palette, Space, Type } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
    icon?: IconName;
    title: string;
    message?: string;
    action?: { label: string; onPress: () => void };
};

/** Trạng thái rỗng / lời mời: icon lớn, tiêu đề, mô tả, một nút. */
export function EmptyState({ icon = 'sparkles-outline', title, message, action }: Props) {
    return (
        <View style={styles.box}>
            <View style={styles.iconWrap}>
                <Ionicons name={icon} size={30} color={Palette.brand} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {action ? <Button title={action.label} onPress={action.onPress} style={styles.action} /> : null}
        </View>
    );
}

/** Lỗi tải dữ liệu — luôn kèm nút thử lại. */
export function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
    const { t } = useTranslation();
    return (
        <EmptyState
            icon="cloud-offline-outline"
            title={t('common.state.error')}
            message={message ?? t('common.state.error_hint')}
            action={{ label: t('common.action.retry'), onPress: onRetry }}
        />
    );
}

export function LoadingState() {
    return (
        <View style={styles.box}>
            <ActivityIndicator color={Palette.brand} />
        </View>
    );
}

const styles = StyleSheet.create({
    box: { alignItems: 'center', justifyContent: 'center', padding: Space.xxl, gap: Space.sm },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(226,114,91,0.12)',
        marginBottom: Space.xs,
    },
    title: { ...Type.headline, color: Palette.onSurface, textAlign: 'center' },
    message: { ...Type.subheadline, color: Palette.textSecondary, textAlign: 'center', maxWidth: 300 },
    action: { marginTop: Space.md },
});
