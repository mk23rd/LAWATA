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
    <div className="bg-white rounded-2xl p-10 shadow-2xl w-[500px] max-w-[450px] animate-slideUp">
      <h1 className="text-center text-gray-800 text-3xl font-bold mb-8 tracking-tight">
        Create Account
      </h1>

      <div className="flex flex-col gap-6 mb-8">
        <InputField 
          par="User Name" 
          classname="w-4/5 px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-800 bg-gray-50 text-base focus:border-indigo-500 focus:bg-white focus:shadow-md outline-none transition duration-300"
          inputtype="text" 
          name="username"
          value={formData.username}
          onChange={handleInputChange}
        />
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
        <InputField 
          par="Confirm Password" 
          classname="w-4/5 px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-800 bg-gray-50 text-base focus:border-indigo-500 focus:bg-white focus:shadow-md outline-none transition duration-300"
          inputtype="password" 
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
        />  
      </div>
      
      <div className="mb-6">
        <Button 
          text="SIGN UP" 
          callfunc={handleSignUp} 
          loading={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold uppercase tracking-wide hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all duration-300"
        />
      </div>
      
      <div className="text-center border-t pt-6">
        <Footer 
          onNavigate={navigateToSignIn}
          textOne="Already have an account? "
          textTwo="Log In"
        />
      </div>
    </div>
  );
}

export default SignUp;
