import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardShadow, Palette, Radius, Type } from '@/constants/theme';

type Props<T extends string> = {
    options: readonly { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
};

/** Segmented control kiểu iOS: rãnh xám, ô đang chọn là viên trắng nổi. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
    return (
        <View style={styles.track} accessibilityRole="tablist">
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        style={[styles.segment, selected && styles.selected]}>
                        <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        padding: 2,
        borderRadius: Radius.sm + 2,
        backgroundColor: Palette.fill,
    },
    segment: {
        flex: 1,
        minHeight: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.sm,
    },
    selected: { backgroundColor: Palette.card, boxShadow: CardShadow },
    label: { ...Type.footnote, fontWeight: '500', color: Palette.onSurface },
    labelSelected: { fontWeight: '600' },
});
