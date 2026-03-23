"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, Filter, Star, Clock, Target } from "lucide-react";

// Mock data for programs
const programsData = [
  {
    id: "smash-power",
    title: "Smash Power",
    description: "Get a better smash through physics & strength.",
    category: "Strength",
    level: "Advanced",
    duration: "4 Weeks",
    rating: 4.9,
    reviews: 128,
    image: "/Padel_player_makes_202603231105.jpeg",
  },
  {
    id: "elbow-rehab",
    title: "Elbow Rehab",
    description: "Fix tennis elbow & prevent injuries with targeted exercises.",
    category: "Rehab",
    level: "All Levels",
    duration: "6 Weeks",
    rating: 4.8,
    reviews: 84,
    image: "/Padel_player_elbow_202603231059.jpeg",
  },
  {
    id: "on-court-agility",
    title: "On-Court Agility",
    description: "Footwork & reaction speed drills to reach every ball.",
    category: "Agility",
    level: "Intermediate",
    duration: "4 Weeks",
    rating: 5.0,
    reviews: 215,
    image: "/padel_player_footwork.webp",
  },
  {
    id: "core-stability",
    title: "Core Stability",
    description: "Build a rock-solid core for better balance and power transfer.",
    category: "Strength",
    level: "Beginner",
    duration: "3 Weeks",
    rating: 4.7,
    reviews: 92,
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34f8?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "match-stamina",
    title: "Match Stamina",
    description: "Cardio conditioning so you never gas out in the 3rd set.",
    category: "Endurance",
    level: "Intermediate",
    duration: "8 Weeks",
    rating: 4.9,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "shoulder-mobility",
    title: "Shoulder Mobility",
    description: "Unlock your full range of motion for bandejas and viboras.",
    category: "Rehab",
    level: "All Levels",
    duration: "2 Weeks",
    rating: 4.8,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34f8?q=80&w=800&auto=format&fit=crop",
  }
];

const categories = ["All", "Strength", "Agility", "Endurance", "Rehab"];

export default function ProgramsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Filter logic
  const filteredPrograms = programsData.filter((program) => {
    const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          program.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || program.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#ccff00] selection:text-black pb-24">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-black transition-colors rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold tracking-wider uppercase hidden sm:block">Core Padel Workout</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium hover:text-[#ccff00] transition-colors hidden sm:block">Home</Link>
            <Link href="/programs" className="text-sm font-medium text-gray-400">Programs</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 pt-12 md:pt-20">
        
        {/* Page Title & Description */}
        <div className="mb-12 max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-4">
            The Program Library
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Find the perfect training program to elevate your padel game. From raw power to injury prevention, we've got you covered.
          </p>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          
          {/* Categories (Scrollable on mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2 text-gray-400 mr-2 shrink-0">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category 
                    ? "bg-black text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8 text-sm font-medium text-gray-500">
          Showing {filteredPrograms.length} {filteredPrograms.length === 1 ? 'program' : 'programs'}
        </div>

        {/* Program Grid */}
        {filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredPrograms.map((program) => (
              <Link 
                href={`/programs/${program.id}`} 
                key={program.id}
                className="group flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-300"
              >
                {/* Card Image */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={program.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-sm text-black text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {program.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/40 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#ccff00] text-[#ccff00]" /> {program.rating}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-medium mb-3 group-hover:text-gray-600 transition-colors">{program.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">
                    {program.description}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      <span>{program.level}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-semibold text-black group-hover:text-gray-600 transition-colors">View Program</span>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#ccff00] transition-colors">
                      <ArrowRight className="w-5 h-5 text-black" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-24 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">No programs found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any programs matching your search for "{searchQuery}". Try adjusting your filters or search term.
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="mt-6 text-sm font-semibold border border-gray-200 px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

      </main>
    </div>
  );
}