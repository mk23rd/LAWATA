import React, { useState, useEffect, useRef } from 'react'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { Link } from 'react-router-dom' // Import Link
import HomeLogo from '../components/HomeLogo'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase/firebase-config'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import Navbar from '../components/NavBar';
import { Draggable } from "gsap/Draggable";

import Arrow from "../assets/images/arrow-left.svg"


// Landing page showcasing the brand hero, featured projects, and marketing sections
const Home = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const user = auth.currentUser
  // Recently approved projects for the carousel
  const [freshProjects, setFreshProjects] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data())
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }

    fetchUserData()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const twoHundredRef = useRef(null);

  useEffect(() => {
  if (twoHundredRef.current) {
    const st = ScrollTrigger.create({
      trigger: twoHundredRef.current,
      start: "top top",
      end: "bottom+=0% top",
      pin: true,
      pinSpacing: true,
      scrub: true,
    });

    // Cleanup on unmount
    return () => {
      st.kill(); // Kill the specific ScrollTrigger instance
    };
  }
}, []);

useEffect(() => {
  const fetchFreshProjects = async () => {
    try {
      const projectsRef = collection(db, "projects");
      const q = query(
        projectsRef,
        // Only show projects that have passed moderation
        where("status", "==", "Approved"),
        orderBy("createdAt", "desc"),
        limit(7)
      );
      const querySnapshot = await getDocs(q);
      const projectsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Populate state for downstream rendering
      setFreshProjects(projectsData);
    } catch (error) {
      console.error("Error fetching fresh projects:", error);
    }
  };

  fetchFreshProjects();
}, []);

const freshContainerRef = useRef(null);

const scrollLeft = () => {
  // Scroll the carousel to reveal previous cards
  freshContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
};

const scrollRight = () => {
  // Scroll the carousel to reveal next cards
  freshContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
};





