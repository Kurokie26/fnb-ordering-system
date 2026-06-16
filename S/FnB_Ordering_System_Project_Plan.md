# Food & Beverage Ordering System — Project Plan & Requirements Package

**Document Type:** Internal Project Plan (for Development Team)
**Status:** Draft v0.1 — For Review
**Prepared:** June 2026

> **Working Assumptions:** Property type and rollout scale were not specified, so this plan defaults to a single-property hospitality scenario (hotel/resort with in-room and outlet dining), since the guest/kiosk/tablet/smart-TV flow described maps most directly to that setting. The architecture, BRD/BRS, and costing model below are written to be modular so the same system can extend to multiple outlets or properties later. Adjust Sections 1.2, 7.4, and 8 once the actual property type and scale are confirmed.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Order Lifecycle & Process Flow](#2-order-lifecycle--process-flow)
3. [Notable Features](#3-notable-features)
4. [App Reference & Inspiration](#4-app-reference--inspiration)
5. [Recommended Technology Stack](#5-recommended-technology-stack)
6. [UI/UX Look & Feel](#6-uiux-look--feel)
7. [Requirements Documentation](#7-requirements-documentation)
8. [High-Level Timeline & Milestones](#8-high-level-timeline--milestones)
9. [Risks & Mitigations](#9-risks--mitigations)
10. [Appendix: Glossary](#10-appendix-glossary)

---

## 1. Project Overview

### 1.1 Background

Guests currently rely on phone calls or in-person requests to order food and beverages, which creates delays, order errors, and limited visibility for both guests and staff. This project introduces a digital F&B ordering system that lets guests order directly from a kiosk, in-room tablet, or smart TV, while giving staff a structured workflow to receive, prepare, deliver, and reconcile payment for every order.

### 1.2 Objective

Build an internal system that digitizes the full order lifecycle — from menu browsing to order placement, staff fulfillment, delivery confirmation, and payment closure — with full traceability of every order and every status change.

### 1.3 Scope

**In Scope (Phase 1)**
- Digital menu management for F&B administrators (items, categories, pricing, availability).
- Guest self-ordering via kiosk, tablet, and smart-TV interface.
- Staff order queue, delivery checklist, and delivery confirmation workflow.
- Payment status handling: Paid Immediately vs. Pay at Checkout (unpaid/charge-to-folio).
- Order closure and basic reporting (orders, revenue, delivery times).

**Out of Scope (Phase 1 — candidates for later phases)**
- Full kitchen production/inventory management (stock depletion, recipe costing).
- Loyalty programs and guest personalization/upselling engine.
- Multi-property/multi-currency rollout (architecture will allow it, but Phase 1 targets one property).
- Third-party marketplace delivery (this is an in-house/on-property ordering system only).

### 1.4 Success Metrics

| Metric | Target (Phase 1 Pilot) |
|---|---|
| Average time from order placed to delivered | ≤ 25 minutes (food), ≤ 10 minutes (beverages) |
| Order accuracy (delivered matches ordered) | ≥ 98% |
| Guest delivery confirmation rate | ≥ 95% of orders confirmed received within the app |
| Staff adoption (orders processed through system vs. phone) | ≥ 90% within 60 days of go-live |
| Payment reconciliation discrepancies | < 1% of closed orders |

### 1.5 Single Point of Contact (SPOC)

One named SPOC per workstream keeps decisions moving and gives the dev team a single person to escalate to per area. Names should be filled in before kickoff.

| Role | Workstream / Owns | Name |
|---|---|---|
| Project Sponsor | Budget approval, go/no-go decisions, escalations beyond SPOC level | TBD |
| Business / Product SPOC | Requirements sign-off, prioritization, BRD/BRS approval | TBD |
| Engineering SPOC (Tech Lead) | Architecture, tech stack decisions, sprint delivery | TBD |
| F&B Operations SPOC | Menu data, staff workflow validation, delivery checklist design | TBD |
| QA / UAT SPOC | Test plan, UAT sign-off, defect triage | TBD |
| IT / Infra SPOC | Network, device provisioning (kiosks/tablets/smart TVs), security | TBD |

---

## 2. Order Lifecycle & Process Flow

The order moves through a fixed sequence of states. Each state transition should be logged with a timestamp and actor for auditability and for the metrics in Section 1.4.

| Step | Actor | Action | Order Status |
|---|---|---|---|
| 1 | Guest | Browses menu and places order via kiosk / tablet / smart TV | Placed |
| 2 | Staff (F&B/Front Desk) | Receives order notification, accepts/acknowledges | Received / Accepted |
| 3 | Kitchen / Bar (optional KDS) | Prepares items | Preparing |
| 4 | Staff (Runner) | Picks order, completes Delivery Checklist, departs for delivery | Out for Delivery |
| 5 | Guest | Receives order and confirms via Delivery Confirmation (Received / Not Received) | Delivered (Confirmed) or Delivery Disputed |
| 6 | Guest / Staff | Payment captured immediately, or marked Unpaid for Pay-at-Checkout | Paid or Unpaid (Pending Checkout) |
| 7 | Staff / Front Desk / Cashier | Reconciles payment at checkout if Unpaid; closes the order | Closed / Finished |

> **Edge cases to design for:** guest marks "Not Received" (should re-open the order and alert a supervisor, not silently close it); guest cancels before acceptance; item is unavailable after order is placed (86'd mid-order); split payment (partial paid now, remainder charged to folio).

---

## 3. Notable Features

### 3.1 Menu Management

Used by F&B administrators/managers to keep the guest-facing menu accurate.

- CRUD for categories, items, modifiers/add-ons, and combo/set items.
- Price management, including time-based menus (breakfast/lunch/dinner/late-night) and outlet-specific pricing.
- Availability toggle ("86" an item instantly when stock runs out) — must propagate to guest screens in near real time.
- Item media (photos), descriptions, allergen and dietary tags (vegetarian, halal, contains nuts, etc.).
- Multi-language menu support (at minimum English + local language).
- Versioning/audit trail of menu changes (who changed what, when).

### 3.2 Guest Ordering

Used by guests on kiosk, in-room tablet, or smart-TV interface.

- Browse by category, search, filter by dietary tag.
- Cart with quantity, modifiers, and special instructions/notes.
- Guest/room or table identification (room number + last name check, or table QR/session) so orders route correctly.
- Order summary and estimated delivery time before submission.
- Real-time order status tracking after submission (Placed → Accepted → Preparing → Out for Delivery → Delivered).
- Order history for repeat ordering.

### 3.3 Order Delivery

This feature has three connected parts that must be designed together since they share one order record.

**3.3.1 Staff Delivery Checklist**
- Runner sees the order item list and must check off each item as packed/verified before marking "Out for Delivery."
- Mismatch handling: if an item can't be fulfilled, the runner flags it, which should trigger a guest notification and an option to substitute, remove, or wait.
- Optional photo-of-tray-before-departure for high-value or VIP orders (configurable).

**3.3.2 Paid Checklist (Payment Handling)**
- At point of delivery (or earlier, depending on outlet policy), staff or guest selects: Paid Now (card/digital wallet/cash collected on the spot) or Pay at Checkout (charged to room/folio, status = Unpaid).
- Paid Now should integrate with a payment terminal/gateway and immediately mark the order as settled.
- Pay at Checkout pushes a line item to the property's folio/billing system (PMS integration) and keeps the order "Unpaid" until the front desk reconciles it at guest checkout.

**3.3.3 Guest Delivery Confirmation**
- Guest is prompted (in-app, or staff hands a tablet) to confirm: "Order Received" or "Not Received / Issue."
- "Order Received" closes the delivery step and starts/finishes the payment step.
- "Not Received / Issue" reopens the order, notifies the F&B supervisor, and excludes the order from the on-time delivery metric until resolved.

---

## 4. App Reference & Inspiration

Rather than building from a blank slate, it's worth studying how established hospitality F&B and ordering platforms solve the same problems. None of these need to be purchased — they're reference points for UX and workflow patterns the dev team can borrow from.

| Platform | Best Known For | What to Borrow |
|---|---|---|
| Duve | Guest experience platform; rated #1 Mobile Ordering & Room Service in the 2026 HotelTechAwards | Single guest-facing app pattern that unifies in-room dining with other guest requests, reducing the number of apps a guest has to juggle. |
| RoomOrders | Contactless in-room dining via guests' own devices | QR-to-menu flow (no app download), and POS/payment gateway integration pattern for in-room ordering. |
| Bbot | Self-service ordering and room service software | Order queue UX for staff and tight order-to-fulfillment time tracking. |
| Toast (tableside ordering) | Handheld POS + Kitchen Display System for restaurant/hotel F&B outlets | Kitchen Display System pattern for routing "Preparing" status to kitchen screens, plus tableside self-ordering UX. |
| Mews / similar PMS-integrated platforms | Connecting F&B orders and spend to the guest folio in the property management system | The "charge to room" / Pay-at-Checkout integration pattern (Section 3.3.2) — this is the part most hospitality ordering apps treat as a first-class integration, not an afterthought. |

> **Recommendation:** time-box 1–2 days for the product/UX team to walk through demos or trial accounts of two or three of the above before locking the wireframes in Section 6 — borrowing a proven pattern is cheaper than re-discovering it during UAT.

---

## 5. Recommended Technology Stack

This is a starting recommendation for an internal build. Swap any row for the team's existing standard if one already exists — consistency with current stack usually outweighs any marginal technical advantage.

| Layer | Recommended Option | Why |
|---|---|---|
| Guest kiosk / tablet app | Progressive Web App (PWA) — React or Vue, installable on Android/iOS tablets and kiosk browsers | One codebase covers kiosk, tablet, and (via casting/WebView) smart TV; no app-store distribution needed for internal devices. |
| Smart TV interface | Same PWA rendered through the TV's built-in browser or a thin native wrapper (Android TV / Tizen / webOS) if the property's TV system requires it | Avoids building a fully separate native TV app unless the existing in-room entertainment system mandates it. |
| Staff app (order queue, delivery checklist) | Responsive web app (same frontend framework) or a lightweight native Android app for handheld scanners/runners | Staff devices are usually Android tablets/handhelds in hospitality; web-first keeps one codebase, native only if offline support is critical. |
| Backend API | Node.js (NestJS) or similar, REST + WebSocket | WebSocket/Socket.io needed for real-time order status push (Section 2) to guest and staff screens. |
| Database | PostgreSQL | Strong relational integrity for orders, payments, and audit trails; mature support for reporting queries. |
| Real-time/notifications | Socket.io or MQTT broker, plus push notifications for staff handhelds | Order state changes must reach staff and guest screens within seconds, not on a polling delay. |
| Payments | PayMongo, Maya, or GCash for digital wallet/card capture; cash drawer reconciliation for Pay-Now-cash | Common Philippine payment gateways for Paid-Now flows; confirm against the property's existing merchant agreements. |
| PMS / Folio integration | Property's existing PMS API (e.g., Mews, Cloudbeds, Oracle Opera, or in-house PMS) | Required for the Pay-at-Checkout / charge-to-folio path in Section 3.3.2 — confirm API availability before committing to this flow. |
| Hosting / infra | Docker containers on a managed cloud (AWS/Azure/GCP) or on-prem if guest data residency requires it | Containerization keeps the guest app, staff app, and backend independently deployable as the system grows to more outlets. |
| Admin dashboard | React/Next.js web app | Menu management (Section 3.1) and reporting; desktop-first, used by managers. |

---

## 6. UI/UX Look & Feel

### 6.1 Design Principles

- Guest-facing screens (kiosk/tablet/TV): large touch targets, high-contrast imagery-led menu cards, minimal text entry, and a visible cart at all times.
- Smart TV specifically: remote-control/D-pad navigable as a fallback to touch, larger base font size, and a simplified "big button" ordering path.
- Staff-facing screens (order queue/checklist): information-dense, status-color-coded (e.g., new = blue, preparing = amber, ready = green, delayed = red), optimized for one-handed handheld use while carrying a tray.
- Consistent property branding (logo, color palette, typography) on guest-facing screens; staff screens prioritize speed and clarity over branding.
- Accessibility: minimum 4.5:1 text contrast, scalable text, and an audio cue on order-status changes for staff handhelds.

### 6.2 Core Screens (Guest)

1. Welcome / Room-Number or Table Identification
2. Menu Browse (category tabs, search, filter by dietary tag)
3. Item Detail (modifiers, special instructions, add to cart)
4. Cart / Order Review
5. Order Confirmation + Estimated Time
6. Live Order Status Tracker
7. Delivery Confirmation (Received / Not Received)
8. Payment Choice (Pay Now / Charge to Room) + Receipt

### 6.3 Core Screens (Staff)

1. Order Queue (incoming, accepted, preparing, ready)
2. Order Detail + Delivery Checklist
3. Delivery / Payment Capture screen (mark Paid Now or Unpaid–Charge to Room)
4. Exceptions/Alerts view (Not Received, item unavailable, delayed orders)
5. Manager Dashboard (menu management entry point, daily order/revenue summary)

---

## 7. Requirements Documentation

### 7.1 Business Requirements Document (BRD)

**7.1.1 Business Objective**

Replace manual/phone-based F&B ordering with a traceable digital workflow that reduces order errors, shortens delivery time, and gives management visibility into every order's status and payment outcome.

**7.1.2 Stakeholders**

| Stakeholder | Interest |
|---|---|
| Guests | Fast, accurate ordering without needing to call or wait for staff; clear payment options. |
| F&B Service Staff / Runners | A clear, single queue of what to deliver next and a fast way to confirm delivery and payment. |
| Kitchen / Bar Staff | Visibility into incoming orders without relying on verbal handoffs. |
| Front Desk / Cashier | Accurate, automatic posting of Unpaid orders to the guest folio for checkout. |
| F&B / Operations Management | Reporting on order volume, delivery times, and revenue; ability to manage the menu without engineering help. |
| IT / Engineering | A maintainable system that integrates cleanly with existing POS/PMS infrastructure. |

**7.1.3 Business Rules**

- An order cannot be marked "Closed" unless its delivery is confirmed (Received) and its payment status is Paid.
- An item marked unavailable (86'd) must be removed from guest-facing menus within the same operational shift it is disabled.
- Pay-at-Checkout orders must post to the guest folio no later than the next PMS sync cycle (target: real-time, fallback: every 5 minutes).
- A "Not Received" confirmation must notify a supervisor within 1 minute and may not be auto-closed by the system.

**7.1.4 Assumptions & Constraints**

- Guests have access to a kiosk, in-room tablet, or smart TV with network connectivity; no requirement for guests to install a personal app in Phase 1.
- The property has (or will provide) a PMS with an API for folio posting; without this, Pay-at-Checkout becomes a manual front-desk process instead of automated.
- Menu content (items, prices, photos, allergens) will be supplied by F&B operations before each environment's go-live.

### 7.2 Business Requirements Specification (BRS)

**7.2.1 Functional Requirements**

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Admin can create, edit, deactivate, and delete menu items, categories, and modifiers. | Must |
| FR-02 | Admin can mark any item unavailable in real time; change reflects on guest screens within 60 seconds. | Must |
| FR-03 | Guest can browse the menu, build a cart, add special instructions, and submit an order tied to a room/table identifier. | Must |
| FR-04 | System sends a real-time notification of new orders to the relevant staff queue. | Must |
| FR-05 | Staff can acknowledge/accept an order, changing its status to "Accepted." | Must |
| FR-06 | Staff can step through a Delivery Checklist confirming each item before marking "Out for Delivery." | Must |
| FR-07 | Guest can confirm delivery as "Received" or "Not Received," with an optional reason/comment. | Must |
| FR-08 | "Not Received" reopens the order and alerts a supervisor role. | Must |
| FR-09 | Staff or guest can record payment as "Paid Now" (with payment method) or "Unpaid — Charge to Room." | Must |
| FR-10 | "Unpaid" orders post a line item to the PMS/folio for reconciliation at checkout. | Must |
| FR-11 | An order can only transition to "Closed" once delivery is confirmed and payment is settled. | Must |
| FR-12 | Managers can view a dashboard of orders, statuses, delivery times, and payment status, filterable by date/outlet. | Should |
| FR-13 | System supports at least two languages on the guest-facing menu. | Should |
| FR-14 | Guest can view past orders for repeat ordering. | Could |
| FR-15 | System logs every status transition with timestamp and actor for audit purposes. | Must |

**7.2.2 Non-Functional Requirements**

| Category | Requirement |
|---|---|
| Performance | Guest menu screens load in under 2 seconds on the property's standard in-room/kiosk network; order status updates propagate to staff/guest screens within 5 seconds. |
| Availability | Core ordering and staff workflow available 99.5%+ during operating hours; system degrades gracefully (e.g., to a manual fallback process) rather than blocking all ordering on an outage. |
| Scalability | Architecture supports adding additional outlets/properties without a schema redesign (multi-tenant-ready data model). |
| Security | Guest sessions are scoped to a room/table only — no guest can view or act on another guest's order. Payment data handled by a PCI-DSS-compliant gateway; the system itself never stores raw card numbers. |
| Auditability | Every order status change is logged with timestamp, actor, and old/new status for at least 12 months. |
| Usability | A new staff member should be able to process an order (accept → checklist → deliver → payment) correctly after a 10-minute walkthrough, with no written manual needed for the core flow. |
| Compatibility | Guest interface renders correctly on common kiosk/tablet browsers and at least one major smart-TV browser engine used by the property's existing in-room entertainment system. |

### 7.3 Proof of Concept (POC) Plan

**7.3.1 Objective**

Validate the riskiest assumptions — real-time order status propagation, the staff delivery checklist workflow, and PMS/folio posting for Pay-at-Checkout — before committing to full build.

**7.3.2 Scope of POC**

- One guest ordering flow (kiosk or tablet only — smart TV can be deferred to the full build).
- One staff flow: receive → checklist → deliver → guest confirms → payment choice.
- A mocked or sandboxed PMS integration if a live API isn't yet available, to prove the data contract works.

**7.3.3 Timeline (Indicative)**

| Week | Activity |
|---|---|
| Week 1 | Environment setup, finalize POC scope and success criteria with SPOCs. |
| Week 2 | Build guest ordering flow + staff order queue (no checklist/payment yet). |
| Week 3 | Build Delivery Checklist, Guest Delivery Confirmation, and Paid/Unpaid capture. |
| Week 4 | Connect mock or sandbox PMS posting; internal demo and go/no-go decision for full build. |

**7.3.4 Exit / Success Criteria**

- An order can be placed, accepted, checklisted, delivered, confirmed, and closed end-to-end without manual database intervention.
- Order status changes are visible on the relevant screen within 5 seconds, in a live demo with at least 10 concurrent test orders.
- Business SPOC and F&B Operations SPOC both sign off that the workflow matches real on-property operations.

### 7.4 Costing

> No scale or property type was confirmed, so cost is modeled here as effort (person-days) by module rather than a fixed currency figure. Multiply the totals by your team's actual blended day-rate to get a budget number — this avoids quoting a market rate that may not reflect your team's actual cost structure.

**7.4.1 Effort Estimate by Module**

| Module | Roles Involved | Estimated Effort (person-days) |
|---|---|---|
| Discovery, BRD/BRS finalization, UX wireframes | Business Analyst, UX Designer | 10–15 |
| Menu Management (admin) | Backend Dev, Frontend Dev | 12–18 |
| Guest Ordering (kiosk/tablet/TV) | Frontend Dev (x2), Backend Dev | 20–30 |
| Staff Order Queue + Delivery Checklist | Frontend Dev, Backend Dev | 15–20 |
| Payment capture (Paid Now) + gateway integration | Backend Dev, QA | 10–15 |
| PMS/Folio integration (Pay at Checkout) | Backend Dev, Integration Specialist | 10–20 (varies heavily by PMS API quality) |
| Admin/reporting dashboard | Frontend Dev, Backend Dev | 10–15 |
| QA, UAT support, bug-fixing | QA Engineer | 15–20 |
| DevOps/infra setup, deployment | DevOps Engineer | 8–12 |
| Project management / SPOC coordination (run throughout) | Project Manager | 20–25 |

**7.4.2 Recurring / Non-Labor Costs to Budget Separately**

- Cloud hosting (compute, database, storage) — scales with number of outlets and order volume.
- Payment gateway transaction fees (per-transaction, charged by the provider, e.g., PayMongo/Maya/GCash).
- Kiosk/tablet hardware procurement and smart-TV compatibility testing, if not already owned by the property.
- PMS integration/API licensing fees, if the property's PMS vendor charges for third-party API access.
- Ongoing support/maintenance post-launch (commonly budgeted as 15–20% of build cost per year as a planning placeholder — confirm against your own SLA needs).

### 7.5 User Agreement (Guest Terms of Use — Draft Outline)

A short, guest-facing terms acknowledgment is recommended at first use (e.g., on the kiosk welcome screen) rather than a long legal document. Suggested clauses for legal/compliance to review and finalize:

1. **Acceptance:** by placing an order through this system, the guest agrees to these terms.
2. **Order accuracy:** the guest is responsible for reviewing the cart before submitting; modifications after staff acceptance may not be possible.
3. **Pricing & charges:** displayed prices are inclusive/exclusive of service charge and tax (state which); charges for Pay-at-Checkout orders will appear on the guest's final folio.
4. **Allergens:** allergen tags are provided as guidance; guests with severe allergies should confirm directly with staff before ordering.
5. **Cancellation:** orders may be cancelled only before staff acceptance; once "Accepted," cancellation requires contacting staff directly.
6. **Payment:** card/digital wallet payments are processed by [payment gateway name]; the property does not store card details.
7. **Data use:** order history and room/table identifiers are used only to fulfill and improve service, per the property's privacy policy.

> This is a starting outline, not a finished legal document — have it reviewed by legal/compliance before publishing, especially the tax/service-charge and data-privacy clauses, which vary by jurisdiction.

### 7.6 User Feedback Plan

**7.6.1 Feedback Touchpoints**

- Immediately after Delivery Confirmation: a single-tap rating (e.g., 1–5 stars or thumbs up/down) on the order itself.
- On "Not Received / Issue": a required short text field so the supervisor has context before following up.
- Periodic (e.g., monthly) longer survey to a sample of guests, covering menu variety, ordering ease, and delivery speed.

**7.6.2 Sample Post-Order Feedback Fields**

- Overall satisfaction (1–5 stars)
- Order accuracy (Yes/No)
- Delivery speed (1–5 stars)
- Optional comment (free text)

**7.6.3 Feedback Loop**

- Ratings below a set threshold (e.g., ≤2 stars) auto-flag to the F&B Operations SPOC for follow-up within 24 hours.
- Aggregate feedback feeds into the manager dashboard (Section 6.3) so trends are visible without manually compiling reports.
- Feedback themes are reviewed in a recurring (e.g., bi-weekly) ops meeting and tracked as backlog items if they require a product change.

---

## 8. High-Level Timeline & Milestones

Indicative only — to be re-baselined once team size and the confirmed scope from Section 1.3 are locked.

| Phase | Duration | Key Deliverables |
|---|---|---|
| Discovery & BRD/BRS sign-off | 2 weeks | Finalized BRD/BRS, wireframes, confirmed tech stack and SPOC list. |
| POC | 4 weeks | Working end-to-end POC per Section 7.3, go/no-go decision. |
| Full Build — Core Modules | 8–10 weeks | Menu Management, Guest Ordering, Staff Queue, Delivery Checklist. |
| Full Build — Payments & Integrations | 4–6 weeks | Paid Now gateway, PMS/folio integration for Pay-at-Checkout. |
| QA & UAT | 3 weeks | Test execution, defect fixes, UAT sign-off from Business and Ops SPOCs. |
| Pilot Launch | 2 weeks | Single-outlet/property pilot, feedback loop active (Section 7.6). |
| Stabilization & Rollout Planning | 2 weeks | Bug-fix pass, decision on rollout to additional outlets/properties. |

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| PMS has no usable API for folio posting | High — Pay-at-Checkout becomes manual | Confirm PMS API availability during Discovery (Section 7.3) before committing the integration timeline. |
| Smart-TV browser/casting compatibility is limited on existing in-room hardware | Medium — guest ordering channel reduced to kiosk/tablet only | De-scope smart TV to Phase 2 if hardware testing in Week 1 of POC shows blockers. |
| Staff resist switching from phone-based ordering | Medium — low adoption, missed success metric (Section 1.4) | Involve F&B Operations SPOC early; design the staff UI for speed; run a short pilot with hands-on training. |
| Menu data (photos, allergens, pricing) not ready in time | Medium — delays go-live | Set a menu-data deadline tied to the UAT milestone, owned by F&B Operations SPOC. |
| Payment gateway PCI-DSS scope creep | High — compliance delay | Use a hosted/tokenized payment gateway integration so card data never touches internal servers. |

---

## 10. Appendix: Glossary

| Term | Meaning |
|---|---|
| SPOC | Single Point of Contact — the one named person accountable for a given workstream. |
| BRD | Business Requirements Document — describes the business problem, objectives, and rules. |
| BRS | Business Requirements Specification — the detailed functional and non-functional requirements derived from the BRD. |
| POC | Proof of Concept — a small, time-boxed build used to validate the riskiest assumptions before full investment. |
| KDS | Kitchen Display System — a screen in the kitchen/bar showing incoming orders, replacing printed tickets. |
| PMS | Property Management System — the hotel's core system for reservations, room status, and the guest folio/billing. |
| Folio | A guest's running bill at a hotel, to which Pay-at-Checkout F&B charges are posted. |
| UAT | User Acceptance Testing — the stage where business/ops stakeholders confirm the system meets requirements. |
