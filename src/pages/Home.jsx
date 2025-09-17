import React, { useState, useEffect, useRef } from 'react'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { Link } from 'react-router-dom' // Import Link
import HomeLogo from '../components/homeLogo'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase/firebase-config'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { collection, getDocs, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import NotificationBell from "../components/NotificationBell";
import { Draggable } from "gsap/Draggable";
import { Timestamp } from 'firebase/firestore';

import Arrow from "../assets/images/arrow-left.svg"

const Home = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const user = auth.currentUser
  const [freshProjects, setFreshProjects] = useState([]);

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
      // notification dropdown handled in component
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
      end: "bottom+=200% top",
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
      const q = query(projectsRef, orderBy("createdAt", "desc"), limit(7));
      const querySnapshot = await getDocs(q);
      const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFreshProjects(projectsData);
    } catch (error) {
      console.error("Error fetching fresh projects:", error);
    }
  };

  fetchFreshProjects();
}, []);

const freshContainerRef = useRef(null);

const scrollLeft = () => {
  freshContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
};

const scrollRight = () => {
  freshContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
};

gsap.registerPlugin(Draggable);

useEffect(() => {
  if (freshContainerRef.current) {
    Draggable.create(freshContainerRef.current, {
      type: "x",
      edgeResistance: 0.8,
      inertia: true
    });
  }
}, []);

  

  return (
    <div className='bg-color-d overflow-x-clip'>
      <nav className='fixed top-0 left-0 w-screen h-20 z-50 flex items-center'>
        <div className='w-1/6 h-full flex justify-center items-center'>
          <p className='font-titan text-5xl text-color-b pointer-events-none'>LAWATA</p>
        </div>

        <div className='w-4/6 h-full flex justify-center items-center'>
          <div className='bg-color-e rounded-2xl w-2xl h-13 gap-40 flex items-center justify-evenly'>
            <Link to="/projects" className='text-color-d text-2xl hover:underline'>Create</Link>
            <Link to="/browse" className='text-color-d text-2xl hover:underline'>Browse Works</Link>
            <Link to="/about" className='text-color-d text-2xl hover:underline'>About</Link>
          </div>
        </div>

        <div className='w-1/6 h-full flex justify-end items-center gap-3 pr-4'>
          <NotificationBell />

          {/* User Profile Dropdown */}
          <div className="relative user-dropdown">
          {/* User Profile Dropdown */}
  <button 
    onClick={toggleDropdown}
    className='bg-color-e rounded-2xl w-35 h-10 flex items-center justify-center text-color-d font-medium hover:bg-opacity-90 transition-colors px-4 truncate'
  >
    {userData?.username || user?.email || 'User'}
  </button>
  
  {showDropdown && (
    <div className="absolute right-0 mt-2 w-48 bg-color-e rounded-md shadow-lg z-10">
      <div className="py-1">
        {user ? (
          <>
            {/* If user IS logged in */}
            <div className="px-4 py-2 text-sm text-color-d border-b border-color-d border-opacity-20">
              <p className="font-medium truncate">{userData?.username || 'User'}</p>
              <p className="truncate text-opacity-80">{user?.email}</p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
            >
              Profile
            </button>
            <button
              onClick={() => navigate("/projects")}
              className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
            >
              Projects
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {/* If user is NOT logged in */}
<button
  onClick={() => navigate("/signing", { state: { panel: "signup" } })}
  className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
>
  Sign Up
</button>
<button
  onClick={() => navigate("/signing", { state: { panel: "login" } })}
  className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
>
  Login
</button>

          </>
        )}
      </div>
    </div>
  )}
</div>

        </div>
      </nav>

      <div ref={twoHundredRef} className='flex flex-col justify-center items-center w-screen h-screen pt-30'>
        <main className='w-full  h-3/5 gap-5 flex items-center justify-center'>
          <div className='bg-color-d w-2/20 h-full'></div>

          <HomeLogo/>

          <div className='bg-color-d w-2/20 h-full'></div>
        </main>

        <div className='w-screen h-1/5 flex items-center pt-25'>
          <div className=' w-2/10 h-full'></div>
          <div className=' w-10/10 h-full flex items-center justify-baseline'>
                <p className='sm:text-3xl md:text-3xl lg:text-4xl text-xl text-color-e font-light'>Crowdfunding Meets Risk Intelligence - Where Every Investment <br /> is an Informed Decision</p>
          </div>       
        </div>
      </div>

      <div className='h-screen w-screen'>
        <nav className='h-1/7'></nav>

        <main className='h-6/7 flex flex-col gap-15'>
          <div className='h-1/11 flex items-center justify-center'>
            <div className='w-1/3 h-full'></div>
            <div className='w-1/3 h-full flex items-center justify-center'>
              <p className='text-color-e text-5xl underline'>Fresh Favorites</p>
            </div>
            <div className='w-1/3 h-full flex justify-end items-center z-10'>
              <div className=' h-full w-60 flex items-center justify-center gap-10'>
                <div onClick={scrollLeft} className='hover:bg-color-a border-3 hover:text-color-d text-color-a border-color-a w-1/4 h-15 rounded-4xl flex items-center justify-center'>
                  <img src={Arrow} alt="" />
                </div>
                <div onClick={scrollRight} className='hover:bg-color-a border-3 hover:text-color-d text-color-a border-color-a w-1/4 h-15 rounded-4xl flex items-center justify-center rotate-180'>
                  <img src={Arrow} alt="" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-10/11 relative w-screen">
            {/* Scroll container */}
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

                  const amountLeft = project.fundingGoal - (project.fundedMoney || 0);

                  const endDate = project.endDate instanceof Timestamp
                    ? project.endDate.toDate()
                    : project.endDate
                      ? new Date(project.endDate)
                      : null;

                  const daysLeft = endDate
                    ? Math.max(Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)), 0)
                    : 'N/A';

                  const isFullyFunded = fundedPercentage >= 100;

                  return (
                  <Link
                    to={`/projectDet/${project.id}`} 
                    key={project.id}
                    className="flex-shrink-0 w-1/4 scroll-snap-align-start relative"
                  >
                    <div className="bg-color-e rounded-lg p-4 flex flex-col gap-5 items-center hover:shadow-lg transition-shadow relative">
                      
                      <img
                        src={project.imageUrl || "/placeholder.png"}
                        alt={project.title}
                        className="w-full h-40 object-cover rounded-lg mb-2 z-10"
                      />

                      {/* progress bar */}
                      <div className="w-full mb-2 z-10">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isFullyFunded ? 'bg-green-500' : 'bg-gradient-to-r from-color-b to-cyan-500'
                            }`}
                            style={{ width: `${fundedPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-color-d w-full">
                          <span>{Math.round(fundedPercentage)}% funded</span>
                          <span>{daysLeft} days left</span>
                        </div>
                      </div>

                      <p className="text-color-d font-medium text-lg truncate mb-2 z-10">{project.title}</p>

                      {!isFullyFunded && (
                        <p className="text-xs text-color-d mb-2 z-10">
                          {amountLeft > 0 ? `$${amountLeft.toLocaleString()} to go` : 'Goal reached!'}
                        </p>
                      )}

                      {/* vertical line that scrolls with the card */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 h-[250%] w-1 bg-color-e pointer-events-none z-0"></div>
                    </div>
                  </Link>
                  );
                })
              ) : (
                <p className="text-color-e ml-4">No projects yet</p>
              )}
            </div>

            {/* Left overlay */}
            <div className="absolute top-0 left-0 h-full w-16 bg-color-d pointer-events-none z-10"></div>

            {/* Right overlay */}
            <div className="absolute top-0 right-0 h-full w-16 bg-color-d pointer-events-none z-10"></div>
          </div>

        </main>
      </div>

      {/* <div className='h-screen w-screen'>
        <nav className='h-1/7'></nav>
        <main className='h-6/7'>
          <div className='h-1/11 flex items-center justify-center'>
            <div className='w-1/3 h-full'></div>
            <div className='w-1/3 h-full flex items-center justify-center'>
              <p className='text-color-e text-5xl underline'>Meet The Creators</p>
            </div>
            <div className='w-1/3 h-full flex justify-end items-center'>
              <div className='bg-red-500 h-full w-60'></div>
            </div>
          </div>
          
          <div className='bg-green-500 h-10/11'></div>
        </main>
      </div> */}
    </div>
  )
}

export default Home