import React from 'react';
import { Upload, Brain, FileText, ArrowRight, Sparkles } from 'lucide-react';
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
    <section className="section-padding bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="container-medical relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/20">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">How It Works</span>
          </div>
          
          <h2 className="heading-section">
            Simple, Fast, and Accurate
            <br />
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              AI-Powered Diagnostics
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
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
              <div key={index} className="relative group animate-fade-in-up hover-scale" style={{ animationDelay: step.delay }}>
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary border-2 border-background rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-sm font-bold text-white">{index + 1}</span>
                </div>

                {/* Card */}
                <div className="card-nephro h-full text-center group cursor-pointer">
                  {/* Icon */}
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                    isSecondary ? 'bg-secondary/10 group-hover:bg-secondary/20' : 'bg-primary/10 group-hover:bg-primary/20'
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
                    <ArrowRight className="h-6 w-6 text-primary/30 group-hover:text-primary transition-colors duration-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Process Visualization */}
        <div className="card-nephro p-8 mb-12 hover-scale animate-fade-in-up">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Advanced AI Pipeline
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
              <div key={index} className="text-center hover-scale group cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-all duration-300">
                  <span className="text-primary font-bold group-hover:scale-110 transition-transform duration-300">{index + 1}</span>
                </div>
                <h4 className="font-medium text-foreground mb-2">{feature.label}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center card-nephro p-8 hover-scale animate-fade-in-up">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Ready to Experience AI-Powered Diagnostics?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of healthcare professionals who trust Renovix AI for 
            accurate, fast, and reliable kidney health diagnostics.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="nephro" size="lg" asChild className="hover-scale">
              <Link to="/ai-scan">
                Start Analysis
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild className="hover-scale">
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