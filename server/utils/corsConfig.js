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
    'http://127.0.0.1:3002',
    // Chrome extension origins, if you use any during development
    'chrome-extension://'
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
  console.log('Configuring CORS for environment:', env);

  // Kombinera dev och prod origins baserat på miljö
  const allowedOrigins = [
    ...ALLOWED_ORIGINS.development,
    ...(env === 'production' ? ALLOWED_ORIGINS.production : [])
  ];

  return {
    origin: function(origin, callback) {
      console.log(`Checking CORS for origin: ${origin}`);
      
      // Tillåt anslutningar utan origin (som lokala testverktyg eller postman)
      if (!origin) {
        console.log('No origin specified, allowing request');
        return callback(null, true);
      }
      
      // Kontrollera om origin börjar med chrome-extension:// för utvecklingsläge
      if (env === 'development' && origin.startsWith('chrome-extension://')) {
        console.log('Allowing Chrome extension in development mode');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log(`Origin ${origin} is allowed`);
        callback(null, true);
      } else {
        console.log(`CORS blockerade förfrågan från origin: ${origin}`);
        console.log(`Tillåtna origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('CORS policy: The origin is not allowed'));
      }
    },
    credentials: true,
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
    maxAge: 86400 // 24 timmar
  };
};

// Funktion för att kontrollera om en origin är tillåten
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  
  const env = process.env.NODE_ENV || 'development';
  const allowedOrigins = [
    ...ALLOWED_ORIGINS.development,
    ...(env === 'production' ? ALLOWED_ORIGINS.production : [])
  ];
  
  // Hantera Chrome-tillägg i utvecklingsläge
  if (env === 'development' && origin.startsWith('chrome-extension://')) {
    return true;
  }
  
  return allowedOrigins.includes(origin);
};

// Hjälpfunktion för att sätta CORS-headers manuellt
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  
  if (isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-vercel-protection-bypass, Origin, Accept, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
  } else if (process.env.NODE_ENV !== 'production') {
    // I utvecklingsläge, tillåt localhost som fallback
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
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
  isOriginAllowed,
  setCorsHeaders,
  handlePreflight,
  ALLOWED_ORIGINS
}; 