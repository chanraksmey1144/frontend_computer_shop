# AGENTS_GUIDE.md (Frontend)

Guidance for AI agents working on the **Frontend_Computer** app. Read this
before editing any frontend file. For backend/API internals, see the root
`../AGENTS_GUIDE.md`.

---

## 1. What This Frontend Is

A React single-page e-commerce app for the Sale_Computer / ComputerShop system.
It is no longer the Vite starter: it contains a full storefront, auth screens,
a customer account area, and an admin dashboard, all wired to a shared Axios API
client.

Current state (important):

- Router, layouts, auth/cart contexts, services, and UI primitives already exist.
- **Storefront, auth, account, and admin screens are implemented.**
- The Laravel backend only implements **roles, users, categories, brands, and
  OTP** endpoints. Auth, products, cart, orders, inventory, and admin/reporting
  endpoints are **not implemented yet**.
- Pages that depend on missing endpoints show honest loading/empty/error or
  "API pending" states. **Never fake success, fake totals, or mock data.**
- Tailwind CSS v4 with a custom brand theme is active.
- JavaScript only. **Do not introduce TypeScript.**

Your job is usually to extend existing screens or connect newly implemented
backend endpoints while keeping the conventions below.

**Recent UI/UX update (reference):** The storefront now uses a polished,
mobile-first experience with safe-area support for mobile bottom nav, reusable
`Breadcrumbs`, `PageHeader`, and `EmptyState` in `components/common`, and routes
redirect unknown paths to home/admin (no global 404 layout route). Keep these
patterns when adding new pages.

---

## 2. Tech Stack (exact, from package.json)

| Package | Version | Notes |
|---------|---------|-------|
| react | ^19.3.1 | Function components + hooks |
| react-dom | ^19.3.1 | `createRoot` in `main.jsx` |
| react-router-dom | ^7.18.4 | `BrowserRouter`, nested routes |
| axios | ^1.20.0 | Shared client in `src/services/api.js` |
| lucide-react | ^0.577.0 | All icons |
| vite | ^8.3.4 | Dev server + build |
| @vitejs/plugin-react | ^6.1.2 | Fast Refresh |
| tailwindcss | ^4.3.3 | v4, no config file |
| @tailwindcss/vite | ^4.3.3 | Vite plugin |
| oxlint | ^1.88.0 | Linter (`npm run lint`) |

Scripts:

```powershell
npm run dev      # Vite dev server, http://localhost:5173
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
├── index.html                  Inter font, meta/theme-color, mounts #root
├── vite.config.js              react() + tailwindcss() plugins
├── package.json                Dependencies and scripts
├── .oxlintrc.json              Lint config (react + oxc plugins)
├── .env.example                VITE_API_BASE_URL
├── .gitignore                  node_modules, dist, .env, editor files
└── src/
    ├── main.jsx                StrictMode > App
    ├── App.jsx                 Renders the router
    ├── index.css               Tailwind import + @theme tokens + utilities
    ├── routes/index.jsx        Providers + all route definitions
    ├── components/
    │   ├── common/             Button, Input, Card, Badge, Modal, Toast, ...
    │   │   └── index.js        Barrel exports (prefer importing from here)
    │   ├── layout/             Header, Footer, StoreLayout, AuthLayout,
    │   │                       Sidebar, AdminLayout
    │   └── account/            AccountNav (Profile/Orders/Addresses/Settings)
    ├── context/
    │   ├── AuthContext.jsx     login/register/logout/profile, token storage
    │   └── CartContext.jsx     cart state + add/update/remove/clear
    ├── hooks/useQuery.js       URL query helpers
    ├── pages/
    │   ├── store/              Home, ProductList, ProductDetail, Cart,
    │   │                       Checkout, Categories, Brands, Search, NotFound
    │   ├── auth/               Login, Register, OtpVerify, Forgot/Reset
    │   ├── account/            Profile, MyOrders, OrderDetail, Addresses,
    │   │                       AccountSettings
    │   └── admin/              Dashboard, Products, ProductCreate/Edit,
    │                           Categories, Brands, Inventory, Orders,
    │                           OrderDetail, Customers, Reports, Settings
    ├── services/               api.js + auth/product/category/brand/cart/
    │                           order/user/inventory/dashboard services
    └── utils/                  cn.js, format.js
```

