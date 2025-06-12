
import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Shield, 
  Stethoscope, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Award, 
  Phone, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Send,
  Menu,
  X,
  TrendingUp,
  Zap
} from 'lucide-react';

const PublicWebsite = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [feedback, setFeedback] = useState({ name: '', message: '' });

  const testimonials = [
    {
      name: "Sarah Ahmed",
      message: "Dr. Jobayer Hasan's expertise in cardiology is exceptional. His compassionate care and thorough diagnosis saved my life. Highly recommend!",
      rating: 5,
      location: "Dhaka, Bangladesh"
    },
    {
      name: "Mohammad Hassan",
      message: "Outstanding service and professional staff. The doctor explained everything clearly and made me feel comfortable throughout the treatment.",
      rating: 5,
      location: "Chittagong, Bangladesh"
    },
    {
      name: "Fatima Khan",
      message: "Best cardiologist in Dhaka! The consultation was detailed and the follow-up care was excellent. Thank you for your dedication.",
      rating: 5,
      location: "Sylhet, Bangladesh"
    }
  ];

  const services = [
    {
      icon: <Heart className="w-12 h-12" />,
      title: "Comprehensive Heart Check-Up",
      description: "Advanced cardiac screening with state-of-the-art diagnostic technology to ensure optimal heart health and early detection.",
      features: ["ECG Analysis", "Blood Tests", "Risk Assessment"]
    },
    {
      icon: <Activity className="w-12 h-12" />,
      title: "Advanced Cardiac Monitoring",
      description: "Continuous heart rhythm monitoring using cutting-edge technology for precise diagnosis and treatment planning.",
      features: ["24/7 Monitoring", "Real-time Analysis", "Emergency Alerts"]
    },
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: "Hypertension Management",
      description: "Personalized blood pressure management plans with lifestyle guidance and medication optimization.",
      features: ["Custom Treatment", "Lifestyle Coaching", "Regular Follow-ups"]
    },
    {
      icon: <Stethoscope className="w-12 h-12" />,
      title: "Chest Pain Evaluation",
      description: "Immediate assessment and diagnosis of chest discomfort with comprehensive cardiac evaluation protocols.",
      features: ["Emergency Care", "Diagnostic Tests", "Treatment Plans"]
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Preventive Cardiology",
      description: "Proactive heart disease prevention through evidence-based lifestyle modifications and risk factor management.",
      features: ["Risk Screening", "Prevention Plans", "Health Education"]
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Interventional Cardiology",
      description: "Minimally invasive cardiac procedures and treatments for complex heart conditions using advanced techniques.",
      features: ["Catheterization", "Angioplasty", "Stent Placement"]
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children }) => (
    <div className="p-6 pb-4">
      {children}
    </div>
  );

  const CardContent = ({ children, className = "" }) => (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );

  const CardTitle = ({ children, className = "" }) => (
    <h3 className={`text-xl font-bold text-slate-900 ${className}`}>
      {children}
    </h3>
  );

  const CardDescription = ({ children, className = "" }) => (
    <p className={`text-slate-600 ${className}`}>
      {children}
    </p>
  );

  const Badge = ({ children, className = "" }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${className}`}>
      {children}
    </span>
  );

  const Button = ({ children, onClick, className = "", variant = "primary", size = "md", type = "button" }) => {
    const baseClasses = "font-semibold rounded-xl transition-all duration-300";
    const variants = {
      primary: "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl",
      outline: "border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 bg-white",
      ghost: "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
    };
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-6 text-lg"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Navigation */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <img 
                  src="https://media.istockphoto.com/id/906716900/photo/confident-male-surgeon-in-scrubs.jpg?s=612x612&w=0&k=20&c=G03yZ-lkdN0pwMbv4Mv-P_WIPNMWhbL2sn3tlpJleMU="
                  alt="Dr. Jobayer Hasan"
                  className="relative w-12 h-12 rounded-full border-2 border-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Dr. Jobayer Hasan
                </h1>
                <p className="text-sm text-slate-600 font-medium">Consultant Cardiologist</p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#home" className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1">Home</a>
              <a href="#services" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Services</a>
              <a href="#appointment" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Appointment</a>
              <a href="#blog" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Blog</a>
              <a href="#about" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">About</a>
              <a href="#contact" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Contact</a>
              {!isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => setShowLogin(true)}>
                    Login
                  </Button>
                  <Button>
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
        <div className="lg:hidden bg-white shadow-xl border-t">
          <div className="px-6 py-4 space-y-4">
            <a href="#home" className="block text-blue-600 font-semibold py-3 border-b border-blue-100">Home</a>
            <a href="#services" className="block text-slate-700 hover:text-blue-600 py-3 transition-colors">Services</a>
            <a href="#appointment" className="block text-slate-700 hover:text-blue-600 py-3 transition-colors">Appointment</a>
            <a href="#blog" className="block text-slate-700 hover:text-blue-600 py-3 transition-colors">Blog</a>
            <a href="#about" className="block text-slate-700 hover:text-blue-600 py-3 transition-colors">About</a>
            <a href="#contact" className="block text-slate-700 hover:text-blue-600 py-3 transition-colors">Contact</a>
            <div className="pt-4 space-y-3">
              <Button variant="outline" className="w-full">Login</Button>
              <Button className="w-full">Sign Up</Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Enhanced */}
      <section id="home" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-emerald-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium">
                  🏥 Expert Cardiac Care Since 2007
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Your Heart, <br />
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Our Expertise
                  </span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                  Experience world-class cardiovascular care with advanced treatments, 
                  compassionate expertise, and cutting-edge technology for complete peace of mind.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleAppointment}
                  size="lg"
                  className="shadow-lg hover:shadow-xl"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency Call
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl blur-3xl opacity-20"></div>
              <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                <div className="aspect-[4/3]">
                  <img 
                    src="https://media.istockphoto.com/id/2201754823/photo/female-physician-explaining-medical-findings-to-older-woman-with-stomach-discomfort-listening.jpg?s=612x612&w=0&k=20&c=BZxNzQuqWTolKHBoQV0V8oOZpDl5PWKlCVe2DDc-ps0="
                    alt="Modern medical consultation"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
                </div>
              </Card>
            </div>
          </div>

          {/* Enhanced Statistics */}
          <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "5000+", label: "Patients Treated", icon: <Users className="w-6 h-6" /> },
              { number: "15+", label: "Years Experience", icon: <Award className="w-6 h-6" /> },
              { number: "98%", label: "Success Rate", icon: <TrendingUp className="w-6 h-6" /> },
              { number: "৳1500", label: "Consultation Fee", icon: <Heart className="w-6 h-6" /> }
            ].map((stat, index) => (
              <Card key={index} className="text-center p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-blue-600 mb-3 flex justify-center">{stat.icon}</div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{stat.number}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Enhanced Available Times */}
          <Card className="mt-16 bg-gradient-to-r from-white to-blue-50/50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
                <Clock className="w-6 h-6 text-blue-600 mr-3" />
                Consultation Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Sunday</div>
                    <div className="text-slate-600">3:30 PM - 9:00 PM</div>
                    <Badge className="mt-1 bg-green-100 text-green-700">Available</Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Friday</div>
                    <div className="text-slate-600">10:00 AM - 9:00 PM</div>
                    <Badge className="mt-1 bg-green-100 text-green-700">Available</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-2">Chamber Location</div>
                  <div className="text-slate-600 leading-relaxed">
                    BTI Landmark (Level-11)<br />
                    Plot-16, Block-CWS(A)<br />
                    Gulshan-1, Dhaka-1212, Bangladesh
                  </div>
                  <Badge className="mt-2 border border-slate-300 text-slate-600">Premium Location</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 mb-6">
              🏥 Our Specializations
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Comprehensive Cardiac Care
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              State-of-the-art cardiovascular services designed to keep you healthy, 
              strong, and living life to the fullest with complete confidence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group h-full bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <CardHeader className="pb-4">
                  <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-slate-600 leading-relaxed">
                    {service.description}
                  </CardDescription>
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-slate-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
     
    {/* Enhanced About Section */}
<section id="about" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-20">
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-2 mb-6">
        👨‍⚕️ Professional Excellence
      </Badge>
      <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
        Meet Dr. Jobayer Hasan
      </h2>
      <p className="text-xl text-slate-600 max-w-3xl mx-auto">
        A distinguished cardiologist with over 15 years of experience in advanced cardiac care
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
      {/* Professional Images Album - Upper Left */}
      <div className="flex flex-col items-center space-y-8">
        <div className="relative w-full max-w-md">
          {/* Album Stack Effect */}
          <div className="relative">
            {/* Background Cards for Stack Effect */}
            <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform rotate-2 scale-95 opacity-60"></div>
            <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform -rotate-1 scale-97 opacity-80"></div>
            
            {/* Main Image Container */}
            <div className="relative bg-white rounded-xl shadow-2xl p-6 transform transition-all duration-500 hover:scale-105">
              <div className="relative overflow-hidden rounded-lg">
                <img 
                  src="https://plus.unsplash.com/premium_photo-1661274078177-3975521e1101?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aGVhcnQlMjB0ZWFtfGVufDB8fDB8fHww"
                  alt="Advanced cardiac equipment"
                  className="w-full h-64 object-cover transition-all duration-700"
                  style={{
                    animation: 'emerge1 3s ease-in-out infinite alternate'
                  }}
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Technology
                </div>
              </div>
              <div className="mt-4 text-center">
                <h4 className="font-bold text-slate-800">Advanced Equipment</h4>
                <p className="text-sm text-slate-600">State-of-the-art cardiac monitoring</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Images Album */}
        <div className="flex gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-lg shadow-md transform rotate-1 scale-95 opacity-70"></div>
            <div className="relative bg-white rounded-lg shadow-xl p-4 transform transition-all duration-500 hover:scale-110">
              <img 
                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
                alt="Medical consultation"
                className="w-24 h-20 object-cover rounded transition-all duration-700"
                style={{
                  animation: 'emerge2 4s ease-in-out infinite alternate'
                }}
              />
              <div className="absolute top-1 right-1 bg-emerald-500 w-3 h-3 rounded-full"></div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-lg shadow-md transform -rotate-1 scale-95 opacity-70"></div>
            <div className="relative bg-white rounded-lg shadow-xl p-4 transform transition-all duration-500 hover:scale-110">
              <img 
                src="https://media.istockphoto.com/id/855467458/photo/we-should-be-able-to-discharge-this-patient-soon.webp?a=1&b=1&s=612x612&w=0&k=20&c=hMw6TCV_C5YYg31O-6qmBihePEcqSXntcmDAAwLCrPA="
                alt="Medical team"
                className="w-24 h-20 object-cover rounded transition-all duration-700"
                style={{
                  animation: 'emerge3 5s ease-in-out infinite alternate'
                }}
              />
              <div className="absolute top-1 right-1 bg-blue-500 w-3 h-3 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Professional Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center transform transition-all duration-500 hover:shadow-xl">
          <div className="text-4xl font-bold text-blue-600 mb-2">15+</div>
          <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Years of Excellence</div>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 mx-auto mt-3 rounded-full"></div>
        </div>
      </div>
      
      {/* Experience - Upper Right */}
      <Card className="bg-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
            <Award className="w-6 h-6 text-blue-600 mr-3" />
            Professional Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {experience.map((exp, index) => (
            <div key={index} className="relative pl-8 pb-6 last:pb-0">
              <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                exp.type === 'current' ? 'bg-blue-600' :
                exp.type === 'previous' ? 'bg-emerald-600' :
                exp.type === 'training' ? 'bg-amber-600' : 'bg-slate-600'
              }`}></div>
              <div className="absolute left-2 top-6 w-0.5 bg-slate-200 h-full last:h-0"></div>
              
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900">{exp.title}</h4>
                <div className="text-blue-600 font-semibold text-sm">{exp.duration}</div>
                <div className="text-slate-800 font-medium">{exp.company}</div>
                <p className="text-slate-600 leading-relaxed">{exp.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education - Lower Left */}
      <Card className="bg-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 flex items-center">
            <Shield className="w-6 h-6 text-emerald-600 mr-3" />
            Education & Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {education.map((edu, index) => (
            <div key={index} className="relative pl-8 pb-6 last:pb-0">
              <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                edu.type === 'certification' ? 'bg-purple-600' :
                edu.type === 'fellowship' ? 'bg-emerald-600' :
                edu.type === 'postgraduate' ? 'bg-blue-600' : 'bg-slate-600'
              }`}></div>
              <div className="absolute left-2 top-6 w-0.5 bg-slate-200 h-full last:h-0"></div>
              
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900">{edu.degree}</h4>
                <div className="text-emerald-600 font-semibold text-sm">{edu.year}</div>
                <div className="text-slate-800 font-medium">{edu.institution}</div>
                <p className="text-slate-600 leading-relaxed">{edu.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Academic Images Album - Lower Right */}
      <div className="flex flex-col items-center space-y-8">
        <div className="relative w-full max-w-md">
          {/* Album Stack Effect */}
          <div className="relative">
            {/* Background Cards for Stack Effect */}
            <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform -rotate-2 scale-95 opacity-60"></div>
            <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform rotate-1 scale-97 opacity-80"></div>
            
            {/* Main Image Container */}
            <div className="relative bg-white rounded-xl shadow-2xl p-6 transform transition-all duration-500 hover:scale-105">
              <div className="relative overflow-hidden rounded-lg">
                <img 
                  src="https://media.istockphoto.com/id/696824550/photo/medical-student-points-to-something-on-a-human-heart-model.jpg?s=612x612&w=0&k=20&c=qWjUVkfCd0dbcREoaD6RuLrAM4wkAJMfd3WiVVfAgPc="
                  alt="Medical research"
                  className="w-full h-64 object-cover transition-all duration-700"
                  style={{
                    animation: 'emerge4 3.5s ease-in-out infinite alternate'
                  }}
                />
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Research
                </div>
              </div>
              <div className="mt-4 text-center">
                <h4 className="font-bold text-slate-800">Academic Research</h4>
                <p className="text-sm text-slate-600">Advancing cardiac medicine</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Academic Images */}
        <div className="flex gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-lg shadow-md transform -rotate-1 scale-95 opacity-70"></div>
            <div className="relative bg-white rounded-lg shadow-xl p-4 transform transition-all duration-500 hover:scale-110">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
                alt="Medical education"
                className="w-24 h-20 object-cover rounded transition-all duration-700"
                style={{
                  animation: 'emerge5 4.5s ease-in-out infinite alternate'
                }}
              />
              <div className="absolute top-1 right-1 bg-purple-500 w-3 h-3 rounded-full"></div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-lg shadow-md transform rotate-1 scale-95 opacity-70"></div>
            <div className="relative bg-white rounded-lg shadow-xl p-4 transform transition-all duration-500 hover:scale-110">
              <img 
                src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
                alt="Medical certifications"
                className="w-24 h-20 object-cover rounded transition-all duration-700"
                style={{
                  animation: 'emerge6 5.5s ease-in-out infinite alternate'
                }}
              />
              <div className="absolute top-1 right-1 bg-emerald-500 w-3 h-3 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Academic Achievement */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center transform transition-all duration-500 hover:shadow-xl">
          <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
          <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Publications</div>
          <div className="w-16 h-1 bg-gradient-to-r from-emerald-600 to-blue-600 mx-auto mt-3 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>

  <style>{`
    @keyframes emerge1 {
      0% { transform: scale(1) rotate(0deg); filter: brightness(1); }
      100% { transform: scale(1.05) rotate(1deg); filter: brightness(1.1); }
    }
    @keyframes emerge2 {
      0% { transform: scale(1) rotate(0deg); opacity: 0.9; }
      100% { transform: scale(1.1) rotate(-2deg); opacity: 1; }
    }
    @keyframes emerge3 {
      0% { transform: scale(1) rotate(0deg); opacity: 0.9; }
      100% { transform: scale(1.1) rotate(2deg); opacity: 1; }
    }
    @keyframes emerge4 {
      0% { transform: scale(1) rotate(0deg); filter: brightness(1); }
      100% { transform: scale(1.05) rotate(-1deg); filter: brightness(1.1); }
    }
    @keyframes emerge5 {
      0% { transform: scale(1) rotate(0deg); opacity: 0.9; }
      100% { transform: scale(1.1) rotate(2deg); opacity: 1; }
    }
    @keyframes emerge6 {
      0% { transform: scale(1) rotate(0deg); opacity: 0.9; }
      100% { transform: scale(1.1) rotate(-2deg); opacity: 1; }
    }
  `}</style>
</section>
     
      

      {/* Enhanced Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-4 py-2 mb-6">
              ⭐ Patient Stories
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              What Our Patients Say
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Real testimonials from patients who have experienced our exceptional cardiac care
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-2xl">
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-2xl mx-1">★</span>
                  ))}
                </div>
                <blockquote className="text-xl lg:text-2xl text-slate-700 mb-8 leading-relaxed italic font-medium">
                  "{testimonials[currentTestimonial].message}"
                </blockquote>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-slate-900">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-slate-600 font-medium">
                    {testimonials[currentTestimonial].location}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-blue-600 w-8' 
                      : 'bg-slate-300 hover:bg-slate-400'
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
                <CardContent className="flex items-center justify-center h-full p-0">
                  <span className="text-sm font-bold text-slate-600">{affiliate.logo}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Blog Section */}
      <section id="blog" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 px-4 py-2 mb-6">
              📚 Health Insights
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Latest Health Articles
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Stay informed with expert insights, health tips, and the latest advances in cardiac care
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
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
            ].map((post, index) => (
              <Card key={index} className="group bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden">
                  <img 
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs bg-slate-100 text-slate-600">{post.category}</Badge>
                    <span className="text-xs text-slate-500">{post.readTime}</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 leading-relaxed">
                    {post.excerpt}
                  </CardDescription>
                  <a href="#" className="inline-block text-blue-600 font-semibold hover:text-blue-700">
                    Read Article →
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Feedback Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2 mb-6">
              💬 Get in Touch
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              We Value Your Feedback
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed">
              Your thoughts help us improve our services. Share your experience and suggestions with us.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-white to-slate-50 border-0 shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleFeedback} className="space-y-6">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-3">Your Name</label>
                  <input
                    type="text"
                    value={feedback.name}
                    onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-3">Your Message</label>
                  <textarea
                    value={feedback.message}
                    onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-900"
                    rows={5}
                    placeholder="Share your thoughts, suggestions, or questions..."
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full py-6"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Dr. Jobayer Hasan
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Excellence in cardiovascular care with compassion, expertise, and cutting-edge technology.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">+880 1717-123456</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">dr.rahman@careconnect.bd</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-400 mt-1" />
                  <span className="text-slate-300">BTI Landmark, Gulshan-1<br />Dhaka-1212, Bangladesh</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
              <div className="space-y-3">
                {['Home', 'Services', 'Appointment', 'About', 'Blog', 'Contact'].map((link) => (
                  <a key={link} href={`#${link.toLowerCase()}`} className="block text-slate-300 hover:text-blue-400 transition-colors">
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
                <h4 className="font-semibold text-white mb-3">Newsletter</h4>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-1 px-4 py-2 text-slate-900 rounded-l-lg focus:outline-none bg-white"
                  />
                  <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-slate-400 text-center md:text-left">
                © 2025 CareConnect. All rights reserved. | Privacy Policy | Terms of Service
              </p>
              <div className="flex items-center space-x-2 text-slate-400">
                <Heart className="w-4 h-4 text-red-400" />
                <span>Made with care for better health</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white border-0 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowLogin(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <CardDescription>Sign in to book your appointment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full py-3"
                >
                  Sign In
                </Button>
                <p className="text-center text-sm text-slate-600">
                  Don't have an account? <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">Sign up here</a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PublicWebsite;
