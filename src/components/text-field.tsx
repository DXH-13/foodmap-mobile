import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Palette, Radius, Space, Type } from '@/constants/theme';

/** Nhóm ô nhập trong một thẻ bo góc, ngăn bằng separator — kiểu form iOS. */
export function FieldGroup({ children }: { children: ReactNode }) {
    const fields = Children.toArray(children);
    return (
        <View style={styles.group}>
            {fields.map((field, i) => (
                <View key={i}>
                    {field}
                    {i < fields.length - 1 && <View style={styles.separator} />}
                </View>
            ))}
        </View>
    );
}

/**
 * Ô nhập trong `FieldGroup`. `invalid` tô đỏ chữ — thông báo lỗi đặt dưới nhóm.
 * `secureTextEntry` kèm nút mắt để xem lại mật khẩu đang gõ.
 */
export function Field({ invalid, style, secureTextEntry, ...props }: TextInputProps & { invalid?: boolean }) {
    const { t } = useTranslation();
    const [revealed, setRevealed] = useState(false);
    const input = (
        <TextInput
            placeholderTextColor={Palette.textSecondary}
            style={[styles.input, secureTextEntry && styles.flex, invalid && styles.invalid, style]}
            secureTextEntry={secureTextEntry && !revealed}
            {...props}
        />
    );
    if (!secureTextEntry) return input;

    return (
        <View style={styles.row}>
            {input}
            <Pressable
                onPress={() => setRevealed((v) => !v)}
                hitSlop={8}
                style={styles.eye}
                accessibilityRole="button"
                accessibilityLabel={t(revealed ? 'common.action.hide_password' : 'common.action.show_password')}
            >
                <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={Palette.textSecondary} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    group: { backgroundColor: Palette.card, borderRadius: Radius.md, overflow: 'hidden' },
    input: { ...Type.body, color: Palette.onSurface, paddingHorizontal: Space.lg, minHeight: 50 },
    invalid: { color: Palette.error },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.separator, marginLeft: Space.lg },
    row: { flexDirection: 'row', alignItems: 'center' },
    flex: { flex: 1 },
    eye: { paddingHorizontal: Space.lg, minHeight: 50, justifyContent: 'center' },
});
