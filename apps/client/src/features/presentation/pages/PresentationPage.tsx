import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'

const slides = [
  {
    id: 1,
    title: 'VinFast QC Copilot',
    subtitle: 'Nền tảng tự động hóa đánh giá chất lượng AI/API',
    content: (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <p className="text-3xl font-medium text-muted-foreground">Nhóm thực hiện:</p>
        <p className="text-4xl font-bold text-foreground">Nguyễn Hoàng Long - Phạm Đình Trường</p>

        <div className="mt-8 pt-8 border-t border-border/50">
          <p className="text-2xl text-muted-foreground mb-4">Hướng dẫn viên (Mentor):</p>
          <p className="text-3xl font-bold text-foreground">Chị Nguyễn Thị Sao - Anh Nguyễn Văn An</p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: 'Những kết quả đã đạt được',
    content: (
      <ul className="text-3xl space-y-10 list-disc list-inside mt-8">
        <li>
          <span className="font-bold text-primary">Linh hoạt cấu hình:</span> Tự động thiết lập và cấu hình Target API, Chatbot dễ dàng.
        </li>
        <li>
          <span className="font-bold text-primary">Đánh giá toàn diện:</span> Khả năng chạy và chấm điểm tự động toàn bộ luồng End-to-End (E2E).
        </li>
        <li>
          <span className="font-bold text-primary">Sẵn sàng sử dụng:</span> Đã deploy thành công hệ thống lên môi trường thực tế, sẵn sàng cho việc đưa lên máy chủ nội bộ (private server) để đảm bảo bảo mật.
        </li>
      </ul>
    )
  },
  {
    id: 3,
    title: 'Live Demo',
    subtitle: 'Import cURL -> Chọn Dataset -> Run -> Realtime Dashboard',
    content: (
      <div className="flex flex-col items-center justify-center h-full pt-16">
        <p className="text-5xl font-bold text-primary animate-pulse tracking-widest">[ Trình diễn Live Demo ]</p>
      </div>
    )
  },
  {
    id: 4,
    title: 'Hướng phát triển tiếp theo',
    content: (
      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-3xl font-bold mb-6 text-foreground flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary text-xl">1</span>
            Hỗ trợ đa biến (Multi-input)
          </h3>
          <p className="text-2xl text-muted-foreground ml-11">
            Mở rộng xử lý nhiều tham số đầu vào cho từng bộ dữ liệu (Dataset) thay vì giới hạn 1 input như hiện tại.
          </p>
        </div>

        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-3xl font-bold mb-6 text-foreground flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary text-xl">2</span>
            Nâng tầm trải nghiệm (UI/UX)
          </h3>
          <p className="text-2xl text-muted-foreground ml-11">
            Tiếp tục tinh chỉnh giao diện người dùng mượt mà, trực quan và tối ưu trải nghiệm thao tác.
          </p>
        </div>

        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-3xl font-bold mb-6 text-foreground flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary text-xl">3</span>
            Tối ưu hóa Hệ thống
          </h3>
          <p className="text-2xl text-muted-foreground ml-11">
            Nâng cấp kiến trúc, tối ưu hiệu năng để đáp ứng khối lượng dữ liệu test lớn hơn trong tương lai.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: 'Q&A',
    content: (
      <div className="flex flex-col items-center justify-center h-full space-y-10 pt-10 text-center">
        <p className="text-5xl font-bold leading-tight">Cảm ơn anh chị đã lắng nghe!</p>

        <div className="space-y-6 max-w-4xl text-2xl text-muted-foreground bg-muted/20 p-10 rounded-2xl border">
          <p>
            Nhóm xin gửi lời cảm ơn chân thành tới <strong className="text-foreground">Chị Nguyễn Thị Sao</strong> và <strong className="text-foreground">Anh Nguyễn Văn An</strong> đã tận tình hỗ trợ và định hướng trong suốt thời gian qua.
          </p>
          <p>
            Đặc biệt cảm ơn công ty <strong className="text-primary font-bold text-3xl">Vinsmart Future</strong> đã tạo điều kiện và cơ hội tuyệt vời để nhóm được cọ xát với môi trường làm việc thực tế!
          </p>
        </div>
      </div>
    )
  }
]

export function PresentationPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate()

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1 < slides.length ? prev + 1 : prev))
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide()
      } else if (e.key === 'ArrowLeft') {
        prevSlide()
      } else if (e.key === 'Escape') {
        navigate('/')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, navigate])

  const currentSlide = slides[currentIndex]

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden flex flex-col font-sans select-none">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full flex items-center justify-between p-8 z-10">
        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Logo" className="h-8" />
          <span className="text-xl font-bold tracking-tight">VF QC Copilot</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full">
          Slide {currentIndex + 1} / {slides.length}
        </div>
      </header>

      {/* Slide Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col px-12 py-8 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {currentIndex === 0 ? (
              // Title Slide Style
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {currentSlide.title}
                </h1>
                <p className="text-3xl text-muted-foreground max-w-3xl leading-relaxed">
                  {currentSlide.subtitle}
                </p>
                <div className="mt-16 pt-8 border-t w-64 border-border/50">
                  {currentSlide.content}
                </div>
              </div>
            ) : (
              // Normal Slide Style
              <div className="flex flex-col h-full">
                <div className="mb-12">
                  <h2 className="text-5xl font-bold tracking-tight mb-4">{currentSlide.title}</h2>
                  {currentSlide.subtitle && (
                    <p className="text-2xl text-muted-foreground">{currentSlide.subtitle}</p>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-start">
                  {currentSlide.content}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Invisible Click Areas for Navigation */}
      <div
        className="absolute left-0 top-0 w-1/4 h-full z-0 cursor-w-resize"
        onClick={prevSlide}
      />
      <div
        className="absolute right-0 top-0 w-1/4 h-full z-0 cursor-e-resize"
        onClick={nextSlide}
      />

      {/* Keyboard Hint */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground/30 pointer-events-none z-10">
        Sử dụng phím mũi tên hoặc click viền màn hình để chuyển slide. Nhấn ESC để thoát.
      </div>
    </div>
  )
}
