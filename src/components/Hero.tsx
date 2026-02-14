import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Activity, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import kidneyHero from '@/assets/kidney-hero.jpg';

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-nephro">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${kidneyHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Animated Background Gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-gray-900/80"
        style={{
          transform: `translate(${mousePosition.x * 0.005}px, ${mousePosition.y * 0.005}px)`,
        }}
      />

      {/* Floating Medical Icons */}
      {floatingIcons.map(({ Icon, delay, position }, index) => (
        <div
          key={index}
          className="absolute opacity-30 text-white sliding-icons cursor-pointer"
          style={{
            ...position,
            animationDelay: `${delay}s`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.3) translateY(-10px)';
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.opacity = '0.3';
          }}
        >
          <Icon className="h-12 w-12 float-animation" />
        </div>
      ))}

      <div className="container-medical relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 mb-8 fade-in-up shadow-xl">
            <span className="w-3 h-3 bg-slate-900 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-slate-900">
              AI-Powered Medical Diagnostics
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="heading-nephro mb-6 fade-in-up text-white" style={{ animationDelay: '0.1s' }}>
            Renovix AI
            <br />
            <span className="relative text-gray-300">
              Next-Gen Kidney Intelligence
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-gray-300/20 blur-3xl -z-10 pulse-glow"></div>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Revolutionary AI platform transforming kidney health diagnostics through cutting-edge machine learning and medical imaging analysis.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="nephro" size="xl" asChild>
              <Link to="/how-it-works" className="group">
                How It Works
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="card-nephro text-center sliding-card">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-white mb-3 text-lg">HIPAA Compliant</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Enterprise-grade security with privacy-first medical data handling
              </p>
            </div>

            <div className="card-nephro text-center sliding-card">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-white mb-3 text-lg">AI-Powered</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Revolutionary deep learning algorithms trained on vast medical datasets
              </p>
            </div>

            <div className="card-nephro text-center sliding-card">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-white mb-3 text-lg">Instant Results</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Real-time diagnostic insights delivered in under 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;