import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, Radius, Space, Type } from '@/constants/theme';

type Props = {
    label: string;
    selected?: boolean;
    onPress: () => void;
};

/** Capsule lọc. Chọn = nền terracotta chữ trắng (stitch-screens.md). */
export function Chip({ label, selected, onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: Space.lg,
        borderRadius: Radius.pill,
        backgroundColor: Palette.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Palette.separator,
    },
    selected: { backgroundColor: Palette.brand, borderColor: Palette.brand },
    pressed: { opacity: 0.7 },
    label: { ...Type.subheadline, fontWeight: '500', color: Palette.onSurface },
    labelSelected: { color: Palette.white, fontWeight: '600' },
});
