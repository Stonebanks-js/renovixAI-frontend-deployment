import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import Footer from '@/components/Footer';
import HealthInfoModal from '@/components/HealthInfoModal';

const Index = () => {
  const [showHealthModal, setShowHealthModal] = useState(false);

  useEffect(() => {
    // Check if user has already provided health info
    const healthInfo = localStorage.getItem('healthInfo');
    if (!healthInfo) {
      // Delay showing modal to let page load
      const timer = setTimeout(() => {
        setShowHealthModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <AboutSection />
      <HowItWorksSection />
      <Footer />
      
      <HealthInfoModal 
        isOpen={showHealthModal} 
        onClose={() => setShowHealthModal(false)} 
      />
    </div>
  );
};

export default Index;
