import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Footer from '../components/Footer';

function SignIn({ onSignIn, loading }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignIn = () => {
    onSignIn(formData);
  };

  const navigateToSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className='login-card'>
      <h1>Welcome!</h1>
      
      <div className='login-inp'>
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
      </div>
      
      <div className="login-opt">
        <div className="rememberme">
          <input type="checkbox" name="remember" id="" />
          <span>Remember Me!</span>
        </div>
        <p><a href="#blank">Forgot password?</a></p>
      </div>

      <div className='login-btns'>
        <Button text='LOG IN' callfunc={handleSignIn} loading={loading} />
      </div>

      <div className='create-account'>
        <Footer 
          onNavigate={navigateToSignUp}
          textOne="Don't have an account? "
          textTwo="Sign up"
        />
      </div>
    </div>
  );
}

export default SignIn;