import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

interface HeroProps {
  isPlaying?: boolean;
}

export default function Hero({ isPlaying = true }: HeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    // Ensure the video starts from the beginning when it's allowed to play
    if (videoRef.current) {
      if (isPlaying) {
        setVideoEnded(false);
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isPlaying]);

  const handleVideoEnded = () => {
    setVideoEnded(true);
  };

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 bg-slate-900">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          poster="/images/main-building.jpg"
          onEnded={handleVideoEnded}
        >
          <source src="/videos/hero-section-video.mp4" type="video/mp4" />
        </video>
        {/* Radial gradient – fades in when text appears for readability */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.6)_0%,rgba(15,23,42,0.1)_60%,transparent_100%)]"
          style={{
            opacity: videoEnded ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
          }}
        />
      </div>

      {/* Hero Content — hidden while video plays, smoothly revealed on end */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40 flex flex-col items-center text-center">
        <h1
          className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl max-w-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{
            opacity: videoEnded ? 1 : 0,
            transform: videoEnded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.9s ease-out, transform 0.9s ease-out',
          }}
        >
          <span className="block mb-2">Build Your University Timetable,</span>
          <span className="block text-blue-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Without the Guesswork.</span>
        </h1>
        <p
          className="mt-6 max-w-2xl mx-auto text-lg text-slate-100 sm:text-xl font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          style={{
            opacity: videoEnded ? 1 : 0,
            transform: videoEnded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1s ease-out 0.2s, transform 1s ease-out 0.2s',
          }}
        >
          Select your courses and sections, detect timetable clashes, find suitable alternatives, and create your final timetable in minutes.
        </p>
        <div
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto sm:max-w-none"
          style={{
            opacity: videoEnded ? 1 : 0,
            transform: videoEnded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1s ease-out 0.4s, transform 1s ease-out 0.4s',
          }}
        >
          <Link
            to="/builder"
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Continue to Builder
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border border-gray-300 text-base font-medium rounded-md text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
          >
            Login
          </Link>
        </div>
        <p
          className="mt-4 text-sm text-gray-300"
          style={{
            opacity: videoEnded ? 1 : 0,
            transition: 'opacity 1s ease-out 0.6s',
          }}
        >
          * Login is optional. You can build your timetable as a guest.
        </p>
      </div>
    </div>
  );
}
