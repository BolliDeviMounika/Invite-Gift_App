import { useState, useEffect } from 'react';
import { 
  Gift, Calendar, Heart, Shield, Users, Check, ArrowRight, Star, Sparkles, 
  HelpCircle, MessageCircle, Mail, Phone, MapPin, RefreshCw
} from 'lucide-react';
import Navbar from './components/Navbar';
import AboutUs from './components/AboutUs';
import BlogPage from './components/BlogPage';
import AuthPage from './components/AuthPage';
import OrganizerDashboard from './components/OrganizerDashboard';
import GuestJourney from './components/GuestJourney';

const CAROUSEL_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
    title: 'Weddings & Anniversaries'
  },
  {
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=1200',
    title: 'Birthday Parties'
  },
  {
    url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200',
    title: 'Baby Showers'
  },
  {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200',
    title: 'Housewarming Events'
  },
  {
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200',
    title: 'Graduation Milestones'
  },
  {
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=1200',
    title: 'General Celebration Gifting'
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [token, setToken] = useState<string | null>(localStorage.getItem('giftify_jwt'));
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  
  // URL Param routing triggers (for guest invites and reset links)
  const [inviteParam, setInviteParam] = useState<string | null>(null);
  const [tokenParam, setTokenParam] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Read query params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    const resetToken = params.get('token');

    if (invite) {
      setInviteParam(invite);
      setCurrentView('guest-journey');
    } else if (resetToken) {
      setTokenParam(resetToken);
      setCurrentView('reset-password');
    }
  }, []);

  // Hydrate user profile if token is present
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setUser(null);
        return;
      }
      setIsLoadingProfile(true);
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
        } else {
          // Token expired
          setToken(null);
          localStorage.removeItem('giftify_jwt');
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleAuthSuccess = (newToken: string, authedUser: { id: string; name: string; email: string }) => {
    setToken(newToken);
    setUser(authedUser);
    localStorage.setItem('giftify_jwt', newToken);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('giftify_jwt');
    setCurrentView('home');
  };

  const handleNavigate = (view: string) => {
    // Prevent navigating to dashboard if not authenticated
    if (view === 'dashboard' && !token) {
      setCurrentView('login');
      return;
    }
    setCurrentView(view);
    // Clear invite query if navigating away to public tabs
    if (view !== 'guest-journey') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('invite') || url.searchParams.has('token')) {
        window.history.pushState({}, document.title, window.location.pathname);
      }
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mb-2" />
        <span className="text-xs text-gray-400 font-bold">Verifying active coordinates session...</span>
      </div>
    );
  }

  return (
    <div id="applet-root" className="min-h-screen bg-white text-gray-900 flex flex-col justify-between font-sans selection:bg-purple-100 selection:text-purple-800">
      
      {/* Dynamic Navigation Header (Sticky and Adaptive) */}
      <Navbar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isAuthenticated={!!token} 
        onLogout={handleLogout}
        userName={user?.name}
      />

      {/* VIEWPORT CONTROLLER */}
      <main className="flex-1">
        
        {/* VIEW 1: LANDING PAGE */}
        {currentView === 'home' && (
          <div className="animate-fade-in">
            {/* HERO SECTION WITH BG CAROUSEL */}
            <section className="relative overflow-hidden min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-center py-20 bg-gray-950">
              
              {/* Full-width Slideshow background layer */}
              <div className="absolute inset-0 select-none z-0 overflow-hidden">
                {CAROUSEL_SLIDES.map((slide, index) => (
                  <div
                    key={slide.url}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={slide.url}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter blur-[2px] brightness-[0.6] scale-105"
                    />
                  </div>
                ))}
                
                {/* Modern Soft Gradient Overlay (Dark Purple & Deep Slate Black with 40-50% Opacity) */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-950/45 via-gray-950/90 to-gray-950 z-10" />
                <div className="absolute inset-0 bg-black/45 z-10" />
              </div>

              {/* Tagline Content positioned center and slightly above the middle of the screen */}
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center pb-6 sm:pb-10 -mt-8 sm:-mt-12">
                
                {/* Active Event Indicator */}
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/15 px-4.5 py-1.5 rounded-full mb-8 shadow-inner animate-pulse">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-[10px] font-bold text-amber-300 tracking-widest uppercase">
                    Celebrating: {CAROUSEL_SLIDES[currentSlide].title}
                  </span>
                </div>

                {/* Elegant Centered Tagline - Smaller, beautiful font size */}
                <h1 className="max-w-3xl mx-auto font-sans font-light tracking-wide text-base sm:text-xl lg:text-2xl text-purple-100/95 leading-relaxed mb-10 px-4 sm:px-8 filter drop-shadow">
                  "Giftify transforms gifting from a stressful and unorganized process into a <span className="text-white font-medium border-b border-purple-400/30 pb-0.5">seamless, transparent, and enjoyable experience</span> for both hosts and guests."
                </h1>

                {/* Action CTA with at least 44px touch targets */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => handleNavigate('register')}
                    className="min-h-[48px] w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-505 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg hover:shadow-purple-900/30 flex items-center justify-center space-x-2 cursor-pointer group"
                    id="cta-get-started"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleNavigate('login')}
                    className="min-h-[48px] w-full sm:w-auto px-8 bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-sm font-extrabold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 animate-fade-in"
                    id="cta-login"
                  >
                    <span>Coordinator Login</span>
                  </button>
                </div>

                {/* Carousel navigation slide dots */}
                <div className="flex justify-center space-x-2.5 mt-10">
                  {CAROUSEL_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentSlide ? 'w-9 bg-purple-500' : 'w-2 bg-white/25 hover:bg-white/45'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

              </div>
            </section>

            {/* FEATURES AND ILLUSTRATION OVERLAY GRID */}
            <section className="relative z-20 py-12 bg-white border-b border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Celebration Interactive Illustration Placeholder Grid overlapping slightly over the dark hero */}
                <div className="-mt-24 sm:-mt-28 relative z-30 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xl max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="absolute -top-3 -right-3 p-1.5 rounded-full bg-amber-500 text-white shadow-sm flex items-center justify-center animate-beat">
                    <Star className="h-4 w-4 fill-current" />
                  </div>

                  <div className="md:col-span-4 rounded-2xl bg-gradient-to-tr from-purple-100/50 to-indigo-100/50 p-6 flex flex-col justify-between items-start text-left">
                    <div className="p-3 bg-white rounded-xl text-purple-600 shadow-sm">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 mt-4 leading-snug">01. Setup Invitations</h3>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">Choose celebration event specs and pre-design custom templates in one dashboard.</p>
                    </div>
                  </div>

                  <div className="md:col-span-4 rounded-2xl bg-gradient-to-tr from-amber-50 to-amber-100/40 p-6 flex flex-col justify-between items-start text-left">
                    <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 mt-4 leading-snug">02. Curate Wishlists</h3>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">Add catalog product links with priority scales, ensuring you get what fits your home.</p>
                    </div>
                  </div>

                  <div className="md:col-span-4 rounded-2xl bg-gradient-to-tr from-emerald-50 to-emerald-100/30 p-6 flex flex-col justify-between items-start text-left">
                    <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 mt-4 leading-snug">03. Gather Live RSVPs</h3>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">Guests lock selection items in real-time. Reserved gifts are locked instantly for others.</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* TRUST FACTORS SECTION */}
            <section className="py-16 bg-white border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-8">Loved by Hosts across the Continent</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  {[
                    { quote: "Giftify completely salvaged our wedding planning cycle. Zero duplicate toasters, and all guest counts matched our buffet order perfectly!", name: "Sophia & Daniel", role: "Wedding organizers" },
                    { quote: "Creating an anniversary template card took under a minute. The real-time locks gave our friends clarity during purchase selections.", name: "Marcus Vance", role: "Silver Jubilee host" },
                    { quote: "No more messy group chat lists for birthday planning! My guests loved the single-click RSVP link without signing up.", name: "Tina Brooks", role: "Mom of two" }
                  ].map((userObj, i) => (
                    <div key={i} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-between text-left">
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed italic">"{userObj.quote}"</p>
                      <div className="mt-4 pt-4 border-t border-gray-100 text-xs">
                        <span className="font-bold text-gray-800 block">{userObj.name}</span>
                        <span className="text-purple-600 font-semibold">{userObj.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FEATURE HIGHLIGHTS */}
            <section className="py-16 sm:py-24 bg-gray-50/50">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-xl mx-auto mb-16">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-650 bg-purple-50 px-3.5 py-1.5 rounded-full inline-block">Applet Features</h3>
                  <h2 className="mt-4 font-sans font-extrabold text-3xl text-gray-900 tracking-tight leading-none">Complete Feature Framework</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { title: "Standalone JWT Auth", icon: Shield, desc: "Secure encrypted profiles for event planners. Keeps coordinator settings and guest lists secure." },
                    { title: "Template Predesigner", icon: Sparkles, desc: "Enter host metadata and generate beautiful typography invitations for baby showers, anniversaries, or birthdays instantly." },
                    { title: "Real-time DB Sync", icon: RefreshCw, desc: "Powered by Server-Sent Events (SSE) stream. Lock purchases instantly so Guests avoid awkward duplicate gifting." },
                    { title: "Catering Analytics Logs", icon: Users, desc: "Compile vegetarian / non-vegetarian counts dynamically, so wedding or graduation kitchens function perfectly." }
                  ].map((feat, i) => {
                    const Icon = feat.icon;
                    return (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-purple-200 transition-all flex items-start space-x-4">
                        <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base mb-1">{feat.title}</h4>
                          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: ABOUT US */}
        {currentView === 'about' && <AboutUs />}

        {/* VIEW 3: BLOGS PAGE */}
        {currentView === 'blog' && <BlogPage token={token} />}

        {/* VIEW 4: LOGIN / REGISTRATION / FORGOT / RESET ROUTES */}
        {['login', 'register', 'forgot', 'reset-password'].includes(currentView) && (
          <AuthPage 
            initialView={
              currentView === 'register' ? 'register' : 
              currentView === 'forgot' ? 'forgot' : 
              currentView === 'reset-password' ? 'reset' : 'login'
            }
            tokenParam={tokenParam}
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {/* VIEW 5: PLANNERS DASHBOARD (ONLY ACCESSED IF AUTHENTICATED) */}
        {currentView === 'dashboard' && token && user && (
          <OrganizerDashboard 
            token={token} 
            user={user} 
            onLogout={handleLogout}
          />
        )}

        {/* VIEW 6: GUEST JOURNEY */}
        {currentView === 'guest-journey' && inviteParam && (
          <GuestJourney 
            eventId={inviteParam} 
            onNavigateHome={() => {
              setInviteParam(null);
              setCurrentView('home');
            }}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <span className="font-sans font-bold text-lg tracking-tight text-white flex items-center space-x-1">
                <Gift className="h-5 w-5 text-purple-505" />
                <span>Giftify</span>
              </span>
              <p className="text-xs text-gray-500 leading-relaxed">
                Empowering hosts and guests to celebrate landmarks smoothly with live-updating digital catalogs.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Functional Hub</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><button onClick={() => handleNavigate('home')} className="hover:text-white">Planners Home</button></li>
                <li><button onClick={() => handleNavigate('blog')} className="hover:text-white">Inspiration Blog</button></li>
                <li><button onClick={() => handleNavigate('about')} className="hover:text-white">Our Mission Principles</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Core SaaS Integrity</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><span className="text-gray-500">Standalone JWT Engine</span></li>
                <li><span className="text-gray-500">SSE Real-Time Toggles</span></li>
                <li><span className="text-gray-500">Auto-Seeding Blogs</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Reach Celebrations</h4>
              <p className="text-xs text-gray-500">Submit requests or configure API pipelines seamlessly.</p>
              <div className="flex items-center space-x-1.5 text-xs text-gray-300 pt-2">
                <Mail className="h-3.5 w-3.5 text-purple-400" />
                <span>support@giftify.com</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© 2026 Giftify Inc. All rights reserved. Precision-engineered celebration workflows.</p>
            <div className="flex space-x-4">
              <span className="hover:underline">Privacy Policy</span>
              <span className="hover:underline">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
