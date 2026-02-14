import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import Footer from '@/components/Footer';
import HealthInfoModal from '@/components/HealthInfoModal';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [showHealthModal, setShowHealthModal] = useState(false);

  useEffect(() => {
    // Only show health info popup AFTER user is signed in
    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return; // Not signed in — don't show popup

      // Check if profile already has real data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, date_of_birth')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // If profile is auto-generated (default values), prompt for real info
      const needsInfo = !profile || profile.full_name === 'User';
      if (needsInfo) {
        const timer = setTimeout(() => setShowHealthModal(true), 800);
        return () => clearTimeout(timer);
      }
    };

    checkAuthAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Re-check after sign-in
        setTimeout(() => checkAuthAndProfile(), 500);
      }
    });

    return () => authListener.subscription.unsubscribe();
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
