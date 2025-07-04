/** @type {import("next").NextConfig} */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Remove standalone output to enable API routes
  // output: 'standalone', // Disable for now to fix API routes
  
  // Trust proxy headers for Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '1000mb', // Increase this value as needed
      allowedOrigins: [
        'localhost:8081',  // Nginx proxy
        'localhost:3100',  // Direct frontend
        'localhost:3000',  // Internal frontend
      ],
    },
  },
  
  // Handle proxy headers properly
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: ""
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
        port: ""
      },
      {
        protocol: "http",
        hostname: process.env.NODE_ENV === 'development' ? "localhost" : "backend",
        port: "8000",
        pathname: "/**"
      }
    ]
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

export default nextConfig;
