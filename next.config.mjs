/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    '@huggingface/transformers',
    '@xenova/transformers',
    'onnxruntime-node'
  ]
}

export default nextConfig
