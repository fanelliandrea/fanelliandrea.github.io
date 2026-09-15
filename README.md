# fanelliandrea.com

Personal site of Andrea Fanelli. Static pages in a sky room: home is a calm desktop OS; Work, Ideas, and Info are rooms off the dock.

Palette lives in `design/tokens.css` — daylight sky (`#6eafd8`, field `#eaf4fb → #3d86be`), white glass, ink `#1a222c`. Not a coral/orange film look.

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
index.html             home OS — time, companion, 3D work shelf, ideas
work.html              selected work grid
ideas.html             writing
info.html              bio
work/*.html            project pages from content/projects.json
ideas/*.html           essays (Taste is the only one so far)
content/register.json  work + writing
design/tokens.css      colour and type
css/site.css           layout
js/site.js             chrome, lists, Rome clock
js/os.js               home desk in 3D
js/space.js            sky, arrival
```
