import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, Radius, Type } from '@/constants/theme';

type Variant = 'filled' | 'tinted';

type Props = {
    title: string;
    onPress: () => void;
    /** `filled` = hành động chính (nền brand); `tinted` = phụ (nền nhạt, chữ brand). */
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

/** Nút capsule kiểu iOS, cao tối thiểu 44pt. */
export function Button({ title, onPress, variant = 'filled', loading, disabled, style }: Props) {
    const filled = variant === 'filled';
    return (
        <Pressable
            accessibilityRole="button"
            disabled={disabled || loading}
            onPress={onPress}
            style={({ pressed }) => [
                styles.base,
                filled ? styles.filled : styles.tinted,
                (pressed || disabled) && styles.dimmed,
                style,
            ]}>
            {loading ? (
                <ActivityIndicator color={filled ? Palette.white : Palette.primary} />
            ) : (
                <Text style={[styles.label, { color: filled ? Palette.white : Palette.primary }]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: 48,
        paddingHorizontal: 24,
        borderRadius: Radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filled: { backgroundColor: Palette.brand },
    tinted: { backgroundColor: 'rgba(226,114,91,0.12)' },
    dimmed: { opacity: 0.6 },
    label: Type.headline,
});
