import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-[Poppins] flex flex-col">
      {/* --- Navbar --- */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-[12px] font-medium">
              DR
            </div>
            <span className="text-[14px] font-medium text-dark tracking-tight">DailyRise</span>
          </div>
          <div className="flex gap-3">
            <Link 
              to="/login" 
              className="px-4 py-1.5 text-[11px] font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link 
              to="/register" 
              className="px-4 py-1.5 text-[11px] font-medium bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-green-50 text-primary text-[10px] font-medium tracking-wide uppercase mb-4 border border-green-100">
            #1 Habit Tracker & Community
          </span>
          <h1 className="text-[14px] sm:text-[16px] font-medium text-dark leading-tight mb-4 uppercase tracking-wide">
            Level up your life, <br />
            <span className="text-primary">
              every single day.
            </span>
          </h1>
          <p className="text-[11px] text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed font-[Roboto]">
            Build better habits, break bad ones, and achieve your goals with 
            gamified tracking, data insights, and a supportive community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/register" 
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-[11px] shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Your Journey Free
            </Link>
            <a 
              href="#features" 
              className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium text-[11px] hover:bg-gray-50 transition-all"
            >
              Explore Features
            </a>
          </div>
        </div>
      </header>

      {/* --- Features Grid --- */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[14px] font-medium text-dark mb-2">Everything you need to grow</h2>
            <p className="text-[11px] text-gray-500 font-[Roboto]">Powerful tools to keep you consistent and motivated.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 text-[14px]">
                🏆
              </div>
              <h3 className="text-[14px] font-medium text-dark mb-2">Gamified Progress</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-[Roboto]">
                Earn points, unlock badges, and climb leaderboards. We make self-improvement feel like a game.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-[14px]">
                👥
              </div>
              <h3 className="text-[14px] font-medium text-dark mb-2">Community Challenges</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-[Roboto]">
                Join groups like "Fitness Warriors". Challenge friends and hold each other accountable.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-[14px]">
                📊
              </div>
              <h3 className="text-[14px] font-medium text-dark mb-2">Smart Insights</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-[Roboto]">
                Visualize streaks and success rates. Understand your patterns to optimize your routine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-[14px] sm:text-[16px] font-medium mb-4">Ready to transform your routine?</h2>
          <p className="text-green-100 text-[11px] mb-8 max-w-lg mx-auto font-[Roboto]">
            Join thousands of users who are building the life they want, one habit at a time.
          </p>
          <Link 
            to="/register" 
            className="inline-block px-8 py-3 bg-white text-primary rounded-lg font-medium text-[11px] shadow-lg hover:bg-gray-100 transition-all duration-300"
          >
            Create Free Account
          </Link>
          <p className="mt-4 text-[10px] text-green-200/80 font-[Roboto]">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center text-white text-[9px] font-medium">DR</div>
            <span className="text-white font-medium text-[14px]">DailyRise</span>
          </div>
          <p className="text-[10px] mb-6 font-[Roboto]">© {new Date().getFullYear()} DailyRise. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-[10px] font-[Roboto]">
            <a href="/" className="hover:text-white transition-colors">Privacy</a>
            <a href="/" className="hover:text-white transition-colors">Terms</a>
            <a href="/" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;