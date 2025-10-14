// Lightweight reusable button with loading and disabled handling
function Button({ text, callfunc, disabled = false, loading = false }) {  
  return (
    // Disable the button when explicitly disabled or while loading
    <button onClick={callfunc} disabled={disabled || loading} className='bg-color-b z-30 flex items-center justify-center rounded-xl text-2xl text-color-d w-40 h-10'>
      {/* Swap label for a loading indicator when asynchronous work is pending */}
      {loading ? 'Loading...' : text}
    </button>
  );
}

export default Button;