---

## 4. Code Conventions

Match these exactly unless a task says otherwise:

- **Semicolons, single quotes, 2-space indentation.**
- Function components declared with `function Name()` and a default export.
  Subcomponents in the same file may also be `function Name()` (not exported).
- Imports ordered: React/hooks, router, services/context, UI, icons, utils.
- `StrictMode` stays enabled in `main.jsx`.
- Tailwind utility classes preferred over new CSS files.
- No comments unless explicitly requested.
- Avoid dead code and unused imports; keep `npm run lint` warning-free where
  practical.

Lint rules that matter (`.oxlintrc.json`):

- `react/rules-of-hooks` is an **error**.
- `react/only-export-components` is a **warning**; `allowConstantExport` is on.
  Context files intentionally export `useX()` hooks alongside providers and
  produce a warning — that is expected. Do not split them just to silence it.
- Existing `set-state-in-effect` warnings in `AuthContext`/`Products` are known
  and benign.

### 4.1 Import paths and barrel usage

From files in `src/pages/**`:

```js
import { Button, Input, Card } from '../../components/common';
import { useToast } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../services/productService';
import { formatMoney } from '../../utils/format';
import AccountNav from '../../components/account/AccountNav';
```

From files in `src/components/**`:

```js
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
```

Rules:

- Import common UI from the barrel (`components/common`), not individual files,
  except inside `components/common` itself.
- `ProtectedRoute` and `AdminRoute` are **named** exports from
  `components/common/ProtectedRoute`.
- `ToastProvider` and `useToast` are named exports from the barrel.
- Everything else in `components/common` is a default export re-exported by the
  barrel.

### 4.2 UI primitives — use these instead of rebuilding

| Primitive | Key props |
|-----------|-----------|
| `Button` | `variant`: `primary`/`secondary`/`outline`/`ghost`/`danger`, `size`: `sm`/`md`/`lg`/`icon`, `loading`, `disabled` |
| `Input` | `label`, `error`, `required`, plus native input props (`type`, `autoComplete`, `maxLength`, `inputMode`); `className` styles the input itself |
| `Card` + `CardHeader/CardTitle/CardContent/CardFooter` | `padding={false}` to remove default padding |
| `Badge` | `variant`: `neutral`/`success`/`warning`/`danger`/`info`/`primary` |
| `Modal` | `isOpen`, `onClose`, `title`, `className`; portals to `body`, closes on Escape/backdrop |
| `ConfirmDialog` | `isOpen`, `onConfirm`, `onCancel`, `title`, `description`, `loading`, `confirmVariant` |
| `ImageFallback` | `src`, `alt`, `className`; shimmer while loading, `ImageOff` placeholder on error |
| `Avatar` | `src`, `alt`, `size`: `sm`/`md`/`lg` |
| `Loader` / `Skeleton` | Spinner; `Skeleton` accepts `className`, `height`, `width` |
| `useToast()` | `show({ title, description, type: 'success'\|'error'\|'warning'\|'info', duration })` |
| `Breadcrumbs` | Page breadcrumb trail |
| `PageHeader` | Eyebrow/title/description/actions with bottom border |
| `EmptyState` | Empty/error placeholder with icon/action |

Use `cn()` from `src/utils/cn.js` for conditional classes. Use `formatMoney`,
`formatDate`, `formatDateTime`, `formatNumber`, `slugify`, `truncate`, `errorMessage`,
`firstError` from `src/utils/format.js`.

---

## 5. App Architecture

### 5.1 Providers and routing

`src/routes/index.jsx` nests, in order:

