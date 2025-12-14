import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Phone, Mail, MapPin, ArrowRight, Building2, TrendingUp, Handshake, Award, Shield, Clock, Quote, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import tabithaHouseStats from '@/data/agentStats';

// Agent stats from configuration (can be updated daily)
const agentStats = tabithaHouseStats;

// Tabitha House's Real Performance Data from Research
const awards = [
  { year: "2024", title: "Top Luxury Listing Agent", org: "Century 21 Advantage Realty" },
  { year: "2024", title: "Top Producer", org: "Century 21 Advantage Realty" },
  { year: "2024", title: "Top Company Agent", org: "Century 21 Advantage Realty" },
  { year: "2024", title: "Centurion Award", org: "Century 21" },
  { year: "2025", title: "Top Listing Agent - November", org: "Century 21 Advantage Realty" },
];

const expertise = [
  {
    icon: Building2,
    title: "Residential & Commercial",
    description: "Specializing in both residential and commercial properties across Laurel County and surrounding areas."
  },
  {
    icon: TrendingUp,
    title: "Top 1% Performance",
    description: "PRIME Agent - ranked in the Top 1% of RealEstateAgents.com with 68 sales in the last 12 months."
  },
  {
    icon: Handshake,
    title: "Expert Negotiation",
    description: "223 total transactions with proven negotiation skills that consistently secure the best terms for clients."
  },
  {
    icon: Award,
    title: "Award-Winning",
    description: "Centurion Award Winner, Masters Diamond Award recipient, and consistently ranked as Top Producing Agent."
  },
  {
    icon: Shield,
    title: "Trusted Advisor",
    description: "5.0 rating with a commitment to protect your interests throughout every transaction."
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Usually responds in 10 minutes. Open 24 hours for dedicated support around the clock."
  },
];

const testimonials = [
  {
    quote: "Tabitha's expertise and dedication made finding our dream home a reality. Her knowledge of the London, KY market is unparalleled, and she negotiated a deal that exceeded our expectations.",
    author: "Happy Homebuyer",
    title: "Purchased Home in Laurel County",
  },
  {
    quote: "The House Team handled everything with grace and professionalism. They achieved above asking price in record time. Highly recommend!",
    author: "Satisfied Seller",
    title: "Sold Property in London, KY",
  },
  {
    quote: "As a first-time buyer, I needed someone who understood my needs. Tabitha's guidance was invaluable throughout the entire process.",
    author: "First-Time Buyer",
    title: "New Homeowner in Kentucky",
  },
];

// Animated Metric Component
interface MetricProps {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  delay?: number;
}

const AnimatedMetric = ({ value, suffix, prefix = "", label, delay = 0 }: MetricProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          current += stepValue;
          if (current >= value) {
            setDisplayValue(value);
            clearInterval(interval);
          } else {
            setDisplayValue(Math.floor(current));
          }
        }, duration / steps);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className="text-center"
    >
      <p className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-2">
        {prefix}{displayValue}{suffix}
      </p>
      <p className="text-sm md:text-base text-muted-foreground font-body uppercase tracking-wider">
        {label}
      </p>
    </motion.div>
  );
};

