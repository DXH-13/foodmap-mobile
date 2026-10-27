import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const TOUR_SEEN_KEY = 'foodmap.tourSeen';

type OnboardingState = {
    /** Đã xem hướng dẫn lần đầu trên máy này chưa. */
    tourSeen: boolean;
    restore: () => Promise<void>;
    markTourSeen: () => void;
};

/**
 * Cờ "đã xem guide tour" — lưu theo thiết bị, không theo tài khoản: đăng xuất rồi đăng
 * nhập lại không phải xem lại tour. Dùng secure-store vì repo không dùng AsyncStorage.
 */
export const useOnboardingStore = create<OnboardingState>((set) => ({
    tourSeen: false,

    restore: async () => {
        try {
            set({ tourSeen: (await SecureStore.getItemAsync(TOUR_SEEN_KEY)) === '1' });
        } catch {
            // Đọc lỗi thì coi như chưa xem — tệ nhất là xem lại tour một lần.
        }
    },

    markTourSeen: () => {
        void SecureStore.setItemAsync(TOUR_SEEN_KEY, '1');
        set({ tourSeen: true });
    },
}));
