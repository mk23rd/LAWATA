import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase-config'; // Firebase auth instance

export const Auth = () => {
    // Store form input values for email and password
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const signIn = async () => {
        try {
            // Create a new user account using Firebase Email/Password auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created:", userCredential.user);
            alert("Account created successfully!");
        } catch (error) {
            // Provide basic feedback for any registration errors
            console.error("Error signing in:", error.message);
            alert(`Error: ${error.message}`);
        }
    };
    
    return (
        // Minimal inline-styled layout for quick testing
        <div style={{padding: '20px', fontFamily: 'Arial'}}>
            <h2>Create Account</h2>
            <input 
                // Capture email updates as the user types
                placeholder="Email" 
                onChange={(e) => setEmail(e.target.value)}
                style={{display: 'block', margin: '10px', padding: '8px', width: '200px'}}
            />
            <input 
                placeholder="Password" 
                type='password'
                // Capture password updates as the user types
                onChange={(e) => setPassword(e.target.value)}
                style={{display: 'block', margin: '10px', padding: '8px', width: '200px'}}
            />
            <button 
                // Trigger Firebase account creation
                onClick={signIn}
                style={{margin: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
            >
                Sign Up
            </button>
        </div>
    );
}