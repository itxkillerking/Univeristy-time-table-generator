import Hero from '../components/home/Hero';
import CoreFeatures from '../components/home/CoreFeatures.tsx';
import HowItWorks from '../components/home/HowItWorks.tsx';
import CourseSelectionPreview from '../components/home/CourseSelectionPreview.tsx';
import ClashDetectionPreview from '../components/home/ClashDetectionPreview.tsx';
import TimetablePreview from '../components/home/TimetablePreview.tsx';
import ReportProblemCTA from '../components/home/ReportProblemCTA.tsx';

export default function HomePage() {
  const isIntroDone = true;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Intro Splash Wrapper (Temporarily Disabled) */}
      {/* <IntroSplash onComplete={() => setIsIntroDone(true)} /> */}
      
      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        <Hero isPlaying={isIntroDone} />
        <CoreFeatures />
        <HowItWorks />
        <CourseSelectionPreview />
        <ClashDetectionPreview />
        <TimetablePreview />
        <ReportProblemCTA />
      </div>
    </div>
  );
}
