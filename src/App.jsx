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
    <>
      
      <div>
        <InputField par = 'Username :' classname = 'usernameField' />
        <InputField par = 'Password :' classname = 'passwordField' inputtype = 'password' />  
      </div>
      <div>
        <Button  text = 'hi sami' />
        <Button text="Count" callfunc={() => {
          setCount(count + 1)
        }} />
      </div>
      <p>{count}</p>
    </>
  )
}

export default App
