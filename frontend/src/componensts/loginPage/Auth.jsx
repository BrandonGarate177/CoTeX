import React, { useState } from 'react';

export default function VideoAndButtons() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validation
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.email) {
      setError('Email is required for signup');
      setLoading(false);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? 
      // USE .env for production
        process.env.REACT_APP_API_URL + '/api/auth/login/' :
        process.env.REACT_APP_API_URL + '/api/auth/register/' ;

      
      const requestData = isLogin ? 
        { username: formData.username, password: formData.password } : 
        { username: formData.username, email: formData.email, password: formData.password };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store tokens in localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      setMessage(isLogin ? 'Login successful!' : 'Account created successfully!');
      
      // Redirect to dashboard or main app after successful auth
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (err) {
      console.error("Auth error:", err);
      
      // Check if it's a network error
      if (!err.response && !window.navigator.onLine) {
        setError("Network error. Please check your internet connection.");
      } else if (err.message === "Failed to fetch") {
        setError("Cannot connect to the server. Please try again later.");
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[570px]">
      {/* Video placeholder */}
      <div className="w-full h-[250px] bg-[#D9D9D9] mb-6">
        {/* You can replace this with an actual video later */}
        <div className="flex items-center justify-center h-full text-gray-500">
          Product Demo Video
        </div>
      </div>

      {isLogin ? (
        // Login Form
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#3a0a5e] text-white"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#3a0a5e] text-white"
            />
          </div>
        </form>
      ) : (
        // Signup Form
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#3a0a5e] text-white"
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#3a0a5e] text-white"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#3a0a5e] text-white"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#3a0a5e] text-white"
            />
          </div>
        </form>
      )}

      {error && <div className="text-red-400 mb-4 text-center">{error}</div>}
      {message && <div className="text-green-400 mb-4 text-center">{message}</div>}
      
      <div className="flex justify-center space-x-6">
        {/* Login Button */}
        <button
          onClick={() => {
            setIsLogin(true);
            if (formData.username && formData.password) handleSubmit(new Event('click'));
          }}
          className={`w-[170px] h-[44px] bg-[#F7EBFD] shadow-md rounded-full text-black 
            text-[20px] font-semibold font-['Source_Code_Pro'] 
            ${isLogin ? 'bg-opacity-100' : 'bg-opacity-70'} ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          disabled={loading}
        >
          Login
        </button>

        {/* Sign Up Button */}
        <button
          onClick={() => {
            setIsLogin(false);
            if (!isLogin && formData.username && formData.email && formData.password && 
                formData.password === formData.confirmPassword) {
              handleSubmit(new Event('click'));
            }
          }}
          className={`w-[170px] h-[44px] bg-[#F7EBFD] shadow-md rounded-full text-black 
            text-[20px] font-semibold font-['Source_Code_Pro'] 
            ${!isLogin ? 'bg-opacity-100' : 'bg-opacity-70'} ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          disabled={loading}
        >
          SIGN UP
        </button>
      </div>
    </div>
  );
}