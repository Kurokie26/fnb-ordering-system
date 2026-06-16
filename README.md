# F&B Ordering System — Aetheria Bistro

A full-featured Food & Beverage Ordering & Operating System built with pure **HTML5, CSS3, and JavaScript** — no backend or build tools required.

## 🌐 Live Portals

| Portal | URL | Purpose |
|---|---|---|
| 🍽️ Guest Dining | `/` or `/guest` | Menu ordering, cart, order tracking, payment |
| 💼 Staff Backoffice | `/staff` | Kitchen queue, delivery dispatch, menu editor, sales |

## ✨ Features

### Guest Portal (`guest.html`)
- Table / Room number login gate
- Browse full menu by category
- Add to cart with quantity controls
- Floating cart button with live item count
- Real-time order status tracker (Pending → Cooking → Packaged → In Transit → Delivered)
- Delivery confirmation (✅ Correct / 🔴 Report Issue)
- Payment: Credit Card (immediate) or Charge to Room Bill

### Staff Backoffice (`staff.html`)  *(admin / admin)*
- Password-protected login
- **Kitchen Monitor** — Kanban board (Pending → Preparing → Ready)
- **Delivery Dispatch** — 4-point handoff checklist before dispatch
- **Menu & Sales** — Add/Edit/Delete/Toggle menu items, live sales ledger

## 🔄 How It Works
Both portals share `localStorage` as the data layer. Orders placed by guests appear instantly in the staff portal, and vice versa — no server required.

## 🚀 Deploy to Vercel
1. Fork/clone this repo
2. Import to [vercel.com](https://vercel.com) → select **Other** framework
3. Deploy — `vercel.json` handles routing automatically

## 📁 File Structure
```
├── guest.html       # Guest Dining Portal
├── staff.html       # Staff Backoffice
├── app-guest.js     # Guest logic (cart, ordering, payment)
├── app-staff.js     # Staff logic (kitchen, dispatch, admin)
├── styles.css       # Shared design system
├── menu-data.js     # Default menu seed data
├── vercel.json      # Vercel routing config
└── index.html       # Legacy unified simulator
```

## 🔑 Demo Credentials
- **Staff login:** `admin` / `admin`
- **Guest login:** Enter any table number (e.g. `5`)
