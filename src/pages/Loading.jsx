import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Mobile-only loading (25 bars, no percent)
const MobileLoading = ({ onComplete }) => {
  const barsRef = useRef([]);
  const barsRandomTop = useRef(
    Array.from({ length: 15 }).map(() => Math.floor(Math.random() * 100))
  );

  useEffect(() => {
    const duration = 3;
    barsRef.current.forEach((bar) => gsap.set(bar, { opacity: 0 }));
    gsap.to(barsRef.current, {
      opacity: 1,
      duration: 0.2,
      stagger: duration / Math.max(barsRef.current.length, 1),
      ease: "power2.out",
    });
    gsap.delayedCall(duration, () => {
      if (onComplete) onComplete();
    });
  }, [onComplete]);

  return (
    <div className="h-screen w-screen overflow-clip flex justify-center items-center bg-white">
      <div className="w-1/24 h-full"></div>
      <div className="w-22/24 h-full flex flex-col justify-center items-center">
        <div className="h-3/4 w-full flex justify-center items-center gap-1 relative">
          {barsRandomTop.current.map((randomTop, index) => (
            <div
              key={index}
              ref={(el) => (barsRef.current[index] = el)}
              className="w-1/15 h-full flex items-center justify-center relative opacity-0"
            >
              <div
                className="bg-color-e w-0.5 h-90 absolute"
                style={{ bottom: `${randomTop}px` }}
              ></div>
              <div
                className="bg-color-e w-full h-50 font-titan flex justify-center items-center z-10 mx-auto flex-none relative"
                style={{ top: `${randomTop}px` }}
              ></div>
            </div>
          ))}
        </div>
        <div className="h-1/4 w-full flex flex-col justify-center items-center relative">
          <div className="w-full h-full flex justify-center items-center">
            <p className="text-color-b text-6xl font-titan">Loading...</p>
          </div>
        </div>
      </div>
      <div className="w-1/24 h-full"></div>
    </div>
  );
};

// Desktop/Tablet loading (original percent and 50 bars)
const DesktopLoading = ({ onComplete }) => {
  const [progress, setProgress] = useState(2);
  const percentRef = useRef(null);
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const barsRandomTop = useRef(
    Array.from({ length: 50 }).map(() => Math.floor(Math.random() * 100))
  );

  useEffect(() => {
    const duration = 3;

    if (containerRef.current && percentRef.current) {
      gsap.set(percentRef.current, { x: 0 });
      setProgress(2);
      barsRef.current.forEach((bar) => gsap.set(bar, { opacity: 0 }));

      const containerWidth = containerRef.current.clientWidth;
      const numberWidth = percentRef.current.clientWidth;
      const distance = containerWidth - numberWidth;

      const tl = gsap.timeline({
        onComplete: () => {
          if (onComplete) onComplete();
        },
      });

      tl.to(percentRef.current, {
        x: distance,
        duration: duration,
        ease: "power2.out",
        onUpdate: function () {
          const currentX = gsap.getProperty(percentRef.current, "x");
          const newProgress = Math.round((currentX / distance) * 100);
          setProgress(newProgress);

          const barsToShow = Math.ceil(
            (newProgress / 100) * barsRef.current.length
          );
          barsRef.current.forEach((bar, index) => {
            if (bar) {
              gsap.to(bar, { opacity: index < barsToShow ? 1 : 0, duration: 0.2 });
            }
          });
        },
      });
    }
  }, [onComplete]);

  return (
    <div className="h-screen w-screen overflow-clip flex justify-center items-center bg-white">
      <div className="w-1/24 h-full"></div>
      <div className="w-22/24 h-full flex flex-col justify-center items-center">
        {/* Animated Bars */}
        <div className="h-3/4 w-full flex justify-center items-center gap-1 relative">
          {barsRandomTop.current.map((randomTop, index) => (
            <div
              key={index}
              ref={(el) => (barsRef.current[index] = el)}
              className="w-1/50 h-full flex items-center justify-center relative opacity-0"
            >
              <div
                className="bg-color-e w-0.5 h-90 absolute"
                style={{ bottom: `${randomTop}px` }}
              ></div>
              <div
                className="bg-color-e w-full h-50 font-titan flex justify-center items-center z-10 mx-auto flex-none relative"
                style={{ top: `${randomTop}px` }}
              ></div>
            </div>
          ))}
        </div>

        {/* Progress Text */}
        <div
          ref={containerRef}
          className="h-1/4 w-full flex flex-col justify-center items-center relative"
        >
          <div className="w-full h-1/2 flex justify-start items-center relative">
            <p
              ref={percentRef}
              className="text-color-b text-6xl absolute left-0"
            >
            </p>
          </div>

          <div className="w-full h-1/2 flex justify-center items-center">
            <p className="text-color-e text-6xl font-titan">Loading...</p>
          </div>
        </div>
      </div>
      <div className="w-1/24 h-full"></div>
    </div>
  );
};

// Wrapper that shows mobile version on small screens only
const Loading = ({ onComplete }) => {
  return (
    <>
      <div className="block md:hidden">
        <MobileLoading onComplete={onComplete} />
      </div>
      <div className="hidden md:block">
        <DesktopLoading onComplete={onComplete} />
      </div>
    </>
  );
};

export default Loading;
