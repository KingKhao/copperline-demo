# Relay Plumbing & Electric: fictional service-call sales demo

Created October 26, 2026 for Clinch Valley Digital's "Example Sites". Relay is not a real business.

- Static HTML, CSS and vanilla JavaScript (`index.html`, `styles.css`, `app.js`). No build step, backend, API keys, cookies or storage.
- Search indexing is disabled (`noindex` meta tag and `X-Robots-Tag` header in `vercel.json`).
- Every flow is a front-end mock. Nothing typed into the page is saved or sent, and each confirmation says so.
- Published: https://relay-plumbing-electric-demo.vercel.app/ . Source: https://github.com/KingKhao/relay-plumbing-electric-demo . Renamed from Copperline Plumbing & Electric on October 27, 2026; the previous plumbing-demo address remains available.
- Vercel's internal project name is still `copperline-demo`. The separate HVAC example is `copperline-heating-air-demo`; do not overwrite it when publishing this plumbing/electrical site.

## Preview in five lines
1. Open `index.html` in a current browser (or run `python -m http.server` in this folder and open http://localhost:8000).
2. Stay online for the Unsplash photos and the Google font.
3. Watch the dispatch board: a truck changes status about every 4 seconds and moves on the route map.
4. In "What's wrong?" pick a problem, answer two questions, then press "Request a tech" to land in the booking form with it filled in.
5. Narrow the window to phone width: the Call now / Request a tech bar stays pinned to the bottom.

## Fictional facts
Relay Plumbing & Electric, 77 Spring Branch Lane, Rogersville, TN 37857 (invented address), (423) 555-0192 (fictional 555 number).
Office Mon–Fri 7–6, Sat 8–2, Sunday emergencies only; emergency line 24/7. $79 trip fee credited to the repair; $125 flat after-hours fee.
Techs Dale, Rosa, Marcus and Jen in Trucks 1–4 (demo data). Service area: Rogersville, Church Hill, Mount Carmel, Surgoinsville, Bulls Gap,
Mooresburg, Eidson, Persia; Sneedville, Kingsport and Morristown are "call first". HomeCare $16/month, HomeCare Plus $27/month.
Reviews are labelled on the page as samples written for the demo. No license, certification or award is claimed.

## Design
Built with the design-taste-frontend skill. Direction "The well-kept board" (seed 1179869965): the page is the company's dispatch board,
tiles fitted edge to edge. Palette from the brief (off-white, deep navy, one safety yellow). Libre Franklin only (the dealt serif text face
was dropped for a single utility face). Signature move: the yellow "Pipe burst? Power out?" marquee.
Final inspector run: 0 FAIL at 1440/768/390, with `--allow covered-text` because the fixed mobile Call bar (a brief requirement) passes
over headings while scrolling.

## Features mapped to the brief
| Problem | What the page does |
|---|---|
| Emergency panic | Hero leads with "Pipe burst? Power out?", a big Call now button, the 24/7 line in the hours block, and an "office open/closed" line that says the emergency line still answers |
| Phone-only booking | Four-step booking (trade, problem, arrival window, contact) with validation and a RL- reference number; triage hands off pre-filled |
| No prices anywhere | Price ranges with what each includes, standard vs emergency table, $79 trip fee, range shown inside the booking form |
| No visibility on arrival | Live dispatch board, route map with moving trucks, next open window, the "tech en route" text on a phone mock |
| Emergency or can it wait? | Six-problem triage with a progress bar, urgency meter (call now / today / schedule) and safe first steps, labelled as a guide |
| Repeat breakdowns | HomeCare checklist, water-heater age slider with advice |
| Invisible on Google | Example search listing in the Visit section; semantic headings and real local details |
| No service-area clarity | Map with the 30-minute ring, town list, a "check your town" box with call-first answers |
| No trust signals | Clear "what we don't do", plain FAQ, sample reviews clearly labelled |
| No recurring revenue | HomeCare and HomeCare Plus as a compared product with a mock signup (no payment) |
