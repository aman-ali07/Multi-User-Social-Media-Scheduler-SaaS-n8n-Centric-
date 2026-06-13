'use client'

import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { SettingsNav } from '@/components/settings/settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ConsoleShell>
         <div className="flex flex-col md:flex-row h-full w-full">
            <aside className="w-full md:w-64 border-r border-hairline bg-surface-soft p-6 md:p-8 shrink-0">
               <h1 className="font-cal text-[24px] text-ink mb-6">Settings</h1>
               <SettingsNav />
            </aside>
            <main className="flex-1 p-6 md:p-12 h-full overflow-y-auto">
               <div className="max-w-2xl">
                 {children}
               </div>
            </main>
         </div>
      </ConsoleShell>
    </AuthGuard>
  )
}
