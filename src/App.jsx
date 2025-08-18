import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


function countup(){
  console.log('hellow from submit button')
}


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

    <button onClick={() =>{
      
    }}>
      {text}
    </button>
  )
}




function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
      <div>
        <InputField par = 'Username :' classname = 'usernameField' />
        <InputField par = 'Password :' classname = 'passwordField' inputtype = 'password' />  
      </div>
      <div>
        <Button  text = 'Login' />
        <Button text = 'Sign up' />
      </div>
    </>
  )
}

export default App
