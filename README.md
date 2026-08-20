# FoodMap Mobile

Ứng dụng iOS + Android của [FoodMap](https://github.com/DXH-13/foodmap) — bản đồ quán ăn,
hàng ăn và chợ đồ ăn Việt Nam.

**React Native · Expo SDK 57 · TypeScript · expo-router**

Repo này là submodule `mobile/` của repo cha.

## Bắt đầu

```bash
npm install
cp .env.example .env      # rồi sửa EXPO_PUBLIC_API_BASE_URL
npx expo start
```

Quét mã QR bằng ứng dụng **Expo Go**, hoặc bấm `a` / `i` để mở máy ảo.

Backend phải đang chạy — xem repo cha:

```bash
cd ..
./scripts/dev-up.sh
cd backend && ./gradlew bootRun
```

### ⚠️ Base URL

`EXPO_PUBLIC_API_BASE_URL` phải là **IP LAN** của máy chạy backend:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8080
```

`localhost` **không** hoạt động trên thiết bị thật và máy ảo Android — chúng hiểu
`localhost` là chính chúng. Emulator Android có thể dùng `http://10.0.2.2:8080`.

Tìm IP: `ipconfig` (Windows) hoặc `ifconfig | grep inet` (macOS).

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm start` | Khởi động dev server |
| `npm run android` / `npm run ios` | Mở trên máy ảo |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | ESLint |

## Client API

`src/api/generated/` được **sinh tự động** từ `docs/SDD/api/openapi.yaml`.
**Đừng sửa tay** — chạy lại generator ở repo cha:

```bash
cd .. && ./scripts/gen-api-client.sh
```

## Giới hạn đã biết

- **Bản web không chạy màn hình Bản đồ.** `react-native-maps` không hỗ trợ web.
  Dùng `npm run web` để xem nhanh các màn hình khác, nhưng đích đến là iOS và Android.
- Cần khoá Google Maps thật (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`) thì bản đồ mới hiện tile.

## Build

```bash
npx eas build --profile production --platform all
```

Cập nhật OTA (`eas update`) **chỉ** dùng được cho thay đổi thuần JavaScript.
Thêm thư viện native hay đổi quyền thì bắt buộc build và submit lại.

## Tài liệu

Yêu cầu và luồng màn hình: `docs/SRS/srs.md`, `docs/SDD/giao-dien/screens.md`.
Quy ước code: [`AGENTS.md`](./AGENTS.md) và skill `expo-mobile` ở repo cha.
