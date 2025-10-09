import React from 'react';
import Navbar from '../components/NavBar';

const About = () => {
  return (
    <div className='bg-white overflow-x-clip'>
      <Navbar />

      {/* Hero Section */}
      <div className="min-h-screen w-screen bg-gradient-to-br from-color-b via-purple-600 to-indigo-700 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 animate-fade-in-up">
            About <span className="bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">LAWATA</span>
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 mb-12 max-w-4xl mx-auto animate-fade-in-up animation-delay-200">
            Revolutionizing crowdfunding with intelligent risk assessment, transparent milestone funding, and unmatched investor protection
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center animate-fade-in-up animation-delay-400">
            <button className="bg-white text-color-b px-8 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-2xl">
              Start Your Project
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-white hover:text-color-b transition-all duration-300 hover:scale-105">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 animate-fade-in-up">
            Our <span className="text-cyan-400">Mission</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
            To democratize investment opportunities while minimizing risk through cutting-edge technology.
            We believe every great idea deserves a chance, and every investor deserves transparency and security.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-color-b to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Innovation</h3>
              <p className="text-gray-200">Pioneering the future of crowdfunding with AI-powered risk analysis and smart contract technology</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Trust</h3>
              <p className="text-gray-200">Building unbreakable trust through transparency, security, and accountability in every transaction</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Community</h3>
              <p className="text-gray-200">Fostering a vibrant ecosystem where creators and investors thrive together</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>

        <div className="relative z-10 text-center px-4 mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Why <span className="text-yellow-300">LAWATA</span>?
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Experience the next generation of crowdfunding with revolutionary features designed for the modern investor
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 max-w-7xl mx-auto px-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-r from-color-b to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Risk Intelligence</h3>
            <p className="text-gray-200">Advanced algorithms analyze project viability, market trends, and creator credibility to provide accurate risk assessments</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Milestone Escrow</h3>
            <p className="text-gray-200">Funds are released progressively as projects achieve predetermined milestones, ensuring accountability and progress</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Investor Protection</h3>
            <p className="text-gray-200">Comprehensive refund policies and project monitoring ensure your investment is protected throughout the journey</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Real-time Analytics</h3>
            <p className="text-gray-200">Live project tracking, funding progress, and market insights to help you make informed investment decisions</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Community Driven</h3>
            <p className="text-gray-200">Connect with like-minded creators and investors in a thriving ecosystem of innovation and collaboration</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Transparent Reporting</h3>
            <p className="text-gray-200">Complete project transparency with detailed progress reports, budget breakdowns, and milestone achievements</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        <div className="relative z-10 text-center px-4 mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            How <span className="text-emerald-400">It Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Getting started with LAWATA is simple. Here's how our revolutionary platform works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10 max-w-6xl mx-auto px-4">
          <div className="text-center animate-fade-in-up animation-delay-200">
            <div className="w-20 h-20 bg-gradient-to-r from-color-b to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Create Project</h3>
            <p className="text-gray-300">Submit your innovative idea with detailed project information, goals, and milestones</p>
          </div>

          <div className="text-center animate-fade-in-up animation-delay-300">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Analysis</h3>
            <p className="text-gray-300">Our advanced algorithms analyze your project and assign a risk score for investor confidence</p>
          </div>

          <div className="text-center animate-fade-in-up animation-delay-400">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Fund & Execute</h3>
            <p className="text-gray-300">Investors fund your project through our secure escrow system as you achieve milestones</p>
          </div>

          <div className="text-center animate-fade-in-up animation-delay-500">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
              4
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Success & Growth</h3>
            <p className="text-gray-300">Complete your project, deliver rewards, and join our community of successful creators</p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        <div className="relative z-10 text-center px-4 mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Meet the <span className="text-pink-400">Team</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The visionaries and engineers behind LAWATA's mission to revolutionize crowdfunding
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 max-w-6xl mx-auto px-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300">
            <div className="w-24 h-24 bg-gradient-to-r from-color-b to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
              CEO
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Sarah Johnson</h3>
            <p className="text-cyan-400 mb-4">Chief Executive Officer</p>
            <p className="text-gray-200 text-sm">15+ years in fintech innovation, former VP at major crowdfunding platforms</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
              CTO
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Michael Chen</h3>
            <p className="text-cyan-400 mb-4">Chief Technology Officer</p>
            <p className="text-gray-200 text-sm">AI/ML expert with PhD in Computer Science, blockchain specialist</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
              CFO
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Emily Rodriguez</h3>
            <p className="text-cyan-400 mb-4">Chief Financial Officer</p>
            <p className="text-gray-200 text-sm">Former investment banker with expertise in risk assessment and portfolio management</p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        <div className="relative z-10 text-center px-4">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 animate-fade-in-up">
            Ready to <span className="text-color-b">Start</span>?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Join thousands of creators and investors who are already building the future with LAWATA
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center animate-fade-in-up animation-delay-400">
            <button className="bg-color-b text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-blue-600 transition-all duration-300 hover:scale-105 shadow-2xl">
              Launch Your Project
            </button>
            <button className="border-2 border-color-b text-color-b px-8 py-4 rounded-full text-xl font-bold hover:bg-color-b hover:text-white transition-all duration-300 hover:scale-105">
              Contact Us
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in-up animation-delay-600">
            <div className="text-center">
              <div className="w-12 h-12 bg-color-b rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Email</h3>
              <p className="text-gray-300">hello@lawata.com</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-color-b rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Location</h3>
              <p className="text-gray-300">San Francisco, CA</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-color-b rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Social</h3>
              <p className="text-gray-300">@lawata_platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
