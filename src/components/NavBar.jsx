// components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import NotificationBell from "../components/NotificationBell";

// Responsive navigation bar that adapts between desktop and mobile layouts
const Navbar = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Store extended profile fields fetched from Firestore
  const [userData, setUserData] = useState(null);
  // Track whether the desktop profile dropdown is visible
  const [showDropdown, setShowDropdown] = useState(false);

  // Control the hamburger menu open state on mobile
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setUserData(userDoc.data());
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase auth and redirect home
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".user-dropdown")) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest("nav")) {
        setMenuOpen(false);
      }
    };
    // Only attach the listener while the menu is open
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <nav className='fixed top-0 left-0 w-screen h-16 md:h-20 z-50 flex items-center bg-white shadow-sm'>
      {/* Logo */}
      <div className='flex-1 md:w-1/6 h-full flex justify-center md:justify-center items-center'>
        <p className='font-titan text-2xl md:text-5xl text-color-b pointer-events-none'>LAWATA</p>
      </div>

      {/* Desktop Navigation */}
      <div className='hidden md:flex w-4/6 h-full justify-center items-center'>
        <div className='bg-color-e rounded-2xl w-2xl h-13 gap-40 flex items-center justify-evenly'>
          <Link to="/projects" className='text-color-d text-2xl hover:underline'>Create</Link>
          <Link to="/browse" className='text-color-d text-2xl hover:underline'>Browse Works</Link>
          <Link to="/about" className='text-color-d text-2xl hover:underline'>About</Link>
        </div>
      </div>

      {/* Desktop User Section */}
      <div className='hidden md:flex w-1/6 h-full justify-end items-center gap-3 pr-4'>
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative user-dropdown">
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
                    onClick={() => { navigate("/wallet"); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Wallet
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

      {/* Mobile Menu Button */}
      <div className='md:hidden flex items-center gap-2 pr-4'>
        <NotificationBell />
        <button
          onClick={toggleMenu}
          className='p-2 rounded-md text-color-b hover:bg-gray-100 transition-colors'
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 right-0 left-0 bg-white shadow-lg border-t border-gray-200 z-40">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Navigation Links */}
            <Link 
              to="/projects" 
              className='block text-color-d text-xl hover:underline py-2'
              onClick={toggleMenu}
            >
              Create
            </Link>
            <Link 
              to="/browse" 
              className='block text-color-d text-xl hover:underline py-2'
              onClick={toggleMenu}
            >
              Browse Works
            </Link>
            <Link 
              to="/about" 
              className='block text-color-d text-xl hover:underline py-2'
              onClick={toggleMenu}
            >
              About
            </Link>
            
            {/* Mobile User Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {user ? (
                <>
                  {/* If user IS logged in */}
                  <div className="px-2 py-2 text-sm text-color-d border-b border-color-d border-opacity-20 mb-2">
                    <p className="font-medium truncate">{userData?.username || 'User'}</p>
                    <p className="truncate text-opacity-80">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate("/profile"); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { navigate("/projects"); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Projects
                  </button>
                  <button
                    onClick={() => { navigate("/wallet"); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Wallet
                  </button>
                  <button
                    onClick={() => { handleLogout(); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* If user is NOT logged in */}
                  <button
                    onClick={() => { navigate("/signing", { state: { panel: "signup" } }); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => { navigate("/signing", { state: { panel: "login" } }); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
