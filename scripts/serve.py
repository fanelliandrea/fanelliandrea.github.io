#!/usr/bin/env python3
"""Static server on 127.0.0.1:43123 with no-store for HTML/JS/CSS/JSON."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import os

ROOT = Path(__file__).resolve().parents[1]
PORT = 43123
NO_STORE = {'.html', '.js', '.css', '.json'}
WORK_QS = 'v=fx064-lock5'


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        path = urlparse(self.path).path
        ext = Path(path).suffix.lower()
        if ext in NO_STORE or path in ('/work', '/work.html'):
            self.send_header('Cache-Control', 'no-store, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def _redirect_work(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/') or '/'
        if path == '/work':
            self.send_response(302)
            self.send_header('Location', f'/work.html?{WORK_QS}')
            self.send_header('Cache-Control', 'no-store, max-age=0')
            self.end_headers()
            return True
        if path == '/work.html' and parsed.query != WORK_QS:
            self.send_response(302)
            self.send_header('Location', f'/work.html?{WORK_QS}')
            self.send_header('Cache-Control', 'no-store, max-age=0')
            self.end_headers()
            return True
        return False

    def do_GET(self):
        if self._redirect_work():
            return
        return super().do_GET()

    def do_HEAD(self):
        if self._redirect_work():
            return
        return super().do_HEAD()


if __name__ == '__main__':
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'Serving {ROOT} at http://127.0.0.1:{PORT}', flush=True)
    httpd.serve_forever()
