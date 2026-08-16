// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // This creates a static site
  images: {
    unoptimized: true,  // Required for static export
  },
  trailingSlash: true,  // Better for mobile routing
  // Remove any server-side features
  // No middleware, no server components
}

module.exports = nextConfig