```
ToastProvider > AuthProvider > CartProvider > BrowserRouter > Routes
```

Layouts:

- `StoreLayout` — Header + `<main id="store-content" className="container-page py-8 pb-24 lg:py-10 lg:pb-10">` +
  Footer + mobile bottom nav with safe-area padding. Accepts `children` and falls back to `<Outlet />`.
- `AuthLayout` — split brand/form panel. Accepts `children` and falls back to
  `<Outlet />`. Routes currently pass children:
  `<AuthLayout><Login /></AuthLayout>`.
- `AdminLayout` — fixed collapsible `Sidebar`, sticky top bar, `Outlet`.
- `ProtectedRoute` — redirects unauthenticated users to `/login` with `state.from`.
- `AdminRoute` — requires auth and `user.role.name === 'admin'`.
- `RedirectIfAuthenticated` — wraps auth routes; renders `null` while auth loads.

Routes:

| Area | Paths |
|------|-------|
| Storefront | `/`, `/home` -> `/`, `/products`, `/products/:id`, `/categories`, `/categories/:slug`, `/brands`, `/brands/:slug`, `/search`, `/cart` |
| Auth | `/login`, `/register`, `/otp/verify`, `/forgot-password`, `/reset-password` |
| Checkout | `/checkout` (protected) |
| Account | `/profile`, `/my-orders`, `/my-orders/:id`, `/addresses`, `/account/settings` (protected) |
| Admin | `/admin/*`: index, `products`, `products/create`, `products/:id/edit`, `categories`, `brands`, `inventory`, `orders`, `orders/:id`, `customers`, `reports`, `settings` |

**Routing note:** Unknown routes redirect to `/` (storefront) or `/admin` (admin area). There is no global 404 layout route.

**Security note:** admin gating is client-side only. The backend has no auth or
admin middleware, so it enforces nothing. Do not claim admin routes are secure
until the backend implements auth/authorization.

### 5.2 Auth flow

`AuthContext`:

- Reads `auth_token` from `localStorage` on mount and calls `GET /user`.
- `login()` calls `POST /login` and accepts `{ token | access_token | accessToken, user }`.
- Persists the token as `auth_token`; `setAccessToken()` updates Axios headers.
- `logout()` calls `POST /logout`, always clears local state.
- Exposes `user`, `loading`, `isAuthenticated`, `isAdmin`.

`services/api.js`:

- Base URL: `import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'`.
- Injects `Authorization: Bearer <token>` when present.
- On any `401`, clears the token and dispatches a window `auth:logout` event
  (AuthContext listens and clears the user). It does **not** redirect.

### 5.3 Cart flow

`CartContext` loads `/cart` on mount and exposes `cart`, `loading`, `addToCart`,
`updateItem`, `removeItem`, `clearCart`, `refresh`, `itemCount`, `cartTotal`.
`Cart` and `Checkout` pages call the cart service directly; keep both paths
consistent if the cart API changes.

### 5.4 Theming and design system

`src/index.css` defines:

- Inter as `--font-sans` (loaded in `index.html` via Google Fonts).
- Brand palette `--color-brand-50` … `--color-brand-900` (primary `brand-600`
  `#1d40f0`) plus `ink` tokens.
- Base body background `#f8fafc`, slate text, tightened heading tracking,
  focus-visible rings, styled scrollbars.
- `@utility container-page` — max width `80rem` with responsive padding.
- `.animate-fade-up` and `.shimmer` animations.

Styling rules:

- Use `brand-*` for primary actions/accents. Use `slate-*` for text, borders,
  and surfaces. Use `emerald` success, `amber` warning, `rose` danger.
- Cards are `rounded-2xl` with `border-slate-200/80` + `shadow-sm`; page sections
  use `space-y-6`.
- Page headers follow: eyebrow (`text-xs font-bold uppercase tracking-[0.18em]
  text-brand-600`), `h1` (`text-3xl font-bold tracking-tight`), supporting
  `text-sm text-slate-500`.
