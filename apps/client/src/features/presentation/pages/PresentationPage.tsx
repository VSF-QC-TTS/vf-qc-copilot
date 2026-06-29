import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'

const slides = [
  {
    id: 1,
    title: 'VF QC Copilot',
    subtitle: 'Nền tảng tự động hóa đánh giá chất lượng AI/API',
    content: (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-2xl text-muted-foreground">Người trình bày: Long</p>
        <p className="text-2xl text-muted-foreground">Mentor: [Tên mentor]</p>
      </div>
    )
  },
  {
    id: 2,
    title: 'Bối cảnh & Vấn đề',
    content: (
      <ul className="text-2xl space-y-8 list-disc list-inside">
        <li>QC thủ công các ứng dụng AI/API tốn quá nhiều thời gian.</li>
        <li>Kết quả từ LLM (AI) linh động, khó dùng công cụ test truyền thống để chấm điểm chính xác.</li>
        <li>Thiếu một nền tảng tập trung để quản lý Dataset, chạy hàng loạt và tự động chấm điểm.</li>
      </ul>
    )
  },
  {
    id: 3,
    title: 'Tổng quan Giải pháp',
    subtitle: 'VF QC Copilot: Import dữ liệu, giả lập gọi API/LLM và chấm điểm tự động',
    content: (
      <div className="grid grid-cols-3 gap-8 mt-12 text-center">
        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-2xl font-bold mb-4">Quản lý Dữ liệu</h3>
          <p className="text-xl text-muted-foreground">Nhập và chuẩn hoá Dataset</p>
        </div>
        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-2xl font-bold mb-4">Cấu hình Linh hoạt</h3>
          <p className="text-xl text-muted-foreground">Target API & Quy tắc Verification</p>
        </div>
        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-2xl font-bold mb-4">Báo cáo & Thống kê</h3>
          <p className="text-xl text-muted-foreground">Dashboard & Real-time Metrics</p>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: 'Đã hoàn thành: Cấu hình Test',
    content: (
      <ul className="text-2xl space-y-8 list-disc list-inside">
        <li>Import cURL tự động thiết lập Target API nhanh chóng.</li>
        <li>Xây dựng bộ quy tắc đánh giá (Assertions): So khớp chuỗi (Chứa, Bằng, Regex...).</li>
        <li>Tích hợp LLM Judge: Dùng AI chấm điểm AI dựa trên các tiêu chí (Rubrics).</li>
      </ul>
    )
  },
  {
    id: 5,
    title: 'Đã hoàn thành: Trải nghiệm Thực thi',
    content: (
      <ul className="text-2xl space-y-8 list-disc list-inside">
        <li>Chạy test hàng loạt (Batch testing) dưới nền.</li>
        <li>Bóc tách và tính toán dữ liệu Real-time ngay trên Frontend.</li>
        <li>Giao diện chi tiết: Tiến độ chạy, Biểu đồ Đạt/Lỗi nhảy số trực tiếp không cần reload.</li>
      </ul>
    )
  },
  {
    id: 6,
    title: 'Đã hoàn thành: Báo cáo & Hiệu chỉnh',
    content: (
      <ul className="text-2xl space-y-8 list-disc list-inside">
        <li>Ghi nhận và thống kê độ trễ (Latency) cho từng API call.</li>
        <li>Tính năng QC Override: Cho phép chuyên viên can thiệp chấm lại điểm.</li>
        <li>Lưu vết lịch sử quá trình hiệu chỉnh kết quả hệ thống.</li>
      </ul>
    )
  },
  {
    id: 7,
    title: 'Khó khăn & Cách giải quyết',
    content: (
      <div className="space-y-8 text-xl mt-6">
        <div className="p-6 border rounded-xl bg-card/50">
          <h3 className="text-2xl font-bold mb-2">1. Cập nhật tiến độ Realtime gây giật lag server</h3>
          <p className="text-muted-foreground">Giải pháp: Tối ưu Polling 1.5s và tự động tính toán Progress/Score bằng dữ liệu tạm trên Frontend.</p>
        </div>
        <div className="p-6 border rounded-xl bg-card/50">
          <h3 className="text-2xl font-bold mb-2">2. Giao diện Assertions rối mắt khi có nhiều quy tắc</h3>
          <p className="text-muted-foreground">Giải pháp: Thiết kế layout tối giản, tự động thu gọn và xử lý chống tràn tinh tế.</p>
        </div>
      </div>
    )
  },
  {
    id: 8,
    title: 'Demo Hệ thống',
    subtitle: 'Import cURL -> Chọn Dataset -> Run -> Realtime Dashboard',
    content: (
      <div className="flex flex-col items-center justify-center h-full pt-16">
        <p className="text-3xl text-muted-foreground animate-pulse">[ Trình diễn Live Demo ]</p>
      </div>
    )
  },
  {
    id: 9,
    title: 'Hướng phát triển tiếp theo',
    content: (
      <div className="grid grid-cols-2 gap-8 text-xl mt-12">
        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-2xl font-bold mb-4">Giai đoạn 2 (Ngắn hạn)</h3>
          <ul className="space-y-4 list-disc list-inside text-muted-foreground">
            <li>Hỗ trợ đa biến (Multi-variable parsing) từ Dataset.</li>
            <li>Xuất báo cáo định dạng Excel / PDF chuyên sâu.</li>
          </ul>
        </div>
        <div className="p-8 border rounded-xl bg-card">
          <h3 className="text-2xl font-bold mb-4">Giai đoạn 3 (Dài hạn)</h3>
          <ul className="space-y-4 list-disc list-inside text-muted-foreground">
            <li>Tích hợp trực tiếp vào luồng CI/CD.</li>
            <li>Biểu đồ thống kê lịch sử xu hướng (Trend analysis) qua nhiều lần chạy.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 10,
    title: 'Q&A',
    content: (
      <div className="flex flex-col items-center justify-center h-full space-y-6 pt-16">
        <p className="text-5xl font-bold">Cảm ơn bạn đã lắng nghe!</p>
        <p className="text-3xl text-muted-foreground">Mời Mentor đặt câu hỏi.</p>
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
