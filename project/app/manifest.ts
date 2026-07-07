import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Community OS',
    short_name: 'Community',
    description: 'Clubs, comunidades y experiencias en un solo lugar',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0f14',
    theme_color: '#0c0f14',
    icons: [
      {
        src: '/brand/ikon-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
