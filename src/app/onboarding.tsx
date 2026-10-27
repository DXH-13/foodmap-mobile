import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Palette, Radius, Space, Type } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboarding';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Mỗi trang giới thiệu một tab — cùng icon với thanh tab để người dùng nhận ra ngay. */
const STEPS: { key: string; icon: IconName; gradient: string }[] = [
    { key: 'map', icon: 'map', gradient: 'linear-gradient(145deg, #FBC3A8 0%, #E2725B 100%)' },
    { key: 'explore', icon: 'compass', gradient: 'linear-gradient(145deg, #C4EFC9 0%, #4FA874 100%)' },
    { key: 'favorites', icon: 'heart', gradient: 'linear-gradient(145deg, #FFE0A3 0%, #F0954A 100%)' },
    { key: 'profile', icon: 'footsteps', gradient: 'linear-gradient(145deg, #EED9C4 0%, #A0715A 100%)' },
];

/** Guide tour lần đầu, sau khi đăng ký/đăng nhập. Xem xong (hoặc bỏ qua) thì không hiện lại. */
export default function OnboardingScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const markTourSeen = useOnboardingStore((s) => s.markTourSeen);
    const scrollRef = useRef<ScrollView>(null);
    const [index, setIndex] = useState(0);

    const isLast = index === STEPS.length - 1;

    const finish = () => {
        markTourSeen();
        router.replace('/');
    };

    const next = () => {
        if (isLast) {
            finish();
            return;
        }
        scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
    };

    return (
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + Space.lg }]}>
            <View style={styles.topBar}>
                {!isLast && (
                    <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
                        <Text style={styles.skip}>{t('onboarding.skip')}</Text>
                    </Pressable>
                )}
            </View>

            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                style={styles.pager}>
                {STEPS.map((step) => (
                    <View key={step.key} style={[styles.page, { width }]}>
                        <View style={[styles.art, { experimental_backgroundImage: step.gradient }]}>
                            <Ionicons name={step.icon} size={84} color="rgba(255,255,255,0.95)" />
                        </View>
                        <Text style={styles.title}>{t(`onboarding.${step.key}.title`)}</Text>
                        <Text style={styles.body}>{t(`onboarding.${step.key}.body`)}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.dots} accessibilityLabel={t('onboarding.progress', { current: index + 1, total: STEPS.length })}>
                {STEPS.map((step, i) => (
                    <View key={step.key} style={[styles.dot, i === index && styles.dotActive]} />
                ))}
            </View>

            <Button
                title={isLast ? t('onboarding.start') : t('onboarding.next')}
                onPress={next}
                style={styles.button}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Palette.surface },
    topBar: { height: 44, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: Space.xl },
    skip: { ...Type.body, color: Palette.textSecondary, fontWeight: '500' },
    pager: { flex: 1 },
    page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space.xxxl, gap: Space.lg },
    art: {
        width: 200,
        height: 200,
        borderRadius: Radius.xl + 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Space.xl,
        boxShadow: '0 12px 32px rgba(159,64,45,0.20)',
    },
    title: { ...Type.title2, color: Palette.onSurface, textAlign: 'center' },
    body: { ...Type.body, color: Palette.textSecondary, textAlign: 'center' },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Space.xxl },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.separator },
    dotActive: { width: 22, backgroundColor: Palette.brand },
    button: { marginHorizontal: Space.xxl },
});
