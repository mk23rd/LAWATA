import React, { useState } from 'react';

const countries = [
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' }
];

const SimplePhoneInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter phone number",
  className = "",
  error = false,
  disabled = false 
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Ethiopia
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract country code and number from full international number
  React.useEffect(() => {
    if (value && value.startsWith('+')) {
      const matchedCountry = countries.find(country => 
        value.startsWith(country.dialCode)
      );
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.substring(matchedCountry.dialCode.length));
      }
    }
  }, [value]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    const fullNumber = country.dialCode + phoneNumber;
    const isValid = validatePhoneNumber(phoneNumber, country.code);
    
    if (onChange) {
      onChange({
        number: fullNumber,
        isValid: isValid,
        countryCode: country.code.toLowerCase(),
        dialCode: country.dialCode
      });
    }
  };

  const handlePhoneNumberChange = (e) => {
    const number = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
    setPhoneNumber(number);
    
    const fullNumber = selectedCountry.dialCode + number;
    const isValid = validatePhoneNumber(number, selectedCountry.code);
    
    if (onChange) {
      onChange({
        number: fullNumber,
        isValid: isValid,
        countryCode: selectedCountry.code.toLowerCase(),
        dialCode: selectedCountry.dialCode
      });
    }
  };

  const validatePhoneNumber = (number, countryCode) => {
    if (!number) return false;
    
    // Basic validation rules for different countries
    const validationRules = {
      'ET': { minLength: 9, maxLength: 9 }, // Ethiopia
      'US': { minLength: 10, maxLength: 10 }, // US
      'GB': { minLength: 10, maxLength: 11 }, // UK
      'CA': { minLength: 10, maxLength: 10 }, // Canada
      'AU': { minLength: 9, maxLength: 9 }, // Australia
      'DE': { minLength: 10, maxLength: 12 }, // Germany
      'FR': { minLength: 9, maxLength: 10 }, // France
      'IN': { minLength: 10, maxLength: 10 }, // India
      'CN': { minLength: 11, maxLength: 11 }, // China
      'JP': { minLength: 10, maxLength: 11 }, // Japan
      'KR': { minLength: 9, maxLength: 11 }, // South Korea
      'BR': { minLength: 10, maxLength: 11 }, // Brazil
      'MX': { minLength: 10, maxLength: 10 }, // Mexico
      'AR': { minLength: 10, maxLength: 10 }, // Argentina
      'ZA': { minLength: 9, maxLength: 9 }, // South Africa
      'NG': { minLength: 10, maxLength: 11 }, // Nigeria
      'KE': { minLength: 9, maxLength: 9 }, // Kenya
      'EG': { minLength: 10, maxLength: 11 }, // Egypt
      'MA': { minLength: 9, maxLength: 9 }, // Morocco
      'GH': { minLength: 9, maxLength: 10 } // Ghana
    };

    const rule = validationRules[countryCode] || { minLength: 7, maxLength: 15 };
    return number.length >= rule.minLength && number.length <= rule.maxLength;
  };

  return (
    <div className="relative">
      <div className={`
        flex rounded-lg border transition-all
        ${error 
          ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent' 
          : 'border-gray-300 focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent'
        }
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        ${className}
      `}>
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-3 border-r border-gray-300 rounded-l-lg
              ${disabled ? 'cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
              focus:outline-none focus:ring-0
            `}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">
              {selectedCountry.dialCode}
            </span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 text-sm">{country.name}</span>
                  <span className="text-sm text-gray-500">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 px-4 py-3 rounded-r-lg border-0 focus:outline-none focus:ring-0
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-transparent'}
          `}
        />
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default SimplePhoneInput;
