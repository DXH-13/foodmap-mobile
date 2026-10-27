import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Space, Type } from '@/constants/theme';

/** Tiêu đề lớn kiểu iOS (34pt bold) ở đầu màn hình tab. */
export function LargeTitle({ title, right }: { title: string; right?: ReactNode }) {
    return (
        <View style={styles.row}>
            <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
                {title}
            </Text>
            {right}
        </View>
    );
}

/**
 * Dải nền mờ dưới status bar cho màn cuộn: nội dung trôi lên không đè lên giờ/pin.
 * Đặt SAU danh sách để nằm trên cùng.
 */
export function StatusBarScrim() {
    const insets = useSafeAreaInsets();
    return <View pointerEvents="none" style={[styles.scrim, { height: insets.top }]} />;
}

const styles = StyleSheet.create({
    scrim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(249,249,249,0.94)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Space.xl,
        paddingTop: Space.sm,
        paddingBottom: Space.md,
    },
    title: { ...Type.largeTitle, color: Palette.onSurface, flexShrink: 1 },
});
