'use client'

import { motion } from 'framer-motion'

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="w-full border-t border-border bg-bg"
    >
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gold text-sm">◈</span>
          <span className="font-serif text-text text-sm tracking-wide">Console</span>
          <span className="text-text-dim text-[10px] font-mono uppercase tracking-widest border border-border rounded-sm px-1.5 py-0.5 ml-2">
            v0.1
          </span>
        </div>

        <div className="flex items-center gap-6">
          {['Documentation', 'Status', 'GitHub'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[12px] text-text-muted hover:text-text font-sans transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <p className="text-[11px] text-text-dim font-mono">
          &copy; {new Date().getFullYear()} Console. All rights reserved.
        </p>
      </div>
    </motion.footer>
  )
}
