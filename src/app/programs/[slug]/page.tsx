import { ArrowLeft, CheckCircle2, Clock, PlayCircle, Star, Target, Zap } from "lucide-react";
import Link from "next/link";

export default function ProgramDetail() {
  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#ccff00] selection:text-black pb-24 md:pb-0">
      
      {/* Mobile Sticky Header (Visible on scroll) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-white via-white/80 to-transparent pb-6 pt-4 px-4 flex items-center justify-between md:hidden">
        <Link href="/" className="p-2 -ml-2 text-gray-800 hover:text-black bg-white/50 backdrop-blur-md rounded-full shadow-sm">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="font-semibold text-sm bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">Smash Power</span>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      <div className="flex flex-col md:flex-row min-h-screen">
        
        {/* Left Column: Image & Mobile Hero */}
        <div className="w-full md:w-1/2 md:fixed md:left-0 md:top-0 md:bottom-0 md:h-screen relative h-[60vh] md:h-auto">
          <img 
            src="/Padel_player_makes_202603231105.jpeg" 
            alt="Smash Power Program" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 md:bg-black/40"></div>
          
          {/* Desktop Back Button */}
          <Link href="/" className="hidden md:flex absolute top-8 left-8 items-center gap-2 text-white/80 hover:text-white transition-colors z-10 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Mobile Hero Content (Over image) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#ccff00] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Advanced</span>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> 4.9 (128 reviews)
              </span>
            </div>
            <h1 className="text-4xl font-medium leading-tight mb-2">Smash Power</h1>
            <p className="text-gray-300 text-sm">Get a better smash through physics & strength.</p>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="w-full md:w-1/2 md:ml-[50%] bg-white relative z-10 rounded-t-3xl -mt-6 md:mt-0 md:rounded-none overflow-hidden">
          <div className="max-w-2xl mx-auto p-6 md:p-12 lg:p-16">
            
            {/* Desktop Hero Content */}
            <div className="hidden md:block mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-[#ccff00] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Advanced</span>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-[#ffc107]" /> 4.9 (128 reviews)
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-medium leading-tight mb-4 tracking-tight">Smash Power</h1>
              <p className="text-gray-500 text-lg">Get a better smash through physics & strength.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-12 py-6 border-y border-gray-100">
              <div className="flex flex-col items-center text-center">
                <Clock className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm font-semibold">4 Weeks</span>
                <span className="text-xs text-gray-500">Duration</span>
              </div>
              <div className="flex flex-col items-center text-center border-x border-gray-100">
                <Target className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm font-semibold">3x / Week</span>
                <span className="text-xs text-gray-500">Frequency</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Zap className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm font-semibold">30 Mins</span>
                <span className="text-xs text-gray-500">Per Session</span>
              </div>
            </div>

            {/* About Program */}
            <div className="mb-12">
              <h2 className="text-2xl font-medium mb-4">About this program</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Stop hitting the net and start finishing points. This 4-week program breaks down the biomechanics of the perfect padel smash and builds the specific muscular strength required to execute it flawlessly. 
              </p>
              <p className="text-gray-600 leading-relaxed">
                You'll work on rotational core power, shoulder mobility, and explosive leg drive. Whether you're struggling with the kick smash (por tres) or just want more raw power, this is your blueprint.
              </p>
            </div>

            {/* What you'll learn */}
            <div className="mb-12 bg-gray-50 rounded-3xl p-8">
              <h3 className="text-lg font-medium mb-6">What you'll achieve</h3>
              <ul className="space-y-4">
                {[
                  "Increase racket head speed by up to 25%",
                  "Master the kinetic chain from feet to wrist",
                  "Develop explosive rotational core strength",
                  "Learn the exact footwork for overhead positioning",
                  "Prevent common shoulder and elbow injuries"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-black shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Curriculum Preview */}
            <div className="mb-12">
              <h2 className="text-2xl font-medium mb-6">Curriculum Preview</h2>
              <div className="space-y-4">
                {[
                  { week: "Week 1", title: "Mobility & The Kinetic Chain", duration: "3 sessions" },
                  { week: "Week 2", title: "Core Rotation & Stability", duration: "3 sessions" },
                  { week: "Week 3", title: "Explosive Leg Drive", duration: "3 sessions" },
                  { week: "Week 4", title: "Putting It All Together on Court", duration: "3 sessions" }
                ].map((module, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{module.week}</div>
                        <div className="font-medium">{module.title}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{module.duration}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacer for mobile bottom bar */}
            <div className="h-24 md:h-0"></div>

          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:left-1/2 bg-white border-t border-gray-100 p-4 md:p-6 z-50 flex items-center justify-between">
        <div className="hidden md:block">
          <div className="text-sm text-gray-500 mb-1">One-time payment</div>
          <div className="text-2xl font-medium">$49.00</div>
        </div>
        <button className="w-full md:w-auto bg-[#ccff00] text-black px-8 py-4 rounded-full font-semibold hover:bg-[#b3e600] transition-colors flex items-center justify-center gap-2 text-lg">
          Start Program Now <span className="md:hidden ml-2 font-normal opacity-50">· $49</span>
        </button>
      </div>

    </div>
  );
}