import React from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksSection from '@/components/HowItWorksSection';
import Footer from '@/components/Footer';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;