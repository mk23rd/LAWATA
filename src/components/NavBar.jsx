// components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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

  const primaryNavLinks = [
    { label: "Home", to: "/home" },
    { label: "Browse", to: "/browse" },
    { label: "Community", to: "/community" },
    { label: "Projects", to: "/projects" },
    { label: "My Projects", to: "/view-my-projects" },
    { label: "Investments", to: "/myInvestments" },
    { label: "Wallet", to: "/wallet" }
  ];

  const accountMenuLinks = [
    { label: "Profile", action: () => navigate("/profile") },
    { label: "Manage Profile", action: () => navigate("/manage-profile") },
    { label: "Create Project", action: () => navigate("/create") },
    { label: "My Projects", action: () => navigate("/view-my-projects") },
    { label: "My Investments", action: () => navigate("/myInvestments") },
    { label: "Bookmarks", action: () => navigate("/bookmarks") },
    { label: "Wallet", action: () => navigate("/wallet") }
  ];

  const guestMenuLinks = [
    { label: "Sign Up", action: () => navigate("/signing", { state: { panel: "signup" } }) },
    { label: "Login", action: () => navigate("/signing", { state: { panel: "login" } }) }
  ];

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
    <nav className="fixed top-0 left-0 w-full z-[100] bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="font-titan text-2xl md:text-4xl text-color-b hover:opacity-80 transition-opacity">
            LAWATA
          </Link>
          <span className="hidden md:block text-xs font-semibold uppercase tracking-widest text-color-c/70">
            Crowdfunding
          </span>
        </div>

        {/* Desktop Navigation */}
  <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-black px-2 py-1">
            {primaryNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-semibold transition-colors rounded-full ${
                    isActive
                      ? "bg-color-b text-white shadow"
                      : "text-white hover:text-color-b hover:bg-color-b/10"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/create"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-color-b px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
          >
            Start a Project
          </Link>
          <NotificationBell />

          {/* User Profile Dropdown */}
          <div className="relative user-dropdown">
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 rounded-full bg-color-e px-3 py-2 text-sm font-semibold text-white hover:bg-opacity-80 transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-color-b/10 text-xs font-bold uppercase text-color-b">
                {userData?.profileImageUrl ? (
                  <img src={userData.profileImageUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                ) : (
                  (userData?.username || user?.email || "U").charAt(0)
                )}
              </span>
              <span className="max-w-[120px] truncate">
                {userData?.username || user?.email || "Account"}
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                <div className="border-b border-gray-100 bg-color-e/60 px-4 py-3 text-sm text-white">
                  <p className="font-semibold truncate">{userData?.username || "User"}</p>
                  <p className="truncate text-xs text-white/70">{user?.email}</p>
                </div>
                <div className="py-1 text-sm">
                  {(user ? accountMenuLinks : guestMenuLinks).map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setShowDropdown(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-color-e hover:bg-color-b/10 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                  {user ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowDropdown(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={toggleMenu}
            className="rounded-md p-2 text-color-b hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-xl">
          <div className="space-y-6 px-4 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Explore</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {primaryNavLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={toggleMenu}
                    className="rounded-lg border border-gray-100 px-3 py-2 text-sm font-semibold text-color-e hover:border-color-b hover:bg-color-b/5"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/create"
                onClick={toggleMenu}
                className="block rounded-lg bg-color-b px-4 py-3 text-center text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                Start a Project
              </Link>
              <Link
                to="/browse"
                onClick={toggleMenu}
                className="block rounded-lg border border-color-b/20 px-4 py-3 text-center text-sm font-semibold text-color-b hover:border-color-b hover:bg-color-b/5"
              >
                Browse Projects
              </Link>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account</p>
              <div className="mt-3 space-y-2">
                {(user ? accountMenuLinks : guestMenuLinks).map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      toggleMenu();
                    }}
                    className="block w-full rounded-lg border border-gray-100 px-3 py-2 text-left text-sm font-semibold text-color-e hover:border-color-b hover:bg-color-b/5"
                  >
                    {item.label}
                  </button>
                ))}
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="block w-full rounded-lg border border-red-200 px-3 py-2 text-left text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
