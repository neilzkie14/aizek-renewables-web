# AIZEK Renewables frontend

Responsive React + TypeScript + Vite marketing frontend implementing `docs/AIZEK_Renewables_Frontend.md`. Includes Tailwind CSS, React Router, React Hook Form + Zod, TanStack Query, and Lucide icons.

## Run locally

Node.js 22.12+ (or 20.19+) and Yarn Classic are required.

```sh
yarn install
yarn dev
```

```sh
yarn lint
yarn typecheck
yarn test
yarn build
yarn vite preview
```

Deploy the generated `dist/` folder to any static hosting provider. Configure an SPA fallback to `index.html` if adding routes. The project is deployed on Vercel at https://aizek-renewables-web.vercel.app, connected to the GitHub main branch.

## Content and branding

No screenshot, logo, approved project photos, reviews, company contacts, or pricing were present in the repository. The text wordmark is a temporary brand treatment. Approximate navy `#0c2038`, gold `#f5c644`, and white theme tokens live in `src/styles.css`; confirm against brand assets before launch.

`src/data/content.ts` contains explicitly labeled illustrative Unsplash photography, not AIZEK installations. Replace it with optimized, approved local WebP/AVIF photos and verified project metadata. The carousel supports touch gestures, left/right arrows, controls, pagination, and unavailable-image fallback. Approved testimonials can be added to the typed array; only approved entries are displayed. Process descriptions are explicitly a typical journey pending confirmation. Remote images and Google Fonts require network access; system font fallbacks and image fallback backgrounds remain usable offline.

## Calculator configuration

`src/features/calculator/calculation.ts` isolates validation and computation. Defaults are **illustrative assumptions**, not locally sourced engineering data:

- Electricity rate: PHP 12/kWh, editable by the user
- Peak sun hours: 4.5/day, not derived from the entered location
- Performance ratio: 0.80 before additional user-entered shading
- Panels: 550 W, 2.6 m² each, before site clearances
- Self-consumption: 70%, capped by monthly demand
- Periods: 365 days/year, 365/12 days/month
- Export credit: zero; installation price and payback omitted

Additional shading is applied once, on top of the baseline losses. Roof area caps the panel count; a roof smaller than one panel produces a zero-capacity result with a warning. Battery selection is a preference only, not an energy-storage simulation. Changing a calculator input invalidates the previous output to prevent stale results. Province and municipality are validated free text, ready for a future authoritative location dataset.

## Backend dependencies

`src/services/publicApi.ts` defines future typed adapters for:

- GET `/api/v1/public/projects`
- GET `/api/v1/public/testimonials`
- POST `/api/v1/estimates/calculate`

These are **not connected or verified**. The frontend intentionally uses the local illustrative calculator until an authoritative endpoint is available. Validate backend response data at the integration boundary before switching sources. TanStack Query is initialized for future API integration.

No lead endpoint was supplied. The quotation dialog validates fields, consent, and the calculator summary in browser memory; it never transmits or persists details and never claims submission success. Its review action explicitly reports the missing integration. Add an actual backend lead adapter with submitting, success, error, server validation, rate limiting, and an approved privacy policy before enabling live requests. Do not embed credentials in browser code. No login, payment, or admin features are included.

## Phones and tablets

`src/responsive.css` adds dedicated phone/tablet layouts, 44px touch targets for key controls, 16px form inputs, decimal keyboard hints, safe-area insets, scrollable landscape navigation, and a scrollable quote dialog with background scroll locking. Browser zoom remains available. Tablets at widths up to 1024px use collapsible navigation and a stacked calculator. Phones at 600px and below use single-column form fields and content cards.

Responsive QA was performed in Chrome using CSS viewport overrides at 320×740, 360×800, 390×844, 430×932, 600×960, 768×1024, 820×1180, 1024×768, 1180×820, and 1366×1024. No horizontal document overflow was observed. The quote dialog was also checked at 320×740, 844×390 landscape, and 820×1180; oversized dialogs scroll within the overlay. These are browser viewport checks, not tests on physical Android/iOS devices. Before release, check Safari on an iPhone/iPad and Chrome on Android with the software keyboard open, pinch zoom, and device rotation.


## Appliance estimator

The default calculator now follows the supplied appliance-calculator GIF. Editable watts, daily hours, quantity steppers, and daytime/balanced/nighttime profiles update the system summary immediately. The original bill/consumption estimator remains under “By electricity bill.” A compact sticky summary keeps results visible when editing the longer appliance list on phones and tablets.

`src/features/calculator/appliances.ts` isolates its assumptions from the original bill calculator: 4 peak sun hours, 80% performance ratio, 620 W panels, 30 days/month, 5.1 kWh nominal battery modules, and 60% simultaneous connected load for the preliminary inverter allowance (rounded to configured capacities, starting at 3 kW). Assumed nighttime demand shares are 25%, 50%, and 75%. Battery capacity is nominal; usable capacity, reserve, conversion losses, starting surges, and actual simultaneous loads require professional design. No prices or guaranteed savings are supplied. The sample produces 14.26 kWh/day, 2,785 W connected load, 8 panels / 4.96 kWp, a 3 kW inverter allowance, and 10.2 kWh nominal battery capacity for balanced usage.

Quote requests retain a snapshot of the selected appliances, hours, quantities, usage profile, and sizing in browser memory. The quotation form still does not submit to a backend. Unit tests cover reference values, live-edit arithmetic, usage profiles, empty systems, invalid values, and snapshot isolation. Phone/tablet viewport checks cover 320, 390, 768, 820, 1024, and 1280px widths.
