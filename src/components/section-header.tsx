import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Space, Type } from '@/constants/theme';

type Props = {
    title: string;
    action?: { label: string; onPress: () => void };
};

/** Tiêu đề mục (Title 3) kèm link "Xem tất cả" tuỳ chọn ở bên phải. */
export function SectionHeader({ title, action }: Props) {
    return (
        <View style={styles.row}>
            <Text style={styles.title} accessibilityRole="header">
                {title}
            </Text>
            {action ? (
                <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.action}>{action.label}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: Space.xl,
        marginBottom: Space.md,
    },
    title: { ...Type.title3, color: Palette.onSurface },
    action: { ...Type.subheadline, color: Palette.primary, fontWeight: '500' },
});
