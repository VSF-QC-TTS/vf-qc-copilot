import { useTranslation } from 'react-i18next'

interface ConfigPageHeaderProps {
  titleKey: string
  descriptionKey: string
}

export function ConfigPageHeader({ titleKey, descriptionKey }: ConfigPageHeaderProps) {
  const { t } = useTranslation(['project'])

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey, { ns: 'project' })}</h1>
      <p className="text-muted-foreground">{t(descriptionKey, { ns: 'project' })}</p>
    </div>
  )
}
