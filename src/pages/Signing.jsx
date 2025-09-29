import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/firebase-config';
import { updateProfile } from "firebase/auth"; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { gsap } from "gsap";
import '../App.css';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Signing = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const initialPanel = location.state?.panel || "login"; // default to login if nothing passed
  const [activePanel, setActivePanel] = useState(initialPanel);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        navigate('/home');
      } else {
        setUser(null);
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


  const handleSignUp = async () => {
    if (loading) return;

    if (signupformData.password !== signupformData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (signupformData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    if (!signupformData.username.trim()) {
      alert("Please enter a username");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupformData.email,
        signupformData.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: signupformData.username,
      });
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: signupformData.email,
        username: signupformData.username,
        roles: ["visitor"], 
        walletBalance: 0,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      alert("Account created successfully!");
    } catch (error) {
      console.error("Sign up error:", error);
      alert(`Error: ${error.message}`);
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
      await setDoc(doc(db, "users", user.uid), { lastLogin: new Date() }, { merge: true });
    } catch (error) {
      console.error("Sign in error:", error);
      alert(`Error: ${error.message}`);
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

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save or update user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: user.displayName || "No Name",
        photoURL: user.photoURL || "",
        roles: ["visitor"],
        lastLogin: new Date(),
      }, { merge: true });

      alert("Signed in with Google successfully!");
    } catch (error) {
      console.error("Google Sign-In error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-color-d overflow-clip'>
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
              <div ref={signupInput} className='flex flex-col gap-2'>
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="text" name="username" value={signupformData.username} onChange={handleSignUpChange} placeholder="User Name"/>
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="email" name="email" value={signupformData.email} onChange={handleSignUpChange} placeholder="Email"/>
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="password" name="password" value={signupformData.password} onChange={handleSignUpChange} placeholder="Password"/>
                <InputField classname="border-b-3 text-2xl border-color-b w-100 outline-0" inputtype="password" name="confirmPassword" value={signupformData.confirmPassword} onChange={handleSignUpChange} placeholder="Confirm Password"/>
              </div>
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
              <div ref={signinInput} className='flex flex-col gap-5'>
                <InputField classname="border-b-3 text-2xl border-color-e w-100 outline-0" inputtype="email" name="email" value={signinformData.email} onChange={handleSignInChange} placeholder="Email"/>
                <InputField classname="border-b-3 text-2xl border-color-e w-100 outline-0" inputtype="password" name="password" value={signinformData.password} onChange={handleSignInChange} placeholder="Password"/>
                <div className="flex text-xl justify-between">
                  <div className="flex gap-2 items-center justify-center">
                    <input className='w-4 h-4 rounded-sm' type="checkbox" />
                    <span>Remember Me !</span>
                  </div>
                  <p><a className='underline' href="#blank">Forgot password?</a></p>
                </div>
              </div>
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
