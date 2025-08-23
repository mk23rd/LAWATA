function InputField({ par, classname, inputtype, value, onChange, name }) {
  return (
    <div className="input-field">
      <input 
        type={inputtype} 
        className={classname}
        placeholder=" "
        required
        value={value}
        onChange={onChange}
        name={name}
      />
      <label>{par}</label>
    </div>
  );
}

export default InputField;