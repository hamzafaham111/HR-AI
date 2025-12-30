"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Brain,
  Zap,
  Shield,
  BarChart3,
  Users,
  FileText,
  Calendar,
  Search,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Star,
  Quote,
  Building2,
  Mail,
  Play,
  ChevronDown,
  Award,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Resume Analysis",
    description:
      "Automatically extract candidate information from resumes using advanced AI. Get structured data including skills, experience, education, and more in seconds.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Search,
    title: "Smart Candidate Matching",
    description:
      "Intelligent matching algorithm that finds the best candidates for your job postings based on skills, experience, and requirements compatibility.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: FileText,
    title: "Job Posting Management",
    description:
      "Create and manage job postings effortlessly. Upload job descriptions and let AI parse all details automatically - title, requirements, benefits, and more.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Users,
    title: "Resume Bank",
    description:
      "Build and maintain a comprehensive talent pool. Store, search, and organize candidate resumes with advanced filtering and search capabilities.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Target,
    title: "Hiring Pipeline Management",
    description:
      "Track candidates through your entire hiring process. Manage stages, move candidates, and get real-time insights into your recruitment pipeline.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Calendar,
    title: "Interview Scheduling",
    description:
      "Streamline interview scheduling with automated meeting management. Create time slots, send invitations, and manage candidate interviews seamlessly.",
    color: "from-teal-500 to-blue-500",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Get comprehensive analytics on your hiring process. Track metrics, identify bottlenecks, and make data-driven decisions to improve recruitment efficiency.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description:
      "Lightning-fast resume processing and candidate matching. Process hundreds of resumes in minutes, not hours.",
    color: "from-yellow-500 to-orange-500",
  },
];

const benefits = [
  "Reduce time-to-hire by up to 70%",
  "Improve candidate quality with AI matching",
  "Automate repetitive recruitment tasks",
  "Scale your hiring process effortlessly",
  "Make data-driven hiring decisions",
  "Enhance candidate experience",
];

const stats = [
  { label: "Resumes Processed", value: "10K+", icon: FileText },
  { label: "Time Saved", value: "500+ hrs", icon: Clock },
  { label: "Match Accuracy", value: "95%+", icon: TrendingUp },
  { label: "Active Users", value: "1K+", icon: Users },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Head of Talent Acquisition",
    company: "TechFlow Inc.",
    image: "SC",
    content:
      "HR-AI has completely transformed our hiring process. We've reduced our time-to-hire by 65% and the AI matching has helped us find candidates we would have missed otherwise.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "HR Director",
    company: "InnovateCorp",
    image: "MR",
    content:
      "The resume analysis feature is incredible. What used to take hours now takes minutes. Our team can focus on building relationships with candidates instead of manual data entry.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Recruitment Manager",
    company: "ScaleUp Solutions",
    image: "EW",
    content:
      "The pipeline management tools have given us complete visibility into our hiring process. We can now make data-driven decisions and optimize our recruitment strategy in real-time.",
    rating: 5,
  },
];

const clients = [
  { name: "TechFlow", logo: "TF" },
  { name: "InnovateCorp", logo: "IC" },
  { name: "ScaleUp", logo: "SU" },
  { name: "DataViz", logo: "DV" },
  { name: "CloudSync", logo: "CS" },
  { name: "NextGen", logo: "NG" },
];

const faqs = [
  {
    question: "How does AI-powered resume analysis work?",
    answer:
      "Our AI uses advanced natural language processing to extract structured data from resumes, including skills, experience, education, and certifications. It can process hundreds of resumes in minutes with 95%+ accuracy.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, we use enterprise-grade encryption and follow industry best practices for data security. Your data is never shared with third parties and is stored securely in compliance with GDPR and SOC 2 standards.",
  },
  {
    question: "Can I integrate HR-AI with my existing ATS?",
    answer:
      "Yes, HR-AI offers API integrations with popular ATS systems. Our team can help you set up custom integrations based on your specific needs.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We offer 24/7 email support, comprehensive documentation, video tutorials, and dedicated account managers for enterprise customers.",
  },
];

// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      const numericValue = parseInt(value.replace(/\D/g, ""));
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setCount(numericValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <span ref={ref}>
      {value.includes("+") ? `${count}${value.replace(/\d/g, "")}` : count}
      {suffix}
    </span>
  );
}

// Scroll to top button
function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          <ArrowRight className="w-5 h-5 rotate-[-90deg]" />
        </motion.button>
      )}
    </>
  );
}

