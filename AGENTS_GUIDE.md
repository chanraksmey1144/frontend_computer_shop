# AGENTS_GUIDE.md (Frontend)

Guidance for AI agents working on the **Frontend_Computer** app. Read this
before editing any frontend file. For backend/API internals, see
`../Backend_Computer/AGENTS_GUIDE.md`.

---

## 1. What This Frontend Is

A React single-page e-commerce app for the Sale_Computer / ComputerShop system.
It is no longer the Vite starter: it contains a full storefront, auth screens,
a customer account area, and an admin dashboard, all wired to a shared Axios API
client.

Current state (important):

- Router, layouts, auth/cart contexts, services, and UI primitives already exist.
- **Storefront, auth, account, and admin screens are implemented.**
- The Laravel backend now implements **roles, users, OTP, token auth
  (register/login/logout/user), password reset, Google OAuth, addresses,
  categories, brands, products, product images (URL-based), product variants,
  warehouses, inventories, inventory movements, product serial numbers,
  carts, and coupons**.
- **Service modules exist for every implemented API**, including the newer
  `couponService`, `inventoryMovementService`, and `serialNumberService`.
- **New commerce UIs are wired**: address create/edit/default, admin coupon
  CRUD (`/admin/coupons`), stock movement history + recording
  (`/admin/movements`), and serial number tracking (`/admin/serial-numbers`).
- **Still not implemented in the API**: orders, profile update/password change,
  payments, and admin dashboard/orders/customers/reporting endpoints.
- Pages that depend on missing endpoints show honest loading/empty/error or
  "API pending" states. **Never fake success, fake totals, or mock data.**
- Tailwind CSS v4 with a custom brand theme is active.
- JavaScript only. **Do not introduce TypeScript.**

Your job is usually to extend existing screens or connect newly implemented
backend endpoints while keeping the conventions below.

**Recent UI/UX update (reference):** The storefront uses a polished,
mobile-first experience with safe-area support for mobile bottom nav, reusable
`Breadcrumbs`, `PageHeader`, and `EmptyState` in `components/common`, an
application-level `AppErrorBoundary`, and routes that redirect unknown paths to
home/admin (no global 404 layout route). Google sign-in and an admin Warehouses
screen were added. Keep these patterns when adding new pages.

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

`@types/react` and `@types/react-dom` are in devDependencies but the app is
plain JavaScript. Ignore them; do not add TS.

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
    ├── App.jsx                 AppErrorBoundary > AppRouter
    ├── index.css               Tailwind import + @theme tokens + utilities
    ├── routes/index.jsx        Providers + all route definitions
    ├── components/
    │   ├── common/             Button, Input, Card, Badge, Modal, Toast, ...
    │   │   ├── AppErrorBoundary.jsx   Class error boundary (wraps router)
    │   │   └── index.js        Barrel exports (prefer importing from here)
    │   ├── layout/             Header, Footer, StoreLayout, AuthLayout,
    │   │                       Sidebar, AdminLayout
    │   └── account/            AccountNav (Profile/Orders/Addresses/Settings)
    ├── context/
    │   ├── AuthContext.jsx     login/register/logout/loginWithToken/profile
    │   └── CartContext.jsx     cart state + add/update/remove/clear
    ├── hooks/useQuery.js       URL query helpers
    ├── pages/
    │   ├── store/              Home, ProductList, ProductDetail, Cart,
    │   │                       Checkout, CategoriesList, CategoryPage,
    │   │                       BrandsList, BrandPage, Search, NotFound
    │   ├── auth/               Login, Register, OtpVerify, Forgot/Reset,
    │   │                       GoogleAuthCallback
    │   ├── account/            Profile, MyOrders, OrderDetail, Addresses,
    │   │                       AccountSettings
    │   └── admin/              Dashboard, Products, ProductCreate/Edit,
    │                           ProductForm, Categories, Brands, Inventory,
    │                           InventoryCreateModal, InventoryMovements,
    │                           SerialNumbers, Warehouses, Coupons, Orders,
    │                           OrderDetail, Customers, Reports, Settings
    ├── services/               api.js + auth/product/category/brand/cart/
    │                           order/user/inventory/inventoryMovement/
    │                           coupon/serialNumber/warehouse/dashboard
    └── utils/                  cn.js, format.js, apiResponse.js
