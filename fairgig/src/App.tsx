// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import SignUp from './components/SignUp';
import Login from './components/Login';
import './App.css';
import Dashboard from './pages/WorkerDashboard';
// import AdvocateDashboard from './pages/AdvocateDashboard/AdvocateDashboard'; // Placeholder for future dashboard page
// Placeholder components for other pages (commented implementations)
// Uncomment and implement these when ready
/*
// import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Feed from './components/Feed';
import Trending from './components/Trending';
import Settings from './components/Settings';
*/


import VerifierDashboard from './pages/verifierDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/worker/dashboard" element={<Dashboard />} />  {/* ← ADD THIS LINE */}
          <Route path="/verifier/dashboard" element={<VerifierDashboard />} />  {/* ← ADD FOR VERIFIER */}
          {/* <Route path="/advocate/dashboard" element={<AdvocateDashboard />} /> ← ADD FOR ADVOCATE */}
        </Routes>
      </div>
    </Router>
  );
};

// HomePage Component (previously the main App content)
const HomePage: React.FC = () => {
  const [counters, setCounters] = useState({ customers: 0, platforms: 0, advocates: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const targetCustomers = 12500;
          const targetPlatforms = 8;
          const targetAdvocates = 47;
          const duration = 2000;
          const stepTime = 20;
          const steps = duration / stepTime;
          let step = 0;

          const interval = setInterval(() => {
            step++;
            setCounters({
              customers: Math.min(Math.floor((step / steps) * targetCustomers), targetCustomers),
              platforms: Math.min(Math.floor((step / steps) * targetPlatforms), targetPlatforms),
              advocates: Math.min(Math.floor((step / steps) * targetAdvocates), targetAdvocates),
            });
            if (step >= steps) clearInterval(interval);
          }, stepTime);
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <>
      <Navigation />
      <HeroCarousel />
      <ServicesSection />
      <ReviewsSlider />
      <StatsSection statsRef={statsRef} counters={counters} />
      <Footer />
    </>
  );
};

// Navigation Component
const Navigation: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login'); // Uncomment when login page is ready
    // alert('Login page coming soon!');
  };
  const handleDashboard = () => {
    navigate('/dashboard'); // Uncomment when dashboard page is ready
    // alert('Dashboard page coming soon!');
  }
  // const handleDashboard = () => {
  //   navigate('/dashboard'); // Uncomment when dashboard page is ready
  //   // alert('Dashboard page coming soon!');
  // };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <i className="fas fa-hand-peace"></i>
          <span>FairGig</span>
        </div>
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <a href="#hero">Home</a>
          <a href="#services">Services</a>
          <a href="#reviews">Reviews</a>
          <a href="#about">About Us</a>
          <a href="#feedback">Feedback</a>
          <a href="#contact">Contact</a>
          <div className="auth-buttons">
            <button className="btn-login" onClick={handleLogin}>Login</button>
            <button className="btn-signup" onClick={handleSignUp}>Sign Up</button>
          </div>
        </div>
        <div className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </div>
      </div>
    </nav>
  );
};

// Hero Carousel Component
const HeroCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "Log & Verify Your Earnings",
      description: "Keep a unified record of all your gig income. Upload screenshots, get verification, and prove your earnings to landlords and banks.",
      icon: "fas fa-chart-line",
    },
    {
      title: "Fair Pay Intelligence",
      description: "Compare your earnings against city-wide medians. Track commission changes and spot unfair deductions instantly.",
      icon: "fas fa-shield-alt",
    },
    {
      title: "Community Grievance Board",
      description: "Join thousands of workers sharing rate intelligence and raising collective concerns. Your voice matters.",
      icon: "fas fa-users",
    },
    {
      title: "Income Certificate Generator",
      description: "Generate printable, verified income reports for any date range. Accepted by landlords and financial institutions.",
      icon: "fas fa-file-invoice",
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <section id="hero" className="hero">
      <div className="hero-slides">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
          >
            <div className="hero-content">
              <i className={`${slide.icon} hero-icon`}></i>
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <button className="hero-cta" onClick={handleGetStarted}>Get Started →</button>
            </div>
          </div>
        ))}
      </div>
      <div className="carousel-dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
          />
        ))}
      </div>
    </section>
  );
};

