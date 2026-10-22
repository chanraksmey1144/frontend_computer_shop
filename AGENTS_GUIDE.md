# AGENTS_GUIDE.md (Frontend)

Guidance for AI agents working on the **Frontend_Computer** app. Read this
before editing any frontend file. For backend/API internals, see the root
`../AGENTS_GUIDE.md`.

---

## 1. What This Frontend Is

A React single-page app for the Sale_Computer e-commerce / computer-shop system.
It is currently the **default Vite + React starter template** and is not yet
connected to the Laravel API.

Current state:
- `App.jsx` renders the Vite demo UI (hero images, counter, docs/social links).
- No router, no API client, no state management, no auth, no real product pages.
- Tailwind CSS v4 is installed and active but barely used by the starter UI.
- JavaScript only. **Do not introduce TypeScript.**

Your job is usually to turn the starter into real shop features while keeping
the existing conventions below.

---

## 2. Tech Stack (exact, from package.json / lockfile)

| Package | Version | Notes |
|---------|---------|-------|
| react | 19.3.1 | Function components + hooks |
| react-dom | 19.3.1 | `createRoot` in `main.jsx` |
| vite | 8.3.5 | Dev server + build |
| @vitejs/plugin-react | 6.1.2 | Fast Refresh |
| tailwindcss | 4.3.3 | v4, no config file |
| @tailwindcss/vite | 4.3.3 | Vite plugin |
| oxlint | 1.89.0 | Linter (`npm run lint`) |

Scripts:

```powershell
npm run dev      # Vite dev server, default http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview the build
npm run lint     # oxlint
```

There is **no test framework installed** (no Vitest/Jest/RTL). Do not assume
tests exist. If a task needs tests, propose adding Vitest + React Testing
Library first.

---

## 3. File Map

```
Frontend_Computer/
├── index.html                  Root HTML, mounts #root, title "frontend-computer"
├── vite.config.js              react() + tailwindcss() plugins
├── package.json                Dependencies and scripts
├── .oxlintrc.json              Lint config (react + oxc plugins)
├── .gitignore                  node_modules, dist, *.local, editor files
├── public/
│   ├── favicon.svg
│   └── icons.svg               Sprite referenced by starter App.jsx
└── src/
    ├── main.jsx                Entry: StrictMode > App
    ├── App.jsx                 Starter UI (replace/extend this)
    ├── App.css                 Only `@import "tailwindcss";`
    ├── index.css               Tailwind import + global CSS variables/theme
    └── assets/
        ├── hero.png
        ├── react.svg
        └── vite.svg
```

Missing (create only when needed, following the suggested structure below):
`src/components/`, `src/pages/`, `src/features/`, `src/api/`, `src/hooks/`,
`src/context/`, `src/routes/`, `src/utils/`.

---

## 4. Current Code Conventions

Match these exactly unless a task says otherwise:

- **No semicolons**, single quotes, 2-space indentation.
- Function components declared with `function Name()` and a default export.
- Imports ordered: React/hooks, then local assets/styles, then local modules.
- `StrictMode` stays enabled in `main.jsx`.
- Tailwind utility classes preferred over new CSS files.
- Global design tokens live as CSS variables in `src/index.css` (`--text`,
  `--bg`, `--accent`, etc.) with automatic dark mode via
  `prefers-color-scheme`. Reuse these instead of hardcoding colors.
- `App.css` and `index.css` both `@import "tailwindcss";`. This currently works
  but is redundant; if you clean up imports, keep `index.css` as the primary
  Tailwind entry (it is imported by `main.jsx`).
- No comments unless explicitly requested.

Lint rules that matter (`.oxlintrc.json`):
- `react/rules-of-hooks` is an **error**.
- `react/only-export-components` is a **warning**; `allowConstantExport` is on.
  Do not export non-component values from component files; move constants/helpers
  to separate modules.

---

## 5. Suggested Folder Structure (when adding features)

```
src/
├── api/
│   ├── client.js            fetch wrapper, base URL, error normalization
│   ├── categories.js
│   ├── brands.js
│   ├── users.js
│   └── otp.js
├── components/              Reusable UI (Button, Input, Table, Modal, ...)
├── features/
│   ├── categories/
│   ├── brands/
│   └── auth/
├── pages/                   Route-level screens
├── hooks/                   useXxx.js
├── context/                 Auth/theme providers
├── routes/                  Router config
└── utils/                   formatters, validators
```

