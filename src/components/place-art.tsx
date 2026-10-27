import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { components } from '@/api/generated/schema';

type PlaceType = components['schemas']['PlaceType'];
type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Glyph theo loại địa điểm — cùng bộ với marker trên bản đồ (stitch-screens.md):
 * quán ăn = dao nĩa, hàng rong = xe đẩy, chợ = giỏ, cà phê = tách.
 */
export const PLACE_ICON: Record<PlaceType, IconName> = {
    RESTAURANT: 'restaurant',
    STREET_FOOD: 'cart',
    FOOD_MARKET: 'basket',
    CAFE: 'cafe',
};

/** Gradient ấm, mỗi loại một tông — để lưới bài viết không đơn điệu khi chưa có ảnh. */
const GRADIENT: Record<PlaceType, string> = {
    RESTAURANT: 'linear-gradient(145deg, #FBC3A8 0%, #E2725B 100%)',
    STREET_FOOD: 'linear-gradient(145deg, #FFE0A3 0%, #F0954A 100%)',
    FOOD_MARKET: 'linear-gradient(145deg, #C4EFC9 0%, #4FA874 100%)',
    CAFE: 'linear-gradient(145deg, #EED9C4 0%, #A0715A 100%)',
};

type Props = {
    placeType: PlaceType;
    imageUrl?: string | null;
    radius?: number;
    iconSize?: number;
    style?: StyleProp<ViewStyle>;
};

/**
 * Ảnh đại diện của một địa điểm/bài viết. Chưa có ảnh (hiện là mọi trường hợp) thì
 * vẽ gradient theo loại quán + icon — không để ô xám trống.
 */
export function PlaceArt({ placeType, imageUrl, radius = 0, iconSize = 32, style }: Props) {
    return (
        <View
            style={[
                styles.base,
                { borderRadius: radius, experimental_backgroundImage: GRADIENT[placeType] },
                style,
            ]}>
            <Ionicons name={PLACE_ICON[placeType]} size={iconSize} color="rgba(255,255,255,0.92)" />
            {imageUrl ? (
                <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    base: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