// Services Section
const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: "fas fa-upload",
      title: "Earnings Logger",
      description: "Log shifts across multiple platforms. Bulk CSV import for tech-savvy users. Track hours, gross earnings, deductions & net income."
    },
    {
      icon: "fas fa-camera",
      title: "Screenshot Verification",
      description: "Upload platform screenshots for verification. Get approval or flag discrepancies. Build trusted earning history."
    },
    {
      icon: "fas fa-chart-bar",
      title: "Income Analytics",
      description: "Weekly trends, hourly rate tracker, commission monitor & anonymous city-wide median comparison."
    },
    // Additional service commented for now
    /*
    {
      icon: "fas fa-bullhorn",
      title: "Grievance Board",
      description: "Post complaints, share rate intel, cluster issues with advocates. Collective power for fair treatment."
    }
    */
  ];

  return (
    <section id="services" className="services">
      <div className="container">
        <div className="section-header">
          <h2>Platform Services</h2>
          <p>Empowering gig workers with transparency and collective action</p>
        </div>
        <div className="services-grid">
          {services.map((service, idx) => (
            <div className="service-card" key={idx}>
              <div className="service-icon">
                <i className={service.icon}></i>
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Reviews Slider
const ReviewsSlider: React.FC = () => {
  const [currentReview, setCurrentReview] = useState(0);
  const reviews = [
    {
      name: "Ahmed Raza",
      role: "Food Delivery Rider",
      content: "FairGig helped me prove my income to my landlord! Before this, no one believed how much I actually earn. The income certificate is a lifesaver.",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "Sadia Khan",
      role: "Freelance Designer",
      content: "The commission tracker showed me how much platforms were really taking. I switched platforms and now save 15% every month. Incredible tool!",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      name: "Usman Chaudhry",
      role: "Ride-hailing Driver",
      content: "Being part of the grievance board gave me a voice. We flagged unfair deactivation and the advocate helped resolve it within days.",
      rating: 4,
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
      name: "Fatima Ali",
      role: "Domestic Worker",
      content: "I never had proof of income before. Now I can show my earnings to family and even applied for a small loan. Thank you FairGig!",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/women/22.jpg"
    }
  ];

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section id="reviews" className="reviews">
      <div className="container">
        <div className="section-header">
          <h2>Worker Stories</h2>
          <p>Real feedback from our growing community</p>
        </div>
        <div className="review-slider">
          <button className="slider-btn prev" onClick={prevReview}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="review-card">
            <div className="review-avatar">
              <img src={reviews[currentReview].avatar} alt={reviews[currentReview].name} />
            </div>
            <div className="review-stars">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < reviews[currentReview].rating ? 'filled' : ''}`}></i>
              ))}
            </div>
            <p className="review-content">"{reviews[currentReview].content}"</p>
            <h4 className="review-name">{reviews[currentReview].name}</h4>
            <p className="review-role">{reviews[currentReview].role}</p>
          </div>
          <button className="slider-btn next" onClick={nextReview}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        <div className="review-dots">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              className={`review-dot ${idx === currentReview ? 'active' : ''}`}
              onClick={() => setCurrentReview(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats Section
interface StatsSectionProps {
  statsRef: React.RefObject<HTMLElement>;
  counters: { customers: number; platforms: number; advocates: number };

}

const StatsSection: React.FC<StatsSectionProps> = ({ statsRef, counters }) => {
  return (
    <section className="stats" ref={statsRef}>
      <div className="container">
        <div className="stats-grid">
          <div className="stat-item">
            <i className="fas fa-user-friends"></i>
            <div className="stat-number">{counters.customers.toLocaleString()}+</div>
            <div className="stat-label">Active Workers</div>
          </div>
          <div className="stat-item">
            <i className="fas fa-chart-line"></i>
            <div className="stat-number">{counters.platforms}+</div>
            <div className="stat-label">Platforms Integrated</div>
          </div>
          <div className="stat-item">
            <i className="fas fa-gavel"></i>
            <div className="stat-number">{counters.advocates}+</div>
            <div className="stat-label">Labour Advocates</div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div id="about" className="footer-section">
            <h3><i className="fas fa-hand-peace"></i> FairGig</h3>
            <p>Empowering Pakistan's gig workers with income transparency, verification, and collective advocacy. Built for riders, drivers, freelancers, and domestic workers.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
            </div>
          </div>

          <div id="feedback" className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#hero">Home</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#reviews">Reviews</a></li>
              <li><a href="#about">About Us</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><a href="#">Worker Guide</a></li>
              <li><a href="#">Platform Policies</a></li>
              <li><a href="#">Advocate Network</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          <div id="contact" className="footer-section">
            <h3>Contact Us</h3>
            <ul className="contact-info">
              <li><i className="fas fa-map-marker-alt"></i> SOFTEC Society, FAST-NU, Block-B, Faisal Town, Lahore, Pakistan</li>
              <li><i className="fas fa-envelope"></i> info@softecnu.org</li>
              <li><i className="fas fa-phone"></i> +92 42 111 128 128</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 FairGig | Gig Worker Income & Rights Platform | All Rights Reserved</p>
          <div className="feedback-form">
            <span>Share your feedback: </span>
            <button className="feedback-btn">Give Feedback <i className="fas fa-comment"></i></button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default App;