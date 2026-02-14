import React from 'react';
import { Mail, Github, Linkedin, FileText, MapPin, Code, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import developerBg from '@/assets/developer-bg.jpg';

const Developer = () => {
  const skills = [
    "Machine Learning",
    "Deep Learning", 
    "Natural Language Processing",
    "Agentic AI & Gen AI",
    "MLOps",
    "Research & Development",
    "Technical Writing",
    "Open Source Development"
  ];

  const projects = [
    {
      title: "Renovix AI",
      description: "Advanced AI-powered kidney health analysis system using computer vision and machine learning",
      tech: ["Python", "TensorFlow", "OpenCV", "React"],
      githubUrl: "https://github.com/Stonebanks-js"
    },
    {
      title: "MLOps Pipeline",
      description: "Automated machine learning pipeline for model deployment and monitoring",
      tech: ["Docker", "Kubernetes", "MLflow", "Python"],
      githubUrl: "https://github.com/Stonebanks-js"
    },
    {
      title: "Agentic AI Research",
      description: "Research on autonomous AI agents for healthcare applications",
      tech: ["LangChain", "OpenAI", "RAG", "Vector DB"],
      githubUrl: "https://github.com/Stonebanks-js"
    }
  ];

  const handleEmailClick = () => {
    window.location.href = 'mailto:aradhyachdry@gmail.com';
  };

  const handleLinkedInClick = () => {
    window.open('https://www.linkedin.com/in/as-chaudhary/', '_blank', 'noopener,noreferrer');
  };

  const handleGitHubClick = () => {
    window.open('https://github.com/Stonebanks-js', '_blank', 'noopener,noreferrer');
  };

  const handleResumeClick = () => {
    window.open('https://drive.google.com/file/d/1WuUYos9Us5MWWnWdP8RqDKJiH9JIakYH/view?usp=sharing', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Background */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${developerBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container-medical relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/20">
                <Brain className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Data Scientist & ML Engineer</span>
              </div>
              
              <h1 className="heading-nephro mb-6">
                Meet <span className="bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent">Aradhya Chaudhary</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Innovative Data Scientist & ML Practitioner specializing in Agentic AI, Healthcare Technology, 
                and Open Source Development. Transforming complex data into intelligent solutions.
              </p>

              <div className="flex items-center justify-center gap-2 mb-8 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>Kanpur, Uttar Pradesh, India</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  variant="nephro" 
                  size="lg" 
                  onClick={handleLinkedInClick}
                  className="hover-scale group"
                >
                  <Linkedin className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  LinkedIn Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleGitHubClick}
                  className="hover-scale group bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:border-white/50 transition-all duration-300"
                >
                  <Github className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  GitHub
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleEmailClick}
                  className="hover-scale group bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:border-white/50 transition-all duration-300"
                >
                  <Mail className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Email Me
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleResumeClick}
                  className="hover-scale group bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:border-white/50 transition-all duration-300"
                >
                  <FileText className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Resume
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding bg-gradient-to-b from-background to-muted/20">
        <div className="container-medical">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h2 className="heading-section mb-6">About Aradhya</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  As a dedicated Data Scientist and Senior Technical Editor at <strong>Kextcache</strong>, 
                  Aradhya brings expertise in cutting-edge technologies including Machine Learning, 
                  Deep Learning, and Natural Language Processing.
                </p>
                <p>
                  With a passion for <strong>Agentic AI & Generative AI</strong>, he specializes in 
                  developing intelligent healthcare solutions, MLOps pipelines, and contributing to 
                  open-source projects including <strong>Hacktoberfest'24</strong>.
                </p>
                <p>
                  Beyond technical expertise, Aradhya is an accomplished <strong>Technical Writer</strong> 
                  and <strong>Tech Speaker</strong>, sharing knowledge and advancing the ML community 
                  through research, development, and thought leadership.
                </p>
              </div>
            </div>
            
            <div className="animate-fade-in-up">
              <Card className="card-medical p-8 hover-scale">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold">Core Expertise</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {skills.map((skill, index) => (
                    <div 
                      key={index}
                      className="bg-muted/50 rounded-lg p-3 text-sm font-medium text-center hover:bg-primary/10 hover:text-primary transition-all duration-200 hover-scale cursor-pointer"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-medical">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="heading-section mb-4">Featured Projects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Innovative solutions at the intersection of AI, healthcare, and technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <Card 
                key={index}
                className="card-medical p-6 animate-fade-in-up group cursor-pointer hover:scale-110 hover:animate-pulse transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => window.open(project.githubUrl, '_blank', 'noopener,noreferrer')}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Code className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                  <h3 className="font-semibold">{project.title}</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, techIndex) => (
                    <span 
                      key={techIndex}
                      className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="container-medical text-center animate-fade-in-up">
          <h2 className="heading-section mb-6">Let's Collaborate</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Interested in AI innovation, healthcare technology, or open source collaboration? 
            Let's connect and build the future together.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button 
              variant="nephro" 
              size="lg" 
              onClick={handleEmailClick}
              className="hover-scale group"
            >
              <Mail className="w-5 h-5 mr-2 group-hover:bounce" />
              Get In Touch
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleLinkedInClick}
              className="hover-scale group"
            >
              <Linkedin className="w-5 h-5 mr-2 group-hover:bounce" />
              Connect on LinkedIn
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Developer;