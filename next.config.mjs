/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    domains: ["assets.co.dev"]
  },
  // Azure specific configuration
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  env: {
    AZURE_WEBSITE_HOSTNAME: process.env.AZURE_WEBSITE_HOSTNAME || '',
    WEBSITE_SLOT_NAME: process.env.WEBSITE_SLOT_NAME || 'production'
  },
  experimental: {
    serverActions: true
  }
}

export default nextConfig