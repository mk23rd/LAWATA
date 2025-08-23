import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import '../App.css';

// InputField Component
function InputField({ par, classname, inputtype, value, onChange, name }) {
  return (
    <div className="input-field">
      <input 
        type={inputtype} 
        className={classname}
        placeholder=" "
        required
        value={value}
        onChange={onChange}
        name={name}
      />
      <label>{par}</label>
    </div>
  );
}

// Button Component
function Button({ text, callfunc, disabled = false, loading = false }) {  
  return (
    <button onClick={callfunc} disabled={disabled || loading}>
      {loading ? 'Loading...' : text}
    </button>
  );
}

// Footer Component
function Footer({ onNavigate, textOne, textTwo }) {
  return (
    <div className='footer'>
      <p>{textOne} 
        <span 
          onClick={onNavigate}
          style={{ color: '#667eea', textDecoration: 'none', cursor: 'pointer' }}
        >
          {textTwo}
        </span>
      </p>
    </div>
  );
}

// SignInPage Component
function SignInPage({ formData, handleInputChange, handleSignIn, footer, loading }) {
  return (
    <div className='login-card'>
      <h1>Welcome!</h1>
      
      <div className='login-inp'>
        <InputField 
          par='Email' 
          classname='emailField' 
          inputtype='email' 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <InputField 
          par='Password' 
          classname='passwordField' 
          inputtype='password' 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
        />  
      </div>
      
      <div className="login-opt">
        <div className="rememberme">
          <input type="checkbox" name="remember" id="" />
          <span>Remember Me!</span>
        </div>
        <p><a href="#blank">Forgot password?</a></p>
      </div>

      <div className='login-btns'>
        <Button text='LOG IN' callfunc={handleSignIn} loading={loading} />
      </div>

      <div className='create-account'>
        {footer}
      </div>
    </div>
  );
}

// SignUpPage Component
function SignUpPage({ formData, handleInputChange, handleSignUp, footer, loading }) {
  return (
    <div className='signup-card'>
      <h1>Create Account</h1>
      <div className='signup-inp'>
        <InputField 
          par='User Name' 
          classname='usernameField' 
          inputtype='text' 
          name="username"
          value={formData.username}
          onChange={handleInputChange}
        />
        <InputField 
          par='Email' 
          classname='emailField' 
          inputtype='email' 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
        />  
        <InputField 
          par='Password' 
          classname='passwordField' 
          inputtype='password' 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
        />  
        <InputField 
          par='Confirm Password' 
          classname='passwordField' 
          inputtype='password' 
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
        />  
      </div>
      
      <div className='signup-btns'>
        <Button text='SIGN UP' callfunc={handleSignUp} loading={loading} />
      </div>
      
      {footer}
    </div>
  );
}

// Main Registration Component
const Registration = () => {
  const navigate = useNavigate();
  
  // Separate state for each form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const [loading, setLoading] = useState(false);

  // Navigation functions with form clearing
  const navigateToSignUp = () => {
    setSignInData({ email: '', password: '' });
    navigate('/signup');
  };

  const navigateToSignIn = () => {
    setSignUpData({ email: '', password: '', confirmPassword: '', username: '' });
    navigate('/');
  };

  // Handle input changes for SignIn
  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData(prev => ({ ...prev, [name]: value }));
  };

  // Handle input changes for SignUp
  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({ ...prev, [name]: value }));
  };

  // Sign Up Function - UPDATED to store in Firestore
  const handleSignUp = async () => {
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
        lastLogin: new Date()
      });
      
      alert("Account created successfully!");
      navigate('/');
    } catch (error) {
      console.error("Sign up error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sign In Function - UPDATED to update last login time
  const handleSignIn = async () => {
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
      
      alert("Logged in successfully!");
    } catch (error) {
      console.error("Sign in error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={
          <SignInPage 
            formData={signInData}
            handleInputChange={handleSignInChange}
            handleSignIn={handleSignIn}
            footer={
              <Footer 
                onNavigate={navigateToSignUp}
                textOne="Don't have an account? "
                textTwo="Sign up"
              />
            }
            loading={loading}
          />
        } />
        <Route path="/signup" element={
          <SignUpPage 
            formData={signUpData}
            handleInputChange={handleSignUpChange}
            handleSignUp={handleSignUp}
            footer={
              <Footer 
                onNavigate={navigateToSignIn}
                textOne="Already have an account? "
                textTwo="Log In"
              />
            }
            loading={loading}
          />
        } />
      </Routes>
    </div>
  );
}

export default Registration;