import React, { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom' // Import Link
import { gsap } from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HomeLogo = () => {
  const letterRef = useRef([]);

  useEffect(() => {
    gsap.utils.toArray(".crowd").forEach(letter => {
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

  useEffect(() => {
    gsap.utils.toArray(".create").forEach(letter => {
      gsap.to(letter, {
        top: "0%", // how far it should move down
        ease: "none",
        scrollTrigger: {
        trigger: letterRef.current,
        start: "top 30%", // when the top of the element hits center of viewport
        end: "bottom 70%", // when bottom hits topof viewport
        scrub: true, // smooth animation linked to scroll
        }
      });
    });
  }, []);

  const createdivRefs = useRef([]);
  const crowddivRefs = useRef([]);

  // Add element to refs array (only if not already added)
  const createaddToRefs = (el) => {
    if (el && !createdivRefs.current.includes(el)) {
      createdivRefs.current.push(el);
    }
  };

  const crowdaddToRefs = (el) => {
    if (el && !crowddivRefs.current.includes(el)) {
      crowddivRefs.current.push(el);
    }
  };

  const crowdhandleMouseEnter = () => {
    crowddivRefs.current?.forEach((el) => {
      gsap.to(el, {
        width: "135%",
        duration: 0.5,
        ease: "power3.out",
      });
    });
  };

  const crowdhandleMouseLeave = () => {
    crowddivRefs.current?.forEach((el) => {
      gsap.to(el, {
        width: "100%",
        duration: 0.5,
        ease: "power3.inOut",
      });
    });
  };

  const createhandleMouseEnter = () => {
    createdivRefs.current?.forEach((el) => {
      gsap.to(el, {
        width: "135%",
        duration: 0.5,
        ease: "power3.out",
      });
    });
  };

  const createhandleMouseLeave = () => {
    createdivRefs.current?.forEach((el) => {
      gsap.to(el, {
        width: "100%",
        duration: 0.5,
        ease: "power3.inOut",
      });
    });
  };

  

  return (
    <>
      <div className='w-20/20 h-full gap-5 hidden md:flex'>
        <div className="w-1/20 h-full flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-90 absolute top-10"></div>
          <Link to="/projects" ref={createaddToRefs} onMouseEnter={createhandleMouseEnter} onMouseLeave={createhandleMouseLeave} className="create border-color-b border-3 bg-color-d h-50 w-full font-titan flex justify-center items-center relative z-10 mx-auto flex-none" style={{ top: "20%"}}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">C</p>
          </Link>
        </div>

        <div className="w-1/20 h-full flex items-center justify-center relative top-20">
          <div className="bg-color-b w-0.5 h-115 absolute"></div>
          <Link to="/projects" ref={createaddToRefs} onMouseEnter={createhandleMouseEnter} onMouseLeave={createhandleMouseLeave} className="border-color-b border-3 bg-color-d w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "23%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">R</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-115 absolute"></div>
          <Link to="/projects" ref={createaddToRefs} onMouseEnter={createhandleMouseEnter} onMouseLeave={createhandleMouseLeave} className="create border-color-b border-3 bg-color-d w-full h-65 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ top: "20%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">E</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-105 absolute"></div>
          <Link to="/projects" ref={createaddToRefs} onMouseEnter={createhandleMouseEnter} onMouseLeave={createhandleMouseLeave} className="create border-color-b border-3 bg-color-d w-full h-20 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ top: "45%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">A</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-100 absolute"></div>
          <Link to="/projects" ref={createaddToRefs} onMouseEnter={createhandleMouseEnter} onMouseLeave={createhandleMouseLeave} className="create border-color-b border-3 bg-color-d w-full h-70 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ top: "10%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">T</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-100 absolute bottom-4"></div>
          <Link to="/projects" ref={createaddToRefs} onMouseEnter={createhandleMouseEnter} onMouseLeave={createhandleMouseLeave} className="create border-color-b border-3 bg-color-d w-full h-45 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ top: "5%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">E</p>
          </Link>
        </div>

        <div className="w-1/20 h-full flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-115 absolute"></div>
          <div className="bg-color-b border-color-e border-3 w-full h-80 font-titan flex justify-center items-center z-10 mx-auto flex-none">
            <p className="text-color-d sm:text-2xl md:text-4xl lg:text-6xl">OR</p>
          </div>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-100 absolute"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "40%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">C</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-90 absolute"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-50 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "30%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">R</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-70 absolute bottom-20"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-35 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "35%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">O</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-105 absolute "></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-55 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "15%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">W</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-115 absolute top-2"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "35%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">D</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-110 absolute"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-75 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "15%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">F</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-100 absolute bottom-10"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-50 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "40%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">U</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-80 absolute"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-20 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "40%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">N</p>
          </Link>
        </div>

        <div className="w-1/20 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-60 absolute"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-30 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "10%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl">D</p>
          </Link>
        </div>
      </div>
      
      <div className='w-5/5 h-full gap-5 sm:gap-5 flex items-center justify-center md:hidden'>
        <div className="w-1/5 h-full flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-90 absolute top-10"></div>
          <Link to="/projects" ref={createaddToRefs} onMouseEnter={createhandleMouseEnter} onMouseLeave={createhandleMouseLeave} className="create border-color-b border-3 bg-color-d h-50 w-full font-titan flex justify-center items-center relative z-10 mx-auto flex-none" style={{ top: "20%"}}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl flex flex-col items-center">
              <span className="text-color-b font-titan text-2xl md:text-4xl lg:text-6xl">C</span>
              <span className="text-color-b font-titan text-2xl md:text-4xl lg:text-6xl">R</span>
              <span className="text-color-b font-titan text-2xl md:text-4xl lg:text-6xl">E</span>
              <span className="text-color-b font-titan text-2xl md:text-4xl lg:text-6xl">A</span>
              <span className="text-color-b font-titan text-2xl md:text-4xl lg:text-6xl">T</span>
              <span className="text-color-b font-titan text-2xl md:text-4xl lg:text-6xl">E</span>
            </p>
          </Link>
        </div>

        <div className="w-3/5 h-full flex items-center justify-center relative">
          <div className="bg-color-b w-0.5 h-115 absolute"></div>
          <div className="bg-color-b border-color-e border-3 w-full h-80 font-titan flex justify-center items-center z-10 mx-auto flex-none">
            <p className="text-color-d text-5xl sm:text-6xl md:text-4xl lg:text-6xl">OR</p>
          </div>
        </div>

        <div className="w-1/5 h-full  flex items-center justify-center relative">
          <div className="bg-color-e w-0.5 h-100 absolute bottom-10"></div>
          <Link to="/browse" ref={crowdaddToRefs} onMouseEnter={crowdhandleMouseEnter} onMouseLeave={crowdhandleMouseLeave} className="crowd bg-color-e w-full h-70 font-titan flex justify-center items-center z-10 relative mx-auto flex-none" style={{ bottom: "40%" }}>
            <p className="text-color-b font-titan sm:text-2xl md:text-4xl lg:text-6xl flex flex-col items-center">
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">C</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">R</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">O</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">W</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">D</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">F</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">U</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">N</span>
              <span className="text-color-b font-titan text-xl md:text-4xl lg:text-6xl">D</span>
            </p>
          </Link>
        </div>
      </div>
    </>
  )
}

export default HomeLogo
