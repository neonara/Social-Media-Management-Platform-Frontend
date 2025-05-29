module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `img-src 'self' data: http://localhost:8000`,
          },
        ],
      },
      
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", 
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
};