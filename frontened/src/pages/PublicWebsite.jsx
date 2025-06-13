
import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Shield, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Menu,
  X,
  TrendingUp,
  Zap,
  Users,
  Award,
  Send,
  Clock,
  Star,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';

const PublicWebsite = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [feedback, setFeedback] = useState({ name: '', message: '' });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const testimonials = [
    {
      name: "Sarah Ahmed",
      message: "Dr. Jobayer Hasan's expertise in cardiology is exceptional. His compassionate care and thorough diagnosis saved my life. Highly recommend!",
      rating: 5,
      location: "Dhaka, Bangladesh",
      avatar: "https://plus.unsplash.com/premium_photo-1678197937465-bdbc4ed95815?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      name: "Mohammad Hassan",
      message: "Outstanding service and professional staff. The doctor explained everything clearly and made me feel comfortable throughout the treatment.",
      rating: 5,
      location: "Chittagong, Bangladesh",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Fatima Khan",
      message: "Best cardiologist in Dhaka! The consultation was detailed and the follow-up care was excellent. Thank you for your dedication.",
      rating: 5,
      location: "Sylhet, Bangladesh",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const services = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Comprehensive Heart Check-Up",
      description: "Advanced cardiac screening with state-of-the-art diagnostic technology to ensure optimal heart health and early detection.",
      features: ["ECG Analysis", "Blood Tests", "Risk Assessment"],
      color: "from-red-500 to-pink-500"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Advanced Cardiac Monitoring",
      description: "Continuous heart rhythm monitoring using cutting-edge technology for precise diagnosis and treatment planning.",
      features: ["24/7 Monitoring", "Real-time Analysis", "Emergency Alerts"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Hypertension Management",
      description: "Personalized blood pressure management plans with lifestyle guidance and medication optimization.",
      features: ["Custom Treatment", "Lifestyle Coaching", "Regular Follow-ups"],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Preventive Cardiology",
      description: "Proactive heart disease prevention through evidence-based lifestyle modifications and risk factor management.",
      features: ["Risk Screening", "Prevention Plans", "Health Education"],
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Interventional Cardiology",
      description: "Minimally invasive cardiac procedures and treatments for complex heart conditions using advanced techniques.",
      features: ["Catheterization", "Angioplasty", "Stent Placement"],
      color: "from-orange-500 to-yellow-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Family Cardiac Care",
      description: "Comprehensive cardiovascular health programs designed for entire families with personalized care plans.",
      features: ["Family Screening", "Genetic Testing", "Lifestyle Programs"],
      color: "from-indigo-500 to-blue-500"
    }
  ];

  const experience = [
    {
      title: "Senior Consultant Cardiologist",
      duration: "Feb 2015–Present",
      company: "National Heart Foundation, Dhaka",
      description: "Leading cardiovascular care excellence with advanced procedures and multidisciplinary team coordination.",
      type: "current"
    },
    {
      title: "Associate Cardiologist",
      duration: "June 2010– Jan 2015",
      company: "Apollo Hospitals Dhaka",
      description: "Specialized in non-invasive cardiology with focus on patient-centered chronic disease management.",
      type: "previous"
    },
    {
      title: "Cardiology Resident",
      duration: "Jan 2007–Aug 2010",
      company: "Bangabandhu Sheikh Mujib Medical University",
      description: "Intensive training in cardiovascular diseases and interventional cardiology procedures.",
      type: "training"
    },
    {
      title: "Medical Intern",
      duration: "Dec 2006- Dec 2007",
      company: "Dhaka Medical College",
      description: "Comprehensive clinical training across internal medicine, surgery, and emergency care departments.",
      type: "foundation"
    }
  ];

  const education = [
    {
      degree: "ASE Echocardiography Certification",
      year: "2012",
      institution: "American Society of Echocardiography",
      description: "International certification in advanced cardiac ultrasound imaging and interpretation.",
      type: "certification"
    },
    {
      degree: "Fellowship in Interventional Cardiology",
      year: "2011",
      institution: "National Heart Foundation, Dhaka",
      description: "Specialized training in catheter-based interventions and complex cardiac procedures.",
      type: "fellowship"
    },
    {
      degree: "Doctor of Medicine (Cardiology)",
      year: "2008–2010",
      institution: "Bangabandhu Sheikh Mujib Medical University",
      description: "Advanced specialization in cardiovascular medicine with research excellence.",
      type: "postgraduate"
    },
    {
      degree: "Bachelor of Medicine & Surgery",
      year: "2002–2007",
      institution: "Dhaka Medical College",
      description: "Medical degree with distinction in clinical excellence and academic achievement.",
      type: "undergraduate"
    }
  ];

  const affiliates = [
    { name: "Square Pharmaceuticals", logo: "SQ" },
    { name: "Beximco Pharma", logo: "BX" },
    { name: "Research Institute", logo: "RI" },
    { name: "Pharma Solutions", logo: "PS" },
    { name: "Medical Institute", logo: "MI" }
  ];

  const blogPosts = [
    {
      title: "Heart Health in 2025: Latest Guidelines",
      excerpt: "Discover the most recent recommendations for maintaining optimal cardiovascular health...",
      image: "https://media.istockphoto.com/id/2161726310/photo/listening-to-patients-heartbeat.webp?a=1&b=1&s=612x612&w=0&k=20&c=c35kO1tzkkHfNHqt4rqv_YFfT8IYz8tZKLJnsxmBN0c=",
      category: "Prevention",
      readTime: "5 min read"
    },
    {
      title: "Managing Hypertension Naturally",
      excerpt: "Evidence-based lifestyle approaches to blood pressure management and prevention...",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=250&fit=crop",
      category: "Treatment",
      readTime: "7 min read"
    },
    {
      title: "Advanced Cardiac Diagnostics",
      excerpt: "Understanding modern heart testing techniques and what they mean for your health...",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=250&fit=crop",
      category: "Technology",
      readTime: "6 min read"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleAppointment = () => {
    if (!isLoggedIn) {
      setShowLogin(true);
    } else {
      alert("Redirecting to appointment booking...");
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    alert("Login successful! Redirecting to appointment page...");
  };

  const handleFeedback = (e) => {
    e.preventDefault();
    alert("Thank you for your valuable feedback!");
    setFeedback({ name: '', message: '' });
  };

  const Button = ({ children, onClick = () => {}, className = "", variant = "primary", size = "md", type = "button" }) => {
    const baseClasses = "font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20";
    const variants = {
      primary: "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl",
      secondary: "bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-800 text-white shadow-xl hover:shadow-2xl",
      outline: "border-2 border-gradient-to-r from-blue-500 to-indigo-500 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 bg-white shadow-lg hover:shadow-xl",
      ghost: "text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
    };
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    return (
      <button
        type={type}
        onClick={onClick}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  const Card = ({ children, className = "", hover = true }) => (
    <div className={`bg-white rounded-2xl shadow-xl ${hover ? 'hover:shadow-2xl transition-all duration-500 hover:-translate-y-2' : ''} backdrop-blur-sm border border-white/20 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/95 backdrop-blur-xl shadow-2xl border-b border-blue-100/50' 
          : 'bg-white/90 backdrop-blur-md shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                <div className="relative">
                  <img 
                    src="https://media.istockphoto.com/id/906716900/photo/confident-male-surgeon-in-scrubs.jpg?s=612x612&w=0&k=20&c=G03yZ-lkdN0pwMbv4Mv-P_WIPNMWhbL2sn3tlpJleMU="
                    alt="Dr. Jobayer Hasan"
                    className="w-14 h-14 rounded-full border-3 border-white shadow-xl object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                  Dr. Jobayer Hasan
                </h1>
                <p className="text-sm text-slate-600 font-medium">Consultant Cardiologist</p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              {['Home', 'Services', 'Appointment', 'Blog', 'About', 'Contact'].map((item, index) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`} 
                  className={`relative font-medium transition-all duration-300 hover:text-blue-600 ${
                    index === 0 ? 'text-blue-600' : 'text-slate-700'
                  } group`}
                >
                  {item}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-emerald-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
              {!isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => setShowLogin(true)}>
                    Login
                  </Button>
                  <Button onClick={() => {}}>
                    Sign Up
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => setIsLoggedIn(false)}>Logout</Button>
              )}
            </div>

            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Enhanced Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed top-20 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl border-t border-blue-100">
            <div className="px-6 py-6 space-y-6">
              {['Home', 'Services', 'Appointment', 'Blog', 'About', 'Contact'].map((item, index) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className={`block py-3 text-lg font-medium transition-colors duration-300 ${
                    index === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="pt-6 space-y-4 border-t border-slate-200">
                <Button variant="outline" className="w-full" onClick={() => setShowLogin(true)}>
                  Login
                </Button>
                <Button className="w-full">
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Dramatically Enhanced */}
      <section id="home" className="relative pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 via-purple-50 to-emerald-100 border border-blue-200/50 rounded-full text-blue-700 text-sm font-semibold animate-pulse">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-ping"></div>
                  🏥 Expert Cardiac Care Since 2007
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="text-slate-900">Your Heart,</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
                    Our Expertise
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-2xl">
                  Experience world-class cardiovascular care with 
                  <span className="font-semibold text-blue-600"> advanced treatments</span>, 
                  <span className="font-semibold text-emerald-600"> compassionate expertise</span>, and 
                  <span className="font-semibold text-purple-600"> cutting-edge technology</span> for complete peace of mind.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Button 
                  onClick={handleAppointment}
                  size="lg"
                  className="group relative overflow-hidden"
                >
                  <Calendar className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Book Appointment
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="group"
                  onClick={() => {}}
                >
                  <Phone className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform text-red-500" />
                  Emergency Call
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden" hover={false}>
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img 
                    src="https://media.istockphoto.com/id/2201754823/photo/female-physician-explaining-medical-findings-to-older-woman-with-stomach-discomfort-listening.jpg?s=612x612&w=0&k=20&c=BZxNzQuqWTolKHBoQV0V8oOZpDl5PWKlCVe2DDc-ps0="
                    alt="Modern medical consultation"
                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-slate-700">Available for Consultation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Enhanced Statistics */}
          <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "5000+", label: "Patients Treated", icon: <Users className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
              { number: "15+", label: "Years Experience", icon: <Award className="w-6 h-6" />, color: "from-emerald-500 to-teal-500" },
              { number: "98%", label: "Success Rate", icon: <TrendingUp className="w-6 h-6" />, color: "from-purple-500 to-violet-500" },
              { number: "৳1500", label: "Consultation Fee", icon: <Heart className="w-6 h-6" />, color: "from-pink-500 to-rose-500" }
            ].map((stat, index) => (
              <Card key={index} className="text-center p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl group">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-slate-900 mb-3">{stat.number}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Enhanced Available Times */}
          <Card className="mt-20 bg-gradient-to-br from-white via-blue-50/30 to-emerald-50/30 border-0 shadow-2xl" hover={false}>
            <div className="p-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Consultation Schedule</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xl text-slate-900">Sunday</div>
                      <div className="text-slate-600 text-lg">3:30 PM - 9:00 PM</div>
                      <div className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Available
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xl text-slate-900">Friday</div>
                      <div className="text-slate-600 text-lg">10:00 AM - 9:00 PM</div>
                      <div className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Available
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xl text-slate-900 mb-3">Chamber Location</div>
                    <div className="text-slate-600 text-lg leading-relaxed">
                      BTI Landmark (Level-11)<br />
                      Plot-16, Block-CWS(A)<br />
                      Gulshan-1, Dhaka-1212, Bangladesh
                    </div>
                    <div className="inline-flex items-center mt-3 px-3 py-1 border border-slate-300 text-slate-600 rounded-full text-sm font-medium">
                      Premium Location
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section id="services" className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-emerald-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-emerald-100 border border-blue-200/50 rounded-full text-blue-700 text-sm font-semibold mb-8">
              🏥 Our Specializations
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-8">
              Comprehensive <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Cardiac Care</span>
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              State-of-the-art cardiovascular services designed to keep you healthy, 
              strong, and living life to the fullest with complete confidence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group h-full bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 overflow-hidden">
                <div className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${service.color} text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-4">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <div className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-slate-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`h-2 bg-gradient-to-r ${service.color} group-hover:h-3 transition-all duration-300`}></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced About Section - Restructured */}
      <section id="about" className="py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 border border-emerald-200/50 rounded-full text-emerald-700 text-sm font-semibold mb-8">
              👨‍⚕️ Professional Excellence
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-8">
              Meet <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Dr. Jobayer Hasan</span>
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto">
              A distinguished cardiologist with over 15 years of experience in advanced cardiac care
            </p>
          </div>

          {/* Upper Section - Professional Experience (Left) and Images (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
            {/* Professional Experience - Upper Left */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl" hover={false}>
              <div className="p-8">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">Professional Experience</h3>
                </div>
                
                <div className="space-y-8">
                  {experience.map((exp, index) => (
                    <div key={index} className="relative pl-8 pb-8 last:pb-0">
                      <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                        exp.type === 'current' ? 'bg-blue-600' :
                        exp.type === 'previous' ? 'bg-emerald-600' :
                        exp.type === 'training' ? 'bg-amber-600' : 'bg-slate-600'
                      }`}></div>
                      <div className="absolute left-2 top-6 w-0.5 bg-slate-200 h-full last:h-0"></div>
                      
                      <div className="space-y-3">
                        <h4 className="text-xl font-bold text-slate-900">{exp.title}</h4>
                        <div className="text-blue-600 font-semibold">{exp.duration}</div>
                        <div className="text-slate-800 font-medium text-lg">{exp.company}</div>
                        <p className="text-slate-600 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Professional Experience Images - Upper Right */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden" hover={false}>
                <div className="aspect-[16/10] relative">
                  <img 
                    src="https://images.unsplash.com/photo-1656428964836-78d54bf76231?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWR2YW5jZSUyMG1lZGljYWwlMjB0ZWNobm9sb2d5fGVufDB8fDB8fHww"
                    alt="Medical technology and innovation"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="text-lg font-bold text-slate-900">Advanced Medical Technology</div>
                      <div className="text-slate-600">State-of-the-art cardiac care facilities</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden" hover={false}>
                <div className="aspect-[16/10] relative">
                  <img 
                    src="https://media.istockphoto.com/id/1185231735/photo/asian-scientist-use-microscope.webp?a=1&b=1&s=612x612&w=0&k=20&c=KmI3VAlWH7pRC_asM6XL6LUyL01H5AvdG85kufIZFLQ="
                    alt="Medical research and analysis"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="text-lg font-bold text-slate-900">Research Excellence</div>
                      <div className="text-slate-600">Continuous medical advancement</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

                    {/* Lower Section - Education & Certifications (Right) and Images (Left) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Education Images - Lower Left */}
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden" hover={false}>
                <div className="aspect-[16/10] relative">
                  <img 
                    src="https://media.istockphoto.com/id/1998218826/photo/teacher-helping-a-medical-student-in-class.webp?a=1&b=1&s=612x612&w=0&k=20&c=ajSieyu70wIt1P7sZ5R_sQtVVKPJEFlbWduFIMiQN0Y="
                    alt="Medical education and learning"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="text-lg font-bold text-slate-900">Medical Education</div>
                      <div className="text-slate-600">Continuous learning and development</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden" hover={false}>
                <div className="aspect-[16/10] relative">
                  <img 
                    src="https://media.istockphoto.com/id/1440567501/photo/manager-giving-certificate.jpg?s=612x612&w=0&k=20&c=TYc93cpAZOKDSH6ACJINYAXssGzlKiiuppecpaPFwUs="
                    alt="Medical certification and expertise"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="text-lg font-bold text-slate-900">Professional Certifications</div>
                      <div className="text-slate-600">International standards of excellence</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Education & Certifications - Lower Right */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl" hover={false}>
              <div className="p-8">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">Education & Certifications</h3>
                </div>
                
                <div className="space-y-8">
                  {education.map((edu, index) => (
                    <div key={index} className="relative pl-8 pb-8 last:pb-0">
                      <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                        edu.type === 'certification' ? 'bg-purple-600' :
                        edu.type === 'fellowship' ? 'bg-emerald-600' :
                        edu.type === 'postgraduate' ? 'bg-blue-600' : 'bg-slate-600'
                      }`}></div>
                      <div className="absolute left-2 top-6 w-0.5 bg-slate-200 h-full last:h-0"></div>
                      
                      <div className="space-y-3">
                        <h4 className="text-xl font-bold text-slate-900">{edu.degree}</h4>
                        <div className="text-emerald-600 font-semibold">{edu.year}</div>
                        <div className="text-slate-800 font-medium text-lg">{edu.institution}</div>
                        <p className="text-slate-600 leading-relaxed">{edu.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-orange-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 rounded-full text-amber-700 text-sm font-semibold mb-8">
              ⭐ Patient Stories
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-8">
              What Our <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Patients Say</span>
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto">
              Real testimonials from patients who have experienced our exceptional cardiac care
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 border-0 shadow-2xl overflow-hidden" hover={false}>
              <div className="p-12 text-center">
                <div className="flex justify-center mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-amber-400 fill-current mx-1 animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                  ))}
                </div>
                
                <div className="mb-8">
                  <img 
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-xl mx-auto mb-6"
                  />
                </div>
                
                <blockquote className="text-2xl lg:text-3xl text-slate-700 mb-8 leading-relaxed italic font-medium">
                  "{testimonials[currentTestimonial].message}"
                </blockquote>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-slate-900">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-slate-600 font-medium text-lg">
                    {testimonials[currentTestimonial].location}
                  </p>
                </div>
              </div>
            </Card>
            
            <div className="flex justify-center mt-8 space-x-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-amber-600 w-12 shadow-lg' 
                      : 'bg-slate-300 hover:bg-amber-400'
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Affiliations */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Trusted Professional Affiliations</h3>
            <p className="text-slate-600">Proud partnerships with leading healthcare organizations</p>
          </div>
          <div className="flex justify-center items-center space-x-16 opacity-70">
            {affiliates.map((affiliate, index) => (
              <Card key={index} className="w-20 h-20 bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center h-full p-0">
                  <span className="text-sm font-bold text-slate-600">{affiliate.logo}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Blog Section with Card Layout */}
      <section id="blog" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200/50 rounded-full text-violet-700 text-sm font-semibold mb-8">
              📚 Health Insights
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-8">
              Latest <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Health Articles</span>
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Stay informed with expert insights, health tips, and the latest advances in cardiac care
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={index} className="group bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img 
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="text-xs bg-white/90 backdrop-blur-sm text-violet-600 px-3 py-1 rounded-full font-semibold shadow-lg">
                      {post.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="text-xs bg-black/70 text-white px-3 py-1 rounded-full font-medium">
                      {post.readTime}
                    </span>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="ghost" className="text-violet-600 hover:text-violet-700 font-semibold">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 border border-green-200/50 rounded-full text-green-700 text-sm font-semibold mb-8">
              💬 Get in Touch
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-8">
              We Value Your <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Feedback</span>
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed">
              Your thoughts help us improve our services. Share your experience and suggestions with us.
            </p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl" hover={false}>
            <div className="p-10">
              <form onSubmit={handleFeedback} className="space-y-8">
                <div>
                  <label className="block text-slate-700 text-lg font-semibold mb-4">Your Name</label>
                  <input
                    type="text"
                    value={feedback.name}
                    onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-slate-900 text-lg"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-lg font-semibold mb-4">Your Message</label>
                  <textarea
                    value={feedback.message}
                    onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-slate-900 text-lg"
                    rows={6}
                    placeholder="Share your thoughts, suggestions, or questions..."
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full py-6 text-xl group"
                >
                  <Send className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
                  Send Feedback
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-emerald-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  Dr. Jobayer Hasan
                </h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Excellence in cardiovascular care with compassion, expertise, and cutting-edge technology.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 group">
                  <Phone className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-300 group-hover:text-white transition-colors">+880 1717-123456</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <Mail className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-300 group-hover:text-white transition-colors">dr.rahman@careconnect.bd</span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <MapPin className="w-5 h-5 text-blue-400 mt-1 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-300 group-hover:text-white transition-colors">BTI Landmark, Gulshan-1<br />Dhaka-1212, Bangladesh</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
              <div className="space-y-3">
                {['Home', 'Services', 'Appointment', 'About', 'Blog', 'Contact'].map((link) => (
                  <a key={link} href={`#${link.toLowerCase()}`} className="block text-slate-300 hover:text-blue-400 transition-colors hover:translate-x-2 duration-300">
                    {link}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Follow Us</h3>
              <div className="flex space-x-4 mb-6">
                <Facebook className="w-7 h-7 text-slate-300 hover:text-blue-400 cursor-pointer transition-colors" />
                <Twitter className="w-7 h-7 text-slate-300 hover:text-blue-400 cursor-pointer transition-colors" />
                <Instagram className="w-7 h-7 text-slate-300 hover:text-pink-400 cursor-pointer transition-colors" />
                <Youtube className="w-7 h-7 text-slate-300 hover:text-red-400 cursor-pointer transition-colors" />
              </div>
              
              <div>
                <h4 className="text-xl font-bold mb-6 text-white">Newsletter</h4>
                <p className="text-slate-300 mb-4">Stay updated with health tips and news</p>
                <div className="flex mb-6">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-1 px-4 py-3 text-slate-900 rounded-l-xl focus:outline-none bg-white"
                  />
                  <button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 px-6 py-3 rounded-r-xl transition-all group">
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-slate-400 text-center md:text-left">
                © 2025 CareConnect. All rights reserved. | Privacy Policy | Terms of Service
              </p>
              <div className="flex items-center space-x-2 text-slate-400">
                <Heart className="w-5 h-5 text-red-400 animate-pulse" />
                <span>Made with care for better health</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl" hover={false}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-slate-900">Welcome Back</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowLogin(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <p className="text-slate-600 mb-8 text-lg">Sign in to book your appointment</p>
              
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-3">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-3">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-4 text-lg"
                >
                  Sign In
                </Button>
                <p className="text-center text-sm text-slate-600">
                  Don't have an account? <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">Sign up here</a>
                </p>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PublicWebsite;