- Always handle images with `ImageFallback` (backend URLs may be absolute,
  relative, or null).
- Keep mobile-first: test narrow layouts; tables need horizontal scroll wrappers.
- Do not add a `.dark` class or a dark-mode toggle; the design is light-only.

---

## 6. Backend API Contract

Base URL default: `http://127.0.0.1:8000/api` (override with
`VITE_API_BASE_URL`). Backend dev server is usually `php artisan serve` on port
8000.

**Critical:** the backend currently implements only:

```
GET/POST/GET/PUT/DELETE  /roles
GET/POST/GET/PUT/DELETE  /users
GET/POST/GET/PUT/DELETE  /categories
GET/POST/GET/PUT/DELETE  /brands
POST                     /otp/send
POST                     /otp/verify
```

Everything below is **expected by the frontend but not implemented**:

```
POST /login, /register, /logout
GET/PUT /user, POST /user/password
GET/POST/PUT/DELETE /user/addresses
GET /products, /products/{id}, /products/{id}/images
POST/PUT/DELETE /products
GET/POST /cart, PATCH/DELETE /cart/items/{id}, DELETE /cart
GET/POST /orders, GET /orders/{id}, PATCH /orders/{id}/status
GET/PATCH /inventory
GET /admin/dashboard, /admin/orders, /admin/products, /admin/customers
POST /password/email, /password/reset
```

When a task involves a missing endpoint: keep the graceful unavailable/error UI,
state the missing route explicitly, and do not fabricate responses.

### 6.1 Response envelope

