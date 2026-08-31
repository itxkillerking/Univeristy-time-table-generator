import { useState, useEffect } from 'react';

export default function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<'initial' | 'logo-enter' | 'content-enter' | 'exiting' | 'done'>('initial');

  useEffect(() => {
    // 1. Session Storage Logic
    const navEntries = window.performance?.getEntriesByType('navigation');
    const isReload = navEntries && navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
    
    if (isReload) {
      sessionStorage.removeItem('hasSeenIntro');
    }

    if (sessionStorage.getItem('hasSeenIntro') === 'true') {
      setStage('done');
      onComplete();
      return;
    }

    // 2. Animation Logic (Total ~5.0 seconds)
    
    // 0.3s: Start logo entrance
    const logoTimer = setTimeout(() => {
      setStage('logo-enter');
    }, 300);

    // 1.2s: Start content entrance (title, line, powered by)
    const contentTimer = setTimeout(() => {
      setStage('content-enter');
    }, 1200);

    // 4.0s: Start exiting (moving upward)
    const exitTimer = setTimeout(() => {
      setStage('exiting');
    }, 4000);

    // 5.0s: Finish completely
    const doneTimer = setTimeout(() => {
      setStage('done');
      sessionStorage.setItem('hasSeenIntro', 'true');
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(contentTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (stage === 'done') return null;

  // Derive class states based on the current stage
  const isLogoVisible = stage !== 'initial';
  const isContentVisible = stage === 'content-enter' || stage === 'exiting';
  const isExiting = stage === 'exiting';

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] transition-transform duration-[1000ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${
        isExiting ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl">
        
        {/* University Logo with right-slide animation and strong glow (like Image 2) */}
        <div className="relative mb-8">
          {/* Intense Glow Background */}
          <div 
            className={`absolute inset-0 bg-blue-500/20 rounded-full blur-[40px] scale-150 transition-all duration-1000 delay-300 ${
              isContentVisible ? 'opacity-100' : 'opacity-0'
            }`} 
          />
          <div 
            className={`absolute inset-0 bg-yellow-500/10 rounded-full blur-[30px] scale-110 transition-all duration-1000 delay-300 ${
              isContentVisible ? 'opacity-100' : 'opacity-0'
            }`} 
          />
          <img 
            src="/images/university-logo.png" 
            alt="University Logo" 
            className={`relative h-28 md:h-36 object-contain transition-all duration-[600ms] ease-out drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] ${
              isLogoVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            } motion-reduce:translate-x-0 motion-reduce:transition-opacity`}
          />
        </div>

        {/* Title */}
        <h1 
          className={`text-3xl md:text-5xl font-bold text-white tracking-widest mb-6 transition-all duration-700 ease-out delay-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] ${
            isContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } motion-reduce:translate-y-0`}
        >
          University Timetable Planner
        </h1>
        
        {/* Elegant Golden Accent Line (like Image 2) */}
        <div 
          className={`h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent transition-all duration-1000 ease-out mb-8 ${
            isContentVisible ? 'w-64 md:w-96 opacity-100' : 'w-0 opacity-0'
          }`} 
        />

        {/* Powered By KNG Logics Solution */}
        <div 
          className={`flex flex-col items-center gap-4 transition-all duration-700 ease-out delay-300 ${
            isContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } motion-reduce:translate-y-0`}
        >
          <span className="text-sm text-gray-400 uppercase tracking-[0.3em] drop-shadow-md">
            Powered by
          </span>
          <div className="relative">
             {/* Subtle glow for KNG Logo */}
             <div 
              className={`absolute inset-0 bg-blue-500/20 rounded-full blur-[20px] scale-150 transition-all duration-1000 delay-500 ${
                isContentVisible ? 'opacity-100' : 'opacity-0'
              }`} 
             />
             <img 
               src="/images/kng_logo_4k_transparent (1) (1)_11zon (2).png" 
               alt="KNG Logics Solution" 
               className="relative h-12 md:h-14 object-contain drop-shadow-[0_0_12px_rgba(0,100,255,0.4)]"
             />
          </div>
        </div>

      </div>
    </div>
  );
}
