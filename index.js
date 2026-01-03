const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4'
};

const serveFile = (filePath, res) => {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(err.code === 'ENOENT' ? 404 : 500);
            return res.end();
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
};

const server = http.createServer((req, res) => {
    const safePath = path.normalize(req.url.split('?')[0]).replace(/^\/+/, '');
    const target = safePath === '' ? 'index.html' : safePath;
    const filePath = path.join(PUBLIC_DIR, target);

    
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.writeHead(404);
            return res.end();
        }

        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            return serveFile(indexPath, res);
        }

        serveFile(filePath, res);
    });
});

server.listen(PORT, () => {
    console.log(`Sorex servido en http://localhost:${PORT}`);
});
