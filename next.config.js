/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const allowedOrigins = [
      'https://www.gulmaran.com',
      'https://stage.gulmaran.com',
      'https://www.stage.gulmaran.com'
    ];

    return [
      {
        // Matching all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Dynamically set the origin based on the request
            value: allowedOrigins.join(',')
          },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 