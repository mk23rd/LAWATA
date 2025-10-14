import React, { useState, useEffect, useRef } from "react";
import {
  FiShield,
  FiTrendingUp,
  FiLayers,
  FiUsers,
  FiDatabase,
  FiBell,
  FiCompass,
  FiCheckCircle,
  FiArrowRight,
  FiAward,
  FiGlobe,
  FiTarget,
} from "react-icons/fi";
import { Link } from "react-router";

const About = () => {
  const [counts, setCounts] = useState({
    first: 0,
    second: 0,
    third: 0
  });
  const [isCounting, setIsCounting] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isCounting) {
          setIsCounting(true);
          startCounting();
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [isCounting]);

  const startCounting = () => {
    // First stat: 24/7
    let firstCount = 0;
    let secondCount = 0;
    let thirdCount = 0;

    const firstInterval = setInterval(() => {
      firstCount++;
      setCounts(prev => ({ ...prev, first: firstCount }));
      if (firstCount === 24) clearInterval(firstInterval);
    }, 80);

    const secondInterval = setInterval(() => {
      secondCount++;
      setCounts(prev => ({ ...prev, second: secondCount }));
      if (secondCount === 7) clearInterval(secondInterval);
    }, 200);

    const thirdInterval = setInterval(() => {
      thirdCount++;
      setCounts(prev => ({ ...prev, third: thirdCount }));
      if (thirdCount === 25) clearInterval(thirdInterval);
    }, 70);
  };

  const stats = [
    { 
      number: `${counts.first}/${counts.second}`, 
      label: "Real-time Sync",
      progress: Math.min(100, ((counts.first / 24) * 100 + (counts.second / 7) * 100) / 2),
      isComplete: counts.first === 24 && counts.second === 7
    },
    { 
      number: `${counts.third}+`, 
      label: "Integrated Tools",
      progress: Math.min(100, (counts.third / 25) * 100),
      isComplete: counts.third === 25
    },
  ];

  const differentiators = [
    {
      icon: <FiShield className="w-5 h-5" />,
      title: "Risk-first investment decisions",
      description: "Every campaign is paired with contextual risk signals—ranging from milestone burn-down tracking to community sentiment—so backers can support ideas with clarity, not guesswork.",
    },
    {
      icon: <FiTrendingUp className="w-5 h-5" />,
      title: "Creator growth companion",
      description: "Project owners unlock analytics, milestone roadmaps, tiered rewards, and compliance-friendly data capture that scales with them from idea to launch to repeat campaigns.",
    },
    {
      icon: <FiLayers className="w-5 h-5" />,
      title: "Unified funding workflows",
      description: "A single experience connects discovery, investing, wallet management, messaging, and after-care so the entire lifecycle stays on one platform.",
    },
  ];

  const investorJourney = [
    {
      step: "01",
      title: "Discover opportunities",
      copy: "Use dynamic search, curated collections, and risk overlays to surface projects that match your appetite for innovation and impact.",
    },
    {
      step: "02",
      title: "Due diligence in context",
      copy: "Dive into milestone roadmaps, projected rewards, and creator credibility signals captured through verification workflows and Firestore-backed profiles.",
    },
    {
      step: "03",
      title: "Fund with confidence",
      copy: "Secure, Firebase-authenticated flows guard every transaction while wallet integrations make deposits, withdrawals, and reinvestments effortless.",
    },
    {
      step: "04",
      title: "Stay in the loop",
      copy: "Real-time notifications, community updates, and milestone alerts ensure you always know how your backing is performing.",
    },
  ];

  const values = [
    {
      icon: <FiTarget className="w-5 h-5" />,
      title: "Radical Transparency",
      description: "Complete visibility into creator and investor data"
    },
    {
      icon: <FiUsers className="w-5 h-5" />,
      title: "Community First",
      description: "Features that celebrate progress, not just funding totals"
    },
    {
      icon: <FiAward className="w-5 h-5" />,
      title: "Responsible Innovation",
      description: "Aligned with regulatory best practices and ethical standards"
    },
    {
      icon: <FiGlobe className="w-5 h-5" />,
      title: "Global Access",
      description: "Democratizing investment opportunities worldwide"
    },
  ];

  const builderToolkit = [
    {
      icon: <FiDatabase className="w-5 h-5" />,
      title: "Data-rich profiles",
      body: "Creator dashboards sync with Firestore to store identity artifacts, funding history, and community engagement stats in one canonical record.",
    },
    {
      icon: <FiBell className="w-5 h-5" />,
      title: "Signal-aware outreach",
      body: "NotificationBell components broadcast campaign updates, investor Q&A, and milestone approvals without leaving the project workspace.",
    },
    {
      icon: <FiCompass className="w-5 h-5" />,
      title: "Guided launch playbooks",
      body: "From rewards configuration to compliance messaging, guided forms and validation utilities lower the barrier to launching responsibly.",
    },
  ];

  const roadmap = [
    {
      milestone: "Q4 2025",
      detail: "Deploy automated risk scoring that blends platform telemetry with third-party data feeds for even richer investor insights.",
    },
    {
      milestone: "Q1 2026",
      detail: "Introduce collaborative due diligence rooms where investors can annotate milestones, share research, and vote on creator requests.",
    },
    {
      milestone: "H1 2026",
      detail: "Expand multi-currency wallets and smart contract settlement options to unlock a broader global investor base.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section with Modern Layout */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex w-35 h-10 items-center gap-2 px-3 py-1 rounded-full text-xl font-medium bg-gray-100 text-gray-700 mb-2">
                <FiTrendingUp className="w-5 h-5 text-color-b" />
                About LAWATA
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Building the future of <span className="text-color-b">risk-integrated</span> crowdfunding
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                LAWATA fuses community-powered backing with institutional-grade risk intelligence. We're creating a trusted home where visionary builders meet discerning investors.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/manage" className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all text-sm flex items-center gap-2">
                  Explore Projects
                  <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/browse" className="px-6 py-3 bg-color-b text-white rounded-lg font-medium hover:bg-blue-900 transition-all text-sm">
                  Browse Projects
                </Link>
              </div>
            </div>

            {/* Stats Grid with Animation */}
            <div ref={statsRef} className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-white border h-60 flex flex-col justify-center items-center border-gray-200 rounded-lg p-6 text-center hover:border-gray-900 transition-all duration-200 relative overflow-hidden group"
                >
                  {/* Water Fill Effect */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-color-b transition-all duration-500 ease-out"
                    style={{ 
                      height: `${stat.progress}%`,
                      background: stat.isComplete 
                        ? 'linear-gradient(to top, rgba(37, 99, 235, 0.9) 0%, rgba(59, 130, 246, 0.95) 100%)'
                        : 'linear-gradient(to top, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.3) 100%)'
                    }}
                  />
                  
                  {/* Ripple Effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, rgba(37, 99, 235, 0.1) 0%, transparent 70%)`
                    }}
                  />
                  
                  <div className="relative z-10">
                    <div className={`text-4xl font-bold mb-2 transition-all duration-300 group-hover:scale-110 ${
                      stat.isComplete ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stat.number}
                    </div>
                    <div className={`text-base font-medium ${
                      stat.isComplete ? 'text-white' : 'text-gray-600'
                    }`}>
                      {stat.label}
                    </div>
                  </div>

                  {/* Water Surface Effect */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-blue-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ top: `${100 - stat.progress}%` }}
                  />

                  {/* Completion Glow Effect */}
                  {stat.isComplete && (
                    <div className="absolute inset-0 rounded-lg bg-blue-500/10 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators - Modern Card Grid */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl font-semibold text-gray-900 mb-3">Why LAWATA Stands Out</h2>
            <p className="text-sm text-gray-600">
              We're redefining crowdfunding through intelligent risk assessment and comprehensive creator support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {differentiators.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-900 transition-all duration-200 group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-lg mb-4 group-hover:scale-105 transition-transform duration-200">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl font-semibold text-gray-900">Why risk intelligence matters</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Impactful crowdfunding demands more than enthusiasm. LAWATA weaves together analytics from components like ProjectAnalytics,
                MilestoneRoadmap, RewardsList, and Wallet management to surface the real-time health of every campaign.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                The result is a transparent ecosystem that rewards creators who plan responsibly while empowering investors to diversify with confidence.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((value, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-900 transition-all duration-200">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg text-gray-900 mb-3">
                    {value.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-xs text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Investor Journey - Modern Timeline */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your investment journey, simplified
            </h2>
            <p className="text-lg text-gray-600">
              Whether you're scanning for emerging ventures or backing seasoned founders, LAWATA keeps the process simple, secure, and insight-rich.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-color-b transform -translate-x-1/2"></div>
            
            <div className="space-y-12 lg:space-y-0">
              {investorJourney.map((item, index) => (
                <div 
                  key={index}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'}`}>
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-color-b text-white rounded-xl text-sm font-bold">
                          {item.step}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.copy}</p>
                    </div>
                  </div>

                  {/* Step Indicator */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-4 h-4 bg-color-b border-white shadow-lg"></div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 lg:opacity-0"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Creator Toolkit */}
      <section className="py-16 lg:py-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl font-semibold text-gray-900">Creator Toolkit</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Launching a campaign is more than publishing a pitch. LAWATA equips builders with workflows that raise the signal-to-noise ratio
                and steward every backer relationship.
              </p>
              
              <div className="space-y-4">
                {builderToolkit.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-900 transition-all duration-200">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg text-gray-900 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
              <h3 className="text-3xl font-semibold text-gray-900 mb-4">Powered by Modern Technology</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">React 18 + Vite for lightning-fast interface updates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Firebase Authentication, Firestore, and Storage securing profiles, funding data, and media uploads.</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Tailwind-inspired utility styling with bespoke palettes for consistent branding.</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">GSAP-powered motion for immersive onboarding and campaign storytelling.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-16 lg:py-24 bg-color-e">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Investment Journey?
          </h2>
          <p className="text-gray-300 text-sm lg:text-base mb-8 max-w-2xl mx-auto">
            Join thousands of investors and creators who trust LAWATA for transparent, risk-aware crowdfunding.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/manage" className="px-8 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm flex items-center justify-center gap-2">
              Create Projects
              <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/browse" className="px-8 py-3 bg-color-b text-white rounded-lg font-medium hover:bg-blue-900 transition-all text-sm">
              Browse Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;