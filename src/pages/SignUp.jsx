import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar";
import { useAuth } from "../lib/context/AuthContext";

import auth from "../assets/auth.jpg";
import { Eye, EyeOff } from "lucide-react";

const SignUp = () => {
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mailError, setMailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");

  const { registerUser } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateName = (name) => {
    return name.length >= 2;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMailError("");
    setPasswordError("");
    setNameError("");

    // Validate name
    if (!validateName(name)) {
      setNameError("Name must be at least 2 characters long");
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setMailError("Please enter a valid email address");
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    const userInfo = { name, email, password };
    await registerUser(userInfo);
  };

  return (
    <div>
      <AuthNavbar />
      <div className="bg-[#fffffb] flex flex-col md:flex-row justify-center items-center w-full min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center justify-center w-full md:w-1/2 h-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-[180px] py-10 md:py-0">
          <div className="items-start pb-6 md:pb-8 w-full">
            <h1 className="font-overpass text-2xl md:text-3xl text-left tracking-[5%]">
              DataShift
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Join Us and Capture, Organize, and Elevate Your Ideas.
            </p>
          </div>
          <div className="flex flex-col w-full">
            <form className="space-y-4 md:space-y-6">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="off"
                  placeholder="John Doe"
                  className="border-b border-gray-300 focus:outline-hidden pl py-2 w-full"
                />
                {nameError && (
                  <p className="text-red-500 text-sm">{nameError}</p>
                )}
              </div>
              <div className="flex flex-col w-full">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="off"
                  placeholder="john@gmail.com"
                  className="border-b border-gray-300 focus:outline-hidden pl py-2 w-full"
                />
                {mailError && (
                  <p className="text-red-500 text-sm">{mailError}</p>
                )}
              </div>
              <div className="relative flex flex-col w-full">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="off"
                  placeholder="••••••••"
                  className="border-b border-gray-300 focus:outline-hidden pl py-2 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 rounded"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>
              <button
                onClick={handleSignUp}
                className="text-white bg-black rounded-full py-2 w-full"
              >
                Sign Up
              </button>
            </form>
          </div>
        </div>
        <div className="hidden md:block relative w-full md:w-1/2 h-full md:h-[calc(100vh-64px)]">
          <img
            src={auth}
            alt="auth-image"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
