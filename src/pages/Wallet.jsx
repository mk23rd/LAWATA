import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase-config';
import { doc, getDoc, updateDoc, increment, collection, addDoc, setDoc, serverTimestamp, query, where, orderBy, limit, getDocs, runTransaction, onSnapshot } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CHAPA_PUBLIC_KEY = import.meta.env.VITE_CHAPA_API_KEY;

export default function Wallet() {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState({
    withdrawable: 0,
    nonWithdrawable: 0,
    total: 0
  });
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topup');
  const formRef = useRef(null);
  const paymentProcessedRef = useRef(false);

  const logTransaction = async (type, amount, status = 'completed', metadata = {}) => {
    try {
      if (!currentUser?.uid) {
        console.error('Cannot log transaction: No user is logged in');
        return null;
      }

      const numericAmount = Math.abs(Number(amount));
      const transactionData = {
        userId: currentUser.uid,
        type,
        amount: numericAmount,
        status,
        transactionTime: serverTimestamp(),
        ...metadata,
        debug_timestamp: new Date().toISOString()
      };

      // Add specific fields based on transaction type
      if (type === 'withdrawal' || type === 'deposit') {
        transactionData.funding = false;
        transactionData.equityBought = 0;
      }
      
      console.log('Creating transaction:', transactionData);
      
      // Use a transaction to ensure data consistency
      let transactionId = null;
      await runTransaction(db, async (transaction) => {
        // Create transaction record
        const transactionsCol = collection(db, 'transactions');
        const newTransRef = doc(transactionsCol);
        transaction.set(newTransRef, transactionData);
        transactionId = newTransRef.id;
      });
      
      console.log('Transaction logged successfully with ID:', transactionId);
      
      // Verify the transaction was written by reading it back
      if (transactionId) {
        const docRef = doc(db, 'transactions', transactionId);
        const verifyDoc = await getDoc(docRef);
        
        if (verifyDoc.exists()) {
          console.log('✅ Transaction verified in Firestore:', verifyDoc.id, verifyDoc.data());
        } else {
          console.error('❌ Transaction NOT found in Firestore after write!');
        }
      }
      
      return transactionId;
    } catch (error) {
      console.error('Error in logTransaction:', {
        error: error.message,
        type,
        amount,
        status,
        metadata,
        stack: error.stack
      });
      // Don't throw here to avoid blocking the main operation
      return null;
    }
  };

  const updateWalletBalance = async (amount, type = 'withdrawable', transactionType = 'deposit') => {
    if (!currentUser) return false;
    
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return false;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Use a transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        // Get the current wallet state
        const userDoc = await transaction.get(userRef);
        const currentWallet = userDoc.data()?.wallet || { withdrawable: 0, nonWithdrawable: 0 };
        
        // Calculate new values
        const newWithdrawable = type === 'withdrawable' 
          ? (currentWallet.withdrawable || 0) + numericAmount 
          : (currentWallet.withdrawable || 0);
          
        const newNonWithdrawable = type === 'nonWithdrawable' 
          ? (currentWallet.nonWithdrawable || 0) + numericAmount 
          : (currentWallet.nonWithdrawable || 0);
          
        const newTotal = newWithdrawable + newNonWithdrawable;
        
        // Prepare update data
        const updateData = {
          'wallet.withdrawable': type === 'withdrawable' ? newWithdrawable : currentWallet.withdrawable || 0,
          'wallet.nonWithdrawable': type === 'nonWithdrawable' ? newNonWithdrawable : currentWallet.nonWithdrawable || 0,
          'wallet.total': newTotal
        };
        
        // Update the document
        transaction.update(userRef, updateData);
        
        // Log the transaction
        const transactionsCol = collection(db, 'transactions');
        const newTransRef = doc(transactionsCol);
        transaction.set(newTransRef, {
          userId: currentUser.uid,
          type: transactionType,
          amount: Math.abs(numericAmount),
          status: 'completed',
          balanceType: type,
          previousBalance: currentWallet[type] || 0,
          newBalance: type === 'withdrawable' ? newWithdrawable : newNonWithdrawable,
          total: newTotal,
          transactionTime: serverTimestamp()
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error updating wallet:', error);
      await logTransaction(
        transactionType,
        numericAmount,
        'failed',
        {
          error: error.message,
          balanceType: type
        }
      );
      throw error;
    }
  };
  
  const transferToWithdrawable = async (amount) => {
    if (!currentUser || amount <= 0 || amount > wallet.nonWithdrawable) return false;
    
    const numericAmount = Number(amount);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        'wallet.nonWithdrawable': increment(-numericAmount),
        'wallet.withdrawable': increment(numericAmount)
      });
      
      // Log the transfer as a transaction
      await logTransaction('transfer', numericAmount, 'completed', {
        from: 'nonWithdrawable',
        to: 'withdrawable',
        newNonWithdrawable: wallet.nonWithdrawable - numericAmount,
        newWithdrawable: wallet.withdrawable + numericAmount
      });
      
      setWallet(prev => ({
        ...prev,
        nonWithdrawable: prev.nonWithdrawable - numericAmount,
        withdrawable: prev.withdrawable + numericAmount
      }));
      
      return true;
    } catch (error) {
      console.error('Error transferring funds:', error);
      await logTransaction('transfer', numericAmount, 'failed', {
        error: error.message,
        from: 'nonWithdrawable',
        to: 'withdrawable'
      });
      return false;
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
          const currentBalance = userDoc.data()?.wallet?.withdrawable || 0;
          const amountToAdd = Number(amount);
          const newBalance = Number(currentBalance) + amountToAdd;
          
          // Update wallet balance
          await updateDoc(doc(db, 'users', currentUser.uid), {
            'wallet.withdrawable': newBalance,
            'wallet.total': increment(amountToAdd)
          });
          
          // Log successful deposit
          await logTransaction('deposit', amountToAdd, 'completed', {
            method: 'chapa',
            previousBalance: currentBalance,
            newBalance: newBalance,
            reference: txRef
          });
          
          setWallet(prev => ({
            ...prev,
            withdrawable: newBalance,
            total: (prev.total || 0) + amountToAdd
          }));
          
          toast.success(`Successfully added $${amount} to your wallet`);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (error) {
          console.error('Deposit processing error:', error);
          await logTransaction('deposit', Number(amount), 'failed', {
            method: 'chapa',
            error: error.message,
            reference: txRef
          });
          toast.error('Failed to process payment return');
        }
      } else if (status === 'success' && txRef && txRef.startsWith('wd-') && amount) {
        paymentProcessedRef.current = true;
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const currentBalance = userDoc.data()?.wallet?.withdrawable || 0;
          const amountToSubtract = Number(amount);
          const newBalance = Number(currentBalance) - amountToSubtract;
          
          // Update wallet balance
          await updateDoc(doc(db, 'users', currentUser.uid), {
            'wallet.withdrawable': newBalance,
            'wallet.total': increment(-amountToSubtract)
          });
          
          // Log successful withdrawal
          await logTransaction('withdrawal', amountToSubtract, 'completed', {
            method: 'chapa',
            previousBalance: currentBalance,
            newBalance: newBalance,
            reference: txRef
          });
          
          setWallet(prev => ({
            ...prev,
            withdrawable: newBalance,
            total: (prev.total || 0) - amountToSubtract
          }));
          
          toast.success(`Successfully withdrew $${amount} from your wallet`);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (error) {
          console.error('Withdrawal processing error:', error);
          await logTransaction('withdrawal', Number(amount), 'failed', {
            method: 'chapa',
            error: error.message,
            reference: txRef
          });
          toast.error('Failed to process withdrawal return');
        }
      }
    };
    
    if (currentUser) {
      handlePaymentReturn();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    
    // Set up real-time listener for wallet data
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      try {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const withdrawable = userData.wallet?.withdrawable || 0;
          const nonWithdrawable = userData.wallet?.nonWithdrawable || 0;
          
          setWallet({
            withdrawable,
            nonWithdrawable,
            total: withdrawable + nonWithdrawable
          });
        }
      } catch (error) {
        console.error('Error in wallet listener:', error);
        toast.error('Error updating wallet data');
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error setting up wallet listener:', error);
      toast.error('Failed to set up real-time updates');
      setIsLoading(false);
    });
    
    // Clean up the listener when component unmounts or user changes
    return () => unsubscribe();
  }, [currentUser?.uid]); // Only re-run if user ID changes

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
    if (!currentUser) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > wallet.withdrawable) {
      toast.error('Insufficient withdrawable balance');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Log withdrawal initiation
      await logTransaction('withdrawal', -amount, 'pending', {
        method: 'chapa',
        previousBalance: wallet.withdrawable
      });
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4 mb-8">
            {/* Total Balance Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">ETB {wallet?.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-color-b" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Withdrawable Balance */}
              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Withdrawable</p>
                    <p className="text-xl font-semibold text-green-600">ETB {wallet?.withdrawable?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Non-Withdrawable Balance */}
              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Non-Withdrawable</p>
                    <p className="text-xl font-semibold text-blue-600">ETB {wallet?.nonWithdrawable?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {wallet?.nonWithdrawable > 0 && (
                  <button 
                    onClick={() => transferToWithdrawable(wallet.nonWithdrawable)}
                    className="mt-2 text-xs font-medium text-color-b hover:text-blue-700 transition-colors duration-200"
                  >
                    Transfer to Withdrawable
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-color-b"></div>
          </div>
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
        <div className="space-y-4 mb-8">
          {/* Total Balance Card */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">ETB {wallet?.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-color-b" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Withdrawable Balance */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Withdrawable</p>
                  <p className="text-xl font-semibold text-green-600">ETB {wallet?.withdrawable?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Non-Withdrawable Balance */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Non-Withdrawable</p>
                  <p className="text-xl font-semibold text-blue-600">ETB {wallet?.nonWithdrawable?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {wallet?.nonWithdrawable > 0 && (
                <button 
                  onClick={() => transferToWithdrawable(wallet.nonWithdrawable)}
                  className="mt-2 text-xs font-medium text-color-b hover:text-blue-700 transition-colors duration-200"
                >
                  Transfer to Withdrawable
                </button>
              )}
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
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-color-b hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-b disabled:opacity-50 disabled:cursor-not-allowed"
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
                Amount to Withdraw (Available: ETB {wallet?.withdrawable?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">ETB</span>
                </div>
                <input
                  type="number"
                  name="withdraw-amount"
                  id="withdraw-amount"
                  className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-color-b focus:border-color-b text-lg"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={wallet?.withdrawable || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
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
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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