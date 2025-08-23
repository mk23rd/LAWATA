import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase-config'; // Import named export

export const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const signIn = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created:", userCredential.user);
            alert("Account created successfully!");
        } catch (error) {
            console.error("Error signing in:", error.message);
            alert(`Error: ${error.message}`);
        }
    };
    
    return (
        <div style={{padding: '20px', fontFamily: 'Arial'}}>
            <h2>Create Account</h2>
            <input 
                placeholder="Email" 
                onChange={(e) => setEmail(e.target.value)}
                style={{display: 'block', margin: '10px', padding: '8px', width: '200px'}}
            />
            <input 
                placeholder="Password" 
                type='password'
                onChange={(e) => setPassword(e.target.value)}
                style={{display: 'block', margin: '10px', padding: '8px', width: '200px'}}
            />
            <button 
                onClick={signIn}
                style={{margin: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
            >
                Sign Up
            </button>
        </div>
    );
}