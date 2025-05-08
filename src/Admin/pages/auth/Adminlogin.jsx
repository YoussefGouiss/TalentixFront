import React, { useState, useEffect } from 'react';
import { FiUser, FiLock, FiLogIn, FiInfo, FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';
// If you want to use react-router-dom for navigation after login
import { useNavigate } from 'react-router-dom';

// --- Configuration ---
// Make sure this matches your Laravel API's URL and port
const API_BASE_URL = 'http://localhost:8000/api/admin'; // Or your production URL

function AdminLogin() {
  const [email, setEmail] = useState(''); // Changed from username to email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  // For react-router-dom navigation
   const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Send email and password
      });

      const data = await response.json();

      if (response.ok) { // Status code 200-299
        // Login successful
        console.log('Login successful:', data);
        localStorage.setItem('admin_token', data.access_token); // Store the token
        localStorage.setItem('admin_token_type', data.token_type);
        localStorage.setItem('admin_token_expires_in', data.expires_in);

         navigate('/admin'); 

      } else {
        // Handle errors (e.g., 401 Unauthorized, 422 Validation)
        if (data.error) {
          setError(data.error); // For general errors like "Unauthorized"
        } else if (data.errors) {
          // For Laravel validation errors (though your login route doesn't typically return these specific ones)
          const firstErrorMessage = Object.values(data.errors)[0][0];
          setError(firstErrorMessage);
        } else {
          setError('Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <FiInfo size={30} className="text-[#FFFFFF]" />
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#34495E] via-[#2C3E50] to-[#22303F] overflow-hidden">
      {/* Background Shapes */}
      <div className={`absolute top-[-10%] left-[-15%] w-72 h-72 md:w-96 md:h-96 bg-[#3498DB]/10 rounded-full filter blur-3xl opacity-70 animate-pulse-slow transition-opacity duration-1000 ${isMounted ? 'opacity-70' : 'opacity-0'} animate-subtle-float`}></div>
      <div className={`absolute bottom-[5%] right-[-10%] w-60 h-80 md:w-80 md:h-96 bg-gradient-to-tr from-[#34495E]/30 via-[#2C3E50]/20 to-transparent rounded-3xl transform rotate-[30deg] filter blur-2xl opacity-60 transition-opacity duration-1000 delay-200 ${isMounted ? 'opacity-60' : 'opacity-0'}`}></div>
      <div className={`absolute bottom-[30%] left-[5%] w-24 h-24 md:w-32 md:h-32 bg-[#3498DB]/20 rounded-full filter blur-xl opacity-80 transition-opacity duration-1000 delay-400 ${isMounted ? 'opacity-80' : 'opacity-0'}`}></div>
      <div className={`absolute top-[15%] right-[10%] w-1 h-40 md:w-1.5 md:h-60 bg-gradient-to-b from-transparent via-[#ECF0F1]/10 to-transparent rounded-full transform -rotate-[20deg] opacity-50 transition-opacity duration-1000 delay-[600ms] ${isMounted ? 'opacity-50' : 'opacity-0'}`}></div>

      <div className={`relative z-10 bg-[#2C3E50]/70 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 border border-[#34495E]/30 transition-all duration-700 ease-out ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="p-8 md:p-12 flex flex-col justify-between text-[#FFFFFF] relative overflow-hidden">
          <div className="relative z-10">
            <div className={`mb-10 md:mb-16 transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
              <Logo />
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold mb-3 leading-tight transition-all duration-500 ease-out delay-100 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
              Espace Admin
            </h1>
            <div className={`w-16 h-1 bg-gradient-to-r from-[#3498DB] to-[#2980B9] rounded-full mb-6 transition-all duration-500 ease-out delay-100 ${isMounted ? 'opacity-100 scale-x-100' : 'opacity-100 scale-x-0'} origin-left`}></div>
            <p className={`text-[#ECF0F1]/80 text-sm md:text-base mb-8 leading-relaxed transition-all duration-500 ease-out delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
              Bienvenue dans votre interface d'administration.
              Connectez-vous pour gérer les ressources du système.
            </p>
          </div>
          <div className={`relative z-10 mt-auto transition-all duration-500 ease-out delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <button className="px-6 py-2.5 rounded-lg text-[#FFFFFF] text-sm font-semibold bg-gradient-to-r from-[#3498DB] to-[#2980B9] hover:from-[#2980B9] hover:to-[#3498DB] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-[#3498DB]/30">
              Support Admin
            </button>
          </div>
        </div>

        <div className="p-8 md:p-12 bg-[#2C3E50]/50 backdrop-blur-xl flex flex-col justify-center">
          <div className={`transition-all duration-500 ease-out delay-[400ms] ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <h2 className="text-[#FFFFFF] text-3xl font-bold mb-2">Admin Login</h2>
            <div className={`w-12 h-1 bg-gradient-to-r from-[#3498DB] to-[#2980B9] rounded-full mb-8 transition-all duration-500 ease-out delay-[400ms] ${isMounted ? 'opacity-100 scale-x-100' : 'opacity-100 scale-x-0'} origin-left`}></div>
          </div>

          <form onSubmit={handleLogin} className={`space-y-6 transition-all duration-500 ease-out delay-[500ms] ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <div>
              <label className="block text-[#ECF0F1]/80 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email Admin {/* Changed from Identifiant Admin */}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiUser className="h-4 w-4 text-[#ECF0F1]/60" />
                </span>
                <input
                  type="email" // Changed type to email for better validation/semantics
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#34495E]/40 border border-[#ECF0F1]/20 text-[#FFFFFF] rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/70 focus:border-transparent placeholder-[#ECF0F1]/50 w-full text-sm transition duration-150 shadow-inner focus:scale-[1.02] origin-left"
                  placeholder="admin@example.com" // Changed placeholder
                />
              </div>
            </div>
            <div>
              <label className="block text-[#ECF0F1]/80 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiLock className="h-4 w-4 text-[#ECF0F1]/60" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#34495E]/40 border border-[#ECF0F1]/20 text-[#FFFFFF] rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/70 focus:border-transparent placeholder-[#ECF0F1]/50 w-full text-sm transition duration-150 shadow-inner focus:scale-[1.02] origin-left"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-[#E74C3C]/20 border border-[#E74C3C]/50 rounded-lg text-center animate-fade-in-down">
                <p className="text-sm font-medium text-[#F5B7B1]">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-3 mt-2 rounded-lg text-[#FFFFFF] text-sm font-semibold bg-gradient-to-r from-[#3498DB] to-[#2980B9] hover:from-[#2980B9] hover:to-[#3498DB] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#3498DB]/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center`}
            >
              {loading ? (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : ('Connexion Admin')}
            </button>
          </form>
          <div className={`flex justify-center space-x-6 mt-8 pt-6 border-t border-[#ECF0F1]/10 transition-all duration-500 ease-out delay-[600ms] ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
            <a href="#" aria-label="Facebook" className="text-[#ECF0F1]/60 hover:text-[#FFFFFF] text-xl transition-all duration-200 hover:scale-110 active:scale-90"><FiFacebook /></a>
            <a href="#" aria-label="Instagram" className="text-[#ECF0F1]/60 hover:text-[#FFFFFF] text-xl transition-all duration-200 hover:scale-110 active:scale-90"><FiInstagram /></a>
            <a href="#" aria-label="Twitter" className="text-[#ECF0F1]/60 hover:text-[#FFFFFF] text-xl transition-all duration-200 hover:scale-110 active:scale-90"><FiTwitter /></a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;