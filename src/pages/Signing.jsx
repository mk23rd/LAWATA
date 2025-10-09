import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/firebase-config';
import { updateProfile, signOut } from "firebase/auth"; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import InputField from '../components/InputField';
import Button from '../components/Button';
import EmailVerification from '../components/EmailVerification';
import PreSignupEmailVerification from '../components/PreSignupEmailVerification';
import { gsap } from "gsap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Signing = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPreSignupVerification, setShowPreSignupVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const location = useLocation();
  const initialPanel = location.state?.panel || "login"; // default to login if nothing passed
  const [activePanel, setActivePanel] = useState(initialPanel);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if email is verified
        if (currentUser.emailVerified) {
          navigate('/home');
        } else {
          // Show verification screen for unverified users
          setPendingUser(currentUser);
          setShowEmailVerification(true);
        }
      } else {
        setUser(null);
        setShowEmailVerification(false);
        setPendingUser(null);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // GSAP refs
  const signupRef = useRef(null);
  const signinRef = useRef(null);
  const signinWid1 = useRef(null);
  const signinWid2 = useRef(null);
  const signinWid3 = useRef(null);
  const signupWid1 = useRef(null);
  const signupWid2 = useRef(null);
  const signupWid3 = useRef(null);
  const signinLabel = useRef(null);
  const signinInput = useRef(null);
  const signinBtn = useRef(null);
  const signupLabel = useRef(null);
  const signupInput = useRef(null);
  const signupBtn = useRef(null);
  const googleinBtn = useRef(null);


  // Form state
  const [signinformData, signinsetFormData] = useState({ email: '', password: '' });
  const [signupformData, signupsetFormData] = useState({
    email: '', password: '', confirmPassword: '', username: ''
  });

  // Form handlers
  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    signinsetFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    signupsetFormData(prev => ({ ...prev, [name]: value }));
  };

  // Check if email already exists in Firestore
  const checkEmailExists = async (email) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Check if username already exists in Firestore
  const checkUsernameExists = async (username) => {
    try {
      const usersRef = collection(db, 'users');
      // Check both original case and lowercase for compatibility with existing data
      const q1 = query(usersRef, where('username', '==', username));
      const q2 = query(usersRef, where('username', '==', username.toLowerCase()));
      
      const [querySnapshot1, querySnapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      console.log('Username check:', { 
        username, 
        lowercase: username.toLowerCase(), 
        found1: !querySnapshot1.empty, 
        found2: !querySnapshot2.empty 
      });
      
      return !querySnapshot1.empty || !querySnapshot2.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // Step 1: Validate form and show email verification
  const handleSignUp = async () => {
    if (loading) return;

    if (signupformData.password !== signupformData.confirmPassword) {
      toast.error("Passwords don't match!", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (signupformData.password.length < 6) {
      toast.error("Password must be at least 6 characters long", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (!signupformData.username.trim()) {
      toast.error("Please enter a username", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (!signupformData.email.trim()) {
      toast.error("Please enter an email address", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupformData.email.trim())) {
      toast.error("Invalid email syntax. Please enter a valid email address", {
        position: "top-center",
        autoClose: 4000,
      });
      return;
    }

    // Set loading for database checks
    setLoading(true);

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(signupformData.email.trim());
      if (emailExists) {
        toast.error("Email already in use. Please use a different email or sign in instead.", {
          position: "top-center",
          autoClose: 4000,
        });
        setLoading(false);
        return;
      }

      // Check if username already exists
      console.log('Checking username:', signupformData.username.trim());
      const usernameExists = await checkUsernameExists(signupformData.username.trim());
      console.log('Username exists result:', usernameExists);
      
      if (usernameExists) {
        toast.error("Username already taken. Please choose a different username.", {
          position: "top-center",
          autoClose: 4000,
        });
        setLoading(false);
        return;
      }

      // Show email verification before creating account
      setShowPreSignupVerification(true);
    } catch (error) {
      console.error('Error during signup validation:', error);
      toast.error("Error validating signup information. Please try again.", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete account setup after email verification
  const completeAccountSetup = async (verifiedUser) => {
    setLoading(true);
    try {
      // Update the user profile with username
      await updateProfile(verifiedUser, {
        displayName: signupformData.username,
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", verifiedUser.uid), {
        uid: verifiedUser.uid,
        email: signupformData.email.toLowerCase(),
        username: signupformData.username.toLowerCase(), // Store username in lowercase for consistency
        displayName: signupformData.username, // Keep original case for display
        roles: ["visitor"], 
        walletBalance: 0,
        createdAt: new Date(),
        lastLogin: new Date(),
        emailVerified: true, // Email already verified
        verifiedAt: new Date(),
      });

      setShowPreSignupVerification(false);
      toast.success("Account created successfully! Welcome to LAWATA!", {
        position: "top-center",
        autoClose: 3000,
      });
      
      // Navigate to home since email is already verified
      navigate('/home');
    } catch (error) {
      console.error("Account setup error:", error);
      toast.error("Error completing account setup: " + error.message, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  
  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        signinformData.email,
        signinformData.password
      );
      const user = userCredential.user;
      
      // Update last login
      await setDoc(doc(db, "users", user.uid), { 
        lastLogin: new Date(),
        emailVerified: user.emailVerified 
      }, { merge: true });
      
      // Check if email is verified
      if (!user.emailVerified) {
        toast.warning("Please verify your email before continuing.", {
          position: "top-center",
          autoClose: 5000,
        });
        // The auth listener will handle showing verification screen
      }
    } catch (error) {
      console.error("Sign in error:", error);
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (activePanel === "signup") {
      gsap.to(signupRef.current, { width: "90%", duration: 0.6, ease: "power2.out" });
      gsap.to(signinRef.current, { width: "10%", duration: 0.6, ease: "power2.out" });

      gsap.to(signinWid1.current, { height: "15%", duration: 0.6 });
      gsap.to(signinWid2.current, { height: "15%", duration: 0.6 });
      gsap.to(signinWid3.current, { height: "70%", duration: 0.6 });
      gsap.to(signupWid1.current, { height: "0%", duration: 0.6 });
      gsap.to(signupWid2.current, { height: "15%", duration: 0.6 });
      gsap.to(signupWid3.current, { height: "85%", duration: 0.6 });

      gsap.to(signinLabel.current, { fontSize: "32px", y: 145, duration: 0.6 });
      gsap.to(signupLabel.current, { fontSize: "72px", y: 0, duration: 0.6 });
      gsap.to(signinInput.current, { opacity: 0, pointerEvents: "none", duration: 0.4 });
      gsap.to(signinBtn.current, { opacity: 0, pointerEvents: "none", duration: 0.4 });
      gsap.to(googleinBtn.current, { opacity: 0, pointerEvents: "none", duration: 0.4 });
      gsap.to(signupInput.current, { opacity: 1, pointerEvents: "auto", duration: 0.6, delay: 0.2 });
      gsap.to(signupBtn.current, { opacity: 1, pointerEvents: "auto", duration: 0.6, delay: 0.2 });
    } else {
      gsap.to(signupRef.current, { width: "10%", duration: 0.6 });
      gsap.to(signinRef.current, { width: "90%", duration: 0.6 });

      gsap.to(signinWid1.current, { height: "85%", duration: 0.6 });
      gsap.to(signinWid2.current, { height: "15%", duration: 0.6 });
      gsap.to(signinWid3.current, { height: "0%", duration: 0.6 });
      gsap.to(signupWid1.current, { height: "70%", duration: 0.6 });
      gsap.to(signupWid2.current, { height: "15%", duration: 0.6 });
      gsap.to(signupWid3.current, { height: "15%", duration: 0.6 });

      gsap.to(signinLabel.current, { fontSize: "72px", y: 0, duration: 0.6 });
      gsap.to(signupLabel.current, { fontSize: "32px", y: 175, duration: 0.6 });
      gsap.to(signinInput.current, { opacity: 1, pointerEvents: "auto", duration: 0.6, delay: 0.2 });
      gsap.to(signinBtn.current, { opacity: 1, pointerEvents: "auto", duration: 0.6, delay: 0.2 });
      gsap.to(googleinBtn.current, { opacity: 1, pointerEvents: "auto", duration: 0.6, delay: 0.2 });
      gsap.to(signupInput.current, { opacity: 0, pointerEvents: "none", duration: 0.4 });
      gsap.to(signupBtn.current, { opacity: 0, pointerEvents: "none", duration: 0.4 });
    }
  }, [activePanel]);

  // Form submit handlers
  const handleSignInSubmit = (e) => {
    e.preventDefault();
    handleSignIn();
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    handleSignUp();
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    const provider = new GoogleAuthProvider();
    // Add additional scopes
    provider.addScope('profile');
    provider.addScope('email');
    // Set custom parameters for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get existing user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const existingData = userDoc.exists() ? userDoc.data() : {};
      
      // Only update username and profileImageUrl if they don't exist or are empty
      const username = existingData.username || user.displayName || user.email.split('@')[0];
      const profileImageUrl = existingData.profileImageUrl || user.photoURL || "";

      // Prepare user data
      const userData = {
        uid: user.uid,
        email: user.email,
        username: username,
        profileImageUrl: profileImageUrl,
        roles: existingData.roles || ["visitor"],
        walletBalance: existingData.walletBalance || 0,
        lastLogin: new Date(),
        createdAt: existingData.createdAt || new Date(),
        displayName: user.displayName || "",
        emailVerified: user.emailVerified,
        providerData: user.providerData.map(provider => ({
          providerId: provider.providerId,
          uid: provider.uid,
          displayName: provider.displayName,
          email: provider.email,
          photoURL: provider.photoURL
        }))
      };

      // Save or update user info in Firestore
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      
      // Update user profile if display name is missing
      if (!user.displayName) {
        await updateProfile(user, {
          displayName: userData.username,
          photoURL: userData.profileImageUrl
        });
      }
      
      // Show success message and redirect (Google accounts are pre-verified)
      toast.success(`Welcome back, ${userData.username || 'User'}!`, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      navigate('/home');
    } catch (error) {
      console.error("Google Sign-In error:", error);
      
      // Handle specific error cases
      let errorMessage = 'An error occurred during sign-in';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked. Please allow pop-ups for this site.';
      } else if (error.code === 'auth/internal-error') {
        errorMessage = 'Authentication service error. Please check your Firebase configuration.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please add it to Firebase console.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Email verification handlers
  const handleVerificationComplete = async () => {
    try {
      // Update user verification status in Firestore
      if (pendingUser) {
        await setDoc(doc(db, "users", pendingUser.uid), {
          emailVerified: true,
          verifiedAt: new Date()
        }, { merge: true });
      }
      
      setShowEmailVerification(false);
      setPendingUser(null);
      
      toast.success('Email verified successfully! Welcome!', {
        position: "top-center",
        autoClose: 3000,
      });
      
      navigate('/home');
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Error updating verification status', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleVerificationCancel = async () => {
    try {
      await signOut(auth);
      setShowEmailVerification(false);
      setPendingUser(null);
      toast.info('Signed out. Please sign in again when ready to verify.', {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Pre-signup verification handlers
  const handlePreVerificationComplete = (verifiedUser) => {
    setVerifiedEmail(signupformData.email);
    completeAccountSetup(verifiedUser);
  };

  const handlePreVerificationBack = () => {
    setShowPreSignupVerification(false);
  };

  return (
    <div className='bg-white overflow-clip'>
      {/* Pre-Signup Email Verification Modal */}
      {showPreSignupVerification && (
        <PreSignupEmailVerification
          email={signupformData.email}
          formData={signupformData}
          onVerificationComplete={handlePreVerificationComplete}
          onBack={handlePreVerificationBack}
        />
      )}
      
      {/* Post-Signup Email Verification Modal (for existing users) */}
      {showEmailVerification && pendingUser && (
        <EmailVerification
          user={pendingUser}
          onVerificationComplete={handleVerificationComplete}
          onCancel={handleVerificationCancel}
        />
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <nav className='w-screen h-1/5'> 
        <div className='fixed flex w-screen pointer-events-none'> 
          <div className='w-1/6 h-full flex justify-center items-center'> 
            <p className='font-titan text-6xl text-color-e relative top-5 pointer-events-auto'>LAWATA</p>
          </div> 

          <div className='w-4/6 h-full flex justify-center items-center'> 
          </div> 

          <div className='w-1/6 h-full flex justify-center items-center'> 
          </div> 
        </div> 
      </nav>
      
      <main className='w-screen flex'>
        {/* Sign Up Panel */}
        <div ref={signupRef} className='w-4/5 h-screen flex flex-col items-center' onClick={() => setActivePanel("signup")}>
          <div ref={signupWid1} className='h-0/5 w-full'></div>
          <div ref={signupWid2} className='bg-color-e h-1/5 w-1.5'></div>
          <div ref={signupWid3} className='bg-color-e h-4/5 w-full font-titan text-5xl text-color-b flex items-center justify-center'>
            <div className='text-color-b w-3xl gap-10 flex flex-col items-center justify-center'>
              <div ref={signupLabel} className='font-titan pointer-events-none'>Sign Up</div>
              <form ref={signupInput} className='flex flex-col gap-2' onSubmit={handleSignUpSubmit} autoComplete="on">
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="text" name="username" value={signupformData.username} onChange={handleSignUpChange} placeholder="User Name" autoComplete="username"/>
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="email" name="email" value={signupformData.email} onChange={handleSignUpChange} placeholder="Email" autoComplete="email"/>
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="password" name="password" value={signupformData.password} onChange={handleSignUpChange} placeholder="Password" autoComplete="new-password"/>
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="password" name="confirmPassword" value={signupformData.confirmPassword} onChange={handleSignUpChange} placeholder="Confirm Password" autoComplete="new-password"/>
              </form>
              <div ref={signupBtn} className='bg-color-b z-30 flex items-center justify-center rounded-xl text-2xl text-color-d w-40 h-10'>
                <Button text="SIGN UP" callfunc={handleSignUp} loading={loading}/>
              </div>
            </div>
          </div>
        </div>

        {/* Sign In Panel */}
        <div ref={signinRef} className='w-1/5 h-screen flex flex-col items-center' onClick={() => setActivePanel("login")}>
          <div ref={signinWid1} className='h-1/5 w-full border-color-b border-b-6 border-l-6 font-titan text-5xl text-color-b flex items-center justify-center'>
            <div className='text-color-e w-3xl gap-5 flex flex-col items-center justify-end-safe'>
              <div ref={signinLabel} className='font-titan pointer-events-none'>Login</div>
              <form ref={signinInput} className='flex flex-col gap-5' onSubmit={handleSignInSubmit} autoComplete="on">
                <InputField classname="border-b-3 text-2xl border-color-e w-100 outline-0" inputtype="email" name="email" value={signinformData.email} onChange={handleSignInChange} placeholder="Email" autoComplete="email"/>
                <InputField classname="border-b-3 text-2xl border-color-e w-100 outline-0" inputtype="password" name="password" value={signinformData.password} onChange={handleSignInChange} placeholder="Password" autoComplete="current-password"/>
                <div className="flex text-xl justify-between">
                  <div className="flex gap-2 items-center justify-center">
                    <input className='w-4 h-4 rounded-sm' type="checkbox" />
                    <span>Remember Me !</span>
                  </div>
                  <p><a className='underline' href="#blank">Forgot password?</a></p>
                </div>
              </form>
              <div ref={signinBtn} className='bg-color-e flex items-center rounded-xl text-2xl justify-center text-color-d w-40 h-10'>
                <Button text="LOG IN" callfunc={handleSignIn} loading={loading}/>
              </div>

              <div ref={googleinBtn} className='bg-color-b flex items-center rounded-xl text-2xl justify-center text-color-d w-60 h-10 cursor-pointer'
                  onClick={handleGoogleSignIn}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" className="w-6 h-6 mr-2"/>
                Sign in with Google
              </div>
            </div>
          </div>
          <div ref={signinWid2} className='bg-color-b h-1/5 w-1.5'></div>
          <div ref={signinWid3} className='h-3/5 w-full'></div>
        </div>
      </main>
    </div>
  );
};

export default Signing;
