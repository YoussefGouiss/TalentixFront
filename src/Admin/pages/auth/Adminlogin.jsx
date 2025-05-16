import React, { useState, useEffect } from 'react';
import { FiUser, FiLock, FiLogIn, FiInfo, FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:8000/api/admin';

// --- New Color Palette (derived from dashboard image, applied to original structure) ---
const THEME_PAGE_BG = '#F5EFEB';                            // Light bluish gray page background
const THEME_CARD_BG = '#FFFFFF';                            // White card background
const THEME_CARD_BORDER = '#E0E4E8';                        // Softer border for card
const THEME_CARD_SHADOW = '0 10px 25px -5px rgba(0,0,0,0.05), 0 20px 20px -10px rgba(0,0,0,0.04)'; // Softer shadow

const THEME_ACCENT_PRIMARY = '#26A69A';                     // Teal (from Talentix logo, for buttons, highlights)
const THEME_ACCENT_PRIMARY_HOVER = '#1D7A70';               // Darker Teal for hover
const THEME_ACCENT_SECONDARY = '#5A6268';                   // Slate Gray-Blue (for "Ajouter" button style if needed)

const THEME_TEXT_PRIMARY_ON_LIGHT = '#343A40';              // Dark Gray for titles, main text on light card
const THEME_TEXT_SECONDARY_ON_LIGHT = '#6C757D';            // Muted Gray for subtitles, placeholders on light card
const THEME_TEXT_ON_ACCENT_BUTTON = '#FFFFFF';              // White text for primary buttons

const THEME_INPUT_BG = '#FFFFFF';
const THEME_INPUT_BORDER = '#CED4DA';                       // Standard input border gray
const THEME_INPUT_FOCUS_BORDER = THEME_ACCENT_PRIMARY;      // Teal accent for focus
const THEME_INPUT_TEXT = THEME_TEXT_PRIMARY_ON_LIGHT;
const THEME_INPUT_PLACEHOLDER = THEME_TEXT_SECONDARY_ON_LIGHT;
const THEME_INPUT_ICON_COLOR = '#ADB5BD';                   // Muted gray for icons in inputs

const THEME_ERROR_BG = '#F8D7DA';
const THEME_ERROR_TEXT = '#721C24';
const THEME_ERROR_BORDER = '#F5C6CB';

// For background shapes, make them very subtle with the new theme
const THEME_SHAPE_COLOR_1 = `${THEME_ACCENT_PRIMARY}1A`; // Teal with ~10% alpha
const THEME_SHAPE_COLOR_2 = `${THEME_ACCENT_SECONDARY}1A`; // Slate with ~10% alpha
const THEME_SHAPE_GRADIENT_FROM = `${THEME_ACCENT_PRIMARY}0D`; // Teal with ~5% alpha
const THEME_SHAPE_GRADIENT_VIA = `${THEME_ACCENT_SECONDARY}0A`; // Slate with ~4% alpha


function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
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
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_token_type', data.token_type);
        localStorage.setItem('admin_token_expires_in', data.expires_in);
        navigate('/admin'); 
      } else {
        if (data.error) {
          setError(data.error);
        } else if (data.errors && Object.values(data.errors).length > 0 && Object.values(data.errors)[0].length > 0) {
          const firstErrorMessage = Object.values(data.errors)[0][0];
          setError(firstErrorMessage);
        } else if (data.message) { // Catching general message from API
            setError(data.message);
        }
        else {
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
    // Using primary accent color for the logo icon
    <FiInfo size={30} style={{ color: THEME_ACCENT_PRIMARY }} />
  );

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: THEME_PAGE_BG }} // Changed overall background
    >
      {/* Background Shapes - Adjusted colors for the new light theme */}
      <div 
        className={`absolute top-[-10%] left-[-15%] w-72 h-72 md:w-96 md:h-96 rounded-full filter blur-3xl opacity-70 animate-pulse-slow transition-opacity duration-1000 ${isMounted ? 'opacity-70' : 'opacity-0'} animate-subtle-float`}
        style={{ backgroundColor: THEME_SHAPE_COLOR_1 }}
      ></div>
      <div 
        className={`absolute bottom-[5%] right-[-10%] w-60 h-80 md:w-80 md:h-96 rounded-3xl transform rotate-[30deg] filter blur-2xl opacity-60 transition-opacity duration-1000 delay-200 ${isMounted ? 'opacity-60' : 'opacity-0'}`}
        style={{ background: `linear-gradient(to tr, ${THEME_SHAPE_GRADIENT_FROM}, ${THEME_SHAPE_GRADIENT_VIA}, transparent)` }}
      ></div>
      <div 
        className={`absolute bottom-[30%] left-[5%] w-24 h-24 md:w-32 md:h-32 rounded-full filter blur-xl opacity-80 transition-opacity duration-1000 delay-400 ${isMounted ? 'opacity-80' : 'opacity-0'}`}
        style={{ backgroundColor: THEME_SHAPE_COLOR_2 }}
      ></div>
      <div 
        className={`absolute top-[15%] right-[10%] w-1 h-40 md:w-1.5 md:h-60 rounded-full transform -rotate-[20deg] opacity-50 transition-opacity duration-1000 delay-[600ms] ${isMounted ? 'opacity-50' : 'opacity-0'}`}
        style={{ background: `linear-gradient(to bottom, transparent, ${THEME_SHAPE_COLOR_1}, transparent)` }}
      ></div>

      <div 
        className={`relative z-10 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 transition-all duration-700 ease-out ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        // Main card is now white, with a light border and softer shadow
        style={{ 
            backgroundColor: `${THEME_CARD_BG}F2`, // Slightly transparent white for backdrop-blur to have some effect
            borderColor: THEME_CARD_BORDER,
            borderWidth: '1px',
            boxShadow: THEME_CARD_SHADOW,
         }}
      >
        {/* Left Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className={`mb-10 md:mb-16 transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
              <Logo />
            </div>
            <h1 
              className={`text-4xl md:text-5xl font-bold mb-3 leading-tight transition-all duration-500 ease-out delay-100 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
              style={{ color: THEME_TEXT_PRIMARY_ON_LIGHT }} // Text color for light background
            >
              Espace Admin
            </h1>
            <div 
              className={`w-16 h-1 rounded-full mb-6 transition-all duration-500 ease-out delay-100 ${isMounted ? 'opacity-100 scale-x-100' : 'opacity-100 scale-x-0'} origin-left`}
              style={{ background: THEME_ACCENT_PRIMARY }} // Accent color for underline
            ></div>
            <p 
              className={`text-sm md:text-base mb-8 leading-relaxed transition-all duration-500 ease-out delay-200 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
              style={{ color: THEME_TEXT_SECONDARY_ON_LIGHT }} // Secondary text color
            >
              Bienvenue dans votre interface d'administration.
              Connectez-vous pour gérer les ressources du système.
            </p>
          </div>
          <div className={`relative z-10 mt-auto transition-all duration-500 ease-out delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <button 
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md"
              style={{ 
                backgroundColor: THEME_ACCENT_PRIMARY, 
                color: THEME_TEXT_ON_ACCENT_BUTTON,
                // Use a subtle shadow based on the accent color
                boxShadow: `0 4px 10px -2px ${THEME_ACCENT_PRIMARY}40` 
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME_ACCENT_PRIMARY_HOVER}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME_ACCENT_PRIMARY}
            >
              Support Admin
            </button>
          </div>
        </div>

        {/* Right Panel (Form) */}
        <div 
            className="p-8 md:p-12 backdrop-blur-sm flex flex-col justify-center"
            // Form panel can be same as card or slightly differentiated. Here, same as card.
            // Or for slight differentiation: style={{ backgroundColor: `${THEME_CARD_BG}E6` }}
        >
          <div className={`transition-all duration-500 ease-out delay-[400ms] ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <h2 className="text-3xl font-bold mb-2" style={{ color: THEME_TEXT_PRIMARY_ON_LIGHT }}>Admin Login</h2>
            <div 
              className={`w-12 h-1 rounded-full mb-8 transition-all duration-500 ease-out delay-[400ms] ${isMounted ? 'opacity-100 scale-x-100' : 'opacity-100 scale-x-0'} origin-left`}
              style={{ background: THEME_ACCENT_PRIMARY }}
            ></div>
          </div>

          <form onSubmit={handleLogin} className={`space-y-6 transition-all duration-500 ease-out delay-[500ms] ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <div>
              <label 
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: THEME_TEXT_SECONDARY_ON_LIGHT }}
              >
                Email Admin
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiUser className="h-4 w-4" style={{ color: THEME_INPUT_ICON_COLOR }} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-lg pl-10 pr-4 py-2.5 focus:outline-none w-full text-sm transition duration-150 shadow-sm focus:scale-[1.01] origin-left"
                  style={{
                    backgroundColor: THEME_INPUT_BG,
                    border: `1px solid ${THEME_INPUT_BORDER}`,
                    color: THEME_INPUT_TEXT,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = THEME_INPUT_FOCUS_BORDER;
                    e.target.style.boxShadow = `0 0 0 2px ${THEME_INPUT_FOCUS_BORDER}40`; // Lighter ring
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = THEME_INPUT_BORDER;
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label 
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: THEME_TEXT_SECONDARY_ON_LIGHT }}
              >
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiLock className="h-4 w-4" style={{ color: THEME_INPUT_ICON_COLOR }} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg pl-10 pr-4 py-2.5 focus:outline-none w-full text-sm transition duration-150 shadow-sm focus:scale-[1.01] origin-left"
                   style={{
                    backgroundColor: THEME_INPUT_BG,
                    border: `1px solid ${THEME_INPUT_BORDER}`,
                    color: THEME_INPUT_TEXT,
                  }}
                   onFocus={(e) => {
                    e.target.style.borderColor = THEME_INPUT_FOCUS_BORDER;
                    e.target.style.boxShadow = `0 0 0 2px ${THEME_INPUT_FOCUS_BORDER}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = THEME_INPUT_BORDER;
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && (
              <div 
                className="p-3 border rounded-lg text-center animate-fade-in-down" // Kept original animation
                style={{
                  backgroundColor: THEME_ERROR_BG,
                  borderColor: THEME_ERROR_BORDER,
                }}
              >
                <p className="text-sm font-medium" style={{ color: THEME_ERROR_TEXT }}>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-3 mt-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center`}
              style={{ 
                backgroundColor: THEME_ACCENT_PRIMARY, 
                color: THEME_TEXT_ON_ACCENT_BUTTON,
                boxShadow: `0 6px 12px -3px ${THEME_ACCENT_PRIMARY}50` // Softer shadow for button
              }}
              onMouseOver={(e) => { if(!loading) e.currentTarget.style.backgroundColor = THEME_ACCENT_PRIMARY_HOVER; }}
              onMouseOut={(e) => { if(!loading) e.currentTarget.style.backgroundColor = THEME_ACCENT_PRIMARY; }}
            >
              {loading ? (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : ('Connexion Admin')}
            </button>
          </form>
          <div 
            className={`flex justify-center space-x-6 mt-8 pt-6 transition-all duration-500 ease-out delay-[600ms] ${isMounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ borderTop: `1px solid ${THEME_CARD_BORDER}` }} // Use card border for separator
          >
            <a href="#" aria-label="Facebook" className="text-xl transition-all duration-200 hover:scale-110 active:scale-90" style={{color: THEME_INPUT_ICON_COLOR}} onMouseOver={(e) => e.currentTarget.style.color = THEME_ACCENT_PRIMARY} onMouseOut={(e) => e.currentTarget.style.color = THEME_INPUT_ICON_COLOR}><FiFacebook /></a>
            <a href="#" aria-label="Instagram" className="text-xl transition-all duration-200 hover:scale-110 active:scale-90" style={{color: THEME_INPUT_ICON_COLOR}} onMouseOver={(e) => e.currentTarget.style.color = THEME_ACCENT_PRIMARY} onMouseOut={(e) => e.currentTarget.style.color = THEME_INPUT_ICON_COLOR}><FiInstagram /></a>
            <a href="#" aria-label="Twitter" className="text-xl transition-all duration-200 hover:scale-110 active:scale-90" style={{color: THEME_INPUT_ICON_COLOR}} onMouseOver={(e) => e.currentTarget.style.color = THEME_ACCENT_PRIMARY} onMouseOut={(e) => e.currentTarget.style.color = THEME_INPUT_ICON_COLOR}><FiTwitter /></a>
          </div>
        </div>
      </div>
      <style jsx global>{`
        input::placeholder {
          color: ${THEME_INPUT_PLACEHOLDER} !important;
          opacity: 1; /* Firefox */
        }
        input:-ms-input-placeholder { 
          color: ${THEME_INPUT_PLACEHOLDER} !important;
        }
        input::-ms-input-placeholder { 
          color: ${THEME_INPUT_PLACEHOLDER} !important;
        }
      `}</style>
    </div>
  );
}

export default AdminLogin;