// Simple footer with inline navigation action for onboarding screens
function Footer({ onNavigate, textOne, textTwo }) {
  return (
    <div className='footer'>
      {/* Static message with highlighted call-to-action */}
      <p>{textOne} 
        <span 
          // Trigger navigation or other callback supplied by parent
          onClick={onNavigate}
          style={{ color: '#667eea', textDecoration: 'none', cursor: 'pointer' }}
        >
          {textTwo}
        </span>
      </p>
    </div>
  );
}

export default Footer;