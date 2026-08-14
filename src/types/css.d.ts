// Khai báo kiểu cho import CSS.
//
// Template Expo dùng CSS module ở bản web (`animated-icon.module.css`) và import
// side-effect `@/global.css`, nhưng không kèm khai báo kiểu — nên `tsc --noEmit`
// báo TS2307/TS2882 ngay từ lần chạy đầu. File này bịt lỗ đó.

declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}

declare module '*.css';
