import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Phone, MapPin, Clock, HelpCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // You can create a contacts table and store submissions there
      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions about NephroScan AI? Our team of experts is here to help. 
              Whether you're a healthcare professional, researcher, or potential partner, 
              we'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your full name" 
                        className="mt-1" 
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com" 
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="How can we help you?" 
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us more about your inquiry..." 
                      className="mt-1 min-h-[120px]"
                      required
                    />
                  </div>
                  
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : (
                      <>
                        Send Message
                        <Send className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">stonebanks.ie@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">+91 9721324544, +91 7054124544</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">Kanpur, Uttar Pradesh, India</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-muted-foreground">24/7 services available</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="p-6 bg-primary/5">
                <h3 className="font-semibold mb-3">Looking for Support?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you're an existing customer looking for technical support, 
                  please visit our help center or contact our support team directly.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Visit Help Center
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <div className="py-16 bg-secondary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-2">
              Find answers to common questions about NephroScan AI
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="what-is-nephroscan" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What is NephroScan AI and how does it work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                NephroScan AI is an advanced medical diagnostic platform that uses artificial intelligence to analyze kidney-related medical scans and provide insights. Our AI model processes medical images to detect potential abnormalities and provide preliminary diagnostic suggestions to assist healthcare professionals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accuracy" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How accurate is the AI diagnosis?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AI model has been trained on extensive medical datasets and achieves high accuracy rates. However, it's important to note that NephroScan AI is designed to assist healthcare professionals, not replace them. All results should be reviewed by qualified medical practitioners before making any treatment decisions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-security" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Is my medical data secure and private?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we take data security very seriously. All medical data is encrypted both in transit and at rest. We comply with HIPAA regulations and international data protection standards. Your personal health information is never shared with third parties without your explicit consent.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="supported-scans" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What types of medical scans does NephroScan AI support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, NephroScan AI supports CT scans, MRI images, and ultrasound images related to kidney and urological conditions. We're continuously working to expand our support for additional imaging modalities and medical conditions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="turnaround-time" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How long does it take to get results?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AI analysis typically completes within 2-5 minutes after uploading your medical scan. The system provides immediate preliminary results, which can then be reviewed and validated by medical professionals if needed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="medical-professional" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Do I need to be a medical professional to use this service?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                While NephroScan AI can be used by patients, we strongly recommend that all results be interpreted by qualified healthcare professionals. The platform is designed to assist medical professionals in their diagnostic process and provide patients with additional insights into their health data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cost" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What are the costs associated with using NephroScan AI?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer various pricing plans to suit different needs, from individual patients to healthcare institutions. Please contact our sales team for detailed pricing information based on your specific requirements and usage volume.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="support" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What kind of support do you provide?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We provide comprehensive technical support including email support, documentation, and training materials. For enterprise customers, we also offer dedicated support channels and onboarding assistance. You can reach our support team at stonebanks.ie@gmail.com.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;