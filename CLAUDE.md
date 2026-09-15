# fanelliandrea.com — redesign

Personal site of Andrea Fanelli. Replaces the current Framer site.
v2 prototype: `index.html`, `work.html`, `ideas/*.html`, shared `css/site.css`
and `js/*.js`. Read them before changing anything.

**Direction v3, 2026-09-14 (Andrea): "as if designed by OEM or Mouthwash".**
References are OEM (oem.care), Special (the annual report and its colour system)
and 21st Europe. Their language:
- a grey room with white squircle objects and dark glass widgets over photographs;
- pill labels with dot-matrix numerals ("01  Hinoki Set"), and "Read ⊕" buttons;
- a home screen of 3D app icons;
- gradient display type;
- a grainy beige-to-blue report gradient;
- blueprint cards with hairline frames;
- a dot-matrix wordmark.

The four GSAP effects stay (091 ring, 109 accordion, 114 Cover Flow, 097 lines)
in this skin. The serif and the sky-gradient hero from v2 are gone. The sky
survives as the Elsewhere band.

This direction knowingly overrides three earlier rules. Glass/backdrop-blur and
blurred colour fields come straight from OEM's refs. Squircles with a soft shadow
appear only on the app icons.

---

## 1. What this site is for

Andrea is a strategic / product designer in Rome going independent. Every client
he has ever had was inbound or referred — mostly Bay Area founders who found him
because of what he writes publicly, not because of a portfolio.

So the site has one job: **a founder who has just raised lands here, understands
in ten seconds what kind of designer this is, and writes to him.**

Audience: early-stage founders (pre-seed to Series A) building tangible things —
hardware, wearables, consumer tech, accessories. Not agencies, not recruiters,
not large corporates.

What he sells: judgement and taste at the stage where a product is still a
feeling. Product + industrial design, brand, creative direction, launch films,
pitch material, research and signals. Priced per project, never by day rate.

## 2. The structural conceit

**Work and writing are one chronological register.**

The essays are why the clients arrived, so they sit at the same weight as the
objects: one list, newest first, each row `year / title / client / type`,
filterable by Objects / Brands / Writing.