Naming:
- Components/pages: `PascalCase.jsx` (`ProductCard.jsx`, `CategoryList.jsx`).
- Hooks: `useSomething.js`.
- API/util modules: `camelCase.js`.
- One component per file; default export the component.

---

## 6. Backend API Contract

Base URL: `http://localhost:8000/api` (Laravel `php artisan serve`).

**Important:** all API routes are currently **unauthenticated**. There is no
login/token flow wired up yet even though Sanctum is installed on the backend.
Do not assume cookies, sessions, or `Authorization` headers are required.

### 6.1 Response envelope

Every success response follows:

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {}
}
```

Deletes omit `data`. Validation failures return HTTP `422` with Laravel's
standard `{ "message": "...", "errors": { "field": ["..."] } }`.

Always read `data` from the envelope, and surface `message` to the user.

### 6.2 Endpoints

| Resource | Method | Path | Notes |
|----------|--------|------|-------|
| Roles | GET | `/roles` | Returns all roles |
| Roles | POST | `/roles` | `{ name, description? }` |
| Roles | GET | `/roles/{id}` | |
| Roles | PUT/PATCH | `/roles/{id}` | `{ name, description? }` |
| Roles | DELETE | `/roles/{id}` | |
| Users | GET | `/users` | Returns all users |
| Users | POST | `/users` | `{ role_id?, name, email, phone?, password, status? }` |
| Users | GET | `/users/{id}` | |
| Users | PUT/PATCH | `/users/{id}` | Same fields, all optional |
| Users | DELETE | `/users/{id}` | |
| OTP | POST | `/otp/send` | `{ destination, purpose }` |
| OTP | POST | `/otp/verify` | `{ destination, purpose, otp }` |
| Categories | GET | `/categories` | Paginated (10); filters below |
| Categories | POST | `/categories` | `{ parent_id?, name, slug, description?, image?, status }` |
| Categories | GET | `/categories/{id}` | Includes `parent` and `children` |
| Categories | PUT/PATCH | `/categories/{id}` | Partial update |
| Categories | DELETE | `/categories/{id}` | |
| Brands | GET | `/brands` | Paginated (10); filters below |
| Brands | POST | `/brands` | **Broken on backend (returns nothing)** |
| Brands | GET | `/brands/{id}` | |
| Brands | PUT/PATCH | `/brands/{id}` | **Bug: creates instead of updates** |
| Brands | DELETE | `/brands/{id}` | |

### 6.3 Filters and pagination

Categories `GET /categories`:
- `status=active|inactive`
- `search=<name substring>`
- `root_only=true` (only top-level categories)
- `page=<n>`

Brands `GET /brands`:
- `status=active|inactive`
- `search=<name substring>`
- `page=<n>`

Paginated `data` is a Laravel paginator:

```json
{
  "current_page": 1,
  "data": [],
  "first_page_url": "...",
  "from": 1,
  "last_page": 3,
  "last_page_url": "...",
  "links": [],
  "next_page_url": "...",
  "path": "...",
  "per_page": 10,
  "prev_page_url": null,
  "to": 10,
  "total": 25
}
```

Render `data.data` for rows and use `last_page` / `links` for pagination.
Roles and Users are **not** paginated.

### 6.4 Entity shapes

Category:
```json
{
  "id": 1,
  "parent_id": null,
  "name": "Laptops",
  "slug": "laptops",
  "description": "Laptop computers",
  "image": null,
  "status": "active",
  "created_at": "...",
  "updated_at": "...",
  "parent": null,
  "children": []
}
```
Note: the backend Laravel column is `image`, but the reference SQL uses
`image_url`. Use `image` against the API.

Brand:
```json
{
  "id": 1,
  "name": "ASUS",
  "slug": "asus",
  "logo_url": null,
  "description": null,
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

User (password and social ids are never returned):
```json
{
  "id": 1,
  "role_id": null,
  "name": "Jane",
  "email": "jane@example.com",
  "phone": null,
  "email_verified_at": null,
  "phone_verified_at": null,
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

OTP purposes: `registration`, `login`, `password_reset`, `change_contact`.
Codes are 6 digits, expire in 5 minutes, max 5 attempts.

OTP response codes:
- `202` success (generic message for `login` / `password_reset`)
- `422` validation error
- `429` rate limited
- `503` email delivery failed (non-sensitive flows)

Rate limits: send 3/min per IP and 5/hour per email; verify 10/min per IP and
10/hour per email. Build UI that handles `429` gracefully.

### 6.5 API client guidance

- Use `import.meta.env.VITE_API_BASE_URL` with fallback
  `http://localhost:8000/api`. Only `VITE_`-prefixed vars are exposed to the
  browser; **never put secrets in them**.
- Add `.env.example` with `VITE_API_BASE_URL=http://localhost:8000/api`.
  `.env` is **not** currently listed in `.gitignore`; add it there before
  creating a real `.env`, and never commit it.
- Backend CORS (`Backend_Computer/config/cors.php`) allows any origin for
  `api/*` with `supports_credentials: false`. Avoid cookie-based auth.
- Prefer the built-in `fetch`. `axios` is **not** installed in this package;
  do not import it. If you must add it, update `package.json` and run
  `npm install`.
- Normalize errors in one place: throw an `Error` carrying `status`,
  `message`, and `errors` from the response.

---

## 7. Styling Rules

- Tailwind v4: there is **no `tailwind.config.js`** and none is needed. Theme
  customization uses the `@theme` directive or CSS variables in `index.css`.
- Use `src/index.css` tokens (`var(--bg)`, `var(--text)`, `var(--accent)`, ...)
  for brand colors so light/dark mode keeps working.
- Dark mode is automatic via `prefers-color-scheme`; do not add a `.dark` class
  unless you also change the strategy deliberately.
- Mobile-first responsive utilities; breakpoints used in existing CSS: `1024px`.
- Most starter styles in `index.css` are scoped to the demo layout (`#center`,
  `#next-steps`, `.hero`, `.counter`). When replacing `App.jsx`, remove or
  migrate those rules instead of leaving dead CSS.
- Use semantic HTML and accessible labels/alt text. The starter uses
  `role="presentation"` and `aria-hidden` on decorative SVGs; keep that pattern.

---

## 8. What to Build Next (typical tasks)

Priority order that matches the backend's readiness:

1. API client wrapper + env config.
2. Categories admin: list (paginated, search, status filter), create, edit,
   delete, parent/child display.
3. Brands admin: list/search/filter, show, delete, edit UI (backend update/store
   must be fixed first — warn the user if asked to rely on it).
4. Roles and users views (roles list is needed for the user role select).
5. OTP flow screens (send/verify) for registration and password reset.
6. Router + layout/shell (header, sidebar, toasts, loading/empty/error states).
7. Later: products, inventory, cart, orders (not yet implemented in Laravel).

---

## 9. Known Pitfalls

1. **Brand create/update endpoints are broken** on the backend. Do not build
   the frontend around `POST /brands` or `PUT /brands/{id}` without flagging it.
2. **No auth/authorization** exists on the API. Do not gate the app on a token
   that the backend does not verify.
3. **No TypeScript.** Do not add `.ts`/`.tsx` files or type-only syntax.
4. `App.css` duplicates the Tailwind import; do not add a third import.
5. Never hardcode API URLs in components; use the shared client/base URL.
6. Do not put backend secrets or `.env` values into frontend code; everything
   shipped to the browser is public.
7. `StrictMode` causes effects to run twice in development. Write idempotent
   effects/abortable requests and do not mistake it for a production bug.
8. Images from the backend may be absolute URLs (`logo_url`) or relative paths
   (`image`); handle both and provide an alt/fallback.
9. User `status` is `active` / `inactive` in the API (the SQL reference also
   mentions `suspended`); only offer values the backend accepts.

---

## 10. Definition of Done for Frontend Changes

- `npm run lint` passes with no new errors.
- `npm run build` succeeds.
- Loading, empty, and error states are handled for any API-backed view.
- No new dependencies without checking `package.json` and confirming with the user.
- No secrets, no TypeScript, no dead starter markup left behind.
- Changes stay scoped to the requested feature.

---

## 11. Quick Commands

```powershell
# inside Frontend_Computer/
npm install
npm run dev
npm run lint
npm run build

# backend, in a separate terminal
cd ..\Backend_Computer
php artisan serve
```

Backend API: `http://localhost:8000/api`
Frontend dev: `http://localhost:5173`
