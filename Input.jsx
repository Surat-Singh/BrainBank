import React, { forwardRef } from "react";

const Input = forwardRef(function Input(
  { placeholder, type, value, onChange },
  ref
) {
  return (
    <input
      ref={ref}
      className="border rounded p-2"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
});

export default Input;
