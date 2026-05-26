'use client'

import { Button } from '@/components/ui/button'

interface ConnectButtonProps {
  platform: 'facebook' | 'instagram'
  disabled?: boolean
  onClick: () => void
}

export function ConnectButton({ platform, disabled, onClick }: ConnectButtonProps) {
  return (
    <Button
      variant="gold"
      size="md"
      onClick={onClick}
      disabled={disabled}
    >
      ◈ Connect {platform === 'facebook' ? 'Facebook' : 'Instagram'}
    </Button>
  )
}
