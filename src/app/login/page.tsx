'use client'; // This directive indicates that this component should run on the client-side

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path based on your structure
import { useRouter } from 'next/navigation';
import Header from '../../components/Header'; // Using the existing Header
import Footer from '../../components/Footer'; // Using the existing Footer

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isLoggedIn, login, userRole } = useAuth(); // Get isLoggedIn state and login function
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      // You could route based on role here if needed, e.g.
      // if (userRole === 'admin') router.push('/admin-dashboard');
      // else router.push('/gtas-validator');
      router.push('/gtas-validator'); // Default redirect to GTAS Validator
    }
  }, [isLoggedIn, router, userRole]); // Add userRole to dependency array

  const handleSubmit = async (event: React.FormEvent) => { // Make handleSubmit async
    event.preventDefault();
    setError(''); // Clear previous errors

    const success = await login(username, password); // Await the login call
    if (success) {
      console.log('Login successful');
      // Redirection handled by useEffect
    } else {
      setError('Invalid username or password.'); // Error message set by this component
    }
  };

  if (isLoggedIn) {
    // Optionally render a loading state or nothing while redirecting
    return (
        <>
            <Header />
            <main className="flex-grow flex items-center justify-center bg-gray-50 py-16 md:py-24">
                <div className="text-center text-gray-700">Redirecting...</div>
            </main>
            <Footer />
        </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-16 md:py-24">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Login to FedReconcile</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Username (e.g., admin or analyst)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3A7CA5]"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Password (e.g., password123 or gtaspass)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3A7CA5]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#3A7CA5] hover:bg-[#2A6C95] text-white font-bold py-2 px-4 rounded-md transition duration-300"
            >
              Login
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}