Success responses:

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {}
}
```

Deletes may omit `data`. Validation failures return HTTP `422` with Laravel's
`{ "message": "...", "errors": { "field": ["..."] } }`.

Read `data` from the envelope (`res.data.data || res.data`). For `422`, map
`errors` to `Input` `error` props.

### 6.2 Pagination and filters

Paginated `data` is a Laravel paginator. Storefront `ProductList` accepts both
plain arrays and `{ data: [...] }` shapes and reads `current_page`, `last_page`,
`links`, `total`.

Categories: `status`, `search`, `root_only`, `page`.
Brands: `status`, `search`, `page`.
Roles and Users are **not** paginated.

### 6.3 Entity shapes (implemented resources)

Category:

```json
{
  "id": 1, "parent_id": null, "name": "Laptops", "slug": "laptops",
  "description": "Laptop computers", "image": null, "status": "active",
  "created_at": "...", "updated_at": "...",
  "parent": null, "children": []
}
```

The backend column is `image` (not `image_url`). Use `image` against the API.

Brand:

```json
{
  "id": 1, "name": "ASUS", "slug": "asus", "logo_url": null,
  "description": null, "status": "active", "created_at": "...", "updated_at": "..."
}
```

User (never contains password/social ids):

```json
{
  "id": 1, "role_id": null, "name": "Jane", "email": "jane@example.com",
  "phone": null, "email_verified_at": null, "phone_verified_at": null,
  "status": "active", "created_at": "...", "updated_at": "...",
  "role": { "name": "admin" }
}
```

`isAdmin` depends on `user.role.name === 'admin'`.

### 6.4 OTP

Purposes: `registration`, `login`, `password_reset`, `change_contact`.
6 digits, expire in 5 minutes, max 5 attempts.

Response codes: `202` success, `422` validation, `429` rate-limited, `503`
delivery failure. Rate limits: send 3/min per IP and 5/hour per email; verify
10/min per IP and 10/hour per email. Surface `429`/`503` messages gracefully.

### 6.5 API client guidance

- Use the shared client in `src/services/api.js`; never hardcode URLs in
  components.
- Add new endpoints as functions in the matching `services/*.js` file.
- Axios errors already expose `err.response.status`, `err.response.data.errors`,
  and `err.message`. Convert to toast messages; do not swallow silently.
- `.env` is gitignored; `.env.example` documents `VITE_API_BASE_URL`. After
  changing `.env`, restart the dev server.
- Only `VITE_`-prefixed vars reach the browser. Never put secrets there.

---

## 7. UX Rules

- Every API-backed view must handle **loading**, **empty**, **error**, and
  **success** states. Prefer skeletons over spinners for page-level loads.
- Never leave a button that appears to work but has no handler. For unavailable
  features, disable it and add a short explanation or toast.
- Use `useToast()` for transient feedback; use inline banners for persistent
  state (e.g. "API not implemented").
- Forms: validate required fields, show field-level errors from `422`, disable
  the submit button while saving, and reset/refresh after success.
- Use semantic HTML (`button`, `label`, `nav`, `main`, `section`), meaningful
  `alt` text, and `aria-label` on icon-only buttons. Include a "Skip to content"
  link in layouts where appropriate and respect `prefers-reduced-motion`.
- Currency uses `formatMoney` (USD); dates use `formatDate`. Do not hand-format.
- Destructive actions go through `ConfirmDialog` and re-fetch after success.

---

## 8. Known Pitfalls

1. **Most feature endpoints are missing.** Storefront catalog endpoints work;
   auth, cart, orders, inventory, and admin reporting do not. Do not assume a
   `404` means the UI is wrong.
2. **No backend auth/authorization.** Sanctum is installed but no middleware
   protects routes. `AdminRoute` is a UX guard only.
3. **Auth routes are frontend-assumed.** `/login`, `/register`, `/logout`,
   `/user`, password reset routes must exist before auth works end-to-end.
4. **Brand create/update were broken** on the backend. Verify before relying on
   them; warn the user if a task depends on those endpoints.
5. **No TypeScript.** Do not add `.ts`/`.tsx` files or type-only syntax.
6. **`AuthLayout` takes `children`** (with `<Outlet />` fallback). Auth routes
   pass children, not nested `<Route>` children — keep that pattern or migrate
   all auth routes together.
7. **`StrictMode` double-runs effects in dev.** Write idempotent effects and use
   cancellation flags for fetches; don't mistake it for a production bug.
8. **Image URLs can be absolute or relative.** Use `ImageFallback`.
9. **User status** is `active` / `inactive` in the API; only offer accepted values.
10. **Bundle size warning.** The single JS chunk exceeds 500 kB after
    minification. `npm run build` still succeeds. If code-splitting, start with
    admin routes via `React.lazy`/`Suspense`.
11. **Do not export non-component values** from UI component files (lint warning).
    Context hook + provider exports are the accepted exception.
12. **`.env` handling.** `.env` is gitignored. Never print or commit its
    contents; backend SMTP credentials live in the backend `.env`, not here.

---

## 9. Definition of Done for Frontend Changes

- `npm run lint` passes with no new errors.
- `npm run build` succeeds (the >500 kB chunk warning is pre-existing).
- Loading, empty, error, and success states are handled for API-backed views.
- No fabricated data, fake success toasts, or dead interactive elements.
- New UI reuses existing primitives/tokens and matches the responsive layout.
- No new dependencies without checking `package.json` and confirming with the user.
- No secrets, no TypeScript, no leftover legacy classes/mojibake.
- Changes stay scoped to the requested feature.

---

## 10. Likely Next Tasks

1. Wire auth screens to real `/login`, `/register`, `/logout`, `/user` endpoints
   once the backend adds them (keep OTP flow where required).
2. Connect product/cart/order/inventory services to real endpoints; remove
   "API pending" placeholders only when the API exists.
3. Improve admin screens (orders, customers, inventory, categories, brands) to
   the same visual standard as Dashboard/Products.
4. Code-split admin routes to resolve the chunk-size warning.
5. Add Vitest + React Testing Library if tests are requested.
6. Add consistent document titles if requested.

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

Backend API: `http://127.0.0.1:8000/api`
Frontend dev: `http://localhost:5173`
