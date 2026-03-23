"use client";

import { ArrowRight, CheckCircle2, Star, Menu, X, Smartphone, Play } from "lucide-react";
import { useEffect, useState } from "react";

import Link from "next/link";

const heroStats = [
  { emoji: "💪", value: "872", text: "Elbows fixed" },
  { emoji: "🔥", value: "389", text: "Smashes improved" },
  { emoji: "⚡", value: "500+", text: "Players faster on court" },
  { emoji: "🛡️", value: "1,200+", text: "Injury-free matches" },
];

const testimonials = [
  {
    text: "Joining Core Padel Workout has been one of the best decisions I've made for my fitness and social life. The sessions are well-structured, the coaches genuinely care about improvement, and the community is welcoming.",
    name: "Sara K.",
    role: "Club Member",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=4"
  },
  {
    text: "What I love most about Core Padel Workout is the atmosphere. From the first day, I felt comfortable and motivated. The coaches explain techniques clearly, and the training sessions are pretty challenging and focusing.",
    name: "Alex M.",
    role: "Club Member",
    rating: "4.9/5",
    img: "https://i.pravatar.cc/100?img=11"
  },
  {
    text: "As a beginner, I was nervous about joining, but Core Padel Workout exceeded all expectations. The staff and players were friendly, patient, and supportive. The structured sessions helped me learn the basics quickly.",
    name: "Emily R.",
    role: "New Player",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=5"
  },
  {
    text: "The Smash Power program completely changed my game. I used to struggle with finishing points, but the biomechanics breakdown helped me understand exactly what I was doing wrong. Highly recommend!",
    name: "David T.",
    role: "Advanced Player",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=8"
  },
  {
    text: "I suffered from tennis elbow for months until I started the rehab program here. The exercises were easy to follow at home, and I'm finally back on the court playing pain-free.",
    name: "Maria L.",
    role: "Intermediate Player",
    rating: "4.8/5",
    img: "https://i.pravatar.cc/100?img=9"
  },
  {
    text: "The app is fantastic! Having the workouts right on my phone makes it so easy to stick to the routine. The video demonstrations are clear and the progress tracking keeps me motivated.",
    name: "James H.",
    role: "Club Member",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=12"
  }
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Use window.scrollY with a fallback for older browsers
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollPosition > 10); // Lowered threshold for mobile responsiveness
    };
    
    // Add passive listener for better scroll performance on mobile
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial check in case page is loaded already scrolled
    handleScroll();
    
    const statInterval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % heroStats.length);
    }, 2500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(statInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#ccff00] selection:text-black">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[90] flex items-center justify-between px-6 md:px-12 py-4 w-full transition-all duration-300 ${
        isScrolled 
          ? "bg-white/90 backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] text-black shadow-sm" 
          : "bg-transparent text-white"
      }`}>
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
          <div className="text-xl font-bold tracking-wider uppercase">Core Padel Workout</div>
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            <a href="#" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>Home</a>
            <a href="#" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>About</a>
            <a href="#" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>Programs</a>
            <a href="#" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>Pricing</a>
          </div>
          <button className={`hidden md:block px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
            isScrolled 
              ? "bg-black text-white hover:bg-gray-800" 
              : "bg-white text-black hover:bg-gray-100"
          }`}>
            Contact Us
          </button>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -mr-2 relative z-[100]"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[110] shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="text-xl font-bold tracking-wider uppercase text-black">Menu</div>
          <button 
            className="p-2 -mr-2 text-gray-500 hover:text-black transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col p-6 space-y-6 text-lg font-medium text-black">
          <a href="#" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
          <a href="#" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <a href="#" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Programs</a>
          <a href="#" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <button className="w-full bg-black text-white px-6 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors">
            Contact Us
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] md:min-h-[90vh] flex flex-col justify-end pb-24 px-6 md:px-12 text-white">
        <div className="absolute inset-0 z-0">
          <picture className="absolute inset-0 w-full h-full">
            <source media="(max-width: 767px)" srcSet="/hero-bg-mobile.webp" />
            <img 
              src="/hero-bg.webp" 
              alt="Padel Court" 
              className="w-full h-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto w-full flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="max-w-3xl">
            <div className="relative h-12 mb-6 overflow-hidden">
              {heroStats.map((stat, index) => (
                <div 
                  key={index}
                  className={`absolute top-0 left-0 transition-all duration-500 ease-in-out ${
                    index === currentStatIndex 
                      ? "opacity-100 translate-y-0 z-10" 
                      : "opacity-0 translate-y-4 -z-10"
                  }`}
                >
                  <div className="text-sm text-gray-200 leading-tight">
                    <span className="font-bold text-white text-lg">{stat.value}</span><br/>
                    <span className="mr-1.5">{stat.emoji}</span>{stat.text}
                  </div>
                </div>
              ))}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight">
              The Ultimate Strength & Conditioning Hub for Padel Players.
            </h1>
          </div>
          
          <div className="max-w-sm flex flex-col gap-8 pb-4">
            <p className="text-gray-300 text-base leading-relaxed">
              Professional training programs for Padel. Move faster, hit harder, and stay injury-free with workouts you can do at the gym, at home, or on the court.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/programs" className="bg-[#ccff00] text-black px-8 py-3.5 rounded-full font-semibold hover:bg-[#b3e600] transition-colors">
                Browse Our Padel Programs
              </Link>
              <button className="bg-white text-black px-8 py-3.5 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                Free 15-Min Pre-Match Warmup
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-12 md:py-24 px-6 md:px-12 bg-white text-black text-center">
        <div className="max-w-[1400px] mx-auto">
          <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600">
            Our Programs
          </div>
          <h2 className="text-4xl md:text-5xl font-medium mb-16 tracking-tight">The Core Padel Program Library</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
            {/* Program 1 */}
            <Link href="/programs/smash-power" className="relative h-[500px] rounded-3xl overflow-hidden group cursor-pointer block">
              <img src="/Padel_player_makes_202603231105.jpeg" alt="Smash Power Program" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute top-6 left-6 bg-white rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-black -rotate-45" />
              </div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-medium mb-1">Smash Power</h3>
                <p className="text-gray-300 text-sm">Get a better smash through physics & strength</p>
              </div>
            </Link>
            
            {/* Program 2 */}
            <Link href="/programs/elbow-rehab" className="relative h-[500px] rounded-3xl overflow-hidden group cursor-pointer block">
              <img src="/Padel_player_elbow_202603231059.jpeg" alt="Elbow Rehab Program" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute top-6 left-6 bg-white rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-black -rotate-45" />
              </div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-medium mb-1">Elbow Rehab</h3>
                <p className="text-gray-300 text-sm">Fix tennis elbow & prevent injuries</p>
              </div>
            </Link>

            {/* Program 3 */}
            <Link href="/programs/on-court-agility" className="relative h-[500px] rounded-3xl overflow-hidden group cursor-pointer block">
              <img src="/padel_player_footwork.webp" alt="On-Court Agility Program" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute top-6 left-6 bg-white rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-black -rotate-45" />
              </div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-medium mb-1">On-Court Agility</h3>
                <p className="text-gray-300 text-sm">Footwork & reaction speed drills</p>
              </div>
            </Link>
          </div>

          <div className="mt-12 flex justify-center">
            <Link href="/programs" className="flex items-center gap-2 text-black font-semibold hover:text-gray-600 transition-colors group">
              View all programs
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 md:py-24 px-6 md:px-12 bg-white text-black overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600">
              About Us
            </div>
            <div className="flex flex-col md:flex-row gap-12 justify-between items-start">
              <h2 className="text-4xl md:text-5xl font-medium max-w-2xl leading-tight tracking-tight">
                Built For Players Who Love The Game — And The Community Behind It.
              </h2>
              <p className="text-gray-500 max-w-md text-lg leading-relaxed">
                Core Padel Workout was created to make racket sports more accessible, energetic, and social. What started as a small group of friends meeting on weekends has grown into a vibrant community.
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden mb-12">
            <img src="/Padel_coach_standing.webp" alt="Core Padel Workout Coach" className="w-full h-full object-cover object-center" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
            {heroStats.map((stat, i) => (
              <div key={i} className="bg-[#f9f9f9] p-6 rounded-3xl flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mb-4">
                  {stat.emoji}
                </div>
                <div className="text-4xl font-medium mb-2">{stat.value}</div>
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-24 bg-white text-black text-center overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-16">
          <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600">
            Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight">Players Love Core Padel Workout</h2>
        </div>
        
        {/* Infinite Scroll Container */}
        <div className="relative flex overflow-x-hidden group">
          <div className="flex gap-6 animate-infinite-scroll w-max px-6">
            {/* Double the testimonials array to create seamless loop */}
            {[...testimonials, ...testimonials].map((testimonial, i) => (
              <div key={i} className="bg-[#f9f9f9] p-8 md:p-10 rounded-3xl flex flex-col justify-between w-[320px] md:w-[400px] shrink-0 text-left">
                <p className="text-gray-600 leading-relaxed mb-12 text-sm md:text-base">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-4">
                    <img src={testimonial.img} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <h4 className="font-medium text-sm md:text-base">{testimonial.name}</h4>
                      <p className="text-xs md:text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {testimonial.rating} <Star className="w-4 h-4 fill-[#ffc107] text-[#ffc107]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Gradient Overlays for smooth fade effect on edges */}
          <div className="absolute top-0 bottom-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 bottom-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-24 px-6 md:px-12 bg-white text-black text-center flex flex-col items-center">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600">
            Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-medium mb-16 tracking-tight">Choose Your Membership</h2>
          
          <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto text-left">
            {/* Single Plan */}
            <div className="flex-1 bg-[#f4f4f4] rounded-[2rem] p-10 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-medium text-gray-600">Single Plan</h3>
                <Star className="w-6 h-6 text-gray-400" />
              </div>
              <div className="mb-2">
                <span className="text-5xl font-medium">€15.00</span>
                <span className="text-gray-500"> /program</span>
              </div>
              <p className="text-gray-500 mb-8 pb-8 border-b border-gray-200">Pay once, keep it forever</p>
              
              <div className="mb-6">
                <p className="text-sm font-medium mb-4">What's included:</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                    <span>Lifetime access to purchased program</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                    <span>High-quality video instructions</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                    <span>Progress tracking in app</span>
                  </li>
                </ul>
              </div>
              <Link href="/programs" className="w-full mt-auto bg-black text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors text-center block">
                Browse Programs
              </Link>
            </div>

            {/* Monthly Package */}
            <div className="flex-1 bg-[#0a0a0a] text-white rounded-[2rem] p-10 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#ccff00] text-black text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Best Value
              </div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-medium text-gray-400">Monthly Package</h3>
                <Star className="w-6 h-6 fill-[#ccff00] text-[#ccff00]" />
              </div>
              <div className="mb-2">
                <span className="text-5xl font-medium">€14.99</span>
                <span className="text-gray-400"> /month</span>
              </div>
              <p className="text-gray-400 mb-8 pb-8 border-b border-gray-800">Unlimited access to everything</p>
              
              <div className="mb-6">
                <p className="text-sm font-medium mb-4">What's included:</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0" />
                    <span>Unlimited access to ALL programs</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0" />
                    <span>AI Coach for personalized routines</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0" />
                    <span>New programs added monthly</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0" />
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </div>
              <button className="w-full mt-auto bg-[#ccff00] text-black py-4 rounded-full font-semibold hover:bg-[#b3e600] transition-colors">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-32 px-6 md:px-12 text-white text-center flex flex-col items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=2940&auto=format&fit=crop" 
            alt="Padel Court Close Up" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 tracking-tight">Ready To Play With Us?</h2>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Step onto the court, sharpen your skills, and compete with players who share your passion for padel.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="bg-[#ccff00] text-black px-8 py-3.5 rounded-full font-semibold hover:bg-[#b3e600] transition-colors">
              Get Started
            </button>
            <button className="bg-white text-black px-8 py-3.5 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
