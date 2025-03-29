// Catch-all API route som hanterar alla API-anrop och lägger till CORS-headers
import httpProxy from 'http-proxy';

// Skapa en proxy för att vidarebefordra anrop till vår faktiska API-server
const proxy = httpProxy.createProxyServer();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  return new Promise((resolve, reject) => {
    // Hantera CORS (lägg till headers på både requests och preflight)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    // Hantera preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return resolve();
    }

    // Vidarebefordra anropet till den faktiska API-servern
    proxy.web(req, res, {
      target: 'https://mallbrf.vercel.app/api',
      changeOrigin: true,
      ignorePath: false,
    }, (err) => {
      if (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
        resolve();
      }
    });

    proxy.once('proxyRes', () => {
      resolve();
    });
  });
} 