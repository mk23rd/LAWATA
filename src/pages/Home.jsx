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
import { FiChevronUp, FiChevronRight } from "react-icons/fi";
import ImageLeft from "../assets/images/Home/pexels-olly-3771045.jpg"
import ImageRight from "../assets/images/Home/pexels-diohasbi-3280130.jpg"


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

  const statsContainerRef = useRef(null);
  const barRefs = useRef([]);
  const textRefs = useRef([]);

  const setBarRef = (el, i) => (barRefs.current[i] = el);
  const setTextRef = (el, i) => (textRefs.current[i] = el);

  // place this INSIDE the Home component function, before the useEffect that uses it
const stats = [
  { id: "projects", display: "50+", label: "Projects Funded", percent: 40, numeric: 20, suffix: "+" },
  
  {
    id: "raised",
    display: "$1M+",
    label: "Total Raised",
    percent: 85,
    numeric: 1000000,
    format: (n) => {
      if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
      if (n >= 1000) return `$${Math.round(n / 1000)}K`;
      return `$${Math.round(n)}`;
    },
    suffix: "+",
  },

  { id: "users", display: "1K+", label: "Active Users", percent: 60, numeric: 1000, format: (n) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`), suffix: "+" },

  { id: "rate", display: "95%", label: "Success Rate", percent: 48, numeric: 48, suffix: "%" },
];


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

  // const toggleDropdown = () => {
  //   setShowDropdown(!showDropdown)
  // }

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

useEffect(() => {
  if (!statsContainerRef.current) return;

  // initial zero state
  barRefs.current.forEach((el) => el && gsap.set(el, { height: "0%" }));
  textRefs.current.forEach((el, i) => {
    const s = stats[i];
    if (!el) return;
    if (s.suffix === "%") el.innerText = "0%";
    else if (s.format) el.innerText = s.format(0) + (s.suffix || "");
    else el.innerText = "0" + (s.suffix || "");
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: statsContainerRef.current,
      start: "top 80%",
      toggleActions: "play none none none",
      // markers: true, // enable to debug
    },
  });

  stats.forEach((s, i) => {
    // bar grow
    tl.to(
      barRefs.current[i],
      { height: `${s.percent}%`, duration: 1.2, ease: "power3.out" },
      i * 0.12
    );

    // count-up
    const obj = { val: 0 };
    tl.to(
      obj,
      {
        val: s.numeric,
        duration: 1.2,
        ease: "power1.out",
        onUpdate: () => {
          const el = textRefs.current[i];
          if (!el) return;
          if (s.suffix === "%") el.innerText = Math.round(obj.val) + "%";
          else if (s.format) el.innerText = s.format(obj.val) + (s.suffix || "");
          else el.innerText = Math.round(obj.val) + (s.suffix || "");
        },
      },
      i * 0.12
    );
  });

  return () => {
    try {
      if (tl && tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    } catch (e) {
      // ignore
    }
  };
}, []);





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

// add this near your stats array
const yTicks = [0, 25, 50, 75, 100]; // adjust values if you want different divisions

const testimonials = [
  {
    initial: "A",
    name: "Alex Chen",
    role: "Project Creator",
    quote:
      '“LAWATA helped me raise $50K for my tech startup in just 2 weeks. The risk analysis gave investors confidence in my project.”',
  },
  {
    initial: "M",
    name: "Maria Rodriguez",
    role: "Investor",
    quote:
      '“The AI risk assessment is incredible. I\'ve made 3 successful investments with 200% returns. LAWATA changed my investment game!”',
  },
  {
    initial: "J",
    name: "James Wilson",
    role: "Entrepreneur",
    quote:
      '“The platform is intuitive and the community is amazing. I found both funding and mentorship here. Highly recommended!”',
  },
];

  

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
                <p className='sm:text-3xl md:text-3xl lg:text-4xl text-2xl text-center lg:text-start pt-30 lg:pt-0 text-color-e font-medium lg:font-light'>Crowdfunding Meets Risk Intelligence - Where Every Funding <br /> is an Informed Decision</p>
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
      <div className="h-screen w-screen bg-white flex flex-col justify-center items-center relative overflow-hidden">
        <div className='w-full h-1/5 flex flex-col items-center'>
          <h2 className="text-4xl md:text-6xl font-bold text-color-a mb-5 mt-5 animate-fade-in-up">
            Join the Future of
            <span className="bg-color-a bg-clip-text text-transparent"> Crowdfunding</span>
          </h2>
          <p className="text-xl md:text-2xl text-color-e mb-12 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Where innovative ideas meet intelligent investment decisions
          </p>
        </div>

        {/* ====== Animated Stats Container (uses GSAP + ScrollTrigger) ====== */}
        <div
          ref={statsContainerRef}
          className="relative w-11/12 h-4/5 flex justify-center items-end gap-10 mb-5 md:gap-38 lg:gap-48 z-10 border-b-6 border-l-6"
        >
          {/* Arrow on top-left of the Y-axis */}
          <FiChevronUp
            className="absolute text-color-a"
            style={{
              top: '-25px',
              left: '-35px',
              fontSize: '4rem',
            }}
          />

          {/* Arrow on bottom-right of the X-axis */}
          <FiChevronRight
            className="absolute text-color-a"
            style={{
              right: '-25px',
              bottom: '-35px',
              fontSize: '4rem',
            }}
          />

          {stats.map((s, i) => (
            <div key={s.id} className="relative text-center w-40 h-full overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-center">
                <div
                  ref={(el) => setBarRef(el, i)}
                  className="md:w-40 border-t-4 border-r-4 border-l-4 w-20 ml-2 mr-2"
                  style={{
                    background: "#1C5EDD",
                    height: "0%",
                  }}
                >
                  <div
                    ref={(el) => setTextRef(el, i)}
                    className="text-3xl mt-5 md:text-6xl font-bold text-white leading-none"
                  >
                    {s.display}
                  </div>
                  <div className="text-gray-300 text-sm md:text-lg">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>

      {/* Testimonials Section */}
      <div className="min-h-screen w-screen bg-white flex flex-col items-center py-12 px-4">
        <div className="relative max-w-6xl w-full text-center mb-12 mt-0 lg:mt-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-color-a">
            What Our <span className="text-color-a">Community</span> Says
          </h2>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-0 lg:mt-10">
          {testimonials.map((t, i) => (
            <article
              key={i}
              tabIndex={0}
              aria-labelledby={`testi-${i}-name`}
              className="group relative rounded-2xl p-6 sm:p-8 bg-color-e bg-opacity-10 backdrop-blur-lg transition-all duration-300 hover:bg-opacity-20 focus:outline-none focus:ring-4 focus:ring-color-e/40 transform hover:scale-[1.012] focus:scale-[1.012]"
              style={{ minHeight: 220 }}
            >
              {/* Centered vertical bar (visible and full height) */}
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="h-75 w-1 bg-color-e"></div>
              </div>

              {/* Foreground content */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-color-b flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">{t.initial}</span>
                  </div>

                  <div className="min-w-0">
                    <h4
                      id={`testi-${i}-name`}
                      className="text-white font-semibold text-lg sm:text-xl truncate"
                    >
                      {t.name}
                    </h4>
                    <p className="text-white text-sm opacity-90">{t.role}</p>
                  </div>
                </div>

                <p className="text-white italic text-base sm:text-lg leading-relaxed max-w-prose">
                  {t.quote}
                </p>

                {/* optional CTA area (keeps spacing consistent on short quotes) */}
                <div className="mt-auto pt-4">
                  {/* placeholder for possible rating / date / link */}
                  <span className="text-xs text-white/60">Verified member</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="h-screen w-screen flex">
        {/* Left side */}
        <Link to="/manage" className="group relative w-1/2 overflow-hidden cursor-pointer border-t-4 border-r-3">
        {/* Image (covers the half) */}
        <img
        src={ImageLeft} /* replace with your left image path */
        alt="Left"
        className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-600 ease-out group-hover:scale-120"
        />


        {/* dim overlay so center text is readable */}
        <div className="absolute inset-0 bg-opacity-30 transition-opacity duration-300 group-hover:bg-opacity-40"></div>


        {/* Center content for this half (hidden link shown on hover) */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 mt-20">
        <h3 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">Create & Build</h3>
        <p className="mt-4 text-sm md:text-xl text-white/90 max-w-xs">Manage your ideas, teams and funding in one place.</p>


        {/* the CTA is initially hidden and revealed when hovering the half */}
        <Link
        to="/manage"
        className="mt-8 inline-block bg-white text-black px-8 py-3 rounded-full font-semibold shadow-lg transform transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
        >
        Manage Your Projects
        </Link>
        </div>


        {/* decorative accent (optional) */}
        <div className="absolute bottom-6 left-6 w-3 h-3 bg-white rounded-full animate-pulse opacity-80"></div>
        </Link>


        {/* Right side */}
        <Link to="/browse" className="group relative w-1/2 overflow-hidden cursor-pointer border-t-4 border-l-3">
        <img
        src={ImageRight} /* replace with your right image path */
        alt="Right"
        className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-600 ease-out group-hover:scale-120"
        />


        <div className="absolute inset-0 bg-opacity-25 transition-opacity duration-300 group-hover:bg-opacity-40"></div>


        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 mt-20">
        <h3 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">Discover & Invest</h3>
        <p className="mt-4 text-sm md:text-xl text-white/90 max-w-xs">Explore rising creators and join their journeys.</p>


        <Link
        to="/browse"
        className="mt-8 inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg transform transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
        >
        Explore Projects
        </Link>
        </div>


        <div className="absolute top-8 right-8 w-4 h-4 bg-yellow-300 rounded-full animate-bounce opacity-80"></div>
        </Link>
      </div>
    </div>
  )
}

export default Home