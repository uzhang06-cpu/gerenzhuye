import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'soft' | 'ghost'
  size?: 'md' | 'lg'
  children: ReactNode
}

const VARIANTS = {
  primary:
    'text-white border-transparent shadow-[0_8px_20px_-8px_rgba(226,78,46,.7)] active:brightness-95',
  soft: 'bg-coral/10 text-coral-deep border-transparent active:bg-coral/16',
  ghost: 'bg-shell text-ink-soft border-hairline active:bg-cream-deep',
} as const

const SIZES = {
  md: 'px-4 py-2.5 text-sm rounded-2xl',
  lg: 'px-5 py-3.5 text-[15px] rounded-[20px]',
} as const

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 border font-medium transition-[filter,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      style={
        variant === 'primary'
          ? { background: 'linear-gradient(135deg, #FF7A5C 0%, #F0562F 100%)' }
          : undefined
      }
    >
      {children}
    </button>
  )
}
