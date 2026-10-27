import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Tính một lần: khả năng của hệ điều hành không đổi trong lúc app chạy. */
const LIQUID_GLASS = isLiquidGlassAvailable();

/**
 * Cùng tên với `glassEffectStyle` của Apple:
 * - `clear`: gần như trong suốt — thanh tab, nút nổi. Ít chữ, nhìn xuyên là chính.
 * - `regular`: đục hơn — thẻ chứa nhiều chữ, cần đọc được trên mọi nền.
 */
export type GlassVariant = 'clear' | 'regular';

type Props = {
    /** Bo góc của khối kính — phải khớp bo góc của phần tử cha. */
    radius: number;
    variant?: GlassVariant;
    style?: StyleProp<ViewStyle>;
};

/**
 * Nền kính, đặt làm lớp dưới cùng (absoluteFill) của một khối nổi.
 *
 * - iOS 26+: Liquid Glass thật của hệ điều hành (`GlassView`), có cả khúc xạ.
 * - Android và iOS cũ: giả lập bằng ba lớp — lõi gần trong suốt, dải phản quang
 *   (specular) sáng ở nửa trên, và viền sáng/tối bằng inset shadow để ra "khối" kính.
 *   KHÔNG giả lập được khúc xạ: cần shader đọc được pixel phía sau, mà nội dung phía sau
 *   (bản đồ) là view native khác.
 *
 * Token theo docs/SDD/giao-dien/stitch-screens.md, mục "Token Liquid Glass".
 */
export function GlassSurface({ radius, variant = 'regular', style }: Props) {
    const shape = [StyleSheet.absoluteFill, { borderRadius: radius }, style];

    if (LIQUID_GLASS) {
        return <GlassView glassEffectStyle={variant} style={shape} />;
    }

    return (
        <View style={[shape, variant === 'clear' ? styles.clearFill : styles.regularFill]}>
            <View style={[StyleSheet.absoluteFill, styles.specular, { borderRadius: radius }]} />
            <View style={[StyleSheet.absoluteFill, styles.rim, { borderRadius: radius }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    clearFill: { backgroundColor: 'rgba(255,255,255,0.12)' },
    // Không có blur trên Android nên phải đục hơn token iOS để chữ còn đọc được.
    regularFill: { backgroundColor: 'rgba(255,255,255,0.58)' },

    // Ánh sáng chiếu từ trên xuống: sáng ở mép trên, trong ở giữa, hắt nhẹ ở mép dưới.
    specular: {
        experimental_backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 35%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.16) 100%)',
    },

    // Mép kính: chỉ sáng ở trên, viền mảnh quanh khối, và tối nhẹ ở đáy cho có độ dày.
    rim: {
        boxShadow: [
            'inset 0 1.5px 0 rgba(255,255,255,0.95)',
            'inset 0 0 0 1px rgba(255,255,255,0.35)',
            'inset 0 -1px 0 rgba(255,255,255,0.5)',
            'inset 0 -10px 18px rgba(0,0,0,0.06)',
        ].join(', '),
    },
});
