import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css'



function InputField({par, classname ,inputtype}){

  return (
    <>
      <p>{par}</p>
      <input type={inputtype} className={classname}/>
    </>
  )

}

function Button({text, callfunc}){  
  return(

   <button onClick={callfunc}>
      {text}
   </button>
  )
}

function Footer({goto}){
  return(
    <>
      <p>Don't have an Account? <Link to={goto} style={{ color: '#007bff', textDecoration: 'none' }}>
          Sign up
        </Link></p>
      
    </>
    
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
        <Footer goto="/signup" />
      </div>
    </div>
  );
}
function SignUpPage(){
    return(
    <div  className='login-card'>
      <h1>Welcome to signup!</h1>
      
      <Footer goto="/" />
      
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
