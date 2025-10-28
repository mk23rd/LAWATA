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

  { id: "users", display: "100+", label: "Active Users", percent: 60, numeric: 100, format: (n) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`), suffix: "+" },

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

  const formatTimeLeft = (totalDays) => {
    const d = Math.max(Number(totalDays) || 0, 0);
    if (d === 0) return '0 days';
    const years = Math.floor(d / 365);
    const remAfterYears = d % 365;
    const months = Math.floor(remAfterYears / 30);
    const days = remAfterYears % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    return parts.join(', ');
  };

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

  const container = statsContainerRef.current;

  const resetZero = () => {
    barRefs.current.forEach((el) => el && gsap.set(el, { y: 0 }));
    textRefs.current.forEach((el, i) => {
      const s = stats[i];
      if (!el) return;
      if (s.suffix === "%") el.innerText = "0%";
      else if (s.format) el.innerText = s.format(0) + (s.suffix || "");
      else el.innerText = "0" + (s.suffix || "");
    });
  };

  const buildTimeline = () => {
    const tl = gsap.timeline();
    const containerHeight = container.clientHeight || 0;

    stats.forEach((s, i) => {
      const barEl = barRefs.current[i];
      const barHeight = barEl ? barEl.offsetHeight : 0;
      const targetTop = containerHeight * (s.percent / 100);
      const targetY = -(targetTop - barHeight);

      tl.to(barEl, { y: targetY, duration: 3.2, ease: "power3.out" }, i * 0.12);

      const obj = { val: 0 };
      tl.to(
        obj,
        {
          val: s.numeric,
          duration: 3.2,
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

    return tl;
  };

  let tl = null;

  const st = ScrollTrigger.create({
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    onEnter: () => {
      if (tl) {
        try { tl.kill(); } catch {}
      }
      resetZero();
      tl = buildTimeline();
    },
    onEnterBack: () => {
      if (tl) {
        try { tl.kill(); } catch {}
      }
      resetZero();
      tl = buildTimeline();
    },
    onLeave: () => {
      if (tl) {
        try { tl.kill(); } catch {}
        tl = null;
      }
    },
    onLeaveBack: () => {
      if (tl) {
        try { tl.kill(); } catch {}
        tl = null;
      }
    },
    // markers: true, // enable for debug
  });

  return () => {
    try {
      if (tl) tl.kill();
    } catch {}
    try {
      st.kill();
    } catch {}
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
    initial: "https://images.pexels.com/photos/9351804/pexels-photo-9351804.jpeg",
    name: "Ephrata Mekbib",
    role: "Project Creator",
    quote:
      '“LAWATA helped me raise 50K for my tech startup in just 2 weeks. The risk analysis gave investors confidence in my project.”',
  },
  {
    initial: "https://images.pexels.com/photos/7345675/pexels-photo-7345675.jpeg",
    name: "Samuel Kidanu",
    role: "Investor",
    quote:
      '“The AI risk assessment is incredible. I\'ve made 3 successful investments with 200% returns. LAWATA changed my investment game!”',
  },
  {
    initial: "https://images.pexels.com/photos/8197946/pexels-photo-8197946.jpeg",
    name: "Mideksa Lafto",
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
                <p className='sm:text-3xl md:text-3xl lg:text-4xl text-2xl text-center lg:text-start pt-15 lg:pt-0 text-color-e font-medium lg:font-light'>Crowdfunding Meets Risk Intelligence - Where Every Funding <br /> is an Informed Decision</p>
          </div>       
        </div>
      </div>

  <div className="w-screen flex flex-col">


  {/* Main */}
  <main className="flex flex-col gap-8 md:gap-12 lg:gap-16 px-4 md:px-8 lg:px-12">
    
    {/* Header Row - Mobile */}
    <div className="flex md:hidden items-center justify-between mx-5 mt-15">
      <button
        onClick={scrollLeft}
        className="hover:bg-color-a border-2 hover:text-color-d text-color-a border-color-a w-10 h-10 rounded-full flex items-center justify-center"
      >
        <img src={Arrow} alt="Scroll Left" className='w-3'/>
      </button>
      <p className="text-color-e text-3xl underline text-center">Fresh Favorites</p>
      <button
        onClick={scrollRight}
        className="hover:bg-color-a border-2 hover:text-color-d text-color-a border-color-a w-10 h-10 rounded-full flex items-center justify-center rotate-180"
      >
        <img src={Arrow} alt="Scroll Right" className='w-3'/>
      </button>
    </div>

    {/* Header Row - Desktop/Tablet */}
    <div className="hidden md:flex items-center justify-center mx-5 mt-15 lg:mt-5 ">
      {/* Title */}
      <div className="w-1/3 flex items-center justify-start">
        <p className="text-color-e text-3xl sm:text-3xl md:text-4xl lg:text-5xl underline">
          Fresh Favorites
        </p>
      </div>

      {/* Explore More (center, desktop only) */}
      <div className="w-1/3 flex items-center justify-center">
        <Link to="/browse" className="bg-blue-600 hover:bg-blue-700 border-3 border-color-a text-white rounded-xl w-40 h-12 justify-center items-center flex text-xl sm:text-2xl md:text-3xl lg:text-3xl z-10">
          Explore More
        </Link>
        <div className='w-0.5 h-20 bg-color-a absolute'></div>
      </div>

      {/* Scroll Buttons */}
      <div className="w-1/3 flex justify-end items-center gap-3 lg:px-0">
        <button
          onClick={scrollLeft}
          className="hover:bg-color-a border-2 md:border-3 hover:text-color-d text-color-a border-color-a w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center"
        >
          <img src={Arrow} alt="Scroll Left" className='w-3'/>
        </button>
        <button
          onClick={scrollRight}
          className="hover:bg-color-a border-2 md:border-3 hover:text-color-d text-color-a border-color-a w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center rotate-180 "
        >
          <img src={Arrow} alt="Scroll Right" className='w-3'/>
        </button>
      </div>
    </div>

    {/* Projects Scroll Section */}
    <div className="relative w-full">
      <div
        ref={freshContainerRef}
        className="flex overflow-x-auto gap-4 scrollbar-hide py-4 px-[5vw] w-full"
        style={{ scrollSnapType: "x mandatory", overscrollBehaviorX: "contain", touchAction: "pan-y" }}
        onWheel={(e) => {
          // Only consume horizontal-intent gestures; let vertical scrolling bubble to the page
          const absX = Math.abs(e.deltaX);
          const absY = Math.abs(e.deltaY);
          if (absX > absY) {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaX;
          }
        }}
      >
        {freshProjects.some((project) => {
          const fundedPercentage =
            project.fundedMoney && project.fundingGoal
              ? (project.fundedMoney / project.fundingGoal) * 100
              : 0;
          return fundedPercentage < 100;
        }) ? (
          freshProjects
            .filter((project) => {
              const fundedPercentage =
                project.fundedMoney && project.fundingGoal
                  ? (project.fundedMoney / project.fundingGoal) * 100
                  : 0;
              return fundedPercentage < 100;
            })
            .map((project) => {
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
                  <div className="w-full mb-2 z-10 ">
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
                      <span>{typeof daysLeft === 'number' ? `${formatTimeLeft(daysLeft)} left` : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-color-d font-medium text-base md:text-lg truncate mb-1 z-10">
                    {project.title}
                  </p>

                  {/* Funding left */}
                  {!isFullyFunded && (
                    <p className="text-xs text-color-d mb-2 z-10 ">
                      {amountLeft > 0
                        ? `$${amountLeft.toLocaleString()} to go`
                        : "Goal reached!"}
                    </p>
                  )}

                  {/* Vertical Line Accent */}
                  <div className="absolute -top-10 left-1/2 h-[115%] w-[3px] bg-color-e pointer-events-none z-0 "></div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-color-e ml-4 ">No projects yet</p>
        )}
      </div>

      {/* Fade Effects */}
      <div className="absolute top-0 left-0 h-90 md:h-full w-5 sm:w-8 md:w-10 lg:w-10 bg-white pointer-events-none z-10"></div>
      <div className="absolute top-0 right-0 h-90 md:h-full w-5 sm:w-8 md:w-10 lg:w-10 bg-white pointer-events-none z-10"></div>
    </div>

    {/* Explore More CTA - Mobile only */}
    <div className="w-full flex justify-center mt-7 md:hidden">
      <Link
        to="/browse"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-xl rounded-xl font-semibold shadow-sm transition-colors"
      >
        Explore More
      </Link>
    </div>
  </main>
</div>


      {/* Statistics Section */}
      <div className="h-screen w-screen flex flex-col justify-center items-center relative overflow-hidden md:mt-15">
        <div className='w-full h-1/5 flex flex-col items-center'>
          <h2 className="text-4xl md:text-6xl font-bold text-color-a mb-5 md:mt-5 animate-fade-in-up">
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
          className="relative w-11/12 h-3/5 md:h-4/5 flex justify-center items-end gap-7 mb-5 md:gap-38 lg:gap-48 z-10 md:mt-10"
        >

          {stats.map((s, i) => (
            <div key={s.id} className="relative text-center w-40 h-full overflow-hidden">
              {/* Behind-rectangle vertical line, full container (y-axis) height */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-color-e z-0"></div>
              <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-center">
                <div
                  ref={(el) => setBarRef(el, i)}
                  className="w-30 h-30 ml-2 mr-2 border-4 flex flex-col items-center justify-center relative z-10"
                  style={{
                    background: "#1C5EDD",
                  }}
                >
                  <div
                    ref={(el) => setTextRef(el, i)}
                    className="text-3xl mt-5 md:text-5xl font-bold text-white leading-none"
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

        <div className="w-85 md:w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-0 lg:mt-10">
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
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-color-b overflow-hidden flex items-center justify-center mr-4">
                    <img src={t.initial} alt={t.name} className="w-full h-full object-cover" />
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
      <div className="h-screen w-screen flex flex-col md:flex-row">
        {/* Left side */}
        <Link to="/manage" className="group relative md:w-1/2 w-full h-1/2 md:h-full overflow-hidden cursor-pointer border-t-4 border-r-3">
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
        className="mt-8 inline-block bg-white text-black px-8 py-3 rounded-full font-semibold shadow-lg transform transition-all duration-300 md:opacity-0 md:translate-y-4 group-hover:md:opacity-100 group-hover:md:translate-y-0"
        >
        Manage Your Projects
        </Link>
        </div>
        </Link>


        {/* Right side */}
        <Link to="/browse" className="group relative md:w-1/2 w-full h-1/2 md:h-full overflow-hidden cursor-pointer border-t-4 border-l-3">
        <img
        src={ImageRight} /* replace with your right image path */
        alt="Right"
        className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-600 ease-out group-hover:scale-120"
        />


        <div className="absolute inset-0 bg-opacity-25 transition-opacity duration-300 group-hover:bg-opacity-40"></div>


        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 mt-20">
        <h3 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">Discover & Crowdfund</h3>
        <p className="mt-4 text-sm md:text-xl text-white/90 max-w-xs">Explore rising creators and join their journeys.</p>


        <Link
        to="/browse"
        className="mt-8 inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg transform transition-all duration-300 md:opacity-0 md:translate-y-4 group-hover:md:opacity-100 group-hover:md:translate-y-0"
        >
        Explore Projects
        </Link>
        </div>
        </Link>
      </div>
    </div>
  )
}

export default Home