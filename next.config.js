/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds untuk Heroku deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds untuk Heroku deployment
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
