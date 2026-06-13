import { Layers, Clock, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  layers: Layers,
  clock: Clock,
  activity: Activity,
}

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const Icon = iconMap[icon] || Layers

  return (
    <div className="feature-card rounded-lg bg-surface-card p-8 opacity-0">
      <div className="w-10 h-10 rounded-lg bg-surface-strong/50 flex items-center justify-center mb-6">
        <Icon className="w-5 h-5 text-ink" />
      </div>
      <h3 className="text-[18px] font-semibold text-ink mb-3">{title}</h3>
      <p className="text-body text-[16px] leading-relaxed">{description}</p>
    </div>
  )
}
