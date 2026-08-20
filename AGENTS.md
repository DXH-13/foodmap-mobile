# FoodMap Mobile — hướng dẫn cho AI

React Native · Expo SDK 57 · TypeScript · expo-router

Quy ước đầy đủ nằm ở repo cha: skill `expo-mobile`, `foodmap-domain`, `i18n-workflow`,
`api-contract`. File này chỉ ghi những gì **riêng của repo này**.

---

## Chạy

```bash
npm install
npx expo start          # quét mã QR bằng Expo Go
npm run typecheck
npm run lint
```

**`EXPO_PUBLIC_API_BASE_URL` phải là IP LAN của máy chạy backend**, không phải
`localhost` — thiết bị thật và máy ảo Android không hiểu localhost của máy bạn.
Xem `.env.example`.

**Bản web không chạy được màn hình Bản đồ** — `react-native-maps` không hỗ trợ web.
Các màn hình khác thì được.

---

## Cấu trúc

```
src/app/                 route (expo-router: file = route)
  _layout.tsx            provider gốc: QueryClient, i18n, khôi phục phiên
  (tabs)/                index (Bản đồ) · explore · favorites · profile
  (auth)/login.tsx
  place/[id].tsx
src/api/
  generated/             ⚠️ SINH TỰ ĐỘNG — KHÔNG SỬA TAY
  client.ts              openapi-fetch + middleware gắn token và Accept-Language
  queryKeys.ts           khai tập trung mọi query key
src/features/<tên>/      hook và component riêng của một feature
src/components/          component dùng chung
src/i18n/                i18next + locales/vi.json, en.json
src/store/               zustand (auth)
src/constants/  src/hooks/  src/types/
```

Route nằm ở **`src/app`**, không phải `app/` ở gốc (template Expo SDK 57 dùng layout này).

---

## Bốn thứ dễ sai nhất trong repo này

### 1. Đừng sửa `src/api/generated/`

Bị ghi đè mỗi lần chạy `../scripts/gen-api-client.sh`. Muốn đổi kiểu dữ liệu API thì
sửa `docs/SDD/api/openapi.yaml` ở submodule `docs`, rồi sinh lại.

Cũng đừng tự khai lại interface DTO — type đã có sẵn trong `schema.ts`:

```ts
import type { components } from '@/api/generated/schema';
type PlaceSummary = components['schemas']['PlaceSummary'];
```

### 2. Base URL không được là `localhost`

Lỗi phổ biến nhất khi chạy trên thiết bị thật. Dùng IP LAN
(`ipconfig` / `ifconfig | grep inet`), hoặc `10.0.2.2` cho emulator Android.

### 3. Bản đồ: chỉ gọi API khi bản đồ NGỪNG di chuyển

Dùng `onRegionChangeComplete`, không phải `onRegionChange`. Gọi theo từng frame kéo
bản đồ sẽ spam server. Bán kính suy từ `latitudeDelta`, kẹp trong 100–50.000m —
vượt giới hạn thì backend trả 400 `RADIUS_OUT_OF_RANGE`, **không** tự cắt bớt.

Dùng `provider={PROVIDER_GOOGLE}` trên **cả hai** nền tảng; mặc định của iOS là Apple Maps.

### 4. `averageRating` có thể là `null`

`null` nghĩa là **chưa có đánh giá nào**, không phải 0 sao. Hiển thị
`t('place.detail.no_rating')`, đừng render `★ 0`.

---

## Quy ước

- **Mọi lần gọi mạng đi qua TanStack Query.** Không `useEffect` + `fetch` thủ công.
  Query key khai ở `src/api/queryKeys.ts`, không rải rác.
- **Không hardcode chuỗi tiếng Việt trong JSX.** Dùng `t('namespace.subject.action')`.
  Thêm key phải có cả `vi.json` và `en.json`.
- **Token lưu bằng `expo-secure-store`**, không dùng `AsyncStorage`.
- **Xin quyền đúng lúc cần**, và luôn có đường thoát khi bị từ chối — không màn hình trắng.
- Mỗi màn hình phải có đủ trạng thái: đang tải, lỗi (có nút thử lại), rỗng (có gợi ý).
- Danh sách dài dùng `FlashList`, không `ScrollView` chứa `.map()`.
- Form: `react-hook-form` + `zod`. Validation client chỉ để UX — backend luôn kiểm tra lại.

---

## Trước khi báo hoàn thành

- [ ] `npm run typecheck` sạch
- [ ] `npm run lint` sạch
- [ ] `npx expo start` bundle được
- [ ] Chuỗi mới có cả `vi` và `en`
- [ ] Không sửa file trong `src/api/generated/`
