import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://multi-user-social-media-scheduler-s.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/composer', '/posts', '/media', '/accounts', '/calendar', '/logs', '/settings'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
