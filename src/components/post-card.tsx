import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated/schema';
import { Avatar } from '@/components/avatar';
import { PlaceArt } from '@/components/place-art';
import { Stars } from '@/components/rating-label';
import { CardShadow, Palette, Radius, Space, Type } from '@/constants/theme';

type Review = components['schemas']['Review'];

/** Tỉ lệ cao/rộng khi chưa có ảnh: xen kẽ theo id để lưới masonry so le như Lemon8. */
const FALLBACK_RATIOS = [1, 0.8, 1.15, 0.9];

function imageRatio(review: Review): number {
    const m = review.media[0];
    if (m?.width && m.height) return Math.min(Math.max(m.height / m.width, 0.75), 1.5);
    const code = review.id.charCodeAt(review.id.length - 1) || 0;
    return FALLBACK_RATIOS[code % FALLBACK_RATIOS.length];
}

type Props = {
    review: Review;
    /** Bài của chính mình: hiện nhãn PENDING/REJECTED (tác giả luôn thấy bài mình kèm trạng thái). */
    showStatus?: boolean;
};

/** Thẻ bài viết cho lưới 2 cột: ảnh, trích đoạn, sao, tên quán, tác giả. */
export function PostCard({ review, showStatus }: Props) {
    const { t } = useTranslation();
    const media = review.media[0];
    const imageUrl = media ? (media.thumbnailUrl ?? media.url) : review.place?.coverImageUrl;
    const placeType = review.place?.placeType ?? 'RESTAURANT';
    const status = showStatus && review.status !== 'APPROVED' ? review.status : null;

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => router.push(`/place/${review.placeId}`)}
            accessibilityRole="button">
            <View>
                <PlaceArt
                    placeType={placeType}
                    imageUrl={imageUrl}
                    iconSize={40}
                    style={{ aspectRatio: 1 / imageRatio(review) }}
                />
                {status && (
                    <View style={[styles.badge, status === 'REJECTED' ? styles.badgeRejected : styles.badgePending]}>
                        <Text style={[styles.badgeLabel, status === 'REJECTED' && styles.badgeLabelOnError]}>
                            {t(`review.status.${status}`)}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.body}>
                {review.content ? (
                    <Text style={styles.content} numberOfLines={3}>
                        {review.content}
                    </Text>
                ) : null}
                <Stars rating={review.rating} />
                {review.place && (
                    <Text style={styles.place} numberOfLines={1}>
                        {review.place.name}
                    </Text>
                )}
                <View style={styles.author}>
                    <Avatar name={review.author.displayName} url={review.author.avatarUrl} size={20} />
                    <Text style={styles.authorName} numberOfLines={1}>
                        {review.author.displayName}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.lg,
        backgroundColor: Palette.card,
        overflow: 'hidden',
        boxShadow: CardShadow,
    },
    pressed: { opacity: 0.85 },
    body: { padding: Space.sm + 2, gap: 6 },
    content: { ...Type.subheadline, color: Palette.onSurface },
    place: { ...Type.footnote, fontWeight: '600', color: Palette.primary },
    author: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    authorName: { ...Type.caption, color: Palette.textSecondary, flex: 1 },
    badge: {
        position: 'absolute',
        top: Space.sm,
        left: Space.sm,
        paddingHorizontal: Space.sm,
        paddingVertical: 3,
        borderRadius: Radius.pill,
    },
    badgePending: { backgroundColor: 'rgba(255,255,255,0.92)' },
    badgeRejected: { backgroundColor: Palette.error },
    badgeLabel: { ...Type.caption, fontWeight: '700', color: Palette.onSurface },
    badgeLabelOnError: { color: Palette.white },
});
