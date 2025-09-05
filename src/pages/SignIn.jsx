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
    <div className="bg-white rounded-2xl p-10 shadow-2xl w-[500px] max-w-[450px] animate-slideUp">
      <h1 className="text-center text-gray-800 text-3xl font-bold mb-8 tracking-tight">
        Welcome Back!
      </h1>
      
      <div className="flex flex-col gap-6 mb-8">
        <InputField 
          par="Email" 
          classname="w-4/5 px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-800 bg-gray-50 text-base focus:border-indigo-500 focus:bg-white focus:shadow-md outline-none transition duration-300"
          inputtype="email" 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <InputField 
          par="Password" 
          classname="w-4/5 px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-800 bg-gray-50 text-base focus:border-indigo-500 focus:bg-white focus:shadow-md outline-none transition duration-300"
          inputtype="password" 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
        />  
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <input type="checkbox" name="remember" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
          <span className="text-sm text-gray-600">Remember Me!</span>
        </div>
        <p className="text-sm text-indigo-600 font-semibold">
          <a href="#blank">Forgot password?</a>
        </p>
      </div>

      <div className="mb-6">
        <Button 
          text="LOG IN" 
          callfunc={handleSignIn} 
          loading={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-700 to-indigo-500 text-white text-lg font-semibold uppercase tracking-wide hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all duration-300"
        />
      </div>

      <div className="text-center border-t pt-6">
        <Footer 
          onNavigate={navigateToSignUp}
          textOne="Don't have an account? "
          textTwo="Sign Up"
        />
      </div>
    </div>
  );
}

export default SignIn;
