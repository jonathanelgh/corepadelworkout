"use client";

import { ArrowLeft, CheckCircle2, PlayCircle, Shield, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function FreeWarmupPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#ccff00] selection:text-black">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-black transition-colors rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold tracking-wider uppercase">Core Padel Workout</span>
          </div>
        </div>
      </header>

      <main className="pt-20">
        
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#ccff00]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-100 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/3"></div>
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-16">
            
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block border border-[#ccff00] bg-[#ccff00]/10 text-black rounded-full px-5 py-1.5 text-sm font-bold mb-8 uppercase tracking-wider">
                100% Free Video Guide
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight mb-8">
                The Ultimate 15-Minute Pre-Match Warmup.
              </h1>
              <p className="text-gray-500 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto md:mx-0">
                Stop walking onto the court cold. Learn the exact dynamic warmup routine used by pros to prevent injuries and dominate from the very first point.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a href="#register" className="bg-[#ccff00] text-black px-8 py-4 rounded-full font-semibold hover:bg-[#b3e600] transition-colors text-center text-lg shadow-[0_0_40px_rgba(204,255,0,0.4)]">
                  Get Free Access Now
                </a>
              </div>
              
              <div className="mt-8 flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1"><PlayCircle className="w-4 h-4" /> HD Video</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> PDF Checklist</span>
              </div>
            </div>

            <div className="flex-1 w-full max-w-lg mx-auto relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 aspect-[4/5]">
                <img 
                  src="/padel_player_footwork.webp" 
                  alt="Padel Warmup" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg">
                    <PlayCircle className="w-10 h-10 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="text-sm font-bold text-[#ccff00] mb-2 uppercase tracking-wider">Preview</div>
                  <h3 className="text-2xl font-medium">Dynamic Court Movements</h3>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Why it matters */}
        <section className="py-24 px-6 md:px-12 bg-black text-white text-center">
          <div className="max-w-[1400px] mx-auto">
            <h2 className="text-3xl md:text-5xl font-medium mb-16 tracking-tight">Why You Need This Routine</h2>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#ccff00]/10 rounded-full flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-[#ccff00]" />
                </div>
                <h3 className="text-xl font-medium mb-4">Injury Prevention</h3>
                <p className="text-gray-400 leading-relaxed">
                  Padel requires explosive lateral movements. Cold muscles lead to pulled hamstrings and tennis elbow. We prep your joints for impact.
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#ccff00]/10 rounded-full flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-[#ccff00]" />
                </div>
                <h3 className="text-xl font-medium mb-4">Instant Peak Performance</h3>
                <p className="text-gray-400 leading-relaxed">
                  Don't use the first set to "warm up." Activate your nervous system so your reaction time and footwork are at 100% from the first serve.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#ccff00]/10 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-[#ccff00]" />
                </div>
                <h3 className="text-xl font-medium mb-4">Mental Readiness</h3>
                <p className="text-gray-400 leading-relaxed">
                  A structured routine gets you in the zone. Stop chatting by the net and start focusing on the match ahead with purpose.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section id="register" className="py-32 px-6 md:px-12 bg-gray-50">
          <div className="max-w-3xl mx-auto bg-white rounded-[2rem] p-8 md:p-16 shadow-xl border border-gray-100">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-medium mb-4">Where should we send it?</h2>
              <p className="text-gray-500">Enter your email below to get instant access to the video guide and PDF checklist.</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-black text-white py-5 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-4"
              >
                Send Me The Free Guide
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-6">
                By registering, you agree to receive training tips and updates from Core Padel Workout. You can unsubscribe at any time.
              </p>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}