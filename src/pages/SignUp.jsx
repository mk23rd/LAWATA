import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Footer from '../components/Footer';

function SignUp({ onSignUp, loading }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = () => {
    onSignUp(formData);
  };

  const navigateToSignIn = () => {
    navigate('/signin');
  };

  return (
    <div className='signup-card'>
      <h1>Create Account</h1>
      <div className='signup-inp'>
        <InputField 
          par='User Name' 
          classname='usernameField' 
          inputtype='text' 
          name="username"
          value={formData.username}
          onChange={handleInputChange}
        />
        <InputField 
          par='Email' 
          classname='emailField' 
          inputtype='email' 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
        />  
        <InputField 
          par='Password' 
          classname='passwordField' 
          inputtype='password' 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
        />  
        <InputField 
          par='Confirm Password' 
          classname='passwordField' 
          inputtype='password' 
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
        />  
      </div>
      
      <div className='signup-btns'>
        <Button text='SIGN UP' callfunc={handleSignUp} loading={loading} />
      </div>
      
      <Footer 
        onNavigate={navigateToSignIn}
        textOne="Already have an account? "
        textTwo="Log In"
      />
    </div>
  );
}

export default SignUp;