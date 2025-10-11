/** @type {import("next").NextConfig} */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Remove standalone output to enable API routes
  // output: 'standalone', // Disable for now to fix API routes

  // Development performance optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Enable SWC loader optimizations
    modularizeImports: {
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        skipDefaultConversion: true,
      },
    },
  }),

  // Turbopack configuration for performance
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  }),

  // Trust proxy headers for Server Actions (Next.js 15+ modern approach)
  experimental: {
    serverActions: {
      bodySizeLimit: '1000mb', // Increase this value as needed
      allowedOrigins: [
        '57.129.79.137',
        '57.129.79.137:8081',  // Nginx proxy production
        '57.129.79.137:3100',  // Direct frontend production  
        'localhost:8081',  // Nginx proxy
        'localhost:3100',  // Direct frontend
        'localhost:3000',  // Internal frontend
        '*.ngrok-free.app',  // Allow all ngrok free domains
        '*.ngrok.app',       // Allow all ngrok domains
        '*.ngrok.io',        // Allow legacy ngrok domains
      ],
    },
    trustProxy: true, // Modern approach for Next.js 15+ to handle proxy headers
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

  // Minimal logging configuration - only logs in development
  logging: process.env.NODE_ENV !== 'production' ? {
    fetches: {
      fullUrl: true,
    },
  } : undefined,

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
        hostname: "localhost", // Allow localhost in all environments
        port: "8000",
        pathname: "/**"
      },
      {
        protocol: "http",
        hostname: "backend", // Keep backend for Docker
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
