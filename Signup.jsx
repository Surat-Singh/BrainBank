import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // import Link
import { Button } from "../components/Button";
import Input from "../components/Input";
import axios from "axios";
import { Backend_URL } from "../config";

export default function Signup() {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  async function signup() {
    setError("");
    setSuccess("");

    const username = usernameRef.current?.value;
    const password = passwordRef.current?.value;

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      await axios.post(`${Backend_URL}/signup`, {
        username,
        password,
      });

      setSuccess("Signup successful! Redirecting...");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      console.error("Error in signup:", err);
      setError(err.response?.data?.message || "Signup failed");
    }
  }

  return (
    <div className="w-screen h-screen bg-gray-400 flex justify-center items-center">
      <div className="flex flex-col min-w-48 p-8 gap-4 rounded-md border">
        <Input ref={usernameRef} type="text" placeholder="username" />
        <Input ref={passwordRef} type="password" placeholder="password" />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="flex justify-center">
          <Button variant="secondary" text="signup" onOpen={signup} />
        </div>

        {/* Clickable text for existing users */}
        <div className="text-center mt-2">
          <Link to="/signin" className="text-sm text-blue-600 hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
