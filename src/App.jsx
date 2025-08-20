import { useState } from 'react'
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

function App() {


  const [count, setCount] = useState(0)

  return (
    <div  className='login-card'>

      <h1>Welcome!</h1>
      
      <div className='login-inp'>
        <InputField par = 'Username :' classname = 'usernameField' inputtype= 'text' />
        <InputField par = 'Password :' classname = 'passwordField' inputtype = 'password' />  
      </div>
      <div className="login-opt">
        <div className="rememberme">
          <input type="checkbox" name="remember" id="" />
          <span>Remember me!</span>
        </div>
        <p><a href="#blank">Forgot password?</a></p>
      </div>
      <div className='login-btns'>
        <Button  text = 'LOG IN' />
      </div>
      {/* <p>{count}</p> */}
      
    </div>
  )
}

export default App
