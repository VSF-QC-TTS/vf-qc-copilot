import { Outlet } from 'react-router-dom'
import { ProjectToolbar } from '../components/ProjectToolbar'
import { TooltipProvider } from '@/components/ui/tooltip'

export function ProjectLayout() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col">
        <ProjectToolbar />
        <main className="flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
