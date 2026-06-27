import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { SaveIcon, Info, ChevronDown, Check } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'

import type { TestExecutionResult } from '@/types/config'
import { useTargetConfig, useSaveTargetConfig, useConnectTarget, useTestTargetConfig, useTargetResponseFields } from '../../hooks/use-target-config'

import { TargetConfigSkeleton } from '../../components/TargetConfigSkeleton'
import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { CurlImportCard } from '../../components/CurlImportCard'
import { ConnectionStatusCard } from '../../components/ConnectionStatusCard'
import { ConfigDetailSheet } from '../../components/ConfigDetailSheet'
import { TestResultDialog } from '../../components/TestResultDialog'
import { cn } from '@/lib/utils'

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
  const [autocompleteOpen, setAutocompleteOpen] = useState(false)

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

  const filteredFields = responseFields?.filter(f => f.toLowerCase().includes(responsePath.toLowerCase())) || []

  if (isLoading) return <TargetConfigSkeleton />

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-6"
      >
        <ConfigPageHeader titleKey="config.target.title" descriptionKey="config.target.description" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: cURL Setup */}
          <div className="lg:col-span-7 flex flex-col gap-6">
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
          </div>

          {/* Right Column: Connection Status & Response Path */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
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
                <Card className="bg-muted/30 border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40 mb-4 bg-background/50 rounded-t-xl">
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
                    <div className="flex flex-col gap-4">
                      <Popover open={autocompleteOpen} onOpenChange={setAutocompleteOpen}>
                        <PopoverTrigger asChild>
                          <div className="relative w-full">
                            <Input
                              value={responsePath}
                              onChange={(e) => setResponsePath(e.target.value)}
                              onFocus={() => setAutocompleteOpen(true)}
                              placeholder="Ví dụ: $.data.items"
                              className="font-mono text-sm pr-10"
                            />
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="p-0 w-[--radix-popover-trigger-width] max-h-[300px]" 
                          align="start"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <Command shouldFilter={false}>
                            <CommandList>
                              {filteredFields.length === 0 ? (
                                <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">Không tìm thấy đường dẫn phù hợp.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {filteredFields.map(field => (
                                    <CommandItem 
                                      key={field} 
                                      value={field} 
                                      onSelect={(val) => { 
                                        setResponsePath(val)
                                        setAutocompleteOpen(false) 
                                      }}
                                      className="font-mono text-[13px] py-2"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 shrink-0",
                                          responsePath === field ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="truncate">{field}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      <Button
                        onClick={handleSaveResponsePath}
                        disabled={saveMutation.isPending || responsePath === config.responsePath}
                        className="w-full"
                      >
                        {saveMutation.isPending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
                        {responsePath === config.responsePath ? 'Đã lưu cấu hình' : 'Lưu cấu hình'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

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