```

---

## 4. Code Conventions

Match these exactly unless a task says otherwise:

- **Semicolons, single quotes, 2-space indentation.**
- Function components declared with `function Name()` and a default export.
  Subcomponents in the same file may also be `function Name()` (not exported).
- The only class component is `AppErrorBoundary` (React requires a class for
  `componentDidCatch`). Do not convert other components to classes.
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
import { parseApiCollection, fetchAllPages } from '../../utils/apiResponse';
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
- `AppErrorBoundary` is a default export imported directly by `App.jsx`.
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
`formatDate`, `formatDateTime`, `formatNumber`, `slugify`, `truncate`,
`errorMessage`, `firstError` from `src/utils/format.js`.

Use `parseApiCollection(response)` and `fetchAllPages(request, params)` from
`src/utils/apiResponse.js` to normalize envelopes and walk paginators. They
handle `{ success, data }`, Laravel paginators, plain arrays, and `items`/`meta`
shapes.

---

## 5. App Architecture

### 5.1 Providers and routing

`src/App.jsx` wraps the router in `AppErrorBoundary`. `src/routes/index.jsx`
nests, in order:

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
- `ProtectedRoute` — redirects unauthenticated users to `/login` with
  `state.from`.
- `AdminRoute` — requires auth and `user.role.name === 'admin'`.
- `RedirectIfAuthenticated` — wraps auth routes; renders `null` while auth
  loads.

Routes:

| Area | Paths |
|------|-------|
| Storefront | `/`, `/home` -> `/`, `/products`, `/products/:id`, `/categories`, `/categories/:slug`, `/brands`, `/brands/:slug`, `/search`, `/cart` |
| Auth | `/login`, `/register`, `/otp/verify`, `/forgot-password`, `/reset-password`, `/auth/google/callback` |
| Checkout | `/checkout`, `/payment/result` (protected) |
| Account | `/profile`, `/my-orders`, `/my-orders/:id`, `/addresses`, `/account/settings` (protected) |
| Admin | `/admin/*`: index, `products`, `products/create`, `products/:id/edit`, `categories`, `brands`, `inventory`, `movements`, `serial-numbers`, `warehouses`, `coupons`, `orders`, `orders/:id`, `customers`, `reports`, `settings` |

**Routing note:** Unknown routes redirect to `/` (storefront) or `/admin` (admin
area). There is no global 404 layout route (a `NotFound` page component exists
but is not routed).

**Security note:** the backend now issues Sanctum tokens for login/Google, but
its CRUD endpoints (users, roles, catalog, inventory) are still unprotected and
there is no admin/authorization middleware. `AdminRoute` remains a client-side
UX guard only. Do not claim admin routes are secure until the backend enforces
authorization.

### 5.2 Auth flow

`AuthContext`:

- Reads `auth_token` from `localStorage` on mount, calls `GET /user`, and
  exposes `user`, `loading`, `isAuthenticated`, `isAdmin`.
- `login()` calls `POST /login` and reads `data.token` (also tolerates
  `access_token`/`accessToken`); stores `user` from the same payload.
- `loginWithToken()` is used by the Google callback: persists the token, calls
  `GET /user`, and clears everything if the profile fetch fails.
- `register()` calls `POST /register`. The backend currently returns the user
  but **no token**, so the app stays signed out unless a token is present in the
  response.
- `logout()` calls `POST /logout`, always clears local state.
- `isAdmin` depends on `user.role.name === 'admin'`.

`services/api.js`:

- Base URL: `import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'`.
- Injects `Authorization: Bearer <token>` when present; token is held in a
  module variable plus `localStorage`.
- On any `401`, clears the token and dispatches a window `auth:logout` event
  (AuthContext listens and clears the user). It does **not** redirect.

Google sign-in:

- `googleLoginUrl` in `authService.js` is `${apiBaseUrl}/auth/google`.
- The backend redirects back to `/auth/google/callback#token=...` or
  `#error=...`; `GoogleAuthCallback` reads the hash, scrubs it with
  `history.replaceState`, calls `loginWithToken`, and redirects.
- Hash fragments are never sent to servers. Still, treat the token as a secret
  and do not log it.

`authService.js` also exposes `updateProfile()` (`PUT /user`),
`changePassword()` (`POST /user/password`), and `resetPassword()`
(`POST /password/reset`). The first two are **not implemented by the backend
yet**.

### 5.3 Cart flow

`CartContext` loads `/cart` on mount and exposes `cart`, `loading`,
`addToCart`, `updateItem`, `removeItem`, `clearCart`, `refresh`, `itemCount`,
`cartTotal`. The cart API is implemented behind Sanctum authentication.
`Cart` and `Checkout` pages call the cart/order services directly. Checkout
loads saved addresses, creates an order from the authenticated cart, starts
ABA PayWay with the order ID, and navigates to the short-lived hosted checkout
URL returned by the backend. The payment result page checks status through the
authenticated API and never trusts browser return parameters as proof of payment.
Checkout can also request the customer's GPS position after an explicit click;
the coordinates are stored with the order and shown as a map link. This requires
browser location permission and HTTPS outside localhost.

The backend recalculates order totals and empties the cart in the same database
transaction when an order is created. The client does not send a trusted total.
ABA PayWay credentials and callback verification stay on the backend.

### 5.4 Addresses, coupons, and stock screens

- Addresses (`/addresses`, protected): `Addresses.jsx` uses `userService`
  (`/user/addresses`) for list/create/update/delete/set-default. The first
  address becomes default automatically; the star button calls
  `PATCH /user/addresses/{id}/default`.
- Coupons (`/admin/coupons`): `Coupons.jsx` does full CRUD against `/coupons`.
  Storefront coupon entry is not wired into the cart; order creation can accept
  and validate a coupon, while the server recalculates the total.
- Stock movements (`/admin/movements`): `InventoryMovements.jsx` lists
  `/inventory-movements` with warehouse/product/type filters and records new
  movements. A matching inventory row must exist before a movement can be
  recorded; the API rejects missing rows with a validation error.
- Serial numbers (`/admin/serial-numbers`): `SerialNumbers.jsx` lists, creates,
  edits, and deletes `/product-serial-numbers` with search and filters. Delete
  is blocked for `sold`/`reserved` serials in both the UI and the API.
- The sidebar groups stock screens under Catalog and coupons under Sales.

### 5.5 Theming and design system

`src/index.css` defines:

- Inter as `--font-sans` (loaded in `index.html` via Google Fonts).
- Brand palette `--color-brand-50` … `--color-brand-900` (primary `brand-600`
  `#1d40f0`) plus `ink` tokens.
- Base body background `#f8fafc`, slate text, tightened heading tracking,
  focus-visible rings, styled scrollbars.
- `@utility container-page` — max width `80rem` with responsive padding.
- `@utility no-scrollbar`, `@utility pb-safe` (safe-area bottom padding).
- `.animate-fade-up` and `.shimmer` animations, with reduced-motion handling.

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

**Implemented today** (some routes require a Bearer token):

```
POST /register, /login
POST /logout, GET /user                    (auth:sanctum)
POST /password/reset
GET  /auth/google, /auth/google/callback   (redirects, not JSON)
POST /otp/send, /otp/verify
GET/POST/GET/PUT/DELETE  /roles
GET/POST/GET/PUT/DELETE  /users
GET/POST/GET/PUT/DELETE  /categories
GET/POST/GET/PUT/DELETE  /brands
GET/POST/GET/PUT/DELETE  /products
GET/POST/GET/PUT/DELETE  /products/{product}/images
GET/POST/GET/PUT/DELETE  /products/{product}/variants
GET/POST/GET/PUT/DELETE  /warehouses
GET/POST/GET/PUT/DELETE  /inventories
GET/POST/GET             /inventory-movements
GET/POST/GET/PUT/PATCH/DELETE /product-serial-numbers
GET/POST/GET/PUT/PATCH/DELETE /addresses           (auth:sanctum)
PATCH                    /addresses/{address}/default
GET/POST/GET/PUT/PATCH/DELETE /user/addresses      (auth:sanctum)
PATCH                    /user/addresses/{address}/default
GET/POST/GET/PUT/PATCH/DELETE /cart                 (auth:sanctum)
POST/PATCH/DELETE        /cart/items                (auth:sanctum)
GET/POST/GET/PUT/PATCH/DELETE /coupons              (auth:sanctum)
POST                     /coupons/validate          (auth:sanctum)
```

**Expected by the frontend but not implemented**:

```
PUT  /user, POST /user/password
GET/POST /orders, GET /orders/{id}, PATCH /orders/{id}/status
GET /admin/dashboard, /admin/orders, /admin/products, /admin/customers
GET /admin/reports (or equivalent)
```

Service mapping (all under `src/services/`):

| Backend area | Service file | Exports |
|--------------|--------------|---------|
| Addresses | `userService.js` | `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress` |
| Cart | `cartService.js` | `getCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart` |
| Coupons | `couponService.js` | `getCoupons`, `getCoupon`, `createCoupon`, `updateCoupon`, `deleteCoupon`, `validateCoupon` |
| Inventory | `inventoryService.js` | `getInventory`, `createInventory`, `adjustInventory` |
| Inventory movements | `inventoryMovementService.js` | `getInventoryMovements`, `getInventoryMovement`, `createInventoryMovement` |
| Serial numbers | `serialNumberService.js` | `getSerialNumbers`, `getSerialNumber`, `createSerialNumber`, `updateSerialNumber`, `deleteSerialNumber` |

`inventory-movements` exposes no working `update`/`delete` (the backend routes
exist but the controller methods do not). Do not call them. Coupons and carts
require a Bearer token; add their UI only behind `ProtectedRoute`/`AdminRoute`.

When a task involves a missing endpoint: keep the graceful unavailable/error UI,
state the missing route explicitly, and do not fabricate responses.

### 6.1 Response envelope

Success responses:

```json
{
  "success": true,
  "message": "Products retrieved successfully.",
  "data": {}
}
```

Deletes may omit `data`. Validation failures return HTTP `422` with Laravel's
`{ "message": "...", "errors": { "field": ["..."] } }`. Inventory create may
return `409` when a duplicate record exists. OTP send returns `202`.

Read `data` from the envelope (`res.data.data || res.data`), or use
`parseApiCollection`. For `422`, map `errors` to `Input` `error` props.

### 6.2 Pagination and filters

Paginated `data` is a Laravel paginator. Storefront `ProductList` and admin
tables accept both plain arrays and paginator shapes; prefer
`fetchAllPages`/`parseApiCollection` for admin listings.

- Products: `search` (name/sku), `category_id`, `brand_id`, `product_type`,
  `status`, `sort` (`newest`|`price_asc`|`price_desc`), `page`. Page size 10.
- Categories: `status`, `search`, `root_only`, `page`. Page size 10.
- Brands: `status`, `search`, `page`. Page size 10.
- Warehouses: `status`, `search` (name/code), `page`. Page size 10.
- Product variants: `page`. Page size 10.
- Inventories: `warehouse_id`, `product_id`, `variant_id`, `low_stock`,
  `per_page` (1–100), `page`. Default page size 10.
- Inventory movements: `warehouse_id`, `product_id`, `movement_type`,
  `per_page` (1–100), `page`. Default page size 10, newest first.
- Product serial numbers: `product_id`, `warehouse_id`, `status`, `search`,
  `per_page` (1–100), `page`. Default page size 10, newest first.
- Coupons: `page` only. Page size 10, newest first.
- Addresses: `page` only. Page size 10; defaults first, then newest.
- Cart: **not paginated**; returns a custom summary object.
- Product images: **not paginated** (plain array).
- Roles and Users are **not** paginated.

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

User (never contains password/social ids; `avatar` may be present):

```json
{
  "id": 1, "role_id": null, "name": "Jane", "email": "jane@example.com",
  "phone": null, "avatar": null, "email_verified_at": null,
  "phone_verified_at": null, "status": "active",
  "created_at": "...", "updated_at": "...",
  "role": { "name": "admin" }
}
```

Login response `data`: `{ token, token_type: "Bearer", expires_at, user }`.
Google callback redirects with `#token=...` (12-hour token).

Product:

```json
{
  "id": 1, "category_id": 2, "brand_id": 3, "name": "Laptop",
  "slug": "laptop", "sku": "LP-001", "short_description": "...",
  "description": "...", "product_type": "laptop", "price": "999.00",
  "compare_at_price": null, "cost_price": null, "currency": "USD",
  "warranty_months": 12, "specifications": { "ram": "16GB" },
  "track_inventory": true, "allow_backorder": false, "status": "active",
  "created_at": "...", "updated_at": "...",
  "category": {}, "brand": {},
  "images": [{ "image_url": "...", "is_primary": true }]
}
```

`images` is only eager-loaded on the products index. Product `show` returns
category/brand only; `ProductDetail` fetches `/products/{id}/images` separately.
**Product responses do not include `stock`.** `ProductList`/`ProductDetail`
treat `product.stock === 0` as unavailable; since it is `undefined`, they rely
on `status` for availability. Do not invent stock values.

ProductImage: `{ id, product_id, image_url, cloudinary_public_id, alt_text,
is_primary, sort_order, created_at, updated_at }`. `image_url` must be a hosted
URL; there is no upload endpoint.

ProductVariant: `{ id, product_id, sku, name, attributes, price, cost_price,
status, created_at, updated_at }`.

Warehouse: `{ id, name, code, address, phone, status, created_at, updated_at }`.

Inventory: `{ id, warehouse_id, product_id, variant_id, quantity,
reserved_quantity, reorder_level, updated_at, warehouse, product, variant }`.
There is no `created_at` and the `available_quantity`/`is_low_stock` accessors
are not appended, so compute availability in the UI if needed.

Address:

```json
{
  "id": 1, "user_id": 1, "recipient_name": "Jane", "phone": "012345678",
  "province": "Phnom Penh", "district": null, "commune": null, "village": null,
  "address_line": "123 Street", "delivery_note": null, "is_default": true,
  "created_at": "...", "updated_at": "..."
}
```

Cart summary (custom shape, not a raw model):

```json
{
  "id": 1, "user_id": 1,
  "items": [
    {
      "id": 10, "cart_id": 1, "product_id": 2, "variant_id": null,
      "quantity": 2, "unit_price": 999.0,
      "product": { "id": 2, "name": "Laptop", "sku": "LP-001", "price": 999.0, "image_url": "..." },
      "variant": null
    }
  ],
  "item_count": 2, "subtotal": 1998.0,
  "discount": 0, "delivery_fee": 0, "total": 1998.0
}
```

An empty/missing cart returns `id: null`, `items: []`, and zero totals. Coupon
discounts and shipping are not applied by the backend yet.

Coupon:

```json
{
  "id": 1, "code": "SAVE10", "description": "10% off",
  "discount_type": "percentage", "discount_value": "10.00",
  "minimum_order_amount": "0.00", "maximum_discount_amount": null,
  "usage_limit": null, "usage_count": 0,
  "starts_at": null, "expires_at": null, "status": "active",
  "created_at": "...", "updated_at": "..."
}
```

`POST /coupons/validate` returns
`{ coupon_code, discount_type, discount_value, order_amount, discount_amount, final_amount }`
where the amount fields are 2-decimal strings. `usage_count` is not incremented
by validation.

InventoryMovement:

```json
{
  "id": 1, "warehouse_id": 1, "product_id": 2, "variant_id": null,
  "user_id": null, "movement_type": "stock_in", "quantity_change": 5,
  "reference_type": null, "reference_id": null, "notes": null,
  "created_at": "...", "warehouse": {}, "product": {}, "variant": null, "user": null
}
```

Creating a movement returns
`data: { movement, inventory: { quantity, reserved_quantity, available_quantity, reorder_level } }`.
Valid movement types: `stock_in`, `stock_out`, `sale`, `return`, `adjustment`,
`reservation`, `release`.

ProductSerialNumber:

```json
{
  "id": 1, "product_id": 2, "variant_id": null, "warehouse_id": 1,
  "serial_number": "SN-0001", "status": "in_stock", "order_item_id": null,
  "created_at": "...", "updated_at": "...", "product": {}, "variant": null, "warehouse": {}
}
```

Valid statuses: `in_stock`, `reserved`, `sold`, `returned`, `repair`,
`written_off`. `DELETE` returns `422` for `sold`/`reserved` serials.

### 6.4 OTP and password reset

Purposes: `registration`, `login`, `password_reset`, `change_contact`.
6 digits, expire in 5 minutes, max 5 attempts.

Response codes: `202` success (including generic privacy response), `422`
validation, `429` rate-limited, `503` delivery failure. Rate limits: send 3/min
per IP and 5/hour per email; verify 10/min per IP and 10/hour per email. Surface
`429`/`503` messages gracefully.

Password reset is a three-step flow: `POST /otp/send`
(`purpose=password_reset`) → `POST /otp/verify` → `POST /password/reset` with
`email`, `password`, `password_confirmation`. The final call fails unless the
OTP was verified first.

### 6.5 API client guidance

- Use the shared client in `src/services/api.js`; never hardcode URLs in
  components.
- Add new endpoints as functions in the matching `services/*.js` file.
- Axios errors already expose `err.response.status`, `err.response.data.errors`,
  and `err.message`. Convert to toast messages with `errorMessage()`; do not
  swallow silently.
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
- Currency uses `formatMoney` (USD by default); dates use `formatDate`/
  `formatDateTime`. Do not hand-format.
- Destructive actions go through `ConfirmDialog` and re-fetch after success.

---

## 8. Known Pitfalls

1. **Some feature endpoints are still missing.** Storefront catalog, cart,
   addresses, checkout/orders, and ABA PayWay status can use real APIs. Profile
   update/password change and admin dashboard/orders/customers/reporting cannot.
   Do not assume a `404` means the UI is wrong.
2. **Backend authorization is incomplete.** Tokens exist for login and guard
   carts/coupons/addresses, but most CRUD routes (users/roles/catalog/inventory)
   are unprotected, and coupons have no admin check. `AdminRoute` is a UX guard
   only.
3. **New APIs are wired, but not everywhere.** Admin coupon CRUD, stock
   movements, and serial numbers are live. Storefront coupon entry is
   intentionally absent. `/cart` returns `discount: 0`; the backend can
   validate/apply a coupon during order creation, but the UI must not adjust
   totals client-side.
4. **Auth is partly wired.** Login, logout, current user, OTP, password reset,
   and Google work. `PUT /user` and `POST /user/password` don't. Register does
   not return a token, so the app may remain signed out after registration.
5. **No product stock in the API.** Availability checks based on
   `product.stock` are effectively undefined; use `status` until inventory is
   aggregated into products.
6. **No TypeScript.** Do not add `.ts`/`.tsx` files or type-only syntax.
7. **`AuthLayout` takes `children`** (with `<Outlet />` fallback). Auth routes
   pass children, not nested `<Route>` children — keep that pattern or migrate
   all auth routes together.
8. **`StrictMode` double-runs effects in dev.** Write idempotent effects and use
   cancellation flags for fetches; don't mistake it for a production bug.
9. **Image URLs can be absolute or relative.** Use `ImageFallback`. Product
   images are URL-only; there is no upload flow, and admin screens do not yet
   manage images/variants.
10. **User status** is `active` / `inactive` in the API; only offer accepted
    values.
11. **Bundle size warning.** The single JS chunk exceeds 500 kB after
    minification. `npm run build` still succeeds. If code-splitting, start with
    admin routes via `React.lazy`/`Suspense`.
12. **Do not export non-component values** from UI component files (lint warning).
    Context hook + provider exports are the accepted exception.
13. **Google callback is hash-based.** Read `window.location.hash`, scrub it
    with `history.replaceState`, and never log the token. If `FRONTEND_URL` on
    the backend is wrong, the callback lands on the wrong origin.
14. **Cart context hides backend errors.** It falls back to an empty cart when
    `/cart` fails, so authentication or server errors can look like an empty
    cart. Keep that in mind when debugging.
15. **`.env` handling.** `.env` is gitignored. Never print or commit its
    contents; backend SMTP/OAuth credentials live in the backend `.env`, not
    here.

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

1. Wire a checkout coupon selector against the backend quote/order APIs without
   calculating discounts in the browser.
2. Wire profile update and password change once `PUT /user` and
   `POST /user/password` exist (OTP flow where required).
3. Connect admin dashboard, orders, customers, and reports to real endpoints.
4. Add product image/variant management to the admin product screens once write
   endpoints are used (services currently provide read helpers only).
5. Derive storefront stock/availability from inventory once the backend exposes
   an aggregate.
6. Coupon usage is not persisted: `usage_count` never increments (no orders),
   so treat the usage column as informational.
7. Code-split admin routes to resolve the chunk-size warning.
8. Add Vitest + React Testing Library if tests are requested.
9. Add consistent document titles if requested.

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
