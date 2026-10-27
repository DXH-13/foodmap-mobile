# Thư mục sinh tự động — KHÔNG SỬA TAY

Toàn bộ nội dung ở đây được sinh từ `docs/SDD/api/openapi.yaml` bằng
`scripts/gen-api-client.sh`. Mọi thay đổi sửa tay sẽ mất khi chạy lại script.

Cần đổi kiểu dữ liệu của API? Sửa `docs/SDD/api/openapi.yaml`, rồi:

    ./scripts/gen-api-client.sh

Chi tiết quy trình: skill `api-contract` trong `.claude/skills/`.
