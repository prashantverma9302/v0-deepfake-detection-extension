/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   experimental: {
//     serverComponentsExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
//   },
// };

// export default nextConfig;