export default function Home() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send to your email service
    setEmailSubmitted(true);
    setTimeout(() => {
      setEmailSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 glass-effect"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center"
              >
                <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </motion.div>
              <span className="text-lg md:text-xl font-bold gradient-text">HR-AI</span>
            </Link>
            <Link
              href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all duration-200 flex items-center space-x-1.5 md:space-x-2 text-sm md:text-base shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="hidden sm:inline">Access Platform</span>
              <span className="sm:hidden">Access</span>
              <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/30" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmOWZhZmIiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        
        <div className="max-w-7xl mx-auto relative w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Advanced AI Technology</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight px-2"
            >
              Transform Your{" "}
              <span className="gradient-text">Hiring Process</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              with AI Intelligence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base md:text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Automate resume analysis, match candidates intelligently, and
              streamline your entire recruitment workflow with cutting-edge AI
              technology.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8"
            >
              <Link
                href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
                className="group px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold text-base hover:bg-primary-700 transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transform hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-base hover:border-primary-500 hover:text-primary-600 transition-all duration-200 flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Watch Demo</span>
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center text-gray-400 cursor-pointer"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="text-xs mb-2">Scroll to explore</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => {
              const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-100 text-primary-600 mb-3">
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-block px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-4">
              Powerful Features
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Everything You Need to{" "}
              <span className="gradient-text">Hire Smarter</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              A comprehensive suite of AI-powered tools designed to transform
              your recruitment workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => {
              const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div
                    className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300 rounded-2xl`}
                  />
                  
                  <div className="relative h-full p-6 md:p-8 bg-white rounded-2xl border border-gray-100 group-hover:border-primary-200 group-hover:shadow-lg transition-all duration-300">
                    <div className="mb-4 md:mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`inline-flex w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${feature.color} items-center justify-center shadow-lg`}
                      >
                        <feature.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </motion.div>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-primary-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    <div className="flex items-center text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Why Leading Companies Choose{" "}
              <span className="gradient-text">HR-AI</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Join the revolution in talent acquisition with proven results
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-12 md:mb-16">
            {benefits.map((benefit, index) => {
              const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 sm:p-4 md:p-5 rounded-lg hover:bg-gray-50 transition-colors duration-300 group"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-primary-600 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </motion.div>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-800 font-medium leading-relaxed pt-0.5">
                    {benefit}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Key Features - Horizontal Layout */}
          <div className="space-y-4 md:space-y-6">
            {[
              {
                icon: Shield,
                title: "Enterprise Security",
                description:
                  "Bank-level encryption and compliance with industry standards. Your data is protected with the highest security measures.",
                gradient: "from-primary-600 to-primary-700",
                textColor: "text-primary-100",
              },
              {
                icon: Zap,
                title: "Lightning Speed",
                description:
                  "Process hundreds of resumes in minutes, not hours. Get results instantly with our optimized AI processing engine.",
                gradient: "from-green-500 to-emerald-600",
                textColor: "text-green-100",
              },
              {
                icon: Brain,
                title: "AI-Powered Intelligence",
                description:
                  "Advanced machine learning algorithms that continuously improve to provide the most accurate candidate matching.",
                gradient: "from-purple-600 to-pink-600",
                textColor: "text-purple-100",
              },
            ].map((feature, index) => {
              const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-4 md:gap-6 p-6 md:p-8 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white`}
                >
                  <div className="flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <feature.icon className="w-8 h-8 md:w-10 md:h-10" />
                    </motion.div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                      {feature.title}
                    </h3>
                    <p className={`${feature.textColor} text-sm md:text-base`}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-block px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-4">
              Client Success Stories
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Trusted by{" "}
              <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              See what our clients have to say about their experience with HR-AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 md:mb-16">
            {testimonials.map((testimonial, index) => {
              const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-full p-5 sm:p-6 md:p-8 bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Quote className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary-200 mb-2 sm:mb-3" />
                    <div className="flex mb-2 sm:mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-3 sm:mb-4 md:mb-6 leading-relaxed text-xs sm:text-sm md:text-base">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center space-x-2.5 sm:space-x-3 md:space-x-4 pt-3 sm:pt-4 md:pt-6 border-t border-gray-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base flex-shrink-0">
                        {testimonial.image}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base truncate">
                          {testimonial.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{testimonial.role}</div>
                        <div className="text-xs text-primary-600 font-medium truncate">
                          {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Clients Logos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 font-medium">
              Trusted by innovative companies worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12">
              {clients.map((client, index) => {
                const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
                return (
                  <motion.div
                    key={index}
                    ref={ref}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center justify-center w-24 h-16 sm:w-28 sm:h-18 md:w-32 md:h-20 rounded-lg md:rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-300"
                  >
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400 hover:text-primary-600 transition-colors">
                      {client.logo}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              Everything you need to know about HR-AI
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const [isOpen, setIsOpen] = useState(false);
              const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    </motion.div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 text-gray-600 text-sm md:text-base">
                      {faq.answer}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-primary-100/50">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Mail className="w-12 h-12 md:w-16 md:h-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated with HR-AI
            </h2>
            <p className="text-base md:text-lg text-gray-600 mb-8">
              Get the latest updates, tips, and insights on AI-powered recruitment
            </p>
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {emailSubmitted ? "Subscribed!" : "Subscribe"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-base md:text-lg text-primary-100 mb-8 md:mb-10 max-w-2xl mx-auto">
              Join thousands of companies using HR-AI to streamline their
              recruitment process and find the best talent faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
                className="inline-flex items-center space-x-2 px-6 md:px-8 py-3 md:py-4 bg-white text-primary-600 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-primary-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span>Access Platform Now</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <button className="px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-white/10 transition-all duration-200">
                Schedule a Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 md:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span className="text-lg md:text-xl font-bold text-white">HR-AI</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-4">
                Intelligent recruitment platform powered by AI.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors" aria-label="Twitter">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors" aria-label="LinkedIn">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 md:mb-4 text-sm md:text-base">Product</h3>
              <ul className="space-y-1.5 md:space-y-2">
                <li>
                  <a href="#features" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 md:mb-4 text-sm md:text-base">Company</h3>
              <ul className="space-y-1.5 md:space-y-2">
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white font-semibold mb-3 md:mb-4 text-sm md:text-base">Support</h3>
              <ul className="space-y-1.5 md:space-y-2">
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs sm:text-sm hover:text-primary-400 transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-gray-400">
            <p className="text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} HR-AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
