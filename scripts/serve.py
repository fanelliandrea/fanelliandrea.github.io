#!/usr/bin/env python3
"""Static server on 127.0.0.1:43123 with no-store for HTML/JS/CSS/JSON."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[1]
PORT = 43123
NO_STORE = {'.html', '.js', '.css', '.json'}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        path = self.path.split('?', 1)[0]
        ext = Path(path).suffix.lower()
        if ext in NO_STORE:
            self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def do_GET(self):
        path, _, query = self.path.partition('?')
        if path == '/work/glyph-toys.html' and 'v=case-sky3' not in query:
            self.send_response(302)
            self.send_header('Location', '/work/glyph-toys.html?v=case-sky3')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            return
        return super().do_GET()

    def do_HEAD(self):
        path, _, query = self.path.partition('?')
        if path == '/work/glyph-toys.html' and 'v=case-sky3' not in query:
            self.send_response(302)
            self.send_header('Location', '/work/glyph-toys.html?v=case-sky3')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            return
        return super().do_HEAD()


if __name__ == '__main__':
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'Serving {ROOT} at http://127.0.0.1:{PORT}', flush=True)
    httpd.serve_forever()
