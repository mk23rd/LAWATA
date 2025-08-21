import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css'


function InputField({ par, classname, inputtype }) {
  return (
    <div className="input-field">
      <input 
        type={inputtype} 
        className={classname}
        placeholder=" "
        required
      />
      <label>{par}</label>
    </div>
    //  <>
    //   <p>{par}</p>
    //   <input type={inputtype} className={classname}/>
    // </>
  );
}

function Button({text, callfunc}){  
  return(

   <button onClick={callfunc}>
      {text}
   </button>
  )
}

function Footer({goto,textOne,textTwo}){
  return(
    <div className='footer'>
      <p>{textOne} <Link to={goto} style={{ color: '#667eea', textDecoration: 'none'}}>
          {textTwo}
        </Link></p>
        
      
    </div>
    
  )
}
function SignInPage(){
  return(
    <div  className='login-card'>
      <h1>Welcome!</h1>
      
      <div className='login-inp'>
        <InputField par = 'Username' classname = 'usernameField' inputtype= 'text' />
        <InputField par = 'Password' classname = 'passwordField' inputtype = 'password' />  
      </div>
      <div className="login-opt">
        <div className="rememberme">
          <input type="checkbox" name="remember" id="" />
          <span>Remember Me!</span>
        </div>
        <p><a href="#blank">Forgot password?</a></p>
      </div>
      <div className='login-btns'>
        <Button  text = 'LOG IN' />
      </div>
      <div className='create-account'>
        <Footer goto="/signup" textOne = "Don't have an account" textTwo="Sign up"/>
      </div>
    </div>
  );
}
function SignUpPage(){
    return(
    <div  className='signup-card'>
      <h1>Create Account</h1>
      <div className='signup-inp'>
        <InputField par = 'User Name' classname = 'usernameField' inputtype= 'text' />
        <InputField par = 'Email' classname = 'passwordField' inputtype = 'password' />  
        <InputField par = 'Password' classname = 'passwordField' inputtype = 'password' />  
        <InputField par = 'Confirm Password' classname = 'passwordField' inputtype = 'password' />  
      </div>
      
      <div className='signup-btns'>
        <Button  text = 'SIGN UP' />
      </div>
      
      <Footer goto="/" textOne = "Already have an account" textTwo="Log In"/>
      
    </div>
  );
}


function App() {


  const [count, setCount] = useState(0);
  

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </div>
    </Router>
    
  )
}

export default App
