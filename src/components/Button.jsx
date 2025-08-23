function Button({ text, callfunc, disabled = false, loading = false }) {  
  return (
    <button onClick={callfunc} disabled={disabled || loading}>
      {loading ? 'Loading...' : text}
    </button>
  );
}

export default Button;