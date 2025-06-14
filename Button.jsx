

const variantClasses = {
  primary: "inline-flex items-center gap-2 bg-purple-300 text-white px-4 py-2 rounded-md hover:bg-purple-300 cursor-pointer",
  secondary: "inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-md cursor-pointer",
};

export function Button({ variant, text, startIcon, onOpen }) {
  return (
    <button
      className={variantClasses[variant]}
      onClick={onOpen}
    >
      {startIcon}
      {text}
    </button>
  );
}
