import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Space, Type } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Nhóm "inset grouped" của Cài đặt iOS: tiêu đề nhỏ phía trên, các dòng trong thẻ trắng bo góc. */
export function InsetGroup({ header, children }: { header?: string; children: ReactNode }) {
    const rows = Children.toArray(children);
    return (
        <View style={styles.group}>
            {header ? <Text style={styles.header}>{header}</Text> : null}
            <View style={styles.card}>
                {rows.map((row, i) => (
                    <View key={i}>
                        {row}
                        {i < rows.length - 1 && <View style={styles.separator} />}
                    </View>
                ))}
            </View>
        </View>
    );
}

type RowProps = {
    icon: IconName;
    /** Màu nền ô icon — như icon Cài đặt iOS. */
    iconColor: string;
    label: string;
    value?: string;
    onPress?: () => void;
    destructive?: boolean;
    /** Dấu tick bên phải (dòng chọn một trong nhiều). */
    checked?: boolean;
};

export function InsetRow({ icon, iconColor, label, value, onPress, destructive, checked }: RowProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityState={checked != null ? { checked } : undefined}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: iconColor }]}>
                <Ionicons name={icon} size={17} color={Palette.white} />
            </View>
            <Text style={[styles.label, destructive && styles.destructive]} numberOfLines={1}>
                {label}
            </Text>
            {value ? <Text style={styles.value}>{value}</Text> : null}
            {checked && <Ionicons name="checkmark" size={20} color={Palette.brand} />}
        </Pressable>
    );
}

/** Thụt lề separator = ngang chữ, không ngang icon (giống iOS). */
const ICON_SIZE = 30;

const styles = StyleSheet.create({
    group: { paddingHorizontal: Space.lg, gap: 6 },
    header: {
        ...Type.footnote,
        color: Palette.textSecondary,
        textTransform: 'uppercase',
        paddingHorizontal: Space.lg,
    },
    card: { backgroundColor: Palette.card, borderRadius: Radius.md, overflow: 'hidden' },
    row: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.md,
        paddingHorizontal: Space.lg,
    },
    pressed: { backgroundColor: Palette.fill },
    icon: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    label: { ...Type.body, color: Palette.onSurface, flex: 1 },
    destructive: { color: Palette.error },
    value: { ...Type.body, color: Palette.textSecondary },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Palette.separator,
        marginLeft: Space.lg + ICON_SIZE + Space.md,
    },
});
