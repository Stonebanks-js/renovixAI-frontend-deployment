import React from 'react';
import { Upload, Brain, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Medical Scan',
      description: 'Securely upload your kidney scan images including X-rays, CT scans, or ultrasounds through our HIPAA-compliant platform.',
      color: 'primary',
      delay: '0s'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Our advanced machine learning algorithms analyze the scan in real-time, identifying patterns and anomalies with medical-grade precision.',
      color: 'secondary', 
      delay: '0.2s'
    },
    {
      icon: FileText,
      title: 'Instant Results',
      description: 'Receive comprehensive diagnostic insights with confidence scores, recommendations, and detailed analysis within seconds.',
      color: 'primary',
      delay: '0.4s'
    }
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container-medical">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-secondary">How It Works</span>
          </div>
          
          <h2 className="heading-section">
            Simple, Fast, and Accurate
            <br />AI-Powered Diagnostics
          </h2>
          
          <p className="text-medical">
            Our streamlined process makes advanced kidney diagnostics accessible to healthcare 
            professionals worldwide. From upload to diagnosis in just three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isSecondary = step.color === 'secondary';
            
            return (
              <div key={index} className="relative group">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-white border-2 border-primary rounded-full flex items-center justify-center z-10">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>

                {/* Card */}
                <div 
                  className="card-medical h-full text-center group-hover:scale-[1.02] transition-all duration-500"
                  style={{ animationDelay: step.delay }}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                    isSecondary ? 'bg-secondary/10' : 'bg-primary/10'
                  }`}>
                    <Icon className={`h-8 w-8 ${
                      isSecondary ? 'text-secondary' : 'text-primary'
                    }`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-0">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Process Visualization */}
        <div className="bg-muted/30 rounded-2xl p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Advanced AI Pipeline
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our proprietary deep learning models are trained on thousands of medical scans, 
              ensuring the highest level of accuracy and reliability in diagnostic results.
            </p>
          </div>

          {/* Technical Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Image Preprocessing', desc: 'DICOM compatible normalization' },
              { label: 'Feature Extraction', desc: 'CNN-based pattern recognition' },
              { label: 'Classification', desc: 'Multi-class diagnostic labeling' },
              { label: 'Confidence Scoring', desc: 'Statistical reliability metrics' }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">{index + 1}</span>
                </div>
                <h4 className="font-medium text-foreground mb-2">{feature.label}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-[var(--shadow-soft)]">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Ready to Experience AI-Powered Diagnostics?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join hundreds of healthcare professionals who trust NephroScan AI for 
            accurate, fast, and reliable kidney health diagnostics.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/ai-scan">
                Start Analysis
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;