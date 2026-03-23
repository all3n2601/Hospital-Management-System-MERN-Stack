# Dashboard Redesign & Appointments Fix — Design Spec

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

Redesign all four role dashboards (Admin, Doctor, Patient, Nurse) to match the Modern Light UI style established in `ui-modern-v1.html` from the previous brainstorm session. Additionally fix a sidebar routing bug that prevents the Appointments page from opening.

---

## Bug Fix: Appointments Sidebar Route

**Problem:** `Sidebar.tsx` has a single `Appointments` nav item pointing to `/appointments`, which has no matching route in `App.tsx`. This causes a 404 for all roles that see the link.

**Fix:** Replace the single entry with role-specific routes:

| Role | Label | Route |
|---|---|---|
| `patient` | Appointments | `/patient/appointments` |
| `doctor` | Schedule | `/doctor/schedule` |
| `admin`, `receptionist` | Appointments | Remove — admins manage appts via Patients page |

---

## Design Language (ui-modern-v1 style)

All dashboards adopt these shared design tokens:

- **Background:** `#f8fafc` (content area), `#fff` (cards)
- **Cards:** `border-radius: 14px`, `border: 1px solid #f1f5f9`, subtle `box-shadow`
- **KPI cards:** 3px gradient top border (blue/green/amber/purple/pink), emoji icon in colored bg box, trend badge (↑/↓), SVG sparkline
- **Appointment rows:** Gradient avatar circle with initials, name + meta, time, status pill
- **Status pills:** Colored background + text per status (scheduled=blue, confirmed=green, inProgress=orange, completed=gray, cancelled=red, pending=amber)
- **Quick Actions:** 2×2 grid of bordered buttons with emoji icon + label + sub-label
- **Alerts/notifications:** Colored dot + text + timestamp
- **Topbar:** Sticky, frosted glass, breadcrumb left, search center-right, icon buttons + avatar right
- **Sidebar:** Grouped sections with labels, active state = indigo gradient bg, badge counts on items with pending work, user info + avatar in footer

---

## Admin Dashboard (`/admin/dashboard`)

**KPI Cards (4):** Total Patients (blue), Appointments Today (green), Revenue MTD (amber), Staff on Duty (purple) — all with sparklines and trend badges. Values fetched live from API.

**Main Grid (2:1):**
- Left: Tabbed appointments card (Today / Upcoming tabs) — appointment rows with avatar, patient name, specialty/doctor, time, status pill. "View all" footer link.
- Right column (stacked):
  - Quick Actions 2×2: New Patient, Book Appointment, New Invoice, Add Staff
  - Live Alerts: 3 most recent alerts (critical lab, low stock, invoice paid) with colored dots

**Bottom Grid (1:1):**
- Department Load: stat bar rows for each department showing occupancy %
- Pending Lab Results: list of pending/critical lab orders with patient, ordered-by, time since ordered, status pill

**API connections:**
- KPIs: `/patients?count=true`, `/appointments?date=today&count=true`, `/billing/revenue-mtd`, staff count uses `/staff` (static fallback "32" if no `onDuty` filter exists in backend)
- Appointments: `/appointments?date=today&limit=5`
- Lab pending: `/lab/orders?status=pending,processing&limit=5`

---

## Doctor Dashboard (`/doctor/dashboard`)

**KPI Cards (3):** Today's Patients (green), Pending Lab Orders (purple, with critical count sub-badge), Active Prescriptions (amber) — all with sparklines.

**Main Grid (2:1):**
- Left: Today's Schedule card — appointment rows with patient initials avatar, name + specialty + patientId, time, status pill. Footer: "Full schedule →" link.
- Right column (stacked):
  - Quick Actions 2×2: Prescribe, Order Lab, Issue Certificate, Patient Notes
  - Lab Results In: alert-style list of recent lab results (critical → red, awaiting review → amber, normal → green)

**API connections:** Already partially implemented — enhance existing `apptQuery`, `labQuery`, `rxQuery` with richer display.

