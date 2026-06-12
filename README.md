# Console: Your Personal Social Media Engine

Hey there! Welcome to **Console**. 

If you've ever tried to manage social media for a business, a brand, or just your own projects, you know the pain. You usually end up paying $50/month per user for a walled-garden SaaS tool, or you end up constantly switching tabs between Facebook, Instagram, and a messy folder full of random images. 

We got tired of that. So, we built Console.

Console is an open-stack, multi-user social media scheduler. It lets you and your team connect your Meta accounts, upload your media to a private library, write your posts, and schedule them out into the future. Once scheduled, you can literally close your laptop—the system takes over and fires off your content at the exact right second.

### Why is this different?
Instead of building a massive, monolithic backend to handle the scheduling, we built Console using **n8n** (a powerful workflow automation engine) and **Supabase** (a wildly scalable database). This means you get enterprise-grade reliability and visual workflow debugging, but on infrastructure that you actually own and control. 

Plus, it's designed to be hosted for free!

---

## 🚀 How to Get Started

We've made getting this live as painless as possible. We highly recommend using our Zero-Cost Deployment architecture:

1. **Frontend:** Deployed on Vercel (Free Tier)
2. **Database:** Supabase Cloud (Free Tier)
3. **Backend:** Oracle Cloud (Always Free ARM Instance)

We have written detailed, step-by-step documentation to help you get this off the ground:

- 📖 **[Deployment & Setup Guide](docs/PROJECT_DOCUMENTATION.md)**: Start here if you are looking to host and deploy the app.
- 🔑 **[Meta API Instructions](docs/META_API_SETUP.md)**: Read this to learn exactly how to get your Facebook and Instagram App Keys.
- 🧑‍💻 **[User Guide](docs/USER_GUIDE.md)**: Share this with your team so they know how to navigate the app, upload media, and schedule posts.

## Tech Stack
For the nerds out there, here's what's running under the hood:
- **Frontend:** Next.js (App Router), TailwindCSS, TypeScript, Framer Motion
- **Database:** PostgreSQL (via Supabase), Row Level Security (RLS), `pg_cron` for our dispatcher
- **Automations:** n8n (handling OAuth token refreshing, heavy video uploads, and Meta Graph API interactions)

Enjoy your newfound scheduling freedom! Let us know if you build something awesome with it.
