import type { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from './glass-surface';

/**
 * Lấy kiểu từ chính `Tabs` của expo-router, không import `BottomTabBarProps` từ
 * `@react-navigation/bottom-tabs`: expo-router mang bản bottom-tabs riêng, hai bản lệch
 * kiểu nhau (ColorValue vs string).
 */
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_HEIGHT = 64;
const BAR_RADIUS = BAR_HEIGHT / 2;
const BAR_PADDING = 6;
/** Khoảng hở giữa viên chọn và mép ô tab. */
const PILL_INSET = 5;
const SIDE_GAP = 16;
/** Khoảng hở tối thiểu giữa thanh và mép dưới màn hình (máy không có home indicator). */
const MIN_BOTTOM_GAP = 12;

/** Lò xo hơi "mềm" như tab bar iOS 26 — nảy nhẹ khi dừng, không lắc lư. */
const SLIDE_SPRING = { damping: 18, stiffness: 220, mass: 0.9 };
/** Viên chọn giãn ngang tối đa bao nhiêu khi đang trượt — chất "giọt nước". */
const MAX_STRETCH = 0.35;

export const TAB_ACTIVE_COLOR = '#E2725B';
const TAB_INACTIVE_COLOR = '#1C1C1E';

/**
 * Khoảng cách từ mép dưới màn hình tới mép trên thanh tab, cộng một khoảng thở.
 * Màn nào có nội dung sát đáy (sheet, nút, danh sách) thì đẩy lên bằng giá trị này —
 * thanh tab nổi nên KHÔNG chiếm chỗ trong layout.
 */
export function useTabBarInset(): number {
    const insets = useSafeAreaInsets();
    return Math.max(insets.bottom, MIN_BOTTOM_GAP) + BAR_HEIGHT + 8;
}

/**
 * Thanh tab nổi kiểu iOS 26 Liquid Glass: capsule kính tách khỏi mép, nhìn xuyên thấy
 * nội dung phía sau. Thay cho tab bar mặc định đục (docs/SDD/giao-dien/stitch-screens.md).
 *
 * Chuyển tab: MỘT viên chọn duy nhất trượt bằng lò xo sang tab mới và giãn ngang khi
 * đang di chuyển. Animation chạy trên UI thread (Reanimated), tự tắt khi người dùng bật
 * "Giảm chuyển động" trong cài đặt hệ thống (mặc định ReduceMotion.System).
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const [itemWidth, setItemWidth] = useState(0);

    // `position` chạy theo lò xo; `target` là đích — khoảng cách giữa hai giá trị
    // quyết định viên chọn giãn bao nhiêu.
    const position = useSharedValue(state.index);
    const target = useSharedValue(state.index);

    useEffect(() => {
        target.set(state.index);
        position.set(withSpring(state.index, SLIDE_SPRING));
    }, [state.index, position, target]);

    const onLayout = (event: LayoutChangeEvent) => {
        const inner = event.nativeEvent.layout.width - BAR_PADDING * 2;
        setItemWidth(inner / state.routes.length);
    };

    const pillWidth = itemWidth - PILL_INSET * 2;

    const pillStyle = useAnimatedStyle(() => {
        const distance = Math.min(Math.abs(target.value - position.value), 1);
        return {
            transform: [
                { translateX: BAR_PADDING + PILL_INSET + position.value * itemWidth },
                { scaleX: 1 + distance * MAX_STRETCH },
                { scaleY: 1 - distance * 0.08 },
            ],
        };
    });

    return (
        <View
            style={[styles.bar, { bottom: Math.max(insets.bottom, MIN_BOTTOM_GAP) }]}
            onLayout={onLayout}
            accessibilityRole="tablist">
            <GlassSurface radius={BAR_RADIUS} variant="clear" />

            {/* Một viên duy nhất, luôn được render — cũng tránh lỗi Android mất bo góc
                khi thêm màu nền vào view đã có sẵn. */}
            {itemWidth > 0 && <Animated.View style={[styles.pill, { width: pillWidth }, pillStyle]} />}

            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const focused = state.index === index;
                const color = focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR;
                const label = options.title ?? route.name;

                // Đúng giao thức tab bar tuỳ biến của React Navigation: phát sự kiện
                // trước, để màn hình chặn được (ví dụ cuộn lên đầu khi bấm lại tab).
                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                return (
                    <TabItem
                        key={route.key}
                        focused={focused}
                        label={label}
                        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                        onPress={onPress}
                        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                        icon={options.tabBarIcon?.({ focused, color, size: 22 })}
                        color={color}
                    />
                );
            })}
        </View>
    );
}

type TabItemProps = {
    focused: boolean;
    label: string;
    accessibilityLabel: string;
    icon: ReactNode;
    color: string;
    onPress: () => void;
    onLongPress: () => void;
};

/** Một ô tab: icon co lại khi nhấn giữ, nảy lên khi vừa được chọn. */
function TabItem({ focused, label, accessibilityLabel, icon, color, onPress, onLongPress }: TabItemProps) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (focused) {
            scale.set(withSequence(withSpring(1.18, { stiffness: 600, damping: 14 }), withSpring(1)));
        }
    }, [focused, scale]);

    const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={() => {
                scale.set(withSpring(0.86, { stiffness: 500, damping: 20 }));
            }}
            onPressOut={() => {
                scale.set(withSpring(1));
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={accessibilityLabel}
            style={styles.item}>
            <Animated.View style={iconStyle}>{icon}</Animated.View>
            <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        left: SIDE_GAP,
        right: SIDE_GAP,
        height: BAR_HEIGHT,
        borderRadius: BAR_RADIUS,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: BAR_PADDING,
        // boxShadow thay cho elevation: elevation trên Android cần nền đặc mới đổ bóng,
        // và bóng sẽ ám xám xuyên qua kính trong suốt. boxShadow chỉ vẽ phía ngoài khối.
        boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
    },
    pill: {
        position: 'absolute',
        left: 0,
        top: PILL_INSET,
        bottom: PILL_INSET,
        borderRadius: BAR_RADIUS - PILL_INSET,
        // Thấu kính trong, KHÔNG phủ màu thương hiệu — giống viên chọn của tab bar iOS 26.
        // Lõi hơi sáng + mép phản quang; màu thương hiệu chỉ nằm ở icon và nhãn.
        backgroundColor: 'rgba(255,255,255,0.22)',
        experimental_backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%)',
        boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,0.95)',
            'inset 0 0 0 1px rgba(255,255,255,0.45)',
            'inset 0 -6px 12px rgba(0,0,0,0.07)',
            '0 2px 8px rgba(0,0,0,0.08)',
        ].join(', '),
    },
    item: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 },
    // Quầng sáng quanh chữ: kính `clear` gần trong suốt, chữ nằm thẳng trên nền bản đồ
    // nhiều màu — thiếu quầng thì khó đọc.
    label: {
        fontSize: 11,
        fontWeight: '600',
        textShadowColor: 'rgba(255,255,255,0.9)',
        textShadowRadius: 6,
    },
});
