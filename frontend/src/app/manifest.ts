import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Console — Social Media Scheduler',
    short_name: 'Console',
    description: 'Schedule and publish content to Facebook and Instagram',
    start_url: '/',
    display: 'standalone',
    background_color: '#0E0E10',
    theme_color: '#0E0E10',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  }
}
