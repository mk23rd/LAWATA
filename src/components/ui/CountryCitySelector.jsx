import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Comprehensive country and city data
const countriesWithCities = {
  'Ethiopia': {
    flag: '🇪🇹',
    cities: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Awasa', 'Bahir Dar', 'Jimma', 'Jijiga', 'Shashamane', 'Bishoftu', 'Arba Minch', 'Hosaena', 'Harar', 'Dilla', 'Nekemte', 'Debre Markos', 'Debre Birhan', 'Adigrat', 'Woldiya', 'Kombolcha']
  },
  'United States': {
    flag: '🇺🇸',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington DC']
  },
  'United Kingdom': {
    flag: '🇬🇧',
    cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester', 'Coventry', 'Bradford', 'Cardiff', 'Belfast', 'Nottingham', 'Hull', 'Newcastle', 'Stoke-on-Trent', 'Southampton', 'Derby']
  },
  'Canada': {
    flag: '🇨🇦',
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'St. Catharines', 'Regina', 'Sherbrooke', 'Barrie']
  },
  'Australia': {
    flag: '🇦🇺',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston']
  },
  'Germany': {
    flag: '🇩🇪',
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster']
  },
  'France': {
    flag: '🇫🇷',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers', 'Grenoble', 'Dijon', 'Nîmes', 'Aix-en-Provence']
  },
  'India': {
    flag: '🇮🇳',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara']
  },
  'China': {
    flag: '🇨🇳',
    cities: ['Shanghai', 'Beijing', 'Chongqing', 'Tianjin', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing', 'Foshan', 'Shenyang', 'Hangzhou', 'Xian', 'Harbin', 'Qingdao', 'Changchun', 'Jinan', 'Kunming', 'Dalian']
  },
  'Japan': {
    flag: '🇯🇵',
    cities: ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama', 'Sagamihara', 'Kumamoto']
  },
  'South Korea': {
    flag: '🇰🇷',
    cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang', 'Yongin', 'Seongnam', 'Bucheon', 'Cheongju', 'Ansan', 'Jeonju', 'Anyang', 'Pohang', 'Uijeongbu', 'Siheung']
  },
  'Brazil': {
    flag: '🇧🇷',
    cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina']
  },
  'Mexico': {
    flag: '🇲🇽',
    cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Nezahualcóyotl', 'Chihuahua', 'Naucalpan', 'Mérida', 'Álvaro Obregón', 'San Luis Potosí', 'Aguascalientes', 'Hermosillo', 'Saltillo', 'Mexicali', 'Culiacán', 'Guadalupe']
  },
  'Argentina': {
    flag: '🇦🇷',
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Santiago del Estero', 'Corrientes', 'Posadas', 'Neuquén', 'Bahía Blanca', 'Paraná', 'Formosa', 'San Luis', 'La Rioja']
  },
  'South Africa': {
    flag: '🇿🇦',
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'East London', 'Vereeniging', 'Bloemfontein', 'Boksburg', 'Welkom', 'Newcastle', 'Krugersdorp', 'Diepsloot', 'Botshabelo', 'Brakpan', 'Witbank', 'Oberholzer']
  },
  'Nigeria': {
    flag: '🇳🇬',
    cities: ['Lagos', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Abuja', 'Sokoto', 'Onitsha', 'Warri', 'Okene', 'Calabar']
  },
  'Kenya': {
    flag: '🇰🇪',
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Kitale', 'Malindi', 'Garissa', 'Kakamega', 'Thika', 'Lamu', 'Naivasha', 'Meru', 'Nyeri', 'Kericho', 'Machakos', 'Homa Bay', 'Kitui', 'Wajir']
  },
  'Egypt': {
    flag: '🇪🇬',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta', 'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan', 'Damietta', 'Damanhur', 'Minya', 'Beni Suef', 'Hurghada']
  },
  'Morocco': {
    flag: '🇲🇦',
    cities: ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'Mohammedia', 'Khouribga', 'Beni Mellal', 'El Jadida', 'Taza', 'Nador', 'Settat', 'Larache', 'Ksar El Kebir']
  },
  'Ghana': {
    flag: '🇬🇭',
    cities: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Sunyani', 'Cape Coast', 'Obuasi', 'Teshie', 'Madina', 'Koforidua', 'Wa', 'Techiman', 'Ho', 'Nungua', 'Lashibi', 'Dome', 'Anloga', 'Bolgatanga', 'Taifa']
  }
};

const CountryCitySelector = ({
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
  error = false,
  disabled = false,
  className = ""
}) => {
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);

  const countries = Object.keys(countriesWithCities);

  // Update available cities when country changes
  useEffect(() => {
    if (selectedCountry && countriesWithCities[selectedCountry]) {
      setAvailableCities(countriesWithCities[selectedCountry].cities);
    } else {
      setAvailableCities([]);
    }
  }, [selectedCountry]);

  // Reset city when country changes
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      const countryData = countriesWithCities[selectedCountry];
      if (countryData && !countryData.cities.includes(selectedCity)) {
        onCityChange('');
      }
    }
  }, [selectedCountry, selectedCity, onCityChange]);

  const handleCountrySelect = (country) => {
    onCountryChange(country);
    setIsCountryDropdownOpen(false);
    // Reset city when country changes
    onCityChange('');
  };

  const handleCitySelect = (city) => {
    onCityChange(city);
    setIsCityDropdownOpen(false);
  };

  const getCountryFlag = (country) => {
    return countriesWithCities[country]?.flag || '🌍';
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Country Dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            disabled={disabled}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all
              ${error && !selectedCountry
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
              }
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              {selectedCountry ? (
                <>
                  <span className="text-lg">{getCountryFlag(selectedCountry)}</span>
                  <span className="text-gray-900">{selectedCountry}</span>
                </>
              ) : (
                <span className="text-gray-500">Select a country</span>
              )}
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isCountryDropdownOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* Country Dropdown Menu */}
          {isCountryDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <span className="text-lg">{getCountryFlag(country)}</span>
                  <span className="text-gray-900">{country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* City Dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && selectedCountry && setIsCityDropdownOpen(!isCityDropdownOpen)}
            disabled={disabled || !selectedCountry}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all
              ${error && !selectedCity
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
              }
              ${disabled || !selectedCountry 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-50 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center">
              {selectedCity ? (
                <span className="text-gray-900">{selectedCity}</span>
              ) : (
                <span className="text-gray-500">
                  {selectedCountry ? 'Select a city' : 'Select a country first'}
                </span>
              )}
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isCityDropdownOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* City Dropdown Menu */}
          {isCityDropdownOpen && selectedCountry && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
              {availableCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <span className="text-gray-900">{city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isCountryDropdownOpen || isCityDropdownOpen) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setIsCountryDropdownOpen(false);
            setIsCityDropdownOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CountryCitySelector;
