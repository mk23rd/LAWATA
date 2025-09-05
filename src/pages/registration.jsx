import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import SignIn from './SignIn';
import SignUp from './SignUp';
import '../App.css';

// Main Registration Component
const Registration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        navigate('/home');
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Sign Up Function
  const handleSignUp = async (signUpData) => {
    if (loading) return;
    
    if (signUpData.password !== signUpData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (signUpData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    if (!signUpData.username.trim()) {
      alert("Please enter a username");
      return;
    }

    setLoading(true);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        signUpData.email, 
        signUpData.password
      );
      
      const user = userCredential.user;
      
      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: signUpData.username,
        email: signUpData.email,
        createdAt: new Date(),
        lastLogin: new Date(),
        investor: false,
        creator: false,
        visitor: true,
      });
      
      alert("Account created successfully!");
    } catch (error) {
      console.error("Sign up error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sign In Function
  const handleSignIn = async (signInData) => {
    if (loading) return;
    
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        signInData.email, 
        signInData.password
      );
      
      const user = userCredential.user;
      
      // Update last login time in Firestore
      await setDoc(doc(db, "users", user.uid), {
        lastLogin: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Sign in error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // If user is authenticated, redirect to home
  if (user) {
    navigate('/home');
    return null;
  }

  // Determine which page to show based on URL
  if (location.pathname === '/signup') {
    return <SignUp onSignUp={handleSignUp} loading={loading} />;
  }
  
  // Default to sign in page
  return <SignIn onSignIn={handleSignIn} loading={loading} />;
}

export default Registration;