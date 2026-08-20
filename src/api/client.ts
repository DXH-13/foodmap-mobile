import createClient, { type Middleware } from 'openapi-fetch';

import { useAuthStore } from '@/store/auth';
import { getCurrentLocale } from '@/i18n';

import type { paths } from './generated/schema';

/**
 * Client HTTP duy nhất của app, sinh kiểu từ `docs/SDD/api/openapi.yaml`.
 *
 * Đừng gọi `fetch` trần ở nơi khác — mọi endpoint đều có kiểu sẵn ở đây, và mọi
 * thay đổi hợp đồng sẽ báo lỗi biên dịch đúng chỗ bị ảnh hưởng.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
    // Lỗi phổ biến nhất khi chạy trên thiết bị thật: để nguyên `localhost`, hoặc quên
    // đặt biến. Thiết bị thật và máy ảo Android không hiểu localhost của máy bạn.
    console.warn(
        '[foodmap] Chưa đặt EXPO_PUBLIC_API_BASE_URL. ' +
            'Dùng IP LAN của máy chạy backend, ví dụ http://192.168.1.10:8080',
    );
}

/** Gắn token và ngôn ngữ vào mọi request. */
const authMiddleware: Middleware = {
    async onRequest({ request }) {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
        }
        // Backend dịch `ApiError.message` theo header này; `code` thì không đổi.
        request.headers.set('Accept-Language', getCurrentLocale());
        return request;
    },

    async onResponse({ response }) {
        // 401 nghĩa là access token hết hạn hoặc bị thu hồi. Xoá phiên để lớp điều hướng
        // đưa người dùng về màn hình đăng nhập. Không tự làm mới ở đây để tránh vòng lặp
        // khi chính endpoint refresh cũng trả 401.
        if (response.status === 401) {
            useAuthStore.getState().clearSession();
        }
        return response;
    },
};

export const api = createClient<paths>({
    baseUrl: API_BASE_URL ?? 'http://localhost:8080',
});

api.use(authMiddleware);

/**
 * Rút thông báo lỗi đã dịch từ phản hồi lỗi của API.
 *
 * So sánh bằng `code` khi cần phân nhánh theo loại lỗi — `message` là chuỗi
 * cho người đọc và thay đổi theo ngôn ngữ.
 */
export function errorMessageOf(error: unknown, fallback: string): string {
    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    ) {
        return (error as { message: string }).message;
    }
    return fallback;
}

export function errorCodeOf(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code: unknown }).code;
        return typeof code === 'string' ? code : undefined;
    }
    return undefined;
}
