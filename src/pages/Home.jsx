import React from 'react'
import HomeLogo from '../components/homeLogo'

const Home = () => {
return (
    <div className='bg-color-d overflow-x-clip'>
            <div className='flex flex-col justify-center items-center h-screen'>
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

                    <main className='w-full h-3/5 flex gap-2 justify-center'>
                            <div className='bg-color-d w-2/26'></div>

                            <HomeLogo 
                                    letter="I"
                                    offset="w-1/26 relative top-28 flex flex-col items-center"
                                    connectorTop=""
                                    boxHeight="bg-color-e w-full h-50 font-titan flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-25"
                                    connectorBottom="bg-color-e w-0.5 h-56"
                            />
                            <HomeLogo 
                                    letter="N"
                                    offset="w-1/26 relative top-8 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-9"
                                    boxHeight="bg-color-e w-full h-65 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-35"
                                    connectorBottom="bg-color-e w-0.5 h-6"
                            />
                            <HomeLogo 
                                    letter="V"
                                    offset="w-1/26 relative -top-5 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-3"
                                    boxHeight="bg-color-e w-full h-80 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-54"
                                    connectorBottom="bg-color-e w-0.5 h-18"
                            />
                            <HomeLogo 
                                    letter="C"
                                    offset="w-1/26 relative -top-25 flex flex-col items-center"
                                    connectorTop="bg-color-b w-0.5 h-35"
                                    boxHeight="border-color-b border-3 w-full h-20 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-2"
                                    connectorBottom="bg-color-b w-0.5 h-25"
                            />
                            <HomeLogo 
                                    letter="E"
                                    offset="w-1/26 relative -top-25 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-32"
                                    boxHeight="bg-color-e w-full h-68 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-45"
                                    connectorBottom=""
                            />
                            <HomeLogo 
                                    letter="S"
                                    offset="w-1/26 relative top-3 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-15"
                                    boxHeight="bg-color-e w-full h-55 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-34"
                                    connectorBottom="bg-color-e w-0.5 h-25"
                            />
                            <HomeLogo 
                                    letter="R"
                                    offset="w-1/26 relative top-2 flex flex-col items-center"
                                    connectorTop="bg-color-b w-0.5 h-5"
                                    boxHeight="border-color-b border-3 w-full h-58 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-5"
                                    connectorBottom="bg-color-b w-0.5 h-5"
                            />
                            <HomeLogo 
                                    letter="T"
                                    offset="w-1/26 relative -top-14 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-15"
                                    boxHeight="bg-color-e w-full h-70 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-51"
                                    connectorBottom="bg-color-e w-0.5 h-5"
                            />
                            <HomeLogo 
                                    letter="/"
                                    offset="w-1/26 relative -top-15 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-60"
                                    boxHeight="bg-color-e w-full h-28 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-8"
                                    connectorBottom="bg-color-e w-0.5 h-3"
                            />
                            <HomeLogo 
                                    letter="C"
                                    offset="w-1/26 relative -top-5 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-40"
                                    boxHeight="bg-color-e w-full h-60 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-18"
                                    connectorBottom=""
                            />
                            <HomeLogo 
                                    letter="E"
                                    offset="w-1/26 relative -top-15 flex flex-col items-center"
                                    connectorTop=""
                                    boxHeight="border-color-b border-3 w-full h-70 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-27"
                                    connectorBottom="bg-color-b w-0.5 h-30"
                            />
                            <HomeLogo 
                                    letter="R"
                                    offset="w-1/26 relative -top-5 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-5"
                                    boxHeight="bg-color-e w-full h-75 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-53"
                                    connectorBottom="bg-color-e w-0.5 h-5"
                            />
                            <HomeLogo 
                                    letter="O"
                                    offset="w-1/26 relative top-30 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-3"
                                    boxHeight="bg-color-e w-full h-52 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-20"
                                    connectorBottom="bg-color-e w-0.5 h-28"
                            />
                            <HomeLogo 
                                    letter="A"
                                    offset="w-1/26 relative top-2 flex flex-col items-center"
                                    connectorTop="bg-color-b w-0.5 h-5"
                                    boxHeight="border-color-b border-3 w-full h-58 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-5"
                                    connectorBottom="bg-color-b w-0.5 h-30"
                            />
                            <HomeLogo 
                                    letter="W"
                                    offset="w-1/26 relative top-5 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-45"
                                    boxHeight="bg-color-e w-full h-20 flex justify-center"
                                    paragraph="text-color-b font-titan text-5xl relative top-5"
                                    connectorBottom="bg-color-e w-0.5 h-10"
                            />
                            <HomeLogo 
                                    letter="D"
                                    offset="w-1/26 relative top-30 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-15"
                                    boxHeight="bg-color-e w-full h-50 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-9"
                                    connectorBottom="bg-color-e w-0.5 h-5"
                            />
                            <HomeLogo 
                                    letter="F"
                                    offset="w-1/26 relative top-10 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-3"
                                    boxHeight="bg-color-e w-full h-60 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-41"
                                    connectorBottom="bg-color-e w-0.5 h-15"
                            />
                            <HomeLogo 
                                    letter="T"
                                    offset="w-1/26 relative -top-30 flex flex-col items-center"
                                    connectorTop="bg-color-b w-0.5 h-35"
                                    boxHeight="border-color-b border-3 w-full h-30 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-5"
                                    connectorBottom="bg-color-b w-0.5 h-3"
                            />
                            <HomeLogo 
                                    letter="U"
                                    offset="w-1/26 relative top-25 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-5"
                                    boxHeight="bg-color-e w-full h-75 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-25"
                                    connectorBottom="bg-color-e w-0.5 h-20"
                            />
                            <HomeLogo 
                                    letter="N"
                                    offset="w-1/26 relative -top-20 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-30"
                                    boxHeight="bg-color-e w-full h-60 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-45"
                                    connectorBottom="bg-color-e w-0.5 h-8"
                            />
                            <HomeLogo 
                                    letter="D"
                                    offset="w-1/26 relative top-20 flex flex-col items-center"
                                    connectorTop="bg-color-e w-0.5 h-15"
                                    boxHeight="bg-color-e w-full h-50 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-20"
                                    connectorBottom="bg-color-e w-0.5 h-15"
                            />
                            <HomeLogo 
                                    letter="E"
                                    offset="w-1/26 relative -top-15 flex flex-col items-center"
                                    connectorTop="bg-color-b w-0.5 h-15"
                                    boxHeight="border-color-b border-3 w-full h-45 flex justify-center"
                                    paragraph="text-color-b font-titan text-6xl relative top-12"
                                    connectorBottom="bg-color-b w-0.5 h-40"
                            />

                            <div className='bg-color-d w-2/26'></div>
                    </main>

                    <div className='w-screen h-1/5 flex items-center'>
                            <p className='text-4xl text-color-e font-light relative left-38'>Crowdfunding Meets Risk Intelligence - Where Every Investment <br /> is an Informed Decision</p>
                    </div>
            </div>

            <div className='h-screen w-screen'>
                    <nav className='h-1/7'></nav>
                    <main className='h-6/7'>
                            <div className='h-1/11 flex items-center justify-center'>
                                    <div className='w-1/3 h-full'></div>
                                    <div className='w-1/3 h-full flex items-center justify-center'>
                                            <p className='text-color-e text-5xl underline'>Fresh Favorites</p>
                                    </div>
                                    <div className='w-1/3 h-full flex justify-end items-center'>
                                            <div className='bg-red-500 h-full w-60'></div>
                                    </div>
                            </div>
                            
                            <div className='bg-green-500 h-10/11'></div>
                    </main>
            </div>

            <div className='h-screen w-screen'>
                    <nav className='h-1/7'></nav>
                    <main className='h-6/7'>
                            <div className='h-1/11 flex items-center justify-center'>
                                    <div className='w-1/3 h-full'></div>
                                    <div className='w-1/3 h-full flex items-center justify-center'>
                                            <p className='text-color-e text-5xl underline'>Meet The Creators</p>
                                    </div>
                                    <div className='w-1/3 h-full flex justify-end items-center'>
                                            <div className='bg-red-500 h-full w-60'></div>
                                    </div>
                            </div>
                            
                            <div className='bg-green-500 h-10/11'></div>
                    </main>
            </div>
    </div>
)
}

export default Home