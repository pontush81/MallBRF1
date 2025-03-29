/**
 * CORS-konfiguration för API
 * Detta är en centraliserad konfiguration för CORS som används i hela applikationen
 */

// Lista över tillåtna ursprung
const ALLOWED_ORIGINS = {
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002'
  ],
  production: [
    // Gulmaran domäner
    'https://www.gulmaran.com',
    'https://gulmaran.com',
    'https://www.stage.gulmaran.com',
    'https://stage.gulmaran.com',
    // Vercel appdomäner
    'https://mallbrf.vercel.app',
    'https://mallbrf1.vercel.app',
    'https://mallbrf-pontush81.vercel.app',
    'https://mallbrf-git-development-pontush81.vercel.app'
  ]
};

// Standard CORS-konfiguration
const getCorsConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`[CORS] Configuring for environment: ${env}`);
  console.log(`[CORS] Current NODE_ENV: ${process.env.NODE_ENV}`);

  // Kombinera dev och prod origins baserat på miljö
  const allowedOrigins = [
    ...ALLOWED_ORIGINS.development,
    ...(env === 'production' ? ALLOWED_ORIGINS.production : [])
  ];

  return {
    origin: function(origin, callback) {
      try {
        console.log(`[CORS] Request from origin: ${origin}`);
        console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
        
        // Tillåt anslutningar utan origin (som lokala testverktyg eller postman)
        if (!origin) {
          console.log('[CORS] No origin specified, allowing request');
          return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
          console.log(`[CORS] Allowing request from: ${origin}`);
          callback(null, true);
        } else {
          console.log(`[CORS] Blocking request from: ${origin}`);
          console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
          callback(new Error('CORS policy: The origin is not allowed'));
        }
      } catch (error) {
        console.error('[CORS] Error in origin check:', error);
        callback(error);
      }
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-vercel-protection-bypass',
      'Origin',
      'Accept',
      'X-Requested-With'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 timmar
    preflightContinue: false // Säkerställ att preflight-anrop hanteras korrekt
  };
};

// Hjälpfunktion för att sätta CORS-headers manuellt
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  const env = process.env.NODE_ENV || 'development';
  const allowedOrigins = [
    ...ALLOWED_ORIGINS.development,
    ...(env === 'production' ? ALLOWED_ORIGINS.production : [])
  ];

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-vercel-protection-bypass, Origin, Accept, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
  }
};

// CORS preflight-hanterare
const handlePreflight = (req, res) => {
  setCorsHeaders(req, res);
  res.status(204).send();
};

module.exports = {
  getCorsConfig,
  setCorsHeaders,
  handlePreflight,
  ALLOWED_ORIGINS
}; 