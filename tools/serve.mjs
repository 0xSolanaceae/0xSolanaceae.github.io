// Minimal static server for local preview. Run `npm run serve` (builds first).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.asc': 'application/pgp-keys',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const notFoundPage = await readFile(join(root, '404.html')).catch(() => Buffer.from('Not found'));

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';

    const file = join(root, normalize(path).replace(/^[\\/]+/, ''));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('forbidden');
      return;
    }

    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { 'content-type': TYPES['.html'] }).end(notFoundPage);
      return;
    }

    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store',
    }).end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end(`500 ${err}`);
  }
});

function listen(server, candidate, attempts = 25) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if ((err.code === 'EACCES' || err.code === 'EADDRINUSE') && attempts > 0) {
        server.removeListener('error', onError);
        resolve(listen(server, candidate + 1, attempts - 1));
      } else {
        reject(err);
      }
    };
    server.once('error', onError);
    server.listen(candidate, '127.0.0.1', () => {
      server.removeListener('error', onError);
      resolve(candidate);
    });
  });
}

const bound = await listen(server, port);
console.log(`solanaceae → http://127.0.0.1:${bound}/`);
