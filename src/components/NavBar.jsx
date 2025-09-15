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
    <nav className="fixed top-0 left-0 w-screen h-20 z-50 flex items-center bg-color-d">
      <div className="w-1/6 h-full flex justify-center items-center">
        <Link to='/' className="font-titan text-5xl text-color-b">LAWATA</Link>
      </div>

      <div className="w-4/6 h-full flex justify-center items-center">
        <div className="bg-color-e rounded-2xl w-2xl h-13 gap-40 flex items-center justify-evenly">
          <Link to="/projects" className="text-color-d text-2xl hover:underline">
            Create
          </Link>
          <Link to="/browse" className="text-color-d text-2xl hover:underline">
            Browse Works
          </Link>
          <Link to="/about" className="text-color-d text-2xl hover:underline">
            About
          </Link>
        </div>
      </div>

      <div className="w-1/6 h-full flex justify-center items-center user-dropdown">
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
                      className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => navigate("/projects")}
                      className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10"
                    >
                      Projects
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10"
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
                      className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10"
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() =>
                        navigate("/signing", { state: { panel: "login" } })
                      }
                      className="block w-full text-left px-4 py-2 text-sm text-color-d hover:bg-color-b hover:bg-opacity-10"
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
  );
};

export default Navbar;
