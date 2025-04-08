/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add a fallback for the VITS module to prevent build errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@diffusionstudio/vits-web': false, // Prevent webpack from trying to bundle this
    };
    
    return config;
  }
};

module.exports = nextConfig; 