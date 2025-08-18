import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
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

async function getPokemon(name){

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)

        if(!response.ok){
            throw new Error(`cant find ${temp}`)
        }
        else{

          const data = await response.json()

          text = `${data.name}`

  
        }

}


let text 


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
        <Button text="Count" callfunc={() => {
          setCount(count + 1)
        }} />
      </div>
      <p>{count}</p>
    </>
  )
}

export default App
