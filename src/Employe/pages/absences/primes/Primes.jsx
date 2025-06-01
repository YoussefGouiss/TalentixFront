import React, { useState, useEffect, useCallback } from 'react';
import {
  FaDollarSign,
  FaCalendarAlt,
  FaInfoCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaGift,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes
} from 'react-icons/fa';

// --- Re-usable components (Themed like Conge.jsx) ---

const Notification = ({ show, message, type, onDismiss }) => {
  if (!show && !message) return null; 

  const visibilityClasses = show 
    ? 'translate-y-0 opacity-100' 
    : '-translate-y-16 opacity-0 pointer-events-none';
  
  return (
    <div
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${visibilityClasses}
                  ${type === 'success' ? 'bg-green-500 text-white border-l-4 border-green-700' : ''}
                  ${type === 'error' ? 'bg-red-500 text-white border-l-4 border-red-700' : ''}
                  ${type === 'warning' ? 'bg-yellow-400 text-yellow-800 border-l-4 border-yellow-600' : ''}
                  flex items-center justify-between min-w-[300px]`}
    >
      <div className="flex items-center">
        {type === 'success' && <FaCheckCircle size={20} className="mr-3 flex-shrink-0" />}
        {type === 'error' && <FaTimesCircle size={20} className="mr-3 flex-shrink-0" />}
        {type === 'warning' && <FaExclamationTriangle size={20} className="mr-3 flex-shrink-0" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
        <FaTimes size={18} />
      </button>
    </div>
  );
};

const SkeletonLoader = ({ rows = 3 }) => (
  <div className="animate-pulse p-4 space-y-5">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-[#C8D9E6]/50">
        <div className="h-6 bg-[#C8D9E6]/70 rounded w-3/5 mb-4"></div> {/* Prime Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-[#C8D9E6]/60 rounded w-1/3 mb-1.5"></div> {/* Label */}
            <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/2"></div>      {/* Value */}
          </div>
          <div>
            <div className="h-4 bg-[#C8D9E6]/60 rounded w-1/3 mb-1.5"></div> {/* Label */}
            <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/2"></div>      {/* Value */}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#C8D9E6]/30">
            <div className="h-4 bg-[#C8D9E6]/60 rounded w-1/4 mb-1.5"></div> {/* Label */}
            <div className="h-4 bg-[#C8D9E6]/50 rounded w-full"></div>      {/* Value */}
        </div>
      </div>
    ))}
  </div>
);
// --- End of Re-usable Components ---

// --- API Configuration ---
const API_BASE_URL = 'http://localhost:8000/api'; // Your API base URL

export default function EmployePrimes() {
  const [myPrimes, setMyPrimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const getToken = useCallback(() => {
    return localStorage.getItem('employe_token'); // Ensure this key matches your auth setup
  }, []);
  
  const showAppNotification = (message, type = 'success', duration = 4000) => {
    setNotification({ show: true, message, type });
    const timer = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
    return () => clearTimeout(timer); 
  };

  const fetchMyPrimes = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Utilisateur non authentifié. Veuillez vous connecter pour voir vos primes.');
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(true);
    setError(null);

    try {
      // This endpoint should be mapped to your `PrimeController@mesPrimes` method
      const response = await fetch(`${API_BASE_URL}/employe/mes-primes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      const responseData = await response.json(); // Parse JSON regardless of status first

      if (!response.ok) {
        if (response.status === 401) {
             setError('Session expirée ou invalide. Veuillez vous reconnecter.');
             setIsAuthenticated(false);
             // Consider clearing the token: localStorage.removeItem('employe_token');
        } else {
            // Use message from parsed JSON if available
            throw new Error(responseData.message || responseData.error || 'Erreur lors de la récupération de vos primes.');
        }
        setMyPrimes([]); // Clear primes on error
      } else {
        // The backend returns { "primes": [...] }, so access responseData.primes
        setMyPrimes(Array.isArray(responseData.primes) ? responseData.primes : []);
      }

    } catch (err) {
      if (!error) { 
          setError(err.message);
      }
      // showAppNotification(err.message, 'error'); // Notification might be redundant if error is shown prominently
      setMyPrimes([]); 
    } finally {
      setIsLoading(false);
    }
  }, [getToken, error]); // Added 'error' to dep array to avoid stale closure if retry logic uses it

  useEffect(() => {
    fetchMyPrimes();
  }, [fetchMyPrimes]); // fetchMyPrimes is memoized with useCallback

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return 'N/A';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
  };

  if (!isLoading && !isAuthenticated && error) {
    return (
      <div className="min-h-screen bg-[#F5EFEB] flex flex-col items-center justify-center p-6">
        <Notification 
          show={notification.show} 
          message={notification.message} 
          type={notification.type}
          onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} 
        />
        <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-md w-full border border-red-300">
          <FaExclamationTriangle size={48} className="mx-auto text-red-500 mb-5" />
          <h2 className="text-2xl font-semibold text-[#2F4156] mb-3">Accès Restreint</h2>
          <p className="text-red-600 text-md mb-6">{error}</p>
           <button
                onClick={fetchMyPrimes}
                className="mt-4 px-6 py-2.5 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors font-medium"
            >
                Réessayer
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EFEB]"> 
      <Notification 
        show={notification.show} 
        message={notification.message} 
        type={notification.type}
        onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} 
      />

      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Mes Primes</h1>
        </header>
      </div>
        
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <SkeletonLoader rows={3} />
        ) : error && myPrimes.length === 0 ? ( 
          <div className="bg-white border border-red-200 p-10 rounded-lg shadow-md text-center">
            <FaExclamationTriangle size={40} className="mx-auto text-red-500 mb-4" />
            <p className="text-xl font-medium text-[#2F4156]">{error}</p>
            <p className="text-[#567C8D] mt-2">Impossible de charger vos primes. Veuillez réessayer plus tard.</p>
             <button
                onClick={fetchMyPrimes}
                className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
            >
                Réessayer
            </button>
          </div>
        ) : !error && myPrimes.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow-lg text-center border border-[#C8D9E6]/60">
            <FaGift size={48} className="mx-auto text-[#A0B9CD] mb-4" />
            <p className="text-xl font-medium text-[#2F4156]">Vous n'avez aucune prime enregistrée.</p>
            <p className="text-sm text-[#567C8D] mt-1">Les primes qui vous sont attribuées apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myPrimes.map((prime) => ( // Using prime.attribution_id if available and unique
              <div 
                key={prime.attribution_id || prime.prime_definition_id || Math.random()} // Prefer unique ID for attribution
                className="bg-white p-6 rounded-xl shadow-lg border border-[#C8D9E6]/50 hover:shadow-xl transition-shadow duration-300 ease-in-out"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-[#C8D9E6]/70">
                    <h2 className="text-xl font-semibold text-[#4A6582]">{prime.nom}</h2> {/* From primes.nom */}
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-2 sm:mt-0">
                       Attribuée le: {formatDate(prime.date_attribution)}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex items-start">
                        <FaDollarSign className="text-green-600 mr-3 h-5 w-5 flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Montant Reçu</p>
                            {/* Use 'montant_attribue' if you aliased in backend, otherwise 'montant' */}
                            <p className="text-lg font-semibold text-[#2F4156]">{formatCurrency(prime.montant_attribue !== undefined ? prime.montant_attribue : prime.montant)}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <FaCalendarAlt className="text-blue-600 mr-3 h-5 w-5 flex-shrink-0 mt-1" />
                         <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Date d'Attribution</p>
                            <p className="text-md font-medium text-[#2F4156]">{formatDate(prime.date_attribution)}</p>
                        </div>
                    </div>
                   
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

       <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80 mt-10">
         <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Espace Primes Employé {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}