# Sthānika Dashboard

React + TypeScript + Vite + Tailwind admin console for the Sthānika offline-mesh payments platform.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks, then builds to dist/
```

## Demo accounts (click to fill on the login page)

| Role     | Email                            | Password       |
| -------- | -------------------------------- | -------------- |
| Admin    | aarav.sharma1@sthanika.local     | admin123       |
| Merchant | priya.patel2@sthanika.local      | sthanika123    |
| User     | rohit.gupta3@sthanika.local      | sthanika123    |

## How it works

- `src/data/mock.ts` – deterministic seed data (same IDs on every load).
- `src/context/AuthContext.tsx` – accounts + session (localStorage).
- `src/context/DataContext.tsx` – devices, merchants, payments, sync queue, security alerts and audit log, with all actions (ban, approve, retry, resolve, pay, sync). Persisted to localStorage; **Reset demo data** in the sidebar restores the seed.
- `src/lib/` – formatting, role-based selectors, stats.

> Auth is demo-only: passwords are stored in plain text in localStorage. Swap in a real backend before deploying.
