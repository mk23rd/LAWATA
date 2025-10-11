import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Mail, RefreshCw, CheckCircle, ArrowLeft, Shield, Clock } from 'lucide-react';
import { auth } from '../firebase/firebase-config';
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser, reload } from 'firebase/auth';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We've sent a verification link to
          </p>
          <p className="font-semibold text-gray-900 mt-1">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Next Steps:
          </h3>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Check your email inbox (and spam folder)</li>
            <li>2. Click the verification link in the email</li>
            <li>3. Return to this page - we'll detect verification automatically</li>
          </ol>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-yellow-50 rounded-lg">
          <Clock className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Checking verification status automatically...
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Manual Check Button */}
          <button
            onClick={checkVerificationStatus}
            disabled={checkingStatus}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingStatus ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                I've Verified My Email
              </>
            )}
          </button>

          {/* Resend Email Button */}
          <button
            onClick={sendVerificationEmail}
            disabled={isSending || countdown > 0}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>
                <Mail className="w-5 h-5" />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Resend Verification Email
              </>
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="w-full flex items-center justify-center gap-2 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Sign Up
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreSignupEmailVerification;
