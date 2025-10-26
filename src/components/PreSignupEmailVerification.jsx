import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Mail, RefreshCw, CheckCircle, ArrowLeft, Shield, Clock } from 'lucide-react';
import { auth } from '../firebase/firebase-config';
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser, reload } from 'firebase/auth';
import { gsap } from 'gsap';

const PreSignupEmailVerification = ({ 
  email, 
  onVerificationComplete, 
  onBack,
  formData 
}) => {
  const [tempUser, setTempUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initializationRef = useRef(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Create temporary Firebase user and send verification email
  const sendVerificationEmail = async () => {
    if (isSending || countdown > 0) return; // Prevent multiple rapid attempts
    
    console.log('sendVerificationEmail called', { isSending, countdown, tempUser: !!tempUser });
    setIsSending(true);
    try {
      // If tempUser already exists, just resend verification
      if (tempUser) {
        await sendEmailVerification(tempUser, {
          url: window.location.origin + '/signup-verify',
          handleCodeInApp: false
        });
        
        toast.success('Verification email resent! Please check your inbox.', {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        // Create temporary Firebase user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          formData.password
        );
        const user = userCredential.user;
        setTempUser(user);

        // Send verification email
        await sendEmailVerification(user, {
          url: window.location.origin + '/signup-verify',
          handleCodeInApp: false
        });
        
        toast.success('Verification email sent! Please check your inbox and click the link.', {
          position: "top-center",
          autoClose: 5000,
        });
      }
      
      setCountdown(60); // 60 second cooldown
      localStorage.setItem('lastEmailVerificationAttempt', Date.now().toString());
    } catch (error) {
      console.error('Error sending verification email:', error);
      let errorMessage = 'Failed to send verification email';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
        // If email exists, suggest going back to sign in
        setTimeout(() => {
          onBack();
        }, 3000);
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        setCountdown(300); // 5 minute cooldown for rate limiting
      }
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 8000,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Check verification status
  const checkVerificationStatus = async () => {
    if (!tempUser) return;

    setCheckingStatus(true);
    try {
      await reload(tempUser);
      if (tempUser.emailVerified) {
        toast.success('Email verified successfully!', {
          position: "top-center",
          autoClose: 3000,
        });
        onVerificationComplete(tempUser);
      } else {
        toast.info('Email not yet verified. Please check your inbox and click the verification link.', {
          position: "top-center",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      toast.error('Error checking verification status', {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setCheckingStatus(false);
    }
  };


  // Handle back button - cleanup temp user
  const handleBack = async () => {
    if (tempUser) {
      try {
        await deleteUser(tempUser);
      } catch (error) {
        console.error('Error deleting temp user:', error);
      }
    }
    onBack();
  };

  // Auto-check verification status periodically
  useEffect(() => {
    if (!tempUser) return;

    const checkInterval = setInterval(async () => {
      try {
        await reload(tempUser);
        if (tempUser.emailVerified) {
          clearInterval(checkInterval);
          onVerificationComplete(tempUser);
        }
      } catch (error) {
        console.error('Error in auto-check:', error);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(checkInterval);
  }, [tempUser, onVerificationComplete]);

  // Send initial verification email when component mounts (with delay to prevent rate limiting)
  useEffect(() => {
    if (initializationRef.current) return; // Prevent multiple initializations
    initializationRef.current = true;
    
    console.log('PreSignupEmailVerification useEffect triggered');
    
    // Check if we're already rate limited
    const lastAttempt = localStorage.getItem('lastEmailVerificationAttempt');
    const now = Date.now();
    
    if (lastAttempt && (now - parseInt(lastAttempt)) < 60000) {
      // Less than 1 minute since last attempt, set countdown
      const remainingTime = Math.ceil((60000 - (now - parseInt(lastAttempt))) / 1000);
      setCountdown(remainingTime);
      toast.info(`Please wait ${remainingTime} seconds before trying again.`, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    
    const timer = setTimeout(() => {
      // Store attempt time
      localStorage.setItem('lastEmailVerificationAttempt', now.toString());
      sendVerificationEmail();
    }, 1000); // 1 second delay to prevent immediate rate limiting
    
    return () => clearTimeout(timer);
  }, []);

  // Animate container width on mount and reveal content afterwards
  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    // Determine target width based on breakpoint (md = 768px)
    const isMd = window.matchMedia('(min-width: 768px)').matches;
    const targetWidth = isMd ? '600px' : '91.6667%'; // 11/12 = 91.6667%

    // Ensure initial state (in case SSR or hot reload)
    gsap.set(containerRef.current, { width: 25, overflow: 'hidden' });
    gsap.set(contentRef.current, { opacity: 0 });

    const tl = gsap.timeline();
    tl.to(containerRef.current, {
      width: targetWidth,
      duration: 1,
      ease: 'power2.out',
    })
      .set(containerRef.current, { overflow: 'visible' })
      .to(contentRef.current, {
        opacity: 1,
        duration: 0.1,
        ease: 'power1.out',
      });

    return () => {
      try { tl.kill(); } catch {}
    };
  }, []);

  return (
    <div className="fixed left-0 right-0 bottom-0 top-16 bg-color-a flex items-center md:items-start justify-center md:pt-10 z-[60]">
      <div className='absolute w-2 h-[46rem] md:h-[38rem] bg-color-b top-5 rounded-2xl'></div>
      <div ref={containerRef} style={{ width: '25px', overflow: 'hidden' }} className="bg-white border-color-b border-5 rounded-xl shadow-2xl p-6 md:p-5 h-[80vh] max-w-md w-11/12 md:w-[600px] mx-auto flex flex-col justify-between z-10">
        <div ref={contentRef} className="opacity-0">
        {/* Top section */}
        <div className="space-y-6 md:space-y-5 flex-1">
        {/* Header */}
        <div className="text-center mb-8 md:mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Verify Your Email
          </h2>
          <p className="text-gray-600 text-sm">
            We've sent a verification link to
          </p>
          <p className="font-semibold text-gray-900 mt-1 text-sm break-words">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-color-b" />
            Next Steps:
          </h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Check your email inbox (and spam folder)</li>
            <li>2. Click the verification link in the email</li>
            <li>3. Return to this page - we'll detect verification automatically</li>
          </ol>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-8 md:mb-6 p-2 bg-yellow-50 rounded-lg">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-yellow-800">
            Checking verification status automatically...
          </span>
        </div>
        </div>

        {/* Bottom section */}
        <div className="space-y-6 md:space-y-4 pt-2">
          {/* Manual Check Button */}
          <button
            onClick={checkVerificationStatus}
            disabled={checkingStatus}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg md:text-sm"
          >
            {checkingStatus ? (
              <>
                <RefreshCw className="w-4 h-10 md:h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-10 md:h-5" />
                I've Verified My Email
              </>
            )}
          </button>

          {/* Resend Email Button */}
          <button
            onClick={sendVerificationEmail}
            disabled={isSending || countdown > 0}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg md:text-sm"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-10 md:h-5 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>
                <Mail className="w-4 h-10 md:h-5" />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <Mail className="w-4 h-10 md:h-5" />
                Resend Verification Email
              </>
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="w-full flex items-center justify-center gap-2 text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign Up
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PreSignupEmailVerification;
