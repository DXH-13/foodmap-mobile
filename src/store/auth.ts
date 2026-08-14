import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { components } from '@/api/generated/schema';

type UserProfile = components['schemas']['UserProfile'];

const ACCESS_TOKEN_KEY = 'foodmap.accessToken';
const REFRESH_TOKEN_KEY = 'foodmap.refreshToken';

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    user: UserProfile | null;
    /** false cho tới khi đọc xong token đã lưu — dùng để tránh nháy màn hình đăng nhập. */
    isRestored: boolean;

    restoreSession: () => Promise<void>;
    setSession: (accessToken: string, refreshToken: string, user: UserProfile) => Promise<void>;
    clearSession: () => void;
};

/**
 * Phiên đăng nhập.
 *
 * Token lưu bằng `expo-secure-store` (Keychain trên iOS, EncryptedSharedPreferences
 * trên Android) — **không** dùng `AsyncStorage`, vì AsyncStorage lưu dạng thường và
 * đọc được trên máy đã root/jailbreak.
 *
 * Đây là state của **client**. Dữ liệu từ server (danh sách quán, đánh giá…) thuộc về
 * TanStack Query — đừng sao chép sang đây.
 */
export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    isRestored: false,

    restoreSession: async () => {
        try {
            const [accessToken, refreshToken] = await Promise.all([
                SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
                SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
            ]);
            set({ accessToken, refreshToken, isRestored: true });
        } catch {
            // Đọc secure store lỗi thì coi như chưa đăng nhập — không chặn app khởi động.
            set({ isRestored: true });
        }
    },

    setSession: async (accessToken, refreshToken, user) => {
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
        ]);
        set({ accessToken, refreshToken, user });
    },

    clearSession: () => {
        // Xoá khoá chạy nền: đăng xuất trên giao diện phải phản hồi ngay.
        void SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        void SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        set({ accessToken: null, refreshToken: null, user: null });
    },
}));

/** Tiện ích đọc nhanh trạng thái đăng nhập trong component. */
export function useIsSignedIn(): boolean {
    return useAuthStore((state) => state.accessToken !== null);
}