---

## Patient Dashboard (`/patient/dashboard`)

**KPI Cards (4):** Upcoming Appointments (blue, with "Next: [day]" trend), Active Prescriptions (green), Lab Results (purple, with "N new" if unread), Outstanding Balance (amber, with "N due" if any unpaid).

**Main Grid (2:1):**
- Left: My Appointments card — each row shows a date-badge square (day + month in colored box), doctor name + specialty, time + reason, status pill. "Book new →" header link.
- Right column (stacked):
  - Quick Actions 2×2: Book Appointment, Refill Rx, Pay Bill, My Records
  - Active Prescriptions: 3 most active, with colored dot per status, drug name + dose + days remaining

**Below (full width):** Health Activity Timeline — recent events (lab result ready, appointment completed, prescription issued, invoice paid) with icon, title, sub-text, date.

**API connections:** Existing queries enhanced with richer display + Outstanding balance from `/billing?status=unpaid&count=true&sum=true`.

---

## Nurse Dashboard (`/nurse/dashboard`)

**KPI Cards (3):** Pending Dispense (amber, with count), Low Stock Items (purple), Lab Samples Collected Today (green).

**Main Grid (2:1):**
- Left: Dispensing Queue card — rows with patient initials avatar, patient name + patientId, drug name + quantity + prescribing doctor, status pill (Pending / Ready / Dispensed). "View all →" link.
- Right column (stacked):
  - Low Stock panel: stat bar rows for each low-stock item showing quantity vs reorder threshold, quantity number in red/amber
  - Quick Actions 1×2: Dispense (process script), Stock Check (inventory view) — only 2 actions relevant for nurse role

**API connections:**
- Dispense queue: `/pharmacy/dispensing?status=pending,ready&limit=5`
- Low stock: `/inventory?belowReorder=true&limit=5`

---

## Sidebar Updates (`Sidebar.tsx`)

Remove the broken single `Appointments` entry. Replace with:

```ts
{ label: 'Appointments', href: '/patient/appointments', icon: Calendar, roles: ['patient'] },
{ label: 'Schedule',     href: '/doctor/schedule',      icon: Calendar, roles: ['doctor'] },
```

Admin and receptionist roles manage appointments through the Patients page — no standalone appointments route exists for them.

---

## Shared Components

Where multiple dashboards repeat the same visual pattern, extract reusable components:

- **`KpiCard`** — accepts `title`, `value`, `trend`, `trendDir` (up/down/neutral), `color` (blue/green/amber/purple/pink), optional `sparklineData`. Used across all 4 dashboards.
- **`AppointmentRow`** — new lightweight component (not a variant of `AppointmentCard`). Shows initials avatar, name + meta, time, status pill in a horizontal row. `AppointmentCard` remains unchanged for use in the full Appointments page.
- **`AlertItem`** — dot + text + timestamp, used in admin and doctor dashboards.
- **`StatBar`** — label + progress bar + value, used in admin department load and nurse low stock.

---

## Files to Change

| File | Change |
|---|---|
| `frontend/src/components/layout/Sidebar.tsx` | Fix appointments routes |
| `frontend/src/pages/admin/Dashboard.tsx` | Full redesign with live API data |
| `frontend/src/pages/doctor/Dashboard.tsx` | Enhance with richer display + new layout |
| `frontend/src/pages/patient/Dashboard.tsx` | Enhance with richer display + timeline + balance |
| `frontend/src/pages/nurse/Dashboard.tsx` | Full redesign with dispensing queue + low stock |
| `frontend/src/components/Shared/KpiCard.tsx` | New shared component |
| `frontend/src/components/Shared/AlertItem.tsx` | New shared component |
| `frontend/src/components/Shared/StatBar.tsx` | New shared component |

---

## Out of Scope

- No backend changes — all data comes from existing API endpoints
- No new routes added
- No changes to any non-dashboard pages
- No dark mode implementation (deferred)
- No real-time socket updates (existing socket events unchanged)
