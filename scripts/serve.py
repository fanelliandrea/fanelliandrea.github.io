#!/usr/bin/env python3
"""Dual-stack static server on 127.0.0.1 and ::1 port 43123."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import os
import socket
import threading

DESKTOP_ROOT = Path('/Users/andreafanelli/Desktop/Website')
MIRROR_ROOT = Path.home() / 'Library/Application Support/com.fanelli.website/www'
PORT = int(os.environ.get('SITE_PORT', '43123'))
NO_STORE = {'.html', '.js', '.css', '.json'}


def readable_root(path):
    try:
        with open(path / 'index.html', 'rb') as fh:
            fh.read(1)
        return True
    except OSError:
        return False


def pick_root():
    env = os.environ.get('SITE_ROOT')
    candidates = []
    if env:
        candidates.append(Path(env))
    candidates.extend([DESKTOP_ROOT, MIRROR_ROOT])
    seen = set()
    for candidate in candidates:
        resolved = candidate.resolve() if candidate.exists() else candidate
        key = str(resolved)
        if key in seen:
            continue
        seen.add(key)
        if readable_root(resolved):
            return resolved
    raise SystemExit('no readable site root')


ROOT = pick_root()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print('[%s] %s' % (self.log_date_time_string(), fmt % args), flush=True)

    def end_headers(self):
        path = urlparse(self.path).path
        ext = Path(path).suffix.lower()
        if ext in NO_STORE or path in ('/work', '/work.html'):
            self.send_header('Cache-Control', 'no-store, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()


class V4Server(ThreadingHTTPServer):
    address_family = socket.AF_INET
    allow_reuse_address = True
    daemon_threads = True


class V6Server(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True
    daemon_threads = True

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
        super().server_bind()


if __name__ == '__main__':
    v4 = V4Server(('127.0.0.1', PORT), Handler)
    v6 = V6Server(('::1', PORT), Handler)
    threading.Thread(target=v6.serve_forever, name='http6', daemon=True).start()
    print('Serving %s at http://127.0.0.1:%s and http://[::1]:%s' % (ROOT, PORT, PORT), flush=True)
    try:
        v4.serve_forever()
    finally:
        v4.shutdown()
        v6.shutdown()
