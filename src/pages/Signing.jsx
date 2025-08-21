import React from 'react'

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
    </div>
  )
}

export default Signing