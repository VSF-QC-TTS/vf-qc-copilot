import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { SaveIcon, Info } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import type { TestExecutionResult } from '@/types/config'
import { useTargetConfig, useSaveTargetConfig, useConnectTarget, useTestTargetConfig, useTargetResponseFields } from '../../hooks/use-target-config'

import { TargetConfigSkeleton } from '../../components/TargetConfigSkeleton'
import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { CurlImportCard } from '../../components/CurlImportCard'
import { ConnectionStatusCard } from '../../components/ConnectionStatusCard'
import { ConfigDetailSheet } from '../../components/ConfigDetailSheet'
import { TestResultDialog } from '../../components/TestResultDialog'

export function TargetConfigPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { data: config, isLoading, error } = useTargetConfig(publicId)
  const saveMutation = useSaveTargetConfig(publicId)
  const connectMutation = useConnectTarget(publicId)
  const testMutation = useTestTargetConfig(publicId)
  const hasResponseSnapshot = !!config?.responseFieldSnapshot
  const { data: responseFields } = useTargetResponseFields(publicId, hasResponseSnapshot)

  const [lastTestResult, setLastTestResult] = useState<TestExecutionResult | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [responsePath, setResponsePath] = useState('')

  // Sync responsePath from config when loaded
  const [responsePathSynced, setResponsePathSynced] = useState(false)
  if (config && !responsePathSynced) {
    setResponsePath(config.responsePath || '')
    setResponsePathSynced(true)
  }

  const hasConfig = !!config && !error

  const handleConnect = (curl: string) => {
    setLastTestResult(null)
    setTestDialogOpen(true)
    connectMutation.mutate({ curl }, {
      onSuccess: (data) => {
        setLastTestResult(data.testResult)
        setResponsePathSynced(false)
      },
    })
  }

  const handleTest = () => {
    setLastTestResult(null)
    setTestDialogOpen(true)
    testMutation.mutate({ sampleInput: {} }, {
      onSuccess: (data) => {
        setLastTestResult(data)
      },
    })
  }

  const handleSaveResponsePath = () => {
    if (!config) return
    saveMutation.mutate({
      method: config.method,
      url: config.url,
      responsePath: responsePath || null,
      timeoutMs: config.timeoutMs,
    })
  }

  if (isLoading) return <TargetConfigSkeleton />

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6"
      >
        <ConfigPageHeader titleKey="config.target.title" descriptionKey="config.target.description" />

        {/* Connection Status */}
        {hasConfig && config.lastTestStatus && (
          <ConnectionStatusCard
            config={config}
            onTest={handleTest}
            onViewDetail={() => setSheetOpen(true)}
            isTestPending={testMutation.isPending}
          />
        )}

        {/* Response Path — only show when connected */}
        {hasConfig && config.lastTestStatus === 'SUCCESS' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  Response Path
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Đường dẫn JSON Path để trích xuất dữ liệu từ response API. Ví dụ: $.candidates[0].content</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      list="json-paths"
                      value={responsePath}
                      onChange={(e) => setResponsePath(e.target.value)}
                      placeholder="$.data.items"
                      className="font-mono text-sm"
                    />
                    <datalist id="json-paths">
                      {responseFields?.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSaveResponsePath}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
                    Lưu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* cURL Input — always visible */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasConfig ? 0.2 : 0 }}
        >
          <CurlImportCard
            onImport={handleConnect}
            isPending={connectMutation.isPending}
            initialValue={config?.rawCurl}
            hasExistingConfig={hasConfig}
          />
        </motion.div>

        {/* Config Detail Sheet */}
        <ConfigDetailSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          config={config ?? null}
          lastTestResult={lastTestResult}
        />

        {/* Test Result Overlay Dialog */}
        <TestResultDialog
          open={testDialogOpen}
          onOpenChange={setTestDialogOpen}
          isPending={connectMutation.isPending || testMutation.isPending}
          result={lastTestResult}
        />
      </motion.div>
    </TooltipProvider>
  )
}
