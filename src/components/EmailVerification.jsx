import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase-config';
import { sendEmailVerification, reload } from 'firebase/auth';
import { toast } from 'react-toastify';
import { Mail, RefreshCw, CheckCircle, Clock } from 'lucide-react';

const EmailVerification = ({ user, onVerificationComplete, onCancel }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check verification status periodically
  useEffect(() => {
    if (!user) return;

    const checkVerificationStatus = async () => {
      try {
        await reload(user);
        if (user.emailVerified) {
          onVerificationComplete();
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Check every 3 seconds
    const interval = setInterval(checkVerificationStatus, 3000);
    return () => clearInterval(interval);
  }, [user, onVerificationComplete]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerificationEmail = async () => {
    if (!user) return;

    setIsResending(true);
    try {
      await sendEmailVerification(user, {
        url: window.location.origin + '/home', // Redirect URL after verification
        handleCodeInApp: false
      });
      
      toast.success('Verification email sent! Please check your inbox.', {
        position: "top-center",
        autoClose: 5000,
      });
      
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      console.error('Error sending verification email:', error);
      let errorMessage = 'Failed to send verification email';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait before requesting another email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationManually = async () => {
    if (!user) return;

    setCheckingStatus(true);
    try {
      await reload(user);
      if (user.emailVerified) {
        toast.success('Email verified successfully!', {
          position: "top-center",
          autoClose: 3000,
        });
        onVerificationComplete();
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

  // Send initial verification email when component mounts
  useEffect(() => {
    if (user && !user.emailVerified) {
      sendVerificationEmail();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We've sent a verification link to
          </p>
          <p className="font-semibold text-gray-900 mt-1">
            {user?.email}
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
            onClick={checkVerificationManually}
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
            disabled={isResending || countdown > 0}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
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

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel and Sign Out
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

export default EmailVerification;
