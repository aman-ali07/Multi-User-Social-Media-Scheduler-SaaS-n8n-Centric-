'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Clock, Share2, Database, LayoutDashboard, Workflow, Users, Settings, Bell, Activity, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    // Initial Reveal Sequence
    const tl = gsap.timeline()
    
    tl.from('.hero-badge', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
    .from('.hero-title', {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power4.out'
    }, '-=0.6')
    .from('.hero-desc', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.6')
    .from('.hero-buttons', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out'
    }, '-=0.6')
    .from('.hero-mockup', {
      y: 100,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    }, '-=0.8')

    // Scroll Storytelling: The Dashboard Assembly
    ScrollTrigger.create({
      trigger: '.hero-mockup-wrapper',
      start: 'top 20%',
      end: '+=800',
      pin: true,
      animation: gsap.timeline()
        .to('.hero-mockup', { scale: 1.05, duration: 1, ease: 'power2.inOut' })
        .to('.mockup-panel', { opacity: 1, x: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }, '<0.2')
        .to('.mockup-node', { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.2)' }, '<0.4')
        .to('.mockup-line', { scaleX: 1, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power2.out' }, '<0.4')
    })
    
    // Continuous flowing data animation on the lines
    gsap.to('.data-particle', {
      x: '100%',
      opacity: 0,
      duration: 1.5,
      repeat: -1,
      stagger: 0.5,
      ease: 'linear'
    })

    // Continuous telemetry scroll simulation
    gsap.to('.telemetry-feed', {
      y: -40,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    })

  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="relative bg-canvas py-24 px-6 overflow-hidden">
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <div className="mb-8 hero-badge">
            <span className="inline-flex items-center rounded-full bg-surface-card px-4 py-1.5 text-[13px] font-medium text-ink border border-hairline">
              <span className="flex w-2 h-2 rounded-full bg-success mr-2" />
              v0.1 — Content Orchestration Platform
            </span>
          </div>

          <h1 className="hero-title font-cal text-[32px] sm:text-[48px] lg:text-[64px] text-ink leading-[1.05] tracking-tighter">
            Orchestrate Your Content.<br />
            <span className="text-muted">Amplify Your Reach.</span>
          </h1>

          <p className="hero-desc mt-6 text-[18px] sm:text-[20px] text-muted font-medium leading-relaxed max-w-lg">
            Schedule, publish, and monitor social content across Facebook and Instagram — from one beautiful console.
          </p>

          <div className="hero-buttons mt-10 flex flex-col sm:flex-row items-start gap-4">
            <Link href="/auth/register">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Real Product Visualization */}
        <div className="lg:col-span-5">
          <div className="hero-mockup-wrapper w-full h-[520px] lg:h-[600px] relative">
            <div className="hero-mockup w-full h-full relative rounded-xl border border-hairline bg-canvas shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden ring-1 ring-ink/5">
            
            {/* Browser Header */}
            <div className="h-12 bg-surface-card border-b border-hairline flex items-center px-5 gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E5E7EB] hover:bg-[#EF4444] transition-colors" />
                <div className="w-3 h-3 rounded-full bg-[#E5E7EB] hover:bg-[#F59E0B] transition-colors" />
                <div className="w-3 h-3 rounded-full bg-[#E5E7EB] hover:bg-[#10B981] transition-colors" />
              </div>
              <div className="mx-auto bg-canvas border border-hairline rounded-md px-4 py-1.5 text-[12px] text-muted font-medium w-64 text-center shadow-sm flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success opacity-80" />
                app.console.so
              </div>
            </div>
            
            <div className="flex-1 flex items-stretch bg-canvas overflow-hidden">
               {/* Left Sidebar: Navigation */}
               <div className="hidden md:flex w-56 bg-surface-soft border-r border-hairline flex-col p-4 opacity-0 -translate-x-8 mockup-panel">
                 <div className="flex items-center gap-3 px-2 mb-8">
                   <div className="w-6 h-6 rounded bg-ink flex items-center justify-center text-canvas text-[10px] font-bold">C</div>
                   <span className="font-cal text-ink text-[16px] tracking-tight">Console Workspace</span>
                 </div>
                 
                 <div className="space-y-1">
                   <div className="text-[11px] font-bold text-muted uppercase tracking-widest px-2 mb-2">Menu</div>
                   {[
                     { icon: LayoutDashboard, label: 'Dashboard' },
                     { icon: Workflow, label: 'Pipelines', active: true },
                     { icon: Users, label: 'Accounts' },
                     { icon: Activity, label: 'Logs' },
                     { icon: Settings, label: 'Settings' }
                   ].map((item, i) => (
                     <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${item.active ? 'bg-canvas shadow-sm border border-hairline' : 'hover:bg-hairline-soft'}`}>
                       <item.icon className={`w-4 h-4 ${item.active ? 'text-ink' : 'text-muted'}`} />
                       <span className={`text-[13px] font-medium ${item.active ? 'text-ink' : 'text-muted'}`}>{item.label}</span>
                     </div>
                   ))}
                 </div>
               </div>
               
               {/* Main Canvas: Visual Workflow Node Editor */}
               <div className="flex-1 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] relative overflow-hidden flex flex-col items-center justify-center opacity-0 scale-95 mockup-panel">
                 <div className="absolute top-4 left-6 flex items-center gap-2">
                   <Workflow className="w-4 h-4 text-muted" />
                   <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Publishing Pipeline</span>
                 </div>
                 
                 <div className="flex items-center mt-4">
                     {/* Node 1: Trigger */}
                     <div className="w-56 p-4 rounded-xl border border-hairline bg-canvas shadow-sm flex flex-col gap-3 z-10 opacity-0 translate-y-4 mockup-node">
                      <div className="flex items-center justify-between border-b border-hairline pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-surface-strong">
                            <Clock className="w-3 h-3 text-ink" />
                          </div>
                          <div className="text-[11px] font-bold text-muted uppercase tracking-widest">Trigger</div>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-ink">Schedule Reached</div>
                        <div className="text-[12px] text-muted font-medium mt-0.5 font-mono">Cron: * * * * *</div>
                      </div>
                    </div>
                    
                    {/* Path 1 */}
                    <div className="w-12 h-[2px] bg-hairline relative origin-left scale-x-0 opacity-0 mockup-line overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-brand-accent to-transparent data-particle opacity-0" />
                    </div>
                    
                     {/* Node 2: Action */}
                     <div className="w-56 p-4 rounded-xl border border-hairline bg-canvas shadow-sm flex flex-col gap-3 z-10 opacity-0 translate-y-4 mockup-node">
                      <div className="flex items-center justify-between border-b border-hairline pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#1877F2]/10">
                            <Share2 className="w-3 h-3 text-[#1877F2]" />
                          </div>
                          <div className="text-[11px] font-bold text-muted uppercase tracking-widest">Action</div>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-ink">Publish to Meta</div>
                        <div className="text-[12px] text-muted font-medium mt-0.5 font-mono">POST /me/feed</div>
                      </div>
                    </div>

                    {/* Path 2 */}
                    <div className="w-12 h-[2px] bg-hairline relative origin-left scale-x-0 opacity-0 mockup-line overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-success to-transparent data-particle opacity-0" style={{ animationDelay: '0.5s' }} />
                    </div>

                    {/* Node 3: Database */}
                    <div className="w-48 p-4 rounded-xl border border-hairline bg-canvas shadow-sm flex flex-col gap-3 z-10 opacity-0 translate-y-4 mockup-node">
                      <div className="flex items-center justify-between border-b border-hairline pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-surface-strong">
                            <Database className="w-3 h-3 text-ink" />
                          </div>
                          <div className="text-[11px] font-bold text-muted uppercase tracking-widest">Update</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-ink">Mark as Published</div>
                        <div className="text-[12px] text-muted font-medium mt-0.5 font-mono">UPDATE posts</div>
                      </div>
                    </div>
                 </div>
               </div>
               
               {/* Right Sidebar: Telemetry Logs */}
               <div className="hidden lg:flex w-72 bg-canvas border-l border-hairline flex-col p-0 opacity-0 translate-x-8 mockup-panel overflow-hidden">
                 <div className="p-4 border-b border-hairline bg-surface-soft flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-2">
                     <Activity className="w-4 h-4 text-muted" />
                     <div className="text-[12px] font-bold text-ink uppercase tracking-wider">Live Telemetry</div>
                   </div>
                   <div className="flex items-center gap-1.5 bg-success/10 px-2 py-0.5 rounded-full">
                     <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                     <span className="text-[10px] font-bold text-success uppercase">Live</span>
                   </div>
                 </div>
                 <div className="flex-1 p-4 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas z-10 pointer-events-none" />
                   <div className="space-y-4 telemetry-feed">
                     {[
                       { action: 'Post Published', detail: 'ID: 9821-meta', time: 'Just now', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
                       { action: 'Media Uploaded', detail: 'image_1.jpg (2.4MB)', time: '2s ago', icon: Database, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
                       { action: 'Draft Saved', detail: 'Autosave triggered', time: '1m ago', icon: Clock, color: 'text-muted', bg: 'bg-surface-strong' },
                       { action: 'Token Refreshed', detail: 'FB User Access Token', time: '5m ago', icon: Settings, color: 'text-muted', bg: 'bg-surface-strong' },
                       { action: 'Schedule Triggered', detail: 'Cron Job 1244', time: '10m ago', icon: Activity, color: 'text-ink', bg: 'bg-surface-strong' },
                       { action: 'Post Published', detail: 'ID: 9820-meta', time: '1h ago', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
                     ].map((log, i) => (
                       <div key={i} className="flex gap-3 items-start group">
                         <div className={`w-6 h-6 rounded flex shrink-0 items-center justify-center mt-0.5 ${log.bg}`}>
                           <log.icon className={`w-3 h-3 ${log.color}`} />
                         </div>
                         <div className="flex-1 border-b border-hairline pb-4 group-last:border-0">
                           <div className="flex items-center justify-between">
                             <div className="text-[13px] font-semibold text-ink leading-tight">{log.action}</div>
                             <div className="text-[11px] text-muted font-medium">{log.time}</div>
                           </div>
                           <div className="text-[12px] text-muted mt-1 font-mono">{log.detail}</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
