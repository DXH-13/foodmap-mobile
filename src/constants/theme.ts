/**
 * Hệ thống thiết kế FoodMap — iOS 26 Liquid Glass.
 * Nguồn token: docs/SDD/giao-dien/stitch-screens.md (mục "Theme").
 *
 * Màu thương hiệu (terracotta) chỉ dùng làm ĐIỂM NHẤN: icon đang chọn, chữ link, nút chính,
 * chip đang chọn. Không phủ mảng nền lớn.
 *
 * Chưa có biến thể tối (stitch-screens.md: "Chưa có biến thể dark") — app hiện chỉ có giao
 * diện sáng; `Colors.dark` tạm trỏ về bảng sáng để component cũ không vỡ.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Palette = {
    /** Terracotta — brand / primary_container */
    brand: '#E2725B',
    /** Đậm hơn brand, dùng cho chữ trên nền sáng để đủ tương phản */
    primary: '#9f402d',
    secondary: '#006e28',
    secondaryContainer: '#6ffb85',

    surface: '#f9f9f9',
    /** Nền thẻ/nhóm trên `surface` — trắng, giống inset grouped của iOS */
    card: '#ffffff',
    /** Nền ô nhập, chip chưa chọn */
    fill: 'rgba(118,118,128,0.12)',
    onSurface: '#1a1c1c',
    onSurfaceVariant: '#56423e',
    /** Chữ phụ (subheadline, caption) */
    textSecondary: 'rgba(60,60,67,0.6)',
    outline: '#89726d',
    separator: 'rgba(60,60,67,0.18)',
    error: '#ba1a1a',
    /** Ngôi sao đánh giá */
    star: '#F5A524',
    white: '#ffffff',
} as const;

/** Khoảng cách theo lưới 4pt. */
export const Space = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
} as const;

/** Bo góc. Phần tử lồng nhau dùng bo góc đồng tâm: trong = ngoài − khoảng đệm. */
export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
} as const;

/** Thang chữ theo iOS Dynamic Type (cỡ mặc định "Large"). */
export const Type = {
    largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
    title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
    title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
    headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
    body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
    subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
    footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

/** Bóng nhẹ cho thẻ nổi trên nền sáng. */
export const CardShadow = '0 2px 10px rgba(0,0,0,0.06)';

// --- Tương thích component template (themed-text, themed-view) ---

const light = {
    text: Palette.onSurface,
    background: Palette.surface,
    backgroundElement: Palette.card,
    backgroundSelected: Palette.fill,
    textSecondary: Palette.textSecondary,
} as const;

export const Colors = { light, dark: light } as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
    ios: {
        sans: 'system-ui',
        serif: 'ui-serif',
        rounded: 'ui-rounded',
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: 'var(--font-display)',
        serif: 'var(--font-serif)',
        rounded: 'var(--font-rounded)',
        mono: 'var(--font-mono)',
    },
});
