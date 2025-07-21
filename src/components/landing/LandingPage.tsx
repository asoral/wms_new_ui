import LandingNavigation from './LandingNavigation';
import LandingHero from './LandingHero';
import LandingFeatures from './LandingFeatures';
import AppShowcase from './AppShowcase';
import ProblemsSection from './ProblemsSection';
import iPhone3DCarousel from './iPhone3DCarousel';
import BenefitsSection from './BenefitsSection';
import LandingCTA from './LandingCTA';
import LandingFooter from './LandingFooter';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />
      <LandingHero />
      <LandingFeatures />
      <AppShowcase />
      <iPhone3DCarousel />
      <ProblemsSection />
      <BenefitsSection />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;