// Main SOQ Page Component
const SOQPage = () => {
  return (
    <div 
      className="soq-theme"
      style={{
        '--background': '220 20% 6%',
        '--foreground': '45 30% 96%',
        '--card': '220 18% 10%',
        '--card-foreground': '45 30% 96%',
        '--popover': '220 18% 10%',
        '--popover-foreground': '45 30% 96%',
        '--primary': '42 65% 58%',
        '--primary-foreground': '220 20% 6%',
        '--secondary': '220 15% 15%',
        '--secondary-foreground': '45 30% 96%',
        '--muted': '220 15% 18%',
        '--muted-foreground': '220 15% 65%',
        '--accent': '42 65% 58%',
        '--accent-foreground': '220 20% 6%',
        '--border': '220 15% 20%',
        '--input': '220 15% 20%',
        '--ring': '42 65% 58%',
      } as React.CSSProperties}
    >
    <main className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 py-4 md:py-6 backdrop-blur-md bg-background/80 border-b border-border/10"
      >
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Back to Home */}
            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline font-body text-sm">Back to Home</span>
            </a>
            
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <span className="font-display text-lg md:text-2xl text-foreground">
                Tabitha <span className="text-primary">House</span>
              </span>
            </a>
            
            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#metrics" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                Performance
              </a>
              <a href="#expertise" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                Expertise
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                Testimonials
              </a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                Contact
              </a>
            </nav>
            
            {/* CTA Button */}
            <Button 
              variant="outline" 
              size="sm"
              className="border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-luxury-home.jpg"
            alt="Luxury home"
            className="w-full h-full object-cover opacity-40"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/50" />
        </div>
        
        {/* Gold accent line */}
        <div className="absolute left-8 md:left-16 top-1/4 w-px h-1/2 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
        
        <div className="container relative z-10 px-4 md:px-6 py-20">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-6"
            >
              Statement of Qualifications
            </motion.p>
            
            {/* Name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground mb-4"
            >
              <span className="text-gradient-gold">Tabitha</span>
              <br />
              <span className="text-gradient-gold">House</span>
            </motion.h1>
            
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground font-body font-light max-w-xl mb-8"
            >
              Top 1% PRIME Agent delivering exceptional real estate results in London, Kentucky with unmatched expertise, unwavering dedication, and proven performance.
            </motion.p>
            
            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                onClick={() => window.open('https://www.century21.com/real-estate-agent/profile/tabitha-house-P106668633', '_blank')}
              >
                View My Portfolio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Schedule Consultation
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground font-body uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent animate-pulse" />
        </motion.div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="py-20 md:py-32 relative">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4">
              Proven Track Record
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground">
              Performance <span className="text-gradient-gold">Metrics</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <AnimatedMetric value={agentStats.salesLast12Months} suffix="+" prefix="" label="Sales Last 12 Months" delay={0} />
            <AnimatedMetric value={agentStats.totalTransactions} suffix="+" prefix="" label="Total Transactions" delay={200} />
            <AnimatedMetric value={agentStats.yearsExperience} suffix="" prefix="" label="Years Experience" delay={400} />
            <AnimatedMetric value={Math.floor(agentStats.starRating)} suffix=".0" prefix="" label="Star Rating" delay={600} />
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-20 relative border-y border-border/30">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4">
              Recognition & Credentials
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Industry <span className="text-gradient-gold">Accolades</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {awards.map((award, index) => (
              <motion.div
                key={award.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-4 md:p-6 border border-border/30 rounded-lg hover:border-primary/30 transition-colors group"
              >
                <p className="text-primary font-display text-xl md:text-2xl font-semibold mb-2">
                  {award.year}
                </p>
                <p className="text-xs md:text-sm text-foreground font-body mb-1 group-hover:text-primary transition-colors">
                  {award.title}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  {award.org}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section id="expertise" className="py-20 md:py-32 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
        
        <div className="container relative z-10 px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4">
              Why Choose Me
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
              Areas of <span className="text-gradient-gold">Expertise</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body font-light max-w-2xl mx-auto">
              With a Master's in Education and Bachelor's in Human Services, I bring a unique client-focused approach to real estate.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {expertise.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group p-6 md:p-8 border border-border/30 rounded-xl hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)]"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl text-foreground mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
        
        <div className="container relative z-10 px-4 md:px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 md:mb-20"
          >
            <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4">
              Client Success Stories
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground">
              What Clients <span className="text-gradient-gold">Say</span>
            </h2>
          </motion.div>
          
          {/* Testimonials grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative p-6 md:p-8 border border-border/30 rounded-xl"
              >
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
                
                <p className="text-foreground font-body font-light leading-relaxed mb-6 relative z-10">
                  "{testimonial.quote}"
                </p>
                
                <div className="border-t border-border/30 pt-4">
                  <p className="font-display text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground font-body">{testimonial.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        
        <div className="container relative z-10 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4">
                Let's Connect
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
                Ready to Begin Your <span className="text-gradient-gold">Journey?</span>
              </h2>
              <p className="text-lg text-muted-foreground font-body font-light max-w-2xl mx-auto mb-12">
                Whether you're buying, selling, or investing, I'm here to provide the exceptional service and expertise you deserve.
              </p>
            </motion.div>
            
            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid sm:grid-cols-3 gap-6 md:gap-8 mb-12"
            >
              <a 
                href="tel:606-224-3261" 
                className="flex flex-col items-center p-6 border border-border/30 rounded-xl hover:border-primary/30 transition-colors group"
              >
                <Phone className="h-6 w-6 text-primary mb-3" />
                <p className="text-foreground font-body group-hover:text-primary transition-colors">(606) 224-3261</p>
                <p className="text-sm text-muted-foreground">Mobile</p>
              </a>
              
              <a 
                href="mailto:thouse@century21advantage.com" 
                className="flex flex-col items-center p-6 border border-border/30 rounded-xl hover:border-primary/30 transition-colors group"
              >
                <Mail className="h-6 w-6 text-primary mb-3" />
                <p className="text-foreground font-body group-hover:text-primary transition-colors text-sm md:text-base">thouse@century21advantage.com</p>
                <p className="text-sm text-muted-foreground">Email</p>
              </a>
              
              <a 
                href="https://maps.google.com/?q=911+N+Main+St,+London,+KY+40741" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-6 border border-border/30 rounded-xl hover:border-primary/30 transition-colors group"
              >
                <MapPin className="h-6 w-6 text-primary mb-3" />
                <p className="text-foreground font-body group-hover:text-primary transition-colors">911 N Main St</p>
                <p className="text-sm text-muted-foreground">London, KY 40741</p>
              </a>
            </motion.div>
            
            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                onClick={() => window.location.href = 'tel:606-224-3261'}
              >
                Schedule a Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="font-display text-xl text-foreground">
                Tabitha <span className="text-primary">House</span>
              </p>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Licensed Real Estate Agent | License #269596
              </p>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">
                Terms of Service
              </a>
            </div>
            
            <p className="text-sm text-muted-foreground font-body">
              © 2025 The House Team. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
    </div>
  );
};

export default SOQPage;
