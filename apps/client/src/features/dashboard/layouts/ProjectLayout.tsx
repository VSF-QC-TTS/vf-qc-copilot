import { Outlet } from 'react-router-dom'
import { ProjectToolbar } from '../components/ProjectToolbar'

export function ProjectLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ProjectToolbar />
      <main className="flex-1 overflow-auto bg-muted/20">
        <Outlet />
      </main>
    </div>
  )
}
