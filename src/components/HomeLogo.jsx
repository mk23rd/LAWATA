import React, { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom' // Import Link
import { gsap } from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HomeLogo = () => {
  const letterRef = useRef([]);

  useEffect(() => {
    gsap.utils.toArray(".letter").forEach(letter => {
      gsap.to(letter, {
        bottom: "0%", // how far it should move down
        ease: "none",
        scrollTrigger: {
        trigger: letterRef.current,
        start: "top 70%", // when the top of the element hits center of viewport
        end: "bottom 30%", // when bottom hits topof viewport
        scrub: true, // smooth animation linked to scroll
        }
      });
    });
  }, []);

  
  
  
  
  const divRefs = useRef([]);

// Add element to refs array (only if not already added)
const addToRefs = (el) => {
  if (el && !divRefs.current.includes(el)) {
    divRefs.current.push(el);
  }
};

const handleMouseEnter = () => {
  divRefs.current?.forEach((el) => {
    gsap.to(el, {
      width: "150%",
      duration: 0.5,
      ease: "power3.out",
    });
  });
};

const handleMouseLeave = () => {
  divRefs.current?.forEach((el) => {
    gsap.to(el, {
      width: "100%",
      duration: 0.5,
      ease: "power3.inOut",
    });
  });
};
  

  return (
    <>
      <div className="w-1/20 h-full flex items-center justify-center relative">
        <div className="bg-color-b w-0.5 h-115 absolute"></div>
        <Link to="/projects" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter border-color-b border-3 bg-color-d h-50 w-full font-titan flex justify-center items-center relative z-10 mx-auto flex-none" style={{ bottom: "40%"}}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">C</p>
        </Link>
      </div>

      <div className="w-1/20 h-full flex items-center justify-center relative top-20">
        <div className="bg-color-b w-0.5 h-115 absolute"></div>
        <Link to="/projects" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="border-color-b border-3 bg-color-d w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "23%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">R</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-b w-0.5 h-115 absolute"></div>
        <Link to="/projects" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter border-color-b border-3 bg-color-d w-full h-70 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "20%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">E</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-b w-0.5 h-115 absolute"></div>
        <Link to="/projects" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter border-color-b border-3 bg-color-d w-full h-20 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "45%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">A</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-b w-0.5 h-115 absolute"></div>
        <Link to="/projects" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter border-color-b border-3 bg-color-d w-full h-80 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "10%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">T</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-b w-0.5 h-115 absolute"></div>
        <Link to="/projects" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter border-color-b border-3 bg-color-d w-full h-45 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "5%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">E</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "40%" }}>
          <p className="text-color-b sm:text-2xl md:text-4xl lg:text-6xl">&</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="bg-color-e w-full h-70 font-titan flex justify-center items-center z-10 mx-auto flex-none">
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">C</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-50 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "30%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">R</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-35 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "35%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">O</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-55 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "15%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">W</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "35%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">D</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-75 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "15%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">F</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-50 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "40%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">U</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-20 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "40%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">N</p>
        </Link>
      </div>

      <div className="w-1/20 h-full  flex items-center justify-center relative">
        <div className="bg-color-e w-0.5 h-115 absolute"></div>
        <Link to="/browse" ref={addToRefs} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="letter bg-color-e w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "10%" }}>
          <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">D</p>
        </Link>
      </div>
    </>
  )
}

export default HomeLogo
