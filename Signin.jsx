import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // import Link
import { Button } from "../components/Button";
import Input from "../components/Input";
import { Backend_URL } from "../config";
import axios from "axios";

export default function Signin() {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  async function clicked() {
    setError("");
    setSuccess("");

    const username = usernameRef.current?.value;
    const password = passwordRef.current?.value;

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const response = await axios.post(`${Backend_URL}/signin`, {
        username,
        password,
      });

      // Extract token if any and store, etc.
      const token = response.data.token ?? response.data.jwt;
      if (token) {
        localStorage.setItem("token", token);
      }
      setSuccess("Login successful! Redirecting…");
      console.log("Response:", response.data);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Error signing in:", err);
      setError(
        err.response?.data?.message ||
          "An unexpected error occurred during signin"
      );
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
          <Button variant="secondary" text="signin" onOpen={clicked} />
        </div>

        {/* Clickable text below button */}
        <div className="text-center mt-2">
          <Link to="/signup" className="text-sm text-blue-600 hover:underline">
            Don’t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
