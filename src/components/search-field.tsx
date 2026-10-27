import Ionicons from '@expo/vector-icons/Ionicons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/glass-surface';
import { Palette, Space, Type } from '@/constants/theme';

const HEIGHT = 48;

/** Kính giả lập không có blur — thêm nền sáng để chữ không lẫn với tên đường của bản đồ. */
const NEEDS_SCRIM = !isLiquidGlassAvailable();

type Props = {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
    placeholder: string;
    style?: StyleProp<ViewStyle>;
};

/** Ô tìm kiếm capsule trên nền kính, nổi trên nội dung (kiểu Apple Maps). */
export function SearchField({ value, onChangeText, onClear, placeholder, style }: Props) {
    const { t } = useTranslation();
    return (
        <View style={[styles.capsule, style]}>
            <GlassSurface radius={HEIGHT / 2} />
            {NEEDS_SCRIM && <View style={styles.scrim} />}
            <Ionicons name="search" size={18} color={Palette.textSecondary} />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Palette.textSecondary}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityRole="search"
            />
            {value.length > 0 && (
                <Pressable
                    onPress={onClear}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.action.clear')}>
                    <Ionicons name="close-circle" size={20} color={Palette.textSecondary} />
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    capsule: {
        height: HEIGHT,
        borderRadius: HEIGHT / 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.sm,
        paddingHorizontal: Space.lg,
        boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
    },
    scrim: { ...StyleSheet.absoluteFill, borderRadius: HEIGHT / 2, backgroundColor: 'rgba(249,249,249,0.65)' },
    input: { flex: 1, ...Type.body, color: Palette.onSurface, paddingVertical: 0 },
});
