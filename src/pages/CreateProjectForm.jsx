import React, { useState, useRef, useEffect } from "react";
import MobileCreateProjectForm from "./MobileCreateProjectForm"; // first code version
import DesktopCreateProjectForm from "./DesktopCreateProjectForm"; // second code version

export default function CreateProjectFormWrapper() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {isMobile ? <MobileCreateProjectForm /> : <DesktopCreateProjectForm />}
    </>
  );
}
