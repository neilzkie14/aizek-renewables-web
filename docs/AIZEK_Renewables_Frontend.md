# AIZEK Renewables — Frontend Development Specification

## 1. Objective
Build a responsive, production-ready marketing website for **AIZEK Renewables**, a Philippine solar installation company. Use the supplied screenshot as the visual reference. Preserve the existing navy-blue, golden-yellow, and white branding. The primary goals are to showcase completed installations, build trust through genuine customer testimonials, and help prospective clients estimate solar-system size and potential savings before requesting a quotation.

## 2. Technology and conventions
- React + TypeScript + Vite; Tailwind CSS; React Router.
- React Hook Form + Zod for validated calculator inputs; TanStack Query for future API integration; Lucide React icons.
- Use reusable components, semantic HTML, accessible controls, and responsive mobile-first layouts.
- Prefer Yarn for package management and omit JavaScript/TypeScript semicolons.
- Do not introduce Next.js, payment features, authentication, or an admin dashboard for this frontend scope.

## 3. Visual direction
- Follow the screenshot's dark navy hero and navigation, yellow primary buttons and headline accents, white text, muted blue-gray supporting text, and compact credibility/statistics strip.
- Preserve the brand identity; do not redesign the logo or invent new brand colors. Extract exact hex colors from existing project assets or design tokens when available; otherwise use clearly documented approximate tokens pending confirmation.
- Header: logo, Services, Size My System, Projects, How We Work, FAQ, Request a Quote. On mobile use an accessible collapsible menu.
- Hero: headline **“Solar for your home, sized and built right.”**, short service description, prominent **Estimate My System** CTA, secondary **See Our Installs** CTA, and a real installation photo.
- Keep the reference's professional, locally grounded aesthetic rather than a generic SaaS dashboard.
- Avoid invented company achievements, warranties, phone numbers, certifications, project locations, or customer endorsements. Render only verified content provided by the project; use clearly labeled placeholders in development.

## 4. Page sections
### A. Hero and service overview
- Explain solar consultation, load analysis, system sizing, installation, and available system types based on verified company offerings.
- CTAs scroll/navigate to calculator and project gallery.
- Responsive split hero: text left, photo right on desktop; stacked on mobile.

### B. Completed-installations photo carousel
- Carousel of genuine installation photos with optional project title, location, system size (kWp), installation type, and short description.
- Previous/next controls, pagination indicators, swipe/touch navigation, keyboard access, image alt text, and lazy loading.
- Optional automatic advancement must pause on hover/focus and respect reduced-motion preferences. No autoplay is required by default.
- Images should maintain consistent aspect ratios, avoid cropping key subjects, and support a fallback image/empty state.
- Store gallery items in a typed data structure, initially local mock content only when real assets are unavailable. Provide an adapter for future `GET /api/v1/public/projects` integration.

### C. Client testimonials
- Show verified client name/display name (with permission), location if approved, testimonial text, and optional project image or rating if verified.
- Responsive card layout or accessible slider; do not fabricate reviews, star ratings, or testimonials.
- If there are no approved testimonials, show an appropriate empty state or hide the section until content is available.
- Provide a typed data adapter for future `GET /api/v1/public/testimonials` integration.

### D. Automatic solar estimator
Build a clear, mobile-friendly estimator for prospective clients. This is a **planning estimate**, not an engineering design or binding quotation.

**Inputs:**
- Philippine location: province and city/municipality; optional latitude/longitude for future location-based irradiation lookup.
- Monthly electric bill in PHP **or** monthly consumption in kWh (select input mode).
- Electricity rate in PHP/kWh (editable; display its source or clearly label a user-entered/default assumption).
- Desired system: grid-tied or hybrid; optional battery backup preference.
- Optional roof area (m²), shading estimate, and peak sun hours if provided by a supported data source.

**Outputs:**
- Estimated monthly kWh consumption (if bill-based).
- Suggested PV capacity (kWp), panel wattage and count.
- Estimated daily/monthly/annual production (kWh).
- Estimated self-consumed solar energy, monthly and annual bill savings, and simple payback if reliable installation cost data is available.
- Optional estimated installation cost **range** only when configured with verified price assumptions; otherwise show **Request a quote** rather than an invented price.
- A summary of all assumptions and warnings, including roof-area limitations where enough data is available.

