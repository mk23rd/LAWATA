import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Animated splash/loading experience displayed before the app becomes interactive
const Loading = ({ onComplete }) => {
  // Numeric percentage shown under the bar animation
  const [progress, setProgress] = useState(2);
  const percentRef = useRef(null);
  const containerRef = useRef(null);
  // Store references to each animated bar element
  const barsRef = useRef([]);
  const barsRandomTop = useRef(
    Array.from({ length: 50 }).map(() => Math.floor(Math.random() * 100))
  );

  useEffect(() => {
    const duration = 3; // loading duration

    if (containerRef.current && percentRef.current) {
      // Reset position & progress
      gsap.set(percentRef.current, { x: 0 });
      setProgress(2);
      barsRef.current.forEach((bar) => gsap.set(bar, { opacity: 0 }));

      const containerWidth = containerRef.current.clientWidth;
      const numberWidth = percentRef.current.clientWidth;
      const distance = containerWidth - numberWidth;

      const tl = gsap.timeline({
        onComplete: () => {
          if (onComplete) onComplete(); // trigger parent callback
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
              {progress}%
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

export default Loading;
