import React from 'react'

const HomeLogo = (Props) => {
  return (
    <div className={`${Props.offset}`}>
        <div className={`${Props.connectorTop}`}></div>
        <div className={`${Props.boxHeight}`}>
            <p className={`${Props.paragraph}`}>{Props.letter}</p>
        </div>
        <div className={`${Props.connectorBottom}`}></div>
    </div>
  )
}

export default HomeLogo