**Calculation rules:**
- Monthly consumption = monthly bill / electricity rate, when bill input is used; validate rate > 0.
- Daily consumption = monthly kWh / average days per month (configurable).
- Preliminary kWp = daily consumption / (peak sun hours × performance ratio), with both assumptions sourced from configuration or a future data service.
- Panel count = ceil(required watts / selected panel wattage).
- Installed kWp = panel count × panel wattage / 1000.
- Daily generation = installed kWp × peak sun hours × performance ratio; monthly and annual generation use the selected period assumptions.
- Distinguish self-consumption savings from exported-energy credits. Do **not** treat all production as offsetting retail-rate consumption or assume export credits equal retail tariffs.
- Avoid double-counting shading, inverter, temperature, and other losses within the performance ratio.
- Show an estimate confidence/assumptions notice; no guaranteed savings or universal Philippine electricity rate.
- If backend API exists, it is the authoritative calculator: integrate `POST /api/v1/estimates/calculate` using a typed request/response adapter. If it does not exist, implement a clearly isolated, testable preliminary calculation module and label the result as illustrative. Do not claim API integration is complete without a working endpoint.
- No login required for a prospective client's initial calculation. If the backend endpoint requires authentication, provide a dedicated, securely rate-limited public calculation route through backend development rather than embedding credentials in the browser.

### E. Request a quotation
- CTA directly beneath estimator results: **Request an Accurate Quote**.
- Form fields: name, contact number/email, municipality/province, system preference, and optional message. Include an explicit privacy notice/consent where needed.
- Prefill the form with a summary of calculator results (not sensitive information in query strings).
- Integrate a backend lead endpoint only if available; otherwise present a clearly marked integration TODO and avoid fake success confirmations.
- Show validation, submitting, success, and error states. Protect public submission endpoints on the backend with validation and rate limits.

### F. Supporting sections
- Brief How We Work steps: inquiry → assessment → proposal → installation (verify exact company process).
- Services, FAQ, and contact/footer with only confirmed business details.
- Keep sections concise; photo carousel, testimonials, and calculator are the main feature priorities.

## 5. Suggested component structure
```text
frontend/
  src/
    components/
      layout/Header.tsx
      layout/Footer.tsx
      home/Hero.tsx
      home/Services.tsx
      projects/ProjectCarousel.tsx
      testimonials/TestimonialSection.tsx
      calculator/SolarCalculator.tsx
      calculator/CalculatorResults.tsx
      quote/QuoteRequestForm.tsx
      common/SectionHeading.tsx
    data/
      projects.ts
      testimonials.ts
    features/calculator/
      calculation.ts
      schema.ts
      types.ts
    services/
      publicApi.ts
    pages/HomePage.tsx
    styles/
      index.css
    App.tsx
    main.tsx
```
Adapt to the existing repository structure rather than duplicating modules.

## 6. UX, accessibility, and performance
- Fully responsive at 320px through wide desktop sizes; avoid horizontal overflow.
- Accessible focus indicators, meaningful labels, alt text, keyboard carousel navigation, and sufficient contrast.
- Respect `prefers-reduced-motion`; prevent auto-rotating media from interfering with accessibility.
- Optimize photographs (WebP/AVIF where practical), lazy-load offscreen images, reserve dimensions to reduce layout shift, and avoid oversized dependencies.
- Clear loading/error/empty states and friendly validation messages.
- Basic SEO: meaningful title, description, Open Graph metadata, and appropriate headings.

## 7. Testing and acceptance criteria
- `yarn lint`, `yarn typecheck`, `yarn build` succeed.
- Unit tests verify bill-to-kWh, kWp, panel count, production, savings, invalid/zero inputs, and roof-capacity edge cases.
- Calculator results update consistently when inputs change; assumptions are visible.
- Photo carousel works with mouse, keyboard, and touch and does not break on mobile.
- Testimonials display only approved data and degrade gracefully when empty.
- Request-quote form validates inputs and never claims successful submission without a real backend response.
- All primary CTAs navigate or scroll to the intended section.
- No hard-coded production secrets, invented prices, fake testimonials, or unsupported performance guarantees.

## 8. Implementation order
1. Inspect the current React repository and reference screenshot; identify reusable assets and existing styling.
2. Define theme tokens, layout, responsive header, hero, and footer.
3. Build the project photo carousel with real images or explicitly labeled development placeholders.
4. Build testimonials section and empty state.
5. Build validated estimator UI and isolated calculation/API adapter.
6. Add quotation CTA/form and integration states.
7. Polish accessibility, responsive behavior, SEO, tests, and performance.

## 9. Deliverables
- Working React + TypeScript + Tailwind frontend.
- Responsive homepage closely matching the supplied branding reference.
- Installation carousel, testimonials, and functional preliminary solar calculator.
- API integration interfaces with clear notes about endpoints that are not yet available.
- Example configuration and README covering local setup, commands, asset replacement, calculator assumptions, and deployment.

## 10. Agent execution instructions
Read this specification and inspect the existing repository before coding. Preserve existing working features and brand assets. Implement only this frontend scope; avoid adding a full CRM, installer portal, or admin system. Work in small verifiable stages, run relevant checks after each stage, report files changed and unresolved backend dependencies, and do not represent placeholders as production data.
