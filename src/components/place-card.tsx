import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated/schema';
import { PlaceArt } from '@/components/place-art';
import { RatingLabel } from '@/components/rating-label';
import { CardShadow, Palette, Radius, Space, Type } from '@/constants/theme';
import { placeSubtitle } from '@/features/places/format';

type PlaceSummary = components['schemas']['PlaceSummary'];

export const PLACE_CARD_WIDTH = 220;

/** Thẻ địa điểm dọc kiểu Airbnb — dùng trong hàng cuộn ngang. */
export function PlaceCard({ place }: { place: PlaceSummary }) {
    const { t } = useTranslation();
    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => router.push(`/place/${place.id}`)}
            accessibilityRole="button"
            accessibilityLabel={place.name}>
            <PlaceArt
                placeType={place.placeType}
                imageUrl={place.coverImageUrl}
                radius={Radius.lg}
                iconSize={36}
                style={styles.art}
            />
            <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>
                    {place.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                    {placeSubtitle(t, place)}
                </Text>
                <RatingLabel rating={place.averageRating} count={place.reviewCount || undefined} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        width: PLACE_CARD_WIDTH,
        borderRadius: Radius.lg + 4,
        backgroundColor: Palette.card,
        padding: 4,
        boxShadow: CardShadow,
    },
    pressed: { opacity: 0.85 },
    art: { height: 132 },
    body: { paddingHorizontal: Space.sm, paddingTop: Space.sm, paddingBottom: Space.sm, gap: 2 },
    name: { ...Type.headline, color: Palette.onSurface },
    sub: { ...Type.footnote, color: Palette.textSecondary },
});
