import { cn } from '@/lib/utils'

const EditorialBubbles = () => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn('w-1 h-1 rounded-full', i === 1 ? 'bg-primary' : 'bg-foreground/10')}
        />
      ))}
    </div>
  )
}

export default EditorialBubbles
