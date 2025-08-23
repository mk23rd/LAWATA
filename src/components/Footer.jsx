function Footer({ onNavigate, textOne, textTwo }) {
  return (
    <div className='footer'>
      <p>{textOne} 
        <span 
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