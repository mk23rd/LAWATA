import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

function InputField({ par, classname, inputtype, placeholder }) {
  return (
    <div className="input-field">
      <input 
        type={inputtype} 
        className={classname}
        placeholder={placeholder}
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

const Signing = () => {
  return (
    <div className='bg-color-d overflow-clip'>
      <nav className='w-screen h-1/5'>
          <div className='fixed flex w-screen'>
              <div className='w-1/6 h-full flex justify-center items-center'>
                  <p className='font-titan text-3xl text-color-e relative top-5'>Name/Logo</p>
              </div>

              <div className='w-4/6 h-full flex justify-center items-center'>
                  <div className='bg-color-e rounded-2xl w-2xl h-13 relative gap-40 top-5 flex items-center justify-evenly'>
                      <a href="" className='text-color-d text-2xl'>Create</a>
                      <a href="" className='text-color-d text-2xl'>Browse Works</a>
                      <a href="" className='text-color-d text-2xl'>About</a>
                  </div>
              </div>

              <div className='w-1/6 h-full flex justify-center items-center'>
                  <div className='bg-color-e rounded-2xl w-35 h-10 relative top-5'></div>
              </div>
          </div>
      </nav>

      <main className='w-screen flex'>
        <div className='w-1/5 h-screen flex flex-col items-center'>
          <div className='h-3/5 w-full'></div>
          <div className='bg-color-e h-1/5 w-1.5'></div>
          <div className='bg-color-e h-1/5 w-full font-titan text-5xl text-color-b flex items-center justify-center'>Sign Up</div>
        </div>


        <div className='w-4/5 h-screen flex flex-col items-center'>
          <div className='h-4/5 w-full border-color-b border-l-6 border-b-6 flex items-center justify-center'>
            <div className=' text-color-e w-3xl h-96 gap-7 flex flex-col items-center justify-center'>

                <div className='font-titan text-7xl'>Login</div>
                
                <div className='flex flex-col gap-5'>
                  <InputField placeholder="User Name" classname = 'border-b-3 text-2xl border-color-e w-100 outline-0' inputtype= 'text' />
                  <InputField placeholder="Password" classname = 'border-b-3 text-2xl border-color-e w-100 outline-0' inputtype = 'password' />  
                </div>

                <div className="flex gap-20 text-xl">

                  <div className="flex gap-2 items-center justify-center">
                    <input className='w-4 h-4 rounded-sm' type="checkbox" name="remember" id="" />
                    <span>Remember Me !</span>
                  </div>

                  <p><a className='underline' href="#blank">Forgot password?</a></p>
                </div>

                <div className='bg-color-e flex items-center rounded-xl text-2xl justify-center text-color-d w-40 h-10'>
                  <Button text = 'Login' />
                </div>
            </div>
          </div>
          <div className='bg-color-b h-1/5 w-1.5'></div>
        </div>
      </main>

      <main className='w-screen flex'>
        <div className='w-4/5 h-screen flex flex-col items-center'>
          <div className='bg-color-e h-1/5 w-1.5'></div>
          <div className='h-4/5 w-full bg-color-e flex items-center justify-center'>
            <div className=' text-color-b w-3xl h-96 gap-10 flex flex-col items-center justify-center'>

                <div className='font-titan text-7xl'>Sign Up</div>
                
                <div className='flex flex-col gap-5'>
                  <InputField placeholder="User Name" classname = 'border-b-3 text-2xl border-color-b w-100 outline-0' inputtype= 'text' />
                  <InputField placeholder="Email" classname = 'border-b-3 text-2xl border-color-b w-100 outline-0' inputtype = 'email' /> 
                  <InputField placeholder="Password" classname = 'border-b-3 text-2xl border-color-b w-100 outline-0' inputtype = 'password' />
                  <InputField placeholder='Confirm Password' classname = 'border-b-3 text-2xl border-color-b w-100 outline-0' inputtype = 'password' />    
                </div>

                <div className='bg-color-b flex items-center rounded-xl text-2xl justify-center text-color-d w-40 h-10'>
                  <Button text = 'Sign Up' />
                </div>
            </div>
          </div>
        </div>

        <div className='w-1/5 h-screen flex flex-col items-center'>
          <div className='h-1/5 w-full border-color-b border-b-6 border-l-6 font-titan text-5xl text-color-b flex items-center justify-center'>Login</div>
          <div className='bg-color-b h-1/5 w-1.5'></div>
          <div className='h-3/5 w-full'></div>
        </div>
      </main>
    </div>
  )
}

export default Signing