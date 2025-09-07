function InputField({ /* par */placeholder, classname, inputtype, value, onChange, name }) {
  return (
    <div className="input-field">
      <input 
        type={inputtype} 
        className={classname}
        required
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