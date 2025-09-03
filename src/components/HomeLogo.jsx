import React, { useRef, useEffect } from 'react'
import { gsap } from "gsap";

const HomeLogo = (Props) => {
  const logoRef = useRef(null)

  // Register ref into global groups (via window or context)
  useEffect(() => {
    if (!window.logoGroups) window.logoGroups = { create: [], invest: [] }

    if (Props.group) {
      window.logoGroups[Props.group].push(logoRef)
    }

    return () => {
      if (Props.group) {
        window.logoGroups[Props.group] = window.logoGroups[Props.group].filter(
          ref => ref !== logoRef
        )
      }
    }
  }, [Props.group])

  const handleMouseEnter = () => {
    if (Props.group && window.logoGroups[Props.group]) {
      gsap.to(window.logoGroups[Props.group].map(r => r.current), {
        width: [Props.wid],
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.05
      })
    }
  }

  const handleMouseLeave = () => {
    if (Props.group && window.logoGroups[Props.group]) {
      gsap.to(window.logoGroups[Props.group].map(r => r.current), {
        width: "100%",
        duration: 0.5,
        ease: "power3.inOut",
        stagger: 0.05
      })
    }
  }

  return (
    <div className={`${Props.offset}`}>
      <div className={`${Props.connectorTop}`}></div>
      <div
        ref={logoRef}
        onMouseEnter={Props.expandable ? handleMouseEnter : undefined}
        onMouseLeave={Props.expandable ? handleMouseLeave : undefined}
        className={`${Props.boxHeight}`}
      >
        <p className={`${Props.paragraph}`}>{Props.letter}</p>
      </div>
      <div className={`${Props.connectorBottom}`}></div>
    </div>
  )
}

export default HomeLogo
