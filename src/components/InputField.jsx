// Reusable controlled input wrapper for form fields
function InputField({ /* par */placeholder, classname, inputtype, value, onChange, name }) {
  return (
    <div className="input-field">
      <input 
        // Accept any HTML input type (text, email, password, etc.)
        type={inputtype} 
        className={classname}
        required
        // Controlled value passed from parent state
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
      />
      {/* <label>{par}</label> */}
    </div>
  );
}

export default InputField;