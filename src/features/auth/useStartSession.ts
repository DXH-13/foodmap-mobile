import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import { useAuthStore } from '@/store/auth';

type AuthTokens = components['schemas']['AuthTokens'];

/**
 * Sau khi đăng nhập / đăng ký thành công: lưu token, đặt sẵn hồ sơ vào cache, rồi vào app.
 * `(tabs)/_layout` tự chuyển sang guide tour nếu máy này chưa xem.
 */
export function useStartSession() {
    const queryClient = useQueryClient();
    const setSession = useAuthStore((s) => s.setSession);

    return async (tokens: AuthTokens) => {
        await setSession(tokens.accessToken, tokens.refreshToken, tokens.user);
        queryClient.setQueryData(qk.me.profile, tokens.user);
        // Bỏ các màn chào/đăng nhập khỏi stack — bấm Back ở app không quay lại form.
        if (router.canDismiss()) router.dismissAll();
        router.replace('/');
    };
}
