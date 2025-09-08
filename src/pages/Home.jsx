import React, { useState, useEffect, useRef } from 'react'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { Link } from 'react-router-dom' // Import Link
import HomeLogo from '../components/homeLogo'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase/firebase-config'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'

const Home = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const user = auth.currentUser

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
      end: "bottom+=190% top",
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

  

  return (
    <div className='bg-color-d overflow-x-clip'>
      <nav className='fixed top-0 left-0 w-screen h-20 z-50 flex items-center'>
        <div className='w-1/6 h-full flex justify-center items-center'>
          <p className='font-titan text-5xl text-color-b'>LAWATA</p>
        </div>

        <div className='w-4/6 h-full flex justify-center items-center'>
          <div className='bg-color-e rounded-2xl w-2xl h-13 gap-40 flex items-center justify-evenly'>
            <Link to="/create" className='text-color-d text-2xl hover:underline'>Create</Link>
            <Link to="/browse" className='text-color-d text-2xl hover:underline'>Browse Works</Link>
            <Link to="/about" className='text-color-d text-2xl hover:underline'>About</Link>
          </div>
        </div>

        <div className='w-1/6 h-full flex justify-center items-center user-dropdown'>
          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={toggleDropdown}
              className='bg-color-e rounded-2xl w-35 h-10 flex items-center justify-center text-color-d font-medium hover:bg-opacity-90 transition-colors px-4 truncate'
            >
              {userData?.username || user?.email || 'User'}
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-color-e rounded-md shadow-lg z-10">
                <div className="py-1">
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
        <main className='h-6/7'>
          <div className='h-1/11 flex items-center justify-center'>
            <div className='w-1/3 h-full'></div>
            <div className='w-1/3 h-full flex items-center justify-center'>
              <p className='text-color-e text-5xl underline'>Fresh Favorites</p>
            </div>
            <div className='w-1/3 h-full flex justify-end items-center'>
              <div className='bg-red-500 h-full w-60'></div>
            </div>
          </div>
          
          <div className='bg-green-500 h-10/11'></div>
        </main>
      </div>

      <div className='h-screen w-screen'>
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
      </div>
    </div>
  )
}

export default Home