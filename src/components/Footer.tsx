import React from 'react';
import { Activity, Mail, Phone, MapPin, Clock, Linkedin, Twitter, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const footerLinks = {
    product: [
      { name: 'AI Scan', href: '/ai-scan' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'API Documentation', href: '/docs' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'News', href: '/news' },
      { name: 'Contact', href: '/contact' },
    ],
    resources: [
      { name: 'Research Papers', href: '/research' },
      { name: 'Case Studies', href: '/case-studies' },
      { name: 'Help Center', href: '/help' },
      { name: 'Blog', href: '/blog' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'HIPAA Compliance', href: '/hipaa' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  };

  const contactInfo = [
    { icon: Mail, text: 'stonebanks.ie@gmail.com', href: 'mailto:stonebanks.ie@gmail.com' },
    { icon: Phone, text: '+91 9721324544, +91 7054124544', href: 'tel:+919721324544' },
    { icon: MapPin, text: 'Kanpur, UP, India', href: '#' },
    { icon: Clock, text: '24/7 services available', href: '#' },
  ];

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="container-medical">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">NephroScan AI</span>
            </Link>
            
            <p className="text-background/70 mb-6 leading-relaxed">
              Revolutionizing kidney health diagnostics with cutting-edge AI technology. 
              Empowering healthcare professionals with instant, accurate diagnostic insights.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map(({ icon: Icon, text, href }, index) => (
                <a
                  key={index}
                  href={href}
                  className="flex items-center gap-3 text-background/70 hover:text-primary transition-colors duration-300"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-background mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-background mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-background mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-background mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-background/20 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-background/70 text-sm">
              © 2024 NephroScan AI. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 bg-background/10 rounded-lg flex items-center justify-center text-background/70 hover:text-primary hover:bg-primary/10 transition-all duration-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Compliance Badge */}
            <div className="flex items-center gap-2 text-xs text-background/70">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;