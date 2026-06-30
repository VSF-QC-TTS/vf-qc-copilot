import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 font-sans text-slate-900">
          <div className="flex w-full max-w-lg flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="border border-slate-200 bg-white rounded-md p-8 md:p-12 shadow-none">
              
              <div className="mb-8">
                <h1 className="font-serif text-3xl tracking-[-0.03em] leading-tight mb-3">
                  Lỗi hệ thống
                </h1>
                <p className="text-slate-500 text-base leading-[1.6]">
                  Đã xảy ra một lỗi nghiêm trọng. Vui lòng tải lại trang hoặc kiểm tra chi tiết lỗi bên dưới.
                </p>
              </div>

              {this.state.error && (
                <div className="mb-10 w-full rounded border border-slate-200 bg-slate-100 p-4 overflow-x-auto">
                  <span className="block mb-2 text-xs uppercase tracking-widest text-slate-500 font-bold">Chi tiết lỗi</span>
                  <code className="block text-sm font-mono text-red-600">
                    {this.state.error.message}
                  </code>
                </div>
              )}

              <Button 
                onClick={this.handleReload} 
                className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 hover:scale-[0.98] transition-transform duration-200 rounded shrink-0 h-11"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tải lại ứng dụng
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

