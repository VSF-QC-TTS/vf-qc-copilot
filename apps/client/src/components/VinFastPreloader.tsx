import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface VinFastPreloaderProps {
  logoUrl: string
  onComplete: () => void
}

export function VinFastPreloader({ logoUrl, onComplete }: VinFastPreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)
  const bgGlowRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const statusTextRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const logoContainer = logoContainerRef.current
    const image = imageRef.current
    const shine = shineRef.current
    const bgGlow = bgGlowRef.current
    const progressBar = progressBarRef.current
    const statusText = statusTextRef.current

    if (!container || !logoContainer || !image || !shine || !bgGlow || !progressBar || !statusText) return

    // Set initial states
    gsap.set(logoContainer, { scale: 0.7, opacity: 0 })
    gsap.set(image, { filter: 'brightness(1.5) drop-shadow(0 0 0px rgba(59, 130, 246, 0))' })
    gsap.set(bgGlow, { scale: 0.7, opacity: 0 })
    gsap.set(shine, { x: '-150%', opacity: 0 })
    gsap.set(progressBar, { scaleX: 0 })
    gsap.set(statusText, { opacity: 0, y: 10 })

    const tl = gsap.timeline({
      onComplete: () => {
        // Simple fade out of the container directly
        gsap.to(container, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: onComplete,
        })

        /* Original cinematic logo exit zoom (Commented for comparison)
        const exitTl = gsap.timeline({
          onComplete: onComplete
        })

        exitTl.to(logoContainer, {
          scale: 1.1,
          opacity: 0,
          filter: 'brightness(2) blur(8px)',
          duration: 0.5,
          ease: 'power3.inOut'
        })
        .to(container, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut'
        }, '-=0.3')
        */
      }
    })

    // Phase 1: Reveal logo with a premium spring scale and fade
    tl.to(logoContainer, {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: 'elastic.out(1, 0.75)'
    })
    // Phase 2: Fade in the ambient background glows and status details
    .to(bgGlow, {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.8')
    .to(statusText, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.6')
    // Phase 3: Fill progress bar (expanding from center)
    .to(progressBar, {
      scaleX: 1,
      duration: 2.0,
      ease: 'power3.inOut'
    }, '-=0.4')
    // Phase 4: Diagonal shine sweep across the logo (triggered halfway through progress)
    .fromTo(shine,
      { x: '-120%', opacity: 0 },
      {
        x: '160%',
        opacity: 0.8,
        duration: 1.2,
        ease: 'power2.inOut',
      },
      '-=1.4'
    )
    // Add dynamic brightness spike to the logo as loading finishes
    .to(image, {
      filter: 'brightness(1.8) drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))',
      duration: 0.4,
      ease: 'power2.out'
    }, '-=0.4')
    .to(statusText, {
      opacity: 0,
      y: -5,
      duration: 0.3,
      ease: 'power2.in'
    }, '-=0.2')

    return () => {
      tl.kill()
    }
  }, [onComplete])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden"
    >
      {/* Dot Grid Pattern - matching LoginPage dynamic canvas */}
      <div 
        className="absolute inset-0 opacity-[0.3] dark:opacity-[0.15] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, #71717a 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Subtle Glowing Orbs Container */}
      <div ref={bgGlowRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[15%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[130px] dark:bg-blue-500/5" />
        <div className="absolute bottom-[15%] right-[15%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[130px] dark:bg-emerald-500/5" />
      </div>

      <div className="flex flex-col items-center gap-8 z-10">
        {/* Logo container */}
        <div 
          ref={logoContainerRef}
          className="relative size-48 md:size-56 flex items-center justify-center"
        >
          <img
            ref={imageRef}
            src={logoUrl}
            className="w-full h-full object-contain select-none pointer-events-none filter drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
            alt="VinFast Logo"
          />
          {/* Sweeping diagonal light reflection */}
          <div
            ref={shineRef}
            className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
            style={{
              background: 'linear-gradient(95deg, transparent, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 55%, transparent)',
              transform: 'skewX(-25deg)',
            }}
          />
        </div>

        {/* Loading details */}
        <div className="flex flex-col items-center gap-3 w-64">
          {/* Progress Bar Container */}
          <div className="relative w-full h-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            {/* Centered progress indicator */}
            <div
              ref={progressBarRef}
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-primary to-emerald-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] rounded-full origin-center"
            />
          </div>

          {/* Status text */}
          <div 
            ref={statusTextRef}
            className="text-[10px] md:text-xs font-semibold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 uppercase select-none font-mono"
          >
            VinFast QC Copilot
          </div>
        </div>
      </div>
    </div>
  )
}
