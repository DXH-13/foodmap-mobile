import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated/schema';
import { PlaceArt } from '@/components/place-art';
import { RatingLabel } from '@/components/rating-label';
import { Palette, Radius, Space, Type } from '@/constants/theme';
import { placeSubtitle } from '@/features/places/format';

type PlaceSummary = components['schemas']['PlaceSummary'];

/** Chiều cao cố định — cho FlashList và để tính chiều cao thẻ kết quả trên bản đồ. */
export const PLACE_ROW_HEIGHT = 76;

type Props = {
    place: PlaceSummary;
    onPress: () => void;
    selected?: boolean;
};

/** Dòng địa điểm kiểu list iOS: thumbnail bo góc, tên, phụ đề, sao, chevron. */
export function PlaceRow({ place, onPress, selected }: Props) {
    const { t } = useTranslation();
    const closed = place.status === 'PERMANENTLY_CLOSED' || place.status === 'TEMPORARILY_CLOSED';

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={place.name}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.row, (pressed || selected) && styles.highlight]}>
            <PlaceArt placeType={place.placeType} imageUrl={place.coverImageUrl} radius={Radius.md} iconSize={22} style={styles.thumb} />
            <View style={styles.main}>
                <Text style={styles.name} numberOfLines={1}>
                    {place.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                    {placeSubtitle(t, place)}
                </Text>
                <View style={styles.meta}>
                    <RatingLabel rating={place.averageRating} count={place.reviewCount || undefined} />
                    {closed && (
                        <Text style={styles.closed}>
                            {t(place.status === 'PERMANENTLY_CLOSED' ? 'place.detail.permanently_closed' : 'place.detail.temporarily_closed')}
                        </Text>
                    )}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Palette.separator} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        height: PLACE_ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.md,
        paddingHorizontal: Space.md,
        borderRadius: Radius.lg,
    },
    highlight: { backgroundColor: 'rgba(226,114,91,0.10)' },
    thumb: { width: 56, height: 56 },
    main: { flex: 1, gap: 1 },
    name: { ...Type.headline, color: Palette.onSurface },
    sub: { ...Type.footnote, color: Palette.textSecondary },
    meta: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
    closed: { ...Type.caption, color: Palette.error, fontWeight: '600' },
});
