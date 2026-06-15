# WenZi 文字

> Từ điển Hán Việt đơn giản và hiệu quả.

## Công nghệ

- [Astro](https://astro.build/) — framework web
- [Bun](https://bun.sh/) — runtime & package manager
- [TypeScript](https://www.typescriptlang.org/) — ngôn ngữ chính
- [SQLite](https://www.sqlite.org/) qua `bun:sqlite` — cơ sở dữ liệu

## Yêu cầu

- [Bun](https://bun.sh/) >= 1.0

## Cài đặt

```bash
bun install
```

## Chạy local

```bash
bun run dev
```

Ứng dụng chạy tại `http://localhost:5000`.

## Build

```bash
bun run build
```

## Cấu trúc thư mục

```
src/
├── components/   # Các component UI tái sử dụng (Astro, TS)
├── layouts/      # Layout dùng chung (BaseLayout, v.v.)
├── pages/        # Các trang — mỗi file là một route
├── lib/          # Tiện ích, kết nối DB, helper
└── data/         # File SQLite và dữ liệu tĩnh
public/           # Tài sản tĩnh (ảnh, font, favicon)
```

## Giấy phép

MIT
