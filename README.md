# fanelliandrea.com

Personal site of Andrea Fanelli. Static pages in a daylight sky. Home is quiet: the sky and the original bottom menu. Work, Ideas, and Info are ordinary pages with the same nav.

Palette lives in `design/tokens.css` — `#6eafd8`, field `#eaf4fb → #3d86be`, ink `#1a222c`. Not a coral/orange film look.

## Run

From the repo root (paths are root-absolute, so do not open `file://`):

```bash
python3 -m http.server 43123 --bind 127.0.0.1
# or
npm run dev
```

Open `http://127.0.0.1:43123`.

macOS may block servers from reading `~/Desktop`. Move the folder or grant Terminal Full Disk Access if assets fail to load.

## Layout

```
index.html             home — sky + bottom menu only
work.html              selected work as Effect 064 3D cloud (scroll on Z)
ideas.html             writing as Effect 114 (pastel 3:4 notes, glass ‹ ›)
info.html              bio
work/*.html            project pages from content/projects.json
ideas/*.html           essays (Taste is the only one so far)
content/register.json  work + writing
design/tokens.css      colour and type
css/site.css           layout
js/site.js             bottom menu, lists, in-page navigation (player stays mounted)
js/player.js           YouTube audio pill
js/space.js            sky, arrival
js/effect064.js        Work 3D cloud + Z fly-through
js/effect114.js        Ideas 3D cover-flow (mouse X / arrows)
```
