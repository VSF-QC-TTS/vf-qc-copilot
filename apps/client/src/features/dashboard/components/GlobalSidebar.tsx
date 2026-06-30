import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Folder } from 'lucide-react'

import {
  SidebarContent,
  SidebarHeader
} from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'
import { ProjectSwitcher } from './ProjectSwitcher'

export function GlobalSidebar() {
  const { t } = useTranslation('project')
  const { state } = useSidebar()

  return (
    <>
      <SidebarHeader>
        <Link to="/projects" className="flex flex-col gap-2 pt-1 pb-5 mb-2 border-b border-slate-200/60 select-none cursor-pointer hover:opacity-80 transition-opacity">
          {state !== 'collapsed' ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4">
              <img src="/logo.png" className="h-[39px] w-auto object-contain" alt="VinFast Logo" />
              <span className="font-bold text-foreground tracking-tight text-[16px] text-center">
                {t('app.name', 'VinFast QC Copilot')}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center pt-2">
              <img src="/logo.png" className="h-8 w-auto object-contain" alt="VinFast Logo" />
            </div>
          )}
        </Link>
        <ProjectSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <div className="px-4 py-8 text-center mt-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 mb-3">
            <Folder className="size-5 text-slate-500" />
          </div>
          <p className="text-xs font-medium text-slate-500 group-data-[collapsible=icon]:hidden">
            {t('sidebar.emptyState', 'Chọn một dự án để xem các chức năng')}
          </p>
        </div>
      </SidebarContent>
    </>
  )
}
