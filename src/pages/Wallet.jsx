import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase-config';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CHAPA_PUBLIC_KEY = import.meta.env.VITE_CHAPA_API_KEY;

export default function Wallet() {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topup');
  const formRef = useRef(null);
  const paymentProcessedRef = useRef(false);

  const updateWalletBalance = async (amount) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        walletBalance: increment(Number(amount))
      });
      setBalance(prev => (prev || 0) + Number(amount));
      return true;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const handlePaymentReturn = async () => {
      if (paymentProcessedRef.current) {
        return;
      }
      const currentUrl = window.location.href;
      const decodedUrl = currentUrl.replace(/&amp;/g, '&');
      const url = new URL(decodedUrl);
      const params = new URLSearchParams(url.search);
      const txRef = params.get('tx_ref');
      const status = params.get('status');
      const amount = params.get('amount');
      if (status === 'success' && txRef && txRef.startsWith('wt-') && amount) {
        paymentProcessedRef.current = true;
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const currentBalance = userDoc.data()?.walletBalance || 0;
          const amountToAdd = Number(amount);
          const newBalance = Number(currentBalance) + amountToAdd;
          await updateDoc(doc(db, 'users', currentUser.uid), {
            walletBalance: newBalance
          });
          setBalance(newBalance);
          toast.success(`Successfully added $${amount} to your wallet`);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (error) {
          toast.error('Failed to process payment return');
        }
      } else if (status === 'success' && txRef && txRef.startsWith('wd-') && amount) {
        paymentProcessedRef.current = true;
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const currentBalance = userDoc.data()?.walletBalance || 0;
          const amountToSubtract = Number(amount);
          const newBalance = Number(currentBalance) - amountToSubtract;
          await updateDoc(doc(db, 'users', currentUser.uid), {
            walletBalance: newBalance
          });
          setBalance(newBalance);
          toast.success(`Successfully withdrew $${amount} from your wallet`);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (error) {
          toast.error('Failed to process withdrawal return');
        }
      }
    };
    if (currentUser) {
      handlePaymentReturn();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!currentUser) {
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const walletBalance = userDoc.data().walletBalance || 0;
          setBalance(walletBalance);
        }
      } catch (error) {
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
    const tempForm = document.createElement('form');
    tempForm.method = 'POST';
    tempForm.action = 'https://api.chapa.co/v1/hosted/pay';
    const txRef = `wt-${Date.now()}-${currentUser.uid.substring(0, 8)}`;
    const baseUrl = window.location.origin;
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
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      tempForm.appendChild(input);
    });
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (Number(withdrawAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!withdrawPhone) {
      toast.error('Please enter mobile number');
      return;
    }
    try {
      setIsLoading(true);
      const tempForm = document.createElement('form');
      tempForm.method = 'POST';
      tempForm.action = 'https://api.chapa.co/v1/hosted/pay';
      const txRef = `wd-${Date.now()}-${currentUser.uid.substring(0, 8)}`;
      const baseUrl = window.location.origin;
      const returnParams = new URLSearchParams({
        status: 'success',
        tx_ref: txRef,
        amount: withdrawAmount
      });
      const fields = {
        'public_key': CHAPA_PUBLIC_KEY,
        'tx_ref': txRef,
        'amount': withdrawAmount,
        'currency': 'ETB',
        'email': currentUser.email || '',
        'first_name': currentUser.displayName?.split(' ')[0] || 'User',
        'last_name': currentUser.displayName?.split(' ')[1] || '',
        'title': `Withdrawal: ${withdrawAmount} ETB`,
        'description': 'Withdrawing funds from your LAWATA wallet',
        'logo': 'https://your-logo-url.com/logo.png',
        'return_url': `${baseUrl}/wallet?${returnParams.toString()}`,
        'callback_url': `${baseUrl}/api/verify-payment`,
        'meta[title]': 'wallet-withdrawal',
        'meta[user_id]': currentUser.uid,
        'meta[amount]': withdrawAmount
      };
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        tempForm.appendChild(input);
      });
      document.body.appendChild(tempForm);
      tempForm.submit();
      document.body.removeChild(tempForm);
    } catch (error) {
      toast.error('Failed to process withdrawal');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-b mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a 
            href="/home" 
            className="text-color-b hover:text-blue-500 text-sm font-medium inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </a>
          <h2 className="text-2xl font-bold text-gray-800">Wallet</h2>
          <div className="w-10"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Balance</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                ${balance?.toFixed(2) || '0.00'}
              </h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-color-b" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex bg-white rounded-xl shadow p-1 mb-6">
          <button
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'topup' 
                ? 'bg-color-b text-white shadow' 
                : 'text-gray-600 hover:text-blue-400'
            }`}
            onClick={() => setActiveTab('topup')}
          >
            Add Funds
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'withdraw' 
                ? 'bg-color-b text-white shadow' 
                : 'text-gray-600 hover:text-blue-400'
            }`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>
        {activeTab === 'topup' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="mb-6">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Add
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  className="block w-full pl-7 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
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
                onClick={handleTopup}
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Add Funds'}
              </button>
            </div>
          </div>
        )}
        {activeTab === 'withdraw' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="mb-6">
              <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Withdraw
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="withdraw-amount"
                  id="withdraw-amount"
                  className="block w-full pl-7 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="mobile-number" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="text"
                id="mobile-number"
                className="block w-full py-4 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                placeholder="+251912345678"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
              />
            </div>
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700">
                  Withdrawal will be processed through Chapa to your mobile money account. This may take up to 24 hours.
                </p>
              </div>
            </div>
            <div>
              <button
                type="submit"
                onClick={handleWithdraw}
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </div>
          </div>
        )}
      </div>
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
    </div>
  );
}