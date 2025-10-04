import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Reusable controlled input wrapper for form fields
function InputField({ placeholder, classname, inputtype, value, onChange, name, autoComplete }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = inputtype === 'password';

  return (
    <div className="input-field relative">
      <input 
        type={isPassword && showPassword ? 'text' : inputtype}
        className={classname}
        required
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}

export default InputField;