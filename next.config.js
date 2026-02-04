/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow pdf-parse to be used in server components
  serverExternalPackages: ['pdf-parse'],
};

module.exports = nextConfig;
