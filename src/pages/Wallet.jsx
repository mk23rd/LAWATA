import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase-config';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Replace with your Chapa public test key
const CHAPA_PUBLIC_KEY = import.meta.env.VITE_CHAPA_API_KEY;

export default function Wallet() {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [topupAmount, setTopupAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef(null);
  const paymentProcessedRef = useRef(false);

  const updateWalletBalance = async (amount) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        walletBalance: increment(Number(amount))
      });
      
      // Update local state
      setBalance(prev => (prev || 0) + Number(amount));
      return true;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  };

  // Check for successful payment return from Chapa
  useEffect(() => {
    console.log('Payment return effect running, currentUser:', currentUser?.uid);
    
    const handlePaymentReturn = async () => {
      // Prevent duplicate processing
      if (paymentProcessedRef.current) {
        console.log('Payment already processed, skipping...');
        return;
      }
      
      // Get the full URL and decode HTML entities
      const currentUrl = window.location.href;
      const decodedUrl = currentUrl.replace(/&amp;/g, '&');
      
      // Create URL object to properly parse parameters
      const url = new URL(decodedUrl);
      const params = new URLSearchParams(url.search);
      
      const txRef = params.get('tx_ref');
      const status = params.get('status');
      const amount = params.get('amount');
      
      console.log('Raw URL:', currentUrl);
      console.log('Decoded URL:', decodedUrl);
      console.log('Payment return params:', { 
        txRef, 
        status, 
        amount,
        allParams: Object.fromEntries(params.entries())
      });
      
      // Only process if we have all required parameters and it's a wallet transaction
      if (status === 'success' && txRef && txRef.startsWith('wt-') && amount) {
        // Mark as processed
        paymentProcessedRef.current = true;
        try {
          console.log('Processing payment return...');
          
          // Get current balance first
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const currentBalance = userDoc.data()?.walletBalance || 0;
          console.log('Current balance from DB:', currentBalance);
          
          // Calculate new balance
          const amountToAdd = Number(amount);
          const newBalance = Number(currentBalance) + amountToAdd;
          
          console.log('Updating balance:', {
            current: currentBalance,
            adding: amountToAdd,
            newBalance: newBalance
          });
          
          // Update Firestore
          await updateDoc(doc(db, 'users', currentUser.uid), {
            walletBalance: newBalance
          });
          
          console.log('Updated balance in DB to:', newBalance);
          
          // Update local state
          setBalance(newBalance);
          
          // Show success message
          toast.success(`Successfully added $${amount} to your wallet`);
          
          // Clean up the URL without triggering a re-render
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          console.log('Payment processed successfully');
          
        } catch (error) {
          console.error('Error processing payment return:', error);
          toast.error('Failed to process payment return');
        }
      } else {
        console.log('Payment return conditions not met or no payment to process');
        console.log('Status:', status);
        console.log('txRef starts with wt-:', txRef?.startsWith('wt-'));
        console.log('Amount exists:', !!amount);
      }
    };
    
    if (currentUser) {
      handlePaymentReturn();
    }
  }, [currentUser]);

  useEffect(() => {
    console.log('Fetching wallet data...');
    
    const fetchWallet = async () => {
      if (!currentUser) {
        console.log('No current user, skipping wallet fetch');
        return;
      }
      
      try {
        console.log('Fetching user document for UID:', currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const walletBalance = userDoc.data().walletBalance || 0;
          console.log('Retrieved wallet balance:', walletBalance);
          setBalance(walletBalance);
        } else {
          console.log('User document does not exist');
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
        toast.error('Failed to load wallet');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, [currentUser]);

  const handleTopup = (e) => {
    e.preventDefault();
    if (!topupAmount || isNaN(topupAmount) || topupAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Create a temporary form for submission
    const tempForm = document.createElement('form');
    tempForm.method = 'POST';
    tempForm.action = 'https://api.chapa.co/v1/hosted/pay';
    
    // Add all form fields
    const txRef = `wt-${Date.now()}-${currentUser.uid.substring(0, 8)}`;
    const baseUrl = window.location.origin;
    
    // Create URLSearchParams to properly encode the URL
    const returnParams = new URLSearchParams({
      status: 'success',
      tx_ref: txRef,
      amount: topupAmount
    });
    
    const fields = {
      'public_key': CHAPA_PUBLIC_KEY,
      'tx_ref': txRef,
      'amount': topupAmount,
      'currency': 'ETB',
      'email': currentUser.email || '',
      'first_name': currentUser.displayName?.split(' ')[0] || 'User',
      'last_name': currentUser.displayName?.split(' ')[1] || '',
      'title': `Top-up: ${topupAmount} ETB`,
      'description': 'Adding funds to your LAWATA wallet',
      'logo': 'https://your-logo-url.com/logo.png',
      'return_url': `${baseUrl}/wallet?${returnParams.toString()}`,
      'callback_url': `${baseUrl}/api/verify-payment`,
      'meta[title]': 'wallet-topup',
      'meta[user_id]': currentUser.uid,
      'meta[amount]': topupAmount
    };
    
    // Create and append hidden inputs
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      tempForm.appendChild(input);
    });
    
    // Always append the form to submit to Chapa
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm);
    
    // In development, you can add a test button or use a different approach
    // but we'll remove the auto-update to match production behavior
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="mb-6">
          <a 
            href="/home" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Wallet</h2>
        
        <div className="space-y-6">
          <div>
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Your Wallet</div>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="text-4xl font-bold text-gray-900">
                ${balance?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {/* Hidden Chapa Form */}
          <form 
            ref={formRef}
            method="POST" 
            action="https://api.chapa.co/v1/hosted/pay"
            className="hidden"
          >
            <input type="hidden" name="public_key" value={CHAPA_PUBLIC_KEY} />
            <input type="hidden" name="tx_ref" value="" />
            <input type="hidden" name="amount" value="4000" />
            <input type="hidden" name="currency" value="ETB" />
            <input type="hidden" name="email" value="" />
            <input type="hidden" name="first_name" value="" />
            <input type="hidden" name="last_name" value="" />
            <input type="hidden" name="title" value="Wallet Top-up" />
            <input type="hidden" name="description" value="Adding funds to your wallet" />
            <input type="hidden" name="logo" value="https://your-logo-url.com/logo.png" />
            <input type="hidden" name="meta[title]" value="wallet-topup" />
          </form>

          {/* Visible Form */}
          <form onSubmit={handleTopup} className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Top-up Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Add Funds'}
              </button>
            </div>
          </form>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-500">Recent Transactions</h3>
            <div className="mt-4 text-center text-sm text-gray-500">
              No recent transactions
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}
