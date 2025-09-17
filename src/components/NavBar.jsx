// components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

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

  return (
    <nav className="fixed top-0 left-0 w-screen h-20 z-50 flex items-center bg-color-e px-4">
  {/* Logo */}
  <div className="flex-1 h-full flex items-center">
    <Link to="/" className="font-titan text-3xl md:text-5xl text-color-b">
      LAWATA
    </Link>
  </div>

  {/* Desktop Menu */}
  <div className="hidden md:flex flex-[2] h-full justify-center items-center">
    <div className="bg-color-e rounded-2xl px-6 py-2 gap-12 flex items-center justify-evenly shadow">
      <Link to="/projects" className="text-color-d text-xl hover:underline">
        Create
      </Link>
      <Link to="/browse" className="text-color-d text-xl hover:underline">
        Browse Works
      </Link>
      <Link to="/about" className="text-color-d text-xl hover:underline">
        About
      </Link>
    </div>
  </div>

  {/* User Dropdown (Desktop) */}
  <div className="hidden md:flex flex-1 h-full justify-end items-center user-dropdown pr-6">
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="bg-color-e rounded-2xl w-35 h-10 flex items-center justify-center text-color-d font-medium hover:bg-opacity-90 transition-colors px-4 truncate"
      >
        {userData?.username || user?.email || "User"}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-color-e rounded-md shadow-lg z-10">
          <div className="py-1">
            {user ? (
              <>
                <div className="px-4 py-2 text-sm text-color-d border-b border-color-d border-opacity-20">
                  <p className="font-medium truncate">
                    {userData?.username || "User"}
                  </p>
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
                <button
                  onClick={() =>
                    navigate("/signing", { state: { panel: "signup" } })
                  }
                  className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10 transition-colors"
                >
                  Sign Up
                </button>
                <button
                  onClick={() =>
                    navigate("/signing", { state: { panel: "login" } })
                  }
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

  {/* Hamburger (Mobile only) */}
  <div className="md:hidden flex items-center">
    <button
      onClick={toggleMenu}
      className="text-color-d focus:outline-none"
    >
      {/* Hamburger Icon */}
      {menuOpen ? (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  </div>

  {/* Mobile Dropdown Menu */}
  {menuOpen && (
    <div className="absolute top-20 left-0 w-full bg-color-e shadow-md flex flex-col items-center py-4 md:hidden z-40">
      <Link
        to="/projects"
        className="py-2 text-lg text-color-d hover:underline"
        onClick={() => setMenuOpen(false)}
      >
        Create
      </Link>
      <Link
        to="/browse"
        className="py-2 text-lg text-color-d hover:underline"
        onClick={() => setMenuOpen(false)}
      >
        Browse Works
      </Link>
      <Link
        to="/about"
        className="py-2 text-lg text-color-d hover:underline"
        onClick={() => setMenuOpen(false)}
      >
        About
      </Link>

      {/* User Actions */}
      <div className="border-t border-color-d border-opacity-20 w-full mt-2 pt-2">
        {user ? (
          <>
            <button
              onClick={() => {
                navigate("/profile");
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-color-d"
            >
              Profile
            </button>
            <button
              onClick={() => {
                navigate("/projects");
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-color-d"
            >
              Projects
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-color-d"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                navigate("/signing", { state: { panel: "signup" } });
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-color-d"
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                navigate("/signing", { state: { panel: "login" } });
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-color-d"
            >
              Login
            </button>
          </>
        )}
      </div>
    </div>
  )}
      </nav>
  );
};

export default Navbar;
