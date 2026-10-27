import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Palette, Type } from '@/constants/theme';

type Props = {
    /** `null`/`undefined` = chưa có đánh giá nào — KHÔNG phải 0 sao. */
    rating: number | null | undefined;
    count?: number;
};

/** "★ 4.2 (12)" hoặc "Chưa có đánh giá". */
export function RatingLabel({ rating, count }: Props) {
    const { t, i18n } = useTranslation();

    if (rating == null) {
        return <Text style={styles.muted}>{t('place.detail.no_rating')}</Text>;
    }

    const value = new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(rating);

    return (
        <View style={styles.row}>
            <Ionicons name="star" size={12} color={Palette.star} />
            <Text style={styles.value}>
                {value}
                {count != null && <Text style={styles.muted}> ({count})</Text>}
            </Text>
        </View>
    );
}

/** Sao nguyên 1–5 của một bài review. */
export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
    const { t } = useTranslation();
    return (
        <View style={styles.row} accessibilityLabel={t('review.rating_label', { count: rating })}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons key={i} name="star" size={size} color={i <= rating ? Palette.star : Palette.fill} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    value: { ...Type.footnote, fontWeight: '600', color: Palette.onSurface },
    muted: { ...Type.footnote, color: Palette.textSecondary },
});
