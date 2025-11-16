import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function App() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        });
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  // Fixed: Proper useEffect for scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fixed: Intersection Observer for fade-in sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/login');
  };

  const features = [
    {
      title: "Incident Management",
      description: "Track and manage incidents efficiently with real-time updates and comprehensive logging.",
      icon: "🚨",
      route: "/incidents"
    },
    {
      title: "Server Management",
      description: "Add and remove server infrastructure",
      icon: "🖥️",
      route: "/admin/servers"
    },
    {
      title: "Audit Logs",
      description: "Complete visibility into system activities with detailed audit trails.",
      icon: "📋",
      route: "/admin/audit-logs"
    },
    {
      title: "User Management",
      description: "Secure user registration and role-based access control for your team.",
      icon: "👥",
      route: "/admin/register"
    }
  ];

  const quickLinks = [
    { 
      title: "View All Incidents", 
      route: "/incidents", 
      color: "from-purple-600/30 to-purple-800/30 border-purple-500/30 hover:border-purple-400", 
      desc: "Browse and manage all reported incidents" 
    },
    { 
      title: "Create Incident", 
      route: "/incidents/new", 
      color: "from-pink-600/30 to-pink-800/30 border-pink-500/30 hover:border-pink-400", 
      desc: "Report a new incident to the system" 
    },
    { 
      title: "Server Status", 
      route: "/admin/servers", 
      color: "from-blue-600/30 to-blue-800/30 border-blue-500/30 hover:border-blue-400", 
      desc: "Check server health and metrics" 
    },
    { 
      title: "Audit Logs", 
      route: "/admin/audit-logs", 
      color: "from-green-600/30 to-green-800/30 border-green-500/30 hover:border-green-400", 
      desc: "Review system activity logs" 
    },
    { 
      title: "Register User", 
      route: "/admin/register", 
      color: "from-yellow-600/30 to-yellow-800/30 border-yellow-500/30 hover:border-yellow-400", 
      desc: "Add new team members" 
    },
    { 
      title: "Dashboard", 
      route: "/dashboard", 
      color: "from-indigo-600/30 to-indigo-800/30 border-indigo-500/30 hover:border-indigo-400", 
      desc: "Access admin dashboard" 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 animate-slide-in-left">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">OB</span>
              </div>
              <span className="text-white font-bold text-xl">OBLIVION</span>
            </div>
            <div className="flex items-center space-x-4 animate-slide-in-right">
              {user ? (
                <>
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-white text-sm font-medium">{user.email}</span>
                    <span className="text-purple-300 text-xs capitalize">
                      {user.role} {user.id && `• ID: ${user.id.slice(0, 8)}...`}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 text-white hover:text-red-300 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : null}
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            IT Infrastructure
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
              Management System
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in animate-delay-200">
            A comprehensive platform for incident tracking, server monitoring, and team collaboration. 
            Everything you need to keep your systems running smoothly.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 fade-in-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => navigate(feature.route)}
                className="glass-effect rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer transform hover:scale-105 hover-glow-purple"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 fade-in-section">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Join teams who trust OBLIVION for their critical infrastructure.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
          >
            Start Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-gray-400 gap-4">
          <div className="text-sm md:text-base">© 2025 Oblivion. All rights reserved.</div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">
              Login
            </button>
            <button onClick={() => navigate('/forgot-password')} className="hover:text-white transition-colors">
              Forgot Password?
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}