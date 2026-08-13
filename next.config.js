// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Remove standalone output - this causes the issue
  // output: 'standalone',  // ← REMOVE THIS LINE
  
  // Disable static generation for problematic pages
  staticPageGenerationTimeout: 120,
  
  // Ensure proper handling of client references
  experimental: {
    clientReferenceManifest: true,
  },
}

module.exports = nextConfig