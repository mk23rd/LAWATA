// Lightweight reusable button with loading and disabled handling
function Button({ text, callfunc, disabled = false, loading = false }) {  
  return (
    // Disable the button when explicitly disabled or while loading
    <button onClick={callfunc} disabled={disabled || loading}>
      {/* Swap label for a loading indicator when asynchronous work is pending */}
      {loading ? 'Loading...' : text}
    </button>
  );
}

export default Button;