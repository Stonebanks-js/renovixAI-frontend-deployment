import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Activity, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import medicalHeroBg from '@/assets/medical-hero-bg.jpg';

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const floatingIcons = [
    { Icon: Brain, delay: 0, position: { top: '20%', left: '10%' } },
    { Icon: Activity, delay: 1, position: { top: '60%', left: '15%' } },
    { Icon: Shield, delay: 2, position: { top: '30%', right: '20%' } },
    { Icon: Zap, delay: 0.5, position: { top: '70%', right: '10%' } },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-medical-pattern">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${medicalHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Animated Background Gradient */}
      <div 
        className="absolute inset-0 bg-hero-gradient opacity-5"
        style={{
          transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
        }}
      />

      {/* Floating Medical Icons */}
      {floatingIcons.map(({ Icon, delay, position }, index) => (
        <div
          key={index}
          className="absolute opacity-20 text-primary"
          style={{
            ...position,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon className="h-12 w-12 float-animation" />
        </div>
      ))}

      <div className="container-medical relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 fade-in-up">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-foreground">
              AI-Powered Medical Diagnostics
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="heading-hero mb-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
            Advanced Kidney Health
            <br />
            <span className="relative">
              Diagnostics with AI
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl -z-10 pulse-glow"></div>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-medical max-w-2xl mx-auto mb-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
            Revolutionizing nephrology with cutting-edge AI technology. Upload medical scans 
            and receive instant, accurate diagnostic insights powered by advanced machine learning.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/ai-scan" className="group">
                Upload Scan
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
            
            <Button variant="outline" size="xl" asChild>
              <Link to="/how-it-works">
                Learn How It Works
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="card-hero text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">HIPAA Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Secure, privacy-first medical data handling
              </p>
            </div>

            <div className="card-hero text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Brain className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Advanced machine learning algorithms
              </p>
            </div>

            <div className="card-hero text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Instant Results</h3>
              <p className="text-sm text-muted-foreground">
                Real-time diagnostic insights in seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;