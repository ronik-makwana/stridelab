# StrideLab

A full-stack e-commerce application with a customer storefront and an admin dashboard. React + Vite on the front end, Express + MongoDB on the back end, with Razorpay for payments.

## Tech Stack

**Frontend** — React 19, Vite 7, React Router 7, Tailwind CSS 4, Zustand (state), Axios, Zod (validation), Recharts (analytics charts), React Hot Toast

**Backend** — Node.js, Express 5, MongoDB via Mongoose 8, JWT auth over HTTP-only cookies, bcryptjs, Zod, Multer, Razorpay, Morgan

## Project Structure

```
ecommerce-app/
├── backend/
│   └── src/
│       ├── config/          # Database connection
│       ├── controllers/     # Route handlers
│       ├── middleware/      # Auth / admin guards
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routers
│       ├── validations/     # Zod schemas
│       └── server.js        # App entry point
└── frontend/
    └── src/
        ├── components/      # Shared UI
        ├── contexts/        # React contexts
        ├── hooks/           # Custom hooks
        ├── layouts/         # MainLayout, AdminLayout
        ├── pages/           # Storefront + admin pages
        ├── services/        # API clients (axios)
        ├── store/           # Zustand stores
        ├── utils/           # Helpers
        └── validations/     # Zod schemas
```

## Getting Started

### Prerequisites

- Node.js 20+ (developed on v22)
- A MongoDB database (local or Atlas)
- A Razorpay account for payment keys

### 1. Clone and install

```bash
git clone <repo-url>
cd ecommerce-app

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`** (see `backend/.env.example`):

```env
MONGO_URI=mongodb://localhost:27017/stridelab
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NODE_ENV=development
CLIENT_URI=http://localhost:5173
PORT=5000
```

**`frontend/.env`**:

```env
VITE_API_URI=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

> `CLIENT_URI` must match the frontend origin — it drives the CORS allowlist, and auth cookies are sent with `credentials: true`.

### 3. Run in development

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

The API listens on `PORT` (5000 by default) and the frontend on http://localhost:5173.

## Scripts

**Backend**

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start the server |

**Frontend**

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## API Overview

All routes are prefixed with `/api`. Protected routes read a JWT from an HTTP-only cookie; admin routes additionally require `role: "admin"`.

| Base | Endpoints |
| --- | --- |
| `/auth` | `register`, `login`, `logout`, `check-auth`, `profile`, `change-password`, `admin/users` |
| `/collections` | List, get, create, update, delete |
| `/products` | List, search, get, create, update, delete, plus product reviews |
| `/cart` | Get cart, add item, update item, remove item, clear |
| `/wishlist` | Get, add, remove, check by product |
| `/orders` | Razorpay create/verify, my orders, order detail, admin listing, stats, status updates |
| `/analytics` | Dashboard metrics |

## Features

- Browse collections, product detail pages, and search
- Cart and wishlist persisted per user
- Checkout with Razorpay order creation and payment verification
- Order history and order confirmation
- User registration, login, profile, and password change
- Admin dashboard: products, collections, orders, customers, and analytics charts

## Notes

- `.env` files are gitignored. Only `backend/.env.example` is tracked — keep real credentials out of version control.
