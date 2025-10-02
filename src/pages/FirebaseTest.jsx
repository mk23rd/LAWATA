import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

// Diagnostic page used to verify Firestore connectivity at runtime
const FirebaseTest = () => {
  const [status, setStatus] = useState('Testing Firebase connection...');
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test if we can list collections (this tests basic connection)
        const querySnapshot = await getDocs(collection(db, 'products'));
        setStatus(`✅ Connected! Found ${querySnapshot.size} products`);
        
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setCollections(productsData);
        
        // Log the actual data for debugging
        console.log('Firebase products data:', productsData);
        
      } catch (error) {
        setStatus(`❌ Connection failed: ${error.message}`);
        console.error('Firebase error details:', error);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Connection Test</h1>
      <div className={`p-4 rounded mb-4 ${
        status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {status}
      </div>
      
      {collections.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Products Data:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(collections, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;