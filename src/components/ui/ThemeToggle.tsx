import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export const ThemeToggle = () => {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 34, height: 34,
        borderRadius: '0.5rem',
        border: '1px solid var(--gb)',
        background: 'var(--g2)',
        color: 'var(--tx2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--g3)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--g2)' }}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
