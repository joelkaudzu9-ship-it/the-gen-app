// next.config.js
/** @type {import('next').NextConfig} */

const isCapacitorBuild = process.env.BUILD_TARGET === 'capacitor'

const nextConfig = {
  // Static export only for the Capacitor/Android/iOS build.
  // Vercel builds normally as a full Next.js server app, so
  // /api routes and middleware stay live in production.
  ...(isCapacitorBuild ? { output: 'export' } : {}),
  images: {
    unoptimized: true, // required for static export; harmless on Vercel too
  },
  trailingSlash: true,
}

module.exports = nextConfig