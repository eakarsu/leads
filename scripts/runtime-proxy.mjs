import http from 'node:http';

const listenPort = Number(process.env.RUNTIME_PROXY_PORT);
const targetPort = Number(process.env.RUNTIME_PROXY_TARGET_PORT);
if (!Number.isInteger(listenPort) || !Number.isInteger(targetPort) || listenPort === targetPort) throw new Error('Distinct runtime proxy ports are required');
const server = http.createServer((req, res) => {
  const upstream = http.request({ hostname: '127.0.0.1', port: targetPort, method: req.method, path: req.url, headers: { ...req.headers, host: `127.0.0.1:${targetPort}` } }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Upstream unavailable'); });
  req.pipe(upstream);
});
server.listen(listenPort, '127.0.0.1', () => console.log(`UI proxy listening on 127.0.0.1:${listenPort}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
