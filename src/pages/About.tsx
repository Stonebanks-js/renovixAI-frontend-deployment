import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Users, Target, Award, Heart, CheckCircle } from 'lucide-react';

const About = () => {
  const team = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Chief Medical Officer',
      description: 'Leading nephrologist with 15+ years in kidney disease research',
      image: '/placeholder.svg'
    },
    {
      name: 'Dr. Michael Rodriguez',
      role: 'Chief Technology Officer', 
      description: 'AI researcher specializing in medical imaging and deep learning',
      image: '/placeholder.svg'
    },
    {
      name: 'Emily Johnson',
      role: 'Head of Product',
      description: 'Healthcare technology expert focused on user experience',
      image: '/placeholder.svg'
    },
    {
      name: 'Dr. James Park',
      role: 'Director of Research',
      description: 'Biomedical engineer with expertise in diagnostic systems',
      image: '/placeholder.svg'
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Patient-Centered Care',
      description: 'Every innovation we create is designed to improve patient outcomes and quality of life.'
    },
    {
      icon: Target,
      title: 'Scientific Rigor',
      description: 'Our AI models are built on robust scientific foundations and validated through extensive research.'
    },
    {
      icon: Award,
      title: 'Excellence in Innovation',
      description: 'We continuously push the boundaries of what\'s possible in medical AI diagnostics.'
    },
    {
      icon: CheckCircle,
      title: 'Ethical AI',
      description: 'We are committed to responsible AI development that prioritizes transparency and fairness.'
    }
  ];

  const timeline = [
    {
      year: '2021',
      title: 'Company Founded',
      description: 'NephroScan AI was established by a team of nephrologists and AI researchers.'
    },
    {
      year: '2022',
      title: 'First AI Model',
      description: 'Developed our first kidney disease detection algorithm with 95% accuracy.'
    },
    {
      year: '2023',
      title: 'Clinical Validation',
      description: 'Completed clinical trials across 15 hospitals with 97.5% accuracy rate.'
    },
    {
      year: '2024',
      title: 'Global Launch',
      description: 'Launched platform globally, serving 150+ healthcare partners across 25 countries.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-medical-pattern">
        <div className="container-medical">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="heading-hero mb-6">
              Pioneering the Future of
              <br />Medical AI Diagnostics
            </h1>
            <p className="text-medical max-w-2xl mx-auto">
              We're a team of passionate medical professionals, AI researchers, and healthcare 
              innovators dedicated to revolutionizing kidney disease detection through 
              cutting-edge artificial intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding">
        <div className="container-medical">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="heading-section">Our Mission</h2>
              <p className="text-medical mb-6">
                To democratize access to advanced kidney disease diagnostics through AI, 
                empowering healthcare professionals worldwide with instant, accurate, 
                and reliable diagnostic tools that save lives and improve patient outcomes.
              </p>
              <p className="text-medical">
                We believe that every patient deserves access to the best diagnostic 
                technology, regardless of their location or economic circumstances.
              </p>
            </div>
            <div className="card-medical bg-primary/5">
              <h3 className="text-xl font-semibold text-foreground mb-4">Our Vision</h3>
              <p className="text-muted-foreground">
                A world where kidney disease is detected early, accurately, and consistently 
                across all healthcare settings, leading to better treatment outcomes and 
                improved quality of life for millions of patients globally.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="heading-section text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="card-medical text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-3">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-muted/30">
        <div className="container-medical">
          <h2 className="heading-section text-center mb-12">Our Journey</h2>
          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start gap-6 mb-8 last:mb-0">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center font-bold text-white">
                    {item.year}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="container-medical">
          <h2 className="heading-section text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card-medical text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;