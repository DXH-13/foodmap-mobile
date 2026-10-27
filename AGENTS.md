# FoodMap Mobile — hướng dẫn cho AI

React Native · Expo SDK 57 · TypeScript · expo-router

Quy ước đầy đủ nằm ở repo cha: skill `expo-mobile`, `foodmap-domain`, `i18n-workflow`,
`api-contract`. File này chỉ ghi những gì **riêng của repo này**.

---

## Chạy

```bash
npm install
npx expo run:android    # development build — KHÔNG dùng Expo Go được (MapLibre là native module)
npm run typecheck
npm run lint
```

**`EXPO_PUBLIC_API_BASE_URL` phải là IP LAN của máy chạy backend**, không phải
`localhost` — thiết bị thật và máy ảo Android không hiểu localhost của máy bạn.
Xem `.env.example`.

**Bản web không chạy được màn hình Bản đồ** — MapLibre không hỗ trợ web.
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
sửa `docs/03-api/openapi.yaml` ở submodule `docs`, rồi sinh lại.

Cũng đừng tự khai lại interface DTO — type đã có sẵn trong `schema.ts`:

```ts
import type { components } from '@/api/generated/schema';
type PlaceSummary = components['schemas']['PlaceSummary'];
```

### 2. Base URL không được là `localhost`

Lỗi phổ biến nhất khi chạy trên thiết bị thật. Dùng IP LAN
(`ipconfig` / `ifconfig | grep inet`), hoặc `10.0.2.2` cho emulator Android.

### 3. Bản đồ: danh sách quán bám theo VỊ TRÍ, không theo vùng đang xem

`/places/nearby` gọi theo GPS (hoặc TP.HCM khi chưa có vị trí), bán kính cố định 2 km
(MAP-03). Kéo bản đồ **không** tải lại danh sách — đây là quyết định sản phẩm, đừng thêm
lại `onRegionDidChange` để gọi API. Bán kính backend chấp nhận 100–50.000m; vượt thì trả
400 `RADIUS_OUT_OF_RANGE`, **không** tự cắt bớt.

Thanh tab là capsule kính **nổi** (`src/components/glass-tab-bar.tsx`), không chiếm chỗ
trong layout. Nội dung sát đáy màn hình phải đẩy lên bằng `useTabBarInset()`. Nền kính dùng
`GlassSurface`: Liquid Glass thật trên iOS 26+, kính mờ giả lập trên Android.

Bản đồ là MapLibre + OpenFreeMap (ADR-0005), không cần khoá. Giữ `androidView="texture"`:
SurfaceView mặc định "đục lỗ" cửa sổ, để lại dải đen dưới thanh tab ở các tab khác. Toạ độ trong MapLibre là
`[kinh độ, vĩ độ]` — ngược thứ tự với `{ latitude, longitude }` của API. Không tắt
`attribution` — giấy phép OpenStreetMap bắt buộc ghi công.

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