/* useEffect(() => {
  const handleClickOutside = (event) => {
    // close user dropdown when clicking outside .user-dropdown
    if (!event.target.closest('.user-dropdown')) {
      setShowDropdown(false);
    }

    // close mobile nav dropdown when clicking outside .nav-dropdown and outside the hamburger button (.nav-hamburger)
    if (!event.target.closest('.nav-dropdown') && !event.target.closest('.nav-hamburger')) {
      setShowNavDropdown(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []); */


  

  return (
    <div className='bg-white overflow-x-clip'>
      <Navbar />

      <div ref={twoHundredRef} className='flex flex-col justify-center items-center w-screen h-screen pt-30'>
        <main className='w-full  h-3/5 gap-5 flex items-center justify-center'>
          <div className='bg-white w-2/20 h-full'></div>
            <HomeLogo />
          <div className='bg-white w-2/20 h-full'></div>
        </main>

        <div className='w-screen h-1/5 flex items-center pt-25'>
          <div className=' w-0/10 h-full lg:w-2/10'></div>
          <div className=' w-10/10 h-full flex items-center lg:justify-start justify-center'>
                <p className='sm:text-3xl md:text-3xl lg:text-4xl text-2xl text-center lg:text-start pt-30 lg:pt-0 text-color-e font-medium lg:font-light'>Crowdfunding Meets Risk Intelligence - Where Every Investment <br /> is an Informed Decision</p>
          </div>       
        </div>
      </div>

      <div className="h-screen w-screen flex flex-col">
  {/* Navbar */}
  <nav className="h-16 md:h-20"></nav>

  {/* Main */}
  <main className="flex-1 flex flex-col gap-8 md:gap-12 lg:gap-16 px-4 md:px-8 lg:px-12">
    
    {/* Header Row */}
    <div className="flex items-center justify-center mx-5 mt-15 lg:mt-5">
      {/* Title */}
      <div className="w-1/2 flex items-center justify-start">
        <p className="text-color-e text-3xl sm:text-3xl md:text-4xl lg:text-5xl underline">
          Fresh Favorites
        </p>
      </div>

      {/* Scroll Buttons */}
      <div className="w-1/2 flex justify-end items-center gap-3 lg:px-0">
        <button
          onClick={scrollLeft}
          className="hover:bg-color-a border-2 md:border-3 hover:text-color-d text-color-a border-color-a w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
        >
          <img src={Arrow} alt="Scroll Left" className='w-3'/>
        </button>
        <button
          onClick={scrollRight}
          className="hover:bg-color-a border-2 md:border-3 hover:text-color-d text-color-a border-color-a w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center rotate-180"
        >
          <img src={Arrow} alt="Scroll Right" className='w-3'/>
        </button>
      </div>
    </div>

    {/* Projects Scroll Section */}
    <div className="relative flex-1 w-full">
      <div
        ref={freshContainerRef}
        className="flex overflow-x-auto gap-4 scrollbar-hide py-4 px-[5vw] w-full"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {freshProjects.length > 0 ? (
          freshProjects.map((project) => {
            const fundedPercentage =
              project.fundedMoney && project.fundingGoal
                ? Math.min((project.fundedMoney / project.fundingGoal) * 100, 100)
                : 0;

            const amountLeft =
              project.fundingGoal - (project.fundedMoney || 0);

            const endDate =
              project.endDate instanceof Timestamp
                ? project.endDate.toDate()
                : project.endDate
                ? new Date(project.endDate)
                : null;

            const daysLeft = endDate
              ? Math.max(
                  Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)),
                  0
                )
              : "N/A";

            const isFullyFunded = fundedPercentage >= 100;

            return (
              <Link
                to={`/projectDet/${project.id}`}
                key={project.id}
                className="flex-shrink-0 w-4/5 sm:w-2/3 md:w-1/2 lg:w-1/4 scroll-snap-align-start"
              >
                <div className="bg-color-e rounded-xl p-4 flex flex-col gap-3 items-center hover:shadow-lg transition-shadow relative">
                  
                  <img
                    src={project.imageUrl || "/placeholder.png"}
                    alt={project.title}
                    className="w-full h-40 md:h-48 lg:h-56 object-cover rounded-lg mb-2 z-10"
                  />

                  {/* Progress Bar */}
                  <div className="w-full mb-2 z-10">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFullyFunded
                            ? "bg-green-500"
                            : "bg-gradient-to-r from-color-b to-cyan-500"
                        }`}
                        style={{ width: `${fundedPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-color-d w-full">
                      <span>{Math.round(fundedPercentage)}% funded</span>
                      <span>{daysLeft} days left</span>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-color-d font-medium text-base md:text-lg truncate mb-1 z-10">
                    {project.title}
                  </p>

                  {/* Funding left */}
                  {!isFullyFunded && (
                    <p className="text-xs text-color-d mb-2 z-10">
                      {amountLeft > 0
                        ? `$${amountLeft.toLocaleString()} to go`
                        : "Goal reached!"}
                    </p>
                  )}

                  {/* Vertical Line Accent */}
                  <div className="absolute -top-10 left-1/2 h-[115%] w-[3px] bg-color-e pointer-events-none z-0"></div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-color-e ml-4">No projects yet</p>
        )}
      </div>

      {/* Fade Effects */}
      <div className="absolute top-0 left-0 h-full w-5 sm:w-8 md:w-10 lg:w-10 bg-white pointer-events-none z-10"></div>
      <div className="absolute top-0 right-0 h-full w-5 sm:w-8 md:w-10 lg:w-10 bg-white pointer-events-none z-10"></div>
    </div>
  </main>
</div>


      {/* Statistics Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center px-4">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 animate-fade-in-up">
            Join the Future of
            <span className="bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent"> Crowdfunding</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Where innovative ideas meet intelligent investment decisions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative z-10">
          <div className="text-center animate-fade-in-up animation-delay-300">
            <div className="text-4xl md:text-6xl font-bold text-white mb-2">500+</div>
            <div className="text-gray-300 text-sm md:text-lg">Projects Funded</div>
          </div>
          <div className="text-center animate-fade-in-up animation-delay-400">
            <div className="text-4xl md:text-6xl font-bold text-white mb-2">$2M+</div>
            <div className="text-gray-300 text-sm md:text-lg">Total Raised</div>
          </div>
          <div className="text-center animate-fade-in-up animation-delay-500">
            <div className="text-4xl md:text-6xl font-bold text-white mb-2">10K+</div>
            <div className="text-gray-300 text-sm md:text-lg">Active Users</div>
          </div>
          <div className="text-center animate-fade-in-up animation-delay-600">
            <div className="text-4xl md:text-6xl font-bold text-white mb-2">95%</div>
            <div className="text-gray-300 text-sm md:text-lg">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        <div className="relative z-10 text-center px-4 mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Why Choose <span className="text-yellow-300">LAWATA</span>?
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Experience the next generation of crowdfunding with AI-powered risk assessment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10 max-w-6xl mx-auto px-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Smart Risk Analysis</h3>
            <p className="text-gray-200">AI-powered algorithms analyze project viability and provide intelligent risk assessments</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
            <p className="text-gray-200">Get instant funding decisions and real-time project updates with our advanced platform</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Secure & Trusted</h3>
            <p className="text-gray-200">Bank-level security with blockchain technology ensuring safe and transparent transactions</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        <div className="relative z-10 text-center px-4 mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            What Our <span className="text-cyan-400">Community</span> Says
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 max-w-6xl mx-auto px-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Alex Chen</h4>
                <p className="text-gray-300 text-sm">Project Creator</p>
              </div>
            </div>
            <p className="text-gray-200 italic">"LAWATA helped me raise $50K for my tech startup in just 2 weeks. The risk analysis gave investors confidence in my project."</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Maria Rodriguez</h4>
                <p className="text-gray-300 text-sm">Investor</p>
              </div>
            </div>
            <p className="text-gray-200 italic">"The AI risk assessment is incredible. I've made 3 successful investments with 200% returns. LAWATA changed my investment game!"</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 hover:bg-opacity-20 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">James Wilson</h4>
                <p className="text-gray-300 text-sm">Entrepreneur</p>
              </div>
            </div>
            <p className="text-gray-200 italic">"The platform is intuitive and the community is amazing. I found both funding and mentorship here. Highly recommended!"</p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="h-screen w-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 flex flex-col justify-center items-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        <div className="relative z-10 text-center px-4">
          <h2 className="text-4xl md:text-7xl font-bold text-white mb-8">
            Ready to <span className="text-black">Launch</span>?
          </h2>
          <p className="text-xl md:text-2xl text-gray-100 mb-12 max-w-3xl mx-auto">
            Join thousands of creators and investors building the future together
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link 
              to="/projects" 
              className="bg-white text-black px-8 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              Start Creating
            </Link>
            <Link 
              to="/browse" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-white hover:text-black transition-all duration-300 hover:scale-105"
            >
              Explore Projects
            </Link>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-yellow-300 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-3 h-3 bg-pink-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 w-5 h-5 bg-cyan-300 rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}

export default Home