v2 (Andrea's call): the homepage now opens with two previews above the register:
Work as a turning 3D ring (effect 091) and Ideas as an accordion (effect 109).
Both are equal in size. The full register still sits on the homepage beneath
them, and is still the complete index.

Pages:
| Page | Effect | File |
|---|---|---|
| Home — work preview | 091 3D wheel (auto-rotate, cursor tilt, scroll boost, drag) | `js/wheel.js` |
| Home — ideas preview | 109 two-way accordion | `js/accordion.js` |
| Work | 114 Cover Flow, cursor zones pick the card | `js/coverflow.js` |
| Article | 097 lines tighten on scroll (SplitText + ScrollTrigger) | `js/article.js` |

## 3. Design direction

The idiom is contemporary studio-institutional — a register of what exists,
addressed to an equal. Never agency marketing.

### Tokens
Live in `design/tokens.css` only. Every page links it; never redefine values inline.

| | |
|---|---|
| Ground | `#efefef` — the grey room |
| Tile | `#ffffff` — objects, sheets |
| Ink | `#111213` (Special Off Black 950) / Ink 2 `#3c3d40` |
| Stone | `#636468` — secondary text, 5.1:1 on ground |
| Pills | `rgba(17,18,19,.07)`; active `#5b5c60`; label pill on white `rgba(17,18,19,.6)` |
| Glass | `rgba(38,34,40,.58)` over photos; `rgba(40,54,78,.62)` over the sky |
| Blue | `#1352f5` (Special Blue 500) — blueprint cards |
| Care | gradient `#1466c8 → #5d63b3 → #a8618e → #c7653f` — statement + pull quotes (≥3:1 at display size) |
| Bag | `navy → periwinkle → peach` — footer line, blank thumbnails |
| Report | grainy `#d8ccb2 → #a9aec2 → #4a66d4 → #1b2f93` — contact card |

Type: **Instrument Sans** for everything (stand-in for a licensed grotesque:
ABC Diatype, Unica77, Suisse). **Doto** (dot matrix) only for numerals, dates,
the `af` mark and the footer wordmark. No serif.

Type rules:
- Labels and pills: 13px, sentence case, `+.02em`. No uppercase metadata except
  the blueprint card rows.
- Statement: 500 weight, line-height 1.08, `-.015em`.
- Body: 15–19px, line-height 1.4–1.55.

Shape: squircles everywhere (`.sq`: `corner-shape: squircle` where supported,
large `border-radius` otherwise). Radii: 1.1 / 1.9 / 3rem.

Spacing: 5 steps, roughly doubling (`1 / 2 / 3 / 6 / 11 rem`). Page gutter
`2.25rem`, `1.25rem` on mobile. Section gaps stay large.

Motion (Emil Kowalski's rules): UI uses `--dur .25s` + `--ease cubic-bezier(.23,1,.32,1)`;
on-screen movement uses `--ease-in-out`. `opacity` and `transform` only. The one
exception is the accordion's `flex-grow`, which is click-initiated and has six
panels. What animates:
page-load (SplitText lines on the hero), register hover preview, and the four
GSAP effects above. Hover is gated to `(hover:hover) and (pointer:fine)`. Pressables
get `scale(.97)` on `:active`. Reduced motion keeps fades and drops movement.

3D pieces: portrait squircles with no reflection. Side cards face the centre at
52° with a `back.out` overshoot on the fold. Ring tiles fade with depth. The
home-screen and menu icons turn to face the cursor (GSAP `quickTo`). Every 3D
piece is named by a dark pill below it: dot-matrix number, title, pager dots.

### Banned — these break the register
- Hero with headline + subhead + two buttons.
- Three-column "What I do" with icons.
- Testimonials, star ratings, logo trust bar, counting statistics.
- "Let's build something amazing together" as a closing CTA.
- Rounded cards with soft shadows on a tinted background.
- Gradient blobs, glassmorphism, purple-to-blue gradients. (The sky is a linear
  identity gradient carried over from the current site, not a blob. Don't add others.)
- Stock or AI imagery standing in for real work.
- "View case study →". The title is the link.
- System font stack. Pure `#000` on pure `#fff`.

### Copy register
Two modes, nothing in between. Institutional-declarative for structure
("Andrea Fanelli is an independent designer who works with founders on the
objects they haven't made yet"), fragmentary for captions. The failure mode is
mid-register marketing prose — "I partner with ambitious brands to craft
meaningful experiences" — invisible to this audience and fatal.

Banned words: unlock, elevate, bespoke, passionate, solutions, transforming,
"I help brands…". No question headlines.

Note: **ÆHD Lab** (his studio, separate site) owns "design for things that don't
exist yet" and a light/glow/Turrell visual line. This site must not look like a
second ÆHD. The sky is daylight and flat, never glow. Keep it drier and more
archival than ÆHD.

## 4. Reference sites

| Site | Take |
|---|---|
| oem.care | menu handling, tile language, mono numerals on dates |
| gionatannese.com | homepage as a selected-work list, hover media, numbered nav |
| pulvinar.framer.website | header: wordmark / city + live time / Menu |
| orchard.framer.website | Index as a real destination; colophon footer |
| sonori.framer.website | lowercase nav, footer sitemap + local time |

Pulvinar, Orchard and Sonori are three templates by the same studio (Satto),
sold to anyone. Take their **structure**, never their skin — cinematic dark,
video wallpaper, "turn your vision into something unforgettable". Copying the
look would put Andrea in a queue of identical sites, which defeats the point.

Wider taste set Andrea works from: modemworks.com, space10.com, gentle.systems,
generaux.services, body-shop.co, 21st-europe.com, 1x.tech,
officeofappliedstrategy.com, mouthwash.studio. Also Emil Kowalski for
interaction polish.

## 5. Open questions — ask Andrea, do not invent

- [ ] Years on every register entry are guesses. Verify all of them.
- [ ] The 2026 "Undisclosed / Under NDA" row is the Co-Star weekend project —
      can it be named?
- [ ] Origami Computing shipped nothing and the team disbanded. Show it or cut it?
- [ ] Hero statement: three options in `content/copy.md`, none chosen yet.
- [ ] "Available from Jan 2027" is a placeholder and a strategic choice.
- [ ] Email is still `fanelliandrea@outlook.com`. Move to `andrea@fanelliandrea.com`.
- [ ] X/Twitter and Enclave links are `#`.
- [ ] Images are hotlinked from the old Framer CDN (framerusercontent.com). They
      disappear when that site is taken down. Move them into the repo first.
- [ ] Four works found on the old site (Staffing Agency, AC Experiences, Dropl,
      Clear Sky Elektricity) have no year, client or confirmed kind.
- [ ] 8 of 12 essays have no year. Only "Taste…" has a real date (2024-01-23).
- [ ] Muse is `kind: film`, so it shows only under "All". Add a Films filter or
      group it with Brands?
- [ ] Hero sub-line's second sentence was changed to fit the new homepage. Confirm.
- [ ] Only one article page exists (Taste). The other essays have no page yet.

## 6. Build

Static multi-page HTML, no toolchain. GSAP 3.13 comes from jsdelivr
(`gsap`, `ScrollTrigger`, `SplitText`, `Observer`, all free since 3.13). Paths
are root-absolute (`/css/site.css`), so the site must be served from a server
root. It will not work from `file://`.

All lists render at runtime from `content/register.json` via `js/site.js`
(`Site.data`). Header, menu and footer are duplicated across the three pages.
That duplication, and the lack of server-rendered content, is the reason to
migrate to **Astro** next (layouts plus content collections on `register.json`),
then deploy on **Vercel**. Do not reach for Next.js; there is no app here.

Working rules for this repo:
- Tokens live only in `design/tokens.css`.
- Register entries live only in `content/register.json`. Never hardcode them in markup.
- Every change gets checked at 1440px and at 390px.
- Keyboard focus visible, `prefers-reduced-motion` respected. Already wired.
