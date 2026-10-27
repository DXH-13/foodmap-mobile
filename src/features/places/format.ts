import type { TFunction } from 'i18next';

import type { components } from '@/api/generated/schema';

type PlaceSummary = components['schemas']['PlaceSummary'];

/** "450m" / "1.2km" — chỉ có khi kết quả tìm theo vị trí. */
export function formatDistance(t: TFunction, meters: number | null | undefined): string | null {
    if (meters == null) return null;
    return meters < 1000
        ? t('place.nearby.distance', { meters: Math.round(meters) })
        : t('place.nearby.distance_km', { km: (meters / 1000).toFixed(1) });
}

/** Dòng phụ dưới tên quán: "Hàng ăn vỉa hè · 450m". */
export function placeSubtitle(t: TFunction, place: PlaceSummary): string {
    const parts = [t(`place.type.${place.placeType}`), formatDistance(t, place.distanceMeters)];
    return parts.filter(Boolean).join(' · ');
}
