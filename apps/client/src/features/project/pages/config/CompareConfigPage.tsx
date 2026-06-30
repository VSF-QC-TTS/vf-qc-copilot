import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, Trash2, Edit2, Key, Info } from 'lucide-react'

import { useCompareConfigs, useDeleteCompareConfig } from '@/features/project/hooks/use-ai-config'
import { Button } from '@/components/ui/button'
import { AiConfigSkeleton } from '@/features/project/components/AiConfigSkeleton'
import { CompareConfigModal } from '@/features/project/components/CompareConfigModal'
import type { AiConfigResponse } from '@/types/config'

export function CompareConfigPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { data: configs, isLoading } = useCompareConfigs(publicId)
  const deleteMutation = useDeleteCompareConfig(publicId)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AiConfigResponse | null>(null)

  if (isLoading) return <AiConfigSkeleton />

  const handleAdd = () => {
    setEditingConfig(null)
    setIsModalOpen(true)
  }

  const handleEdit = (config: AiConfigResponse) => {
    setEditingConfig(config)
    setIsModalOpen(true)
  }

  const handleDelete = (configId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa cấu hình so sánh này?')) {
      deleteMutation.mutate(configId)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cấu hình So sánh LLM</h1>
          <p className="text-muted-foreground mt-1 text-sm">Thêm tối đa 3 mô hình ngôn ngữ (LLM) để so sánh với chatbot hiện tại.</p>
        </div>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button 
            onClick={handleAdd} 
            disabled={configs && configs.length >= 3} 
            className="shadow-sm font-semibold cursor-pointer text-xs"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm mô hình
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-dense gap-6 mt-2">
        {configs?.map((config, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={config.publicId} 
            className={`group flex flex-col border border-border/60 bg-card rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden ${i === 0 && (configs.length === 1 || configs.length === 3) ? 'md:col-span-2 lg:col-span-2' : ''}`}
          >
            <div className="pb-5 border-b border-border/60 mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground mb-1">{config.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{config.provider} — {config.evaluationModel}</p>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -mr-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={() => handleEdit(config)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(config.publicId)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-3.5 text-sm text-foreground">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Generation Model</span>
                <span className="font-mono bg-muted/50 px-2 py-1 rounded-md text-[11px] font-semibold border border-border/50">{config.generationModel || config.evaluationModel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Key Source</span>
                <span className="flex items-center gap-1.5 font-medium text-xs">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  {config.keySource === 'PLATFORM' ? 'Nền tảng' : 'Cá nhân'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Temperature</span>
                <span className="font-mono text-xs font-medium">{config.temperature}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Max Tokens</span>
                <span className="font-mono text-xs font-medium">{config.maxTokens}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {(!configs || configs.length === 0) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="col-span-full flex flex-col items-center justify-center p-16 border border-dashed border-border/60 rounded-xl bg-muted/20"
          >
            <div className="mb-4 flex items-center justify-center h-12 w-12 rounded-full bg-muted/50">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Chưa có cấu hình so sánh</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Thêm tối đa 3 mô hình AI để chạy song song và so sánh kết quả với chatbot hiện tại.
            </p>
          </motion.div>
        )}
      </div>

      <CompareConfigModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingConfig}
        publicId={publicId}
      />
    </motion.div>
  )
}

