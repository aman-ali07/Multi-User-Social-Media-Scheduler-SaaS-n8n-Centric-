'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { LeftNav } from './left-nav'
import { TopBar } from './top-bar'
import { StatusBar } from './status-bar'

interface ConsoleShellProps {
  children: React.ReactNode
  rightPanel?: React.ReactNode
}

export function ConsoleShell({ children, rightPanel }: ConsoleShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftNav mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex-1 overflow-auto scrollbar-custom"
        >
          <div className="flex flex-col lg:flex-row h-full">
            <div className="flex-1 min-w-0">
              {children}
            </div>
            {rightPanel && (
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-surface overflow-y-auto flex-shrink-0"
              >
                {rightPanel}
              </motion.aside>
            )}
          </div>
        </motion.main>

        <StatusBar />
      </div>
    </div>
  )
}
