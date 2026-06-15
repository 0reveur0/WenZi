# WenZi 文字

> Từ điển Hán Việt đơn giản và hiệu quả.

## Công nghệ

- [Astro](https://astro.build/) v5 — web framework, SSR mode
- [Bun](https://bun.sh/) — runtime & package manager
- [TypeScript](https://www.typescriptlang.org/) — ngôn ngữ chính
- [sql.js](https://sql.js.org/) — SQLite biên dịch sang WebAssembly (không cần binary native)

> **Ghi chú SQLite:** `bun:sqlite` không hoạt động qua Vite SSR của Astro (Vite dùng Node ESM loader riêng cho server-side code). `sql.js` là lựa chọn tương thích nhất — SQLite thuần WASM, không cần biên dịch native.

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

## Build production

```bash
bun run build
```

> Lưu ý: Production build yêu cầu cài thêm Astro SSR adapter (ví dụ `@astrojs/node`).

## API

```
GET /api/search?q=<keyword>
```

Tìm kiếm theo: chữ Hán giản thể / phồn thể · pinyin · nghĩa tiếng Việt

```json
[
  {
    "simplified": "学生",
    "traditional": "學生",
    "pinyin": "xué shēng",
    "vietnamese": "Học sinh"
  }
]
```

## Cấu trúc thư mục

```
src/
├── components/   # Component UI tái sử dụng
│   └── ThemeToggle.astro
├── layouts/      # Layout dùng chung
│   └── BaseLayout.astro
├── pages/        # Mỗi file = một route
│   ├── index.astro
│   └── api/
│       └── search.ts
├── lib/          # Tiện ích, kết nối DB
│   ├── db.ts     # SQLite singleton (sql.js)
│   └── schema.ts # Định nghĩa kiểu TypeScript
└── data/         # File wenzi.db (tự tạo khi chạy)
public/           # Tài sản tĩnh
```

## Giấy phép

MIT
