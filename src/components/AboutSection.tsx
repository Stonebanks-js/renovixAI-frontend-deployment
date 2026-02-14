import React from 'react';
import { CheckCircle, Users, Award, Microscope } from 'lucide-react';
import kidneyIcon from '@/assets/kidney-icon.png';
import aiBrainIcon from '@/assets/ai-brain-icon.png';

const AboutSection = () => {
  const achievements = [
    { label: 'Accuracy Rate', value: '97.5%', icon: Award },
    { label: 'Scans Analyzed', value: '50K+', icon: Microscope },
    { label: 'Healthcare Partners', value: '150+', icon: Users },
    { label: 'Countries Served', value: '25+', icon: CheckCircle },
  ];

  const features = [
    'Advanced AI algorithms trained on thousands of medical scans',
    'Real-time diagnostic insights with confidence scoring',
    'HIPAA compliant infrastructure for maximum security',
    'Integration with existing hospital information systems',
    'Continuous learning and model improvement',
    '24/7 support for healthcare professionals',
  ];

  return (
    <section className="section-padding bg-subtle-gradient">
      <div className="container-medical">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-medium text-primary">About Renovix AI</span>
            </div>
            
            <h2 className="heading-section">
              Transforming Kidney Disease Detection Through AI Innovation
            </h2>
            
            <p className="text-medical mb-6">
              Renovix AI represents a breakthrough in medical diagnostics, combining 
              cutting-edge artificial intelligence with decades of nephrology expertise. 
              Our platform empowers healthcare professionals with instant, accurate 
              diagnostic insights for kidney-related conditions.
            </p>

            <p className="text-medical mb-8">
              Founded by a team of nephrologists, AI researchers, and medical technology 
              experts, we're committed to making advanced diagnostic tools accessible to 
              healthcare providers worldwide, ultimately improving patient outcomes and 
              reducing diagnostic time.
            </p>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-2 gap-4">
              {achievements.map(({ label, value, icon: Icon }, index) => (
                <div key={index} className="card-medical text-center">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Elements */}
          <div className="relative">
            {/* Main illustration container */}
            <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-[var(--shadow-medium)]">
              {/* Floating kidney icon */}
              <div className="absolute top-4 right-4 float-animation">
                <img 
                  src={kidneyIcon} 
                  alt="Kidney Icon" 
                  className="h-16 w-16 opacity-60"
                />
              </div>

              {/* AI Brain illustration */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <img 
                    src={aiBrainIcon} 
                    alt="AI Brain" 
                    className="h-32 w-32 pulse-glow"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
                </div>
              </div>

              {/* Connection lines */}
              <div className="relative">
                <div className="absolute top-1/2 left-1/4 w-1/2 h-0.5 bg-gradient-to-r from-primary to-secondary opacity-30"></div>
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-primary rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Microscope className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-foreground">Deep Analysis</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="text-sm font-medium text-foreground">Proven Accuracy</div>
                </div>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/5 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;