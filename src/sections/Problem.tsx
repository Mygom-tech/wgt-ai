import { getTranslations } from 'next-intl/server'
import { EditorialSection } from '@/components/EditorialSection'
import { Button } from '@/components/ui/Button'
import type { LandingPage, Image as PayloadImage } from '@/payload-types'

type ProblemProps = {
  problem: LandingPage['problem']
}

export async function Problem({ problem }: ProblemProps) {
  const t = await getTranslations('problem')
  const image = typeof problem.image === 'object' ? (problem.image as PayloadImage) : null

  return (
    <EditorialSection
      id="problem"
      eyebrow={problem.eyebrow ?? ''}
      heading={problem.heading}
      body={problem.body}
      image={image}
      backgroundWord={t('backgroundWord')}
      footer={
        <Button href="#register" variant="primary" size="default">
          {t('cta')}
          <span aria-hidden="true" className="ml-2">&rarr;</span>
        </Button>
      }
    />
  )
}
