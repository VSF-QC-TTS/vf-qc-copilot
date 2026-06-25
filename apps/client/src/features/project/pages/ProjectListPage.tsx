import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderIcon, Plus } from 'lucide-react'
import { motion } from 'motion/react'

import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from '../components/CreateProjectDialog'

export function ProjectListPage() {
  const { t } = useTranslation('project')
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
        className="w-full max-w-md"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderIcon className="size-12" />
            </EmptyMedia>
            <EmptyTitle>{t('welcome.title')}</EmptyTitle>
            <EmptyDescription>{t('welcome.subtitle')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('welcome.createBtn')}
            </Button>
          </EmptyContent>
        </Empty>
      </motion.div>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
