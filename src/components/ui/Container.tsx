import { cn } from '@/lib/utils'

type ContainerSize = 'prose' | 'md' | 'lg' | 'xl' | 'full'

type ContainerProps = {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'nav'
  size?: ContainerSize
}

export function Container({
  children,
  className,
  as: Component = 'div',
  size = 'lg',
}: ContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        {
          'max-w-[45rem]': size === 'prose',
          'max-w-[60rem]': size === 'md',
          'max-w-[70rem]': size === 'lg',
          'max-w-[80rem]': size === 'xl',
          'max-w-none': size === 'full',
        },
        className,
      )}
    >
      {children}
    </Component>
  )
}
