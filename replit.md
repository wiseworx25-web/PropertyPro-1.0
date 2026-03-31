# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Property Pro | Wiseworx - Full-stack property management platform.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken + bcryptjs) with 8hr expiry
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Payments**: Paystack (https://paystack.shop/pay/nscrent)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── property-pro/       # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seed script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **users** - Owner, Admin, Tenant, Vendor roles
- **properties** - Property listings owned by owners
- **units** - Individual rental units with tier (Entry R1,600 / Small R2,400 / Medium R3,800)
- **leases** - Tenant-unit lease agreements
- **transactions** - Financial payments and expenses
- **maintenance_requests** - Tenant maintenance tickets assigned to vendors
- **notifications** - Per-user notification inbox
- **audit_logs** - System-wide activity audit trail

## Auth

JWT tokens stored in `property_pro_token` in localStorage, 8hr expiry.
Roles: owner, admin, tenant, vendor

## Demo Accounts

- owner@propertypro.com / owner123
- admin@propertypro.com / admin123
- tenant@propertypro.com / tenant123
- tenant2@propertypro.com / tenant123
- vendor@propertypro.com / vendor123

## Seed Data

Run: `pnpm --filter @workspace/scripts run seed`

## Key Features

- Role-based dashboards (Owner/Admin/Tenant/Vendor)
- Paystack rent payment integration
- Financial reporting with charts
- Maintenance request workflow
- Lease management
- PDF/CSV export capabilities
- Wiseworx branding throughout

## Branding

Logo: `artifacts/property-pro/public/assets/images/wiseworx-logo.png`
Also available as import: `@assets/wiseworxlogo_1774862605471.png`
Title: "Property Pro | Wiseworx"
