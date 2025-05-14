import React, { useState } from 'react';

export default function LoginModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Log the URL for debugging
      const url = process.env.REACT_APP_API_URL + '/api/auth/login/';
      console.log('Attempting fetch to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies if your API uses sessions
        body: JSON.stringify(formData)
      });
      
      // Check for network errors
      if (!response) {
        throw new Error('Network response was not received');
      }

      // Try to parse the JSON, with error handling
      let data;
      try {
        const textData = await response.text();
        console.log('Raw response:', textData);
        
        // Try to parse as JSON if it looks like JSON
        if (textData && textData.trim().startsWith('{')) {
          data = JSON.parse(textData);
        } else {
          throw new Error('Response is not valid JSON');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Failed to parse server response');
      }

      // Handle the response
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Authentication failed');
      }

      // Success path
      console.log('Login successful:', data);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[calc(100%-600px)] flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-8 rounded-lg w-[400px] shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            placeholder="Username"
          />
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            placeholder="Password"
          />
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="flex justify-between">
            <button type="submit" disabled={loading} className="bg-purple-700 text-white px-4 py-2 rounded">
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button onClick={onClose} type="button" className="text-sm text-gray-600 underline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
