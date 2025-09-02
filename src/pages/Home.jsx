import React, { useState, useEffect } from 'react'
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

  return (
    <div className='bg-color-d overflow-x-clip'>
      <div className='flex flex-col justify-center items-center h-screen'>
        <nav className='w-screen h-1/5'>
          <div className='fixed flex w-screen'>
            <div className='w-1/6 h-full flex justify-center items-center'>
              <p className='font-titan text-3xl text-color-e relative top-5'>Name/Logo</p>
            </div>

            <div className='w-4/6 h-full flex justify-center items-center'>
              <div className='bg-color-e rounded-2xl w-2xl h-13 relative gap-40 top-5 flex items-center justify-evenly'>
                {/* Replace <a> tags with <Link> components */}
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
                  className='bg-color-e rounded-2xl w-35 h-10 relative top-5 flex items-center justify-center text-color-d font-medium hover:bg-opacity-90 transition-colors px-4 truncate'
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
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-d hover:bg-opacity-10 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className='w-full h-3/5 flex gap-2 justify-center'>
          <div className='bg-color-d w-2/26'></div>

          <HomeLogo 
            letter="I"
            offset="w-1/26 relative top-28 flex flex-col items-center"
            connectorTop=""
            boxHeight="bg-color-e w-full h-50 font-titan flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-25"
            connectorBottom="bg-color-e w-0.5 h-56"
          />
          <HomeLogo 
            letter="N"
            offset="w-1/26 relative top-8 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-9"
            boxHeight="bg-color-e w-full h-65 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-35"
            connectorBottom="bg-color-e w-0.5 h-6"
          />
          <HomeLogo 
            letter="V"
            offset="w-1/26 relative -top-5 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-3"
            boxHeight="bg-color-e w-full h-80 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-54"
            connectorBottom="bg-color-e w-0.5 h-18"
          />
          <HomeLogo 
            letter="C"
            offset="w-1/26 relative -top-25 flex flex-col items-center"
            connectorTop="bg-color-b w-0.5 h-35"
            boxHeight="border-color-b border-3 w-full h-20 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-2"
            connectorBottom="bg-color-b w-0.5 h-25"
          />
          <HomeLogo 
            letter="E"
            offset="w-1/26 relative -top-25 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-32"
            boxHeight="bg-color-e w-full h-68 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-45"
            connectorBottom=""
          />
          <HomeLogo 
            letter="S"
            offset="w-1/26 relative top-3 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-15"
            boxHeight="bg-color-e w-full h-55 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-34"
            connectorBottom="bg-color-e w-0.5 h-25"
          />
          <HomeLogo 
            letter="R"
            offset="w-1/26 relative top-2 flex flex-col items-center"
            connectorTop="bg-color-b w-0.5 h-5"
            boxHeight="border-color-b border-3 w-full h-58 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-5"
            connectorBottom="bg-color-b w-0.5 h-5"
          />
          <HomeLogo 
            letter="T"
            offset="w-1/26 relative -top-14 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-15"
            boxHeight="bg-color-e w-full h-70 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-51"
            connectorBottom="bg-color-e w-0.5 h-5"
          />
          <HomeLogo 
            letter="/"
            offset="w-1/26 relative -top-15 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-60"
            boxHeight="bg-color-e w-full h-28 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-8"
            connectorBottom="bg-color-e w-0.5 h-3"
          />
          <HomeLogo 
            letter="C"
            offset="w-1/26 relative -top-5 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-40"
            boxHeight="bg-color-e w-full h-60 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-18"
            connectorBottom=""
          />
          <HomeLogo 
            letter="E"
            offset="w-1/26 relative -top-15 flex flex-col items-center"
            connectorTop=""
            boxHeight="border-color-b border-3 w-full h-70 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-27"
            connectorBottom="bg-color-b w-0.5 h-30"
          />
          <HomeLogo 
            letter="R"
            offset="w-1/26 relative -top-5 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-5"
            boxHeight="bg-color-e w-full h-75 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-53"
            connectorBottom="bg-color-e w-0.5 h-5"
          />
          <HomeLogo 
            letter="O"
            offset="w-1/26 relative top-30 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-3"
            boxHeight="bg-color-e w-full h-52 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-20"
            connectorBottom="bg-color-e w-0.5 h-28"
          />
          <HomeLogo 
            letter="A"
            offset="w-1/26 relative top-2 flex flex-col items-center"
            connectorTop="bg-color-b w-0.5 h-5"
            boxHeight="border-color-b border-3 w-full h-58 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-5"
            connectorBottom="bg-color-b w-0.5 h-30"
          />
          <HomeLogo 
            letter="W"
            offset="w-1/26 relative top-5 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-45"
            boxHeight="bg-color-e w-full h-20 flex justify-center"
            paragraph="text-color-b font-titan text-5xl relative top-5"
            connectorBottom="bg-color-e w-0.5 h-10"
          />
          <HomeLogo 
            letter="D"
            offset="w-1/26 relative top-30 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-15"
            boxHeight="bg-color-e w-full h-50 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-9"
            connectorBottom="bg-color-e w-0.5 h-5"
          />
          <HomeLogo 
            letter="F"
            offset="w-1/26 relative top-10 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-3"
            boxHeight="bg-color-e w-full h-60 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-41"
            connectorBottom="bg-color-e w-0.5 h-15"
          />
          <HomeLogo 
            letter="T"
            offset="w-1/26 relative -top-30 flex flex-col items-center"
            connectorTop="bg-color-b w-0.5 h-35"
            boxHeight="border-color-b border-3 w-full h-30 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-5"
            connectorBottom="bg-color-b w-0.5 h-3"
          />
          <HomeLogo 
            letter="U"
            offset="w-1/26 relative top-25 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-5"
            boxHeight="bg-color-e w-full h-75 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-25"
            connectorBottom="bg-color-e w-0.5 h-20"
          />
          <HomeLogo 
            letter="N"
            offset="w-1/26 relative -top-20 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-30"
            boxHeight="bg-color-e w-full h-60 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-45"
            connectorBottom="bg-color-e w-0.5 h-8"
          />
          <HomeLogo 
            letter="D"
            offset="w-1/26 relative top-20 flex flex-col items-center"
            connectorTop="bg-color-e w-0.5 h-15"
            boxHeight="bg-color-e w-full h-50 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-20"
            connectorBottom="bg-color-e w-0.5 h-15"
          />
          <HomeLogo 
            letter="E"
            offset="w-1/26 relative -top-15 flex flex-col items-center"
            connectorTop="bg-color-b w-0.5 h-15"
            boxHeight="border-color-b border-3 w-full h-45 flex justify-center"
            paragraph="text-color-b font-titan text-6xl relative top-12"
            connectorBottom="bg-color-b w-0.5 h-40"
          />

          <div className='bg-color-d w-2/26'></div>
        </main>

        <div className='w-screen h-1/5 flex items-center'>
          <p className='text-4xl text-color-e font-light relative left-38'>Crowdfunding Meets Risk Intelligence - Where Every Investment <br /> is an Informed Decision</p>
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