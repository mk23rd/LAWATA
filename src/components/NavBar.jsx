// components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase/firebase-config";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import NotificationBell from "../components/NotificationBell";

// Responsive navigation bar that adapts between desktop and mobile layouts
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  // Store extended profile fields fetched from Firestore
  const [userData, setUserData] = useState(null);
  // Track whether the desktop profile dropdown is visible
  const [showDropdown, setShowDropdown] = useState(false);

  // Control the hamburger menu open state on mobile
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Real-time listener for user data
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUserData(docSnapshot.data());
        } else {
          setUserData(null);
        }
      },
      (error) => {
        console.error("Error listening to user data:", error);
      }
    );

    // Cleanup listener on unmount or when user changes
    return () => unsubscribe();
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
    <nav className='fixed top-0 left-0 w-screen h-16 md:h-20 z-[100] flex items-center bg-white shadow-sm'>
      {/* Logo */}
      <div className='flex-1 md:w-1/6 h-full flex justify-center md:justify-center items-center'>
        <Link to="/" className='font-titan text-2xl md:text-5xl text-color-b hover:opacity-80 transition-opacity cursor-pointer'>
          LAWATA
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className='hidden md:flex w-4/6 h-full justify-center items-center'>
        <div className='bg-color-e rounded-2xl w-2xl h-13 gap-6 flex items-center justify-evenly px-4'>
          <Link 
            to="/home" 
            className={`text-2xl font-semibold transition-all px-6 py-2 rounded-full ${
              location.pathname === '/manage' 
                ? 'bg-color-b text-white shadow-md'
                : 'text-color-d hover:bg-color-b hover:bg-opacity-80 hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/browse" 
            className={`text-2xl font-semibold transition-all px-6 py-2 rounded-full ${
              location.pathname === '/browse' 
                ? 'bg-color-b text-white shadow-md'
                : 'text-color-d hover:bg-color-b hover:bg-opacity-80 hover:text-white'
            }`}
          >
            Browse Works
          </Link>
          <Link 
            to="/about" 
            className={`text-2xl font-semibold transition-all px-6 py-2 rounded-full ${
              location.pathname === '/about' 
                ? 'bg-color-b text-white shadow-md'
                : 'text-color-d hover:bg-color-b hover:bg-opacity-80 hover:text-white'
            }`}
          >
            About
          </Link>
        </div>
      </div>

      {/* Desktop User Section */}
      <div className='hidden md:flex w-1/6 h-full justify-end items-center gap-3 pr-4'>
        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative user-dropdown">
          <button 
            onClick={toggleDropdown}
            className='bg-color-w rounded-2xl h-14 flex items-center justify-center text-color-d font-medium hover:bg-opacity-90 transition-colors px-4 gap-6'
          >
            {userData?.profileImageUrl ? (
              <img 
                src={userData.profileImageUrl} 
                alt="Profile" 
                className="w-14 h-14 rounded-full object-cover border-3 border-color-b"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-color-b flex items-center justify-center text-white font-bold text-sm">
                {(userData?.username || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            
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
                      onClick={() => navigate("/manage")}
                      className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                    >
                      Manage
                    </button>
                    <button
                    onClick={() => { navigate("/wallet"); toggleMenu(); }}
                    className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"

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
              to="/home" 
              className={`block text-lg font-semibold py-2 px-4 rounded-lg transition-all ${
                location.pathname === '/manage' 
                  ? 'bg-color-b text-white shadow-md' 
                  : 'text-color-d hover:bg-color-b hover:bg-opacity-80 hover:text-white'
              }`}
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link 
              to="/browse" 
              className={`block text-lg font-semibold py-2 px-4 rounded-lg transition-all ${
                location.pathname === '/browse' 
                  ? 'bg-color-b text-white shadow-md' 
                  : 'text-color-d hover:bg-color-b hover:bg-opacity-80 hover:text-white'
              }`}
              onClick={toggleMenu}
            >
              Browse Works
            </Link>
            <Link 
              to="/about" 
              className={`block text-lg font-semibold py-2 px-4 rounded-lg transition-all ${
                location.pathname === '/about' 
                  ? 'bg-color-b text-white shadow-md' 
                  : 'text-color-d hover:bg-color-b hover:bg-opacity-80 hover:text-white'
              }`}
              onClick={toggleMenu}
            >
              About
            </Link>
            
            {/* Mobile User Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {user ? (
                <>
                  {/* If user IS logged in */}
                  <div className="px-2 py-2 text-sm text-color-d border-b border-color-d border-opacity-20 mb-2 flex items-center gap-2">
                    {userData?.profileImageUrl ? (
                      <img 
                        src={userData.profileImageUrl} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-color-b"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-color-b flex items-center justify-center text-white font-bold">
                        {(userData?.username || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{userData?.username || 'User'}</p>
                      <p className="truncate text-opacity-80 text-xs">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate("/profile"); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { navigate("/manage"); toggleMenu(); }}
                    className="block w-full text-left px-2 py-2 text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                  >
                    Manage
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
