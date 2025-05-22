import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaSpinner, FaCheckCircle, FaTimesCircle, FaIdCard, FaExclamationTriangle } from 'react-icons/fa'; // Added FaExclamationTriangle

// --- ThemedNotification Component ---
const ThemedNotification = ({ message, type, show, onDismiss }) => {
  if (!show) return null;
  let bgColor, textColor, borderColor, Icon;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-500'; textColor = 'text-white'; borderColor = 'border-green-700'; Icon = FaCheckCircle;
      break;
    case 'error':
      bgColor = 'bg-red-500'; textColor = 'text-white'; borderColor = 'border-red-700'; Icon = FaTimesCircle;
      break;
    case 'warning': // Added warning case
      bgColor = 'bg-yellow-400'; textColor = 'text-yellow-800'; borderColor = 'border-yellow-600'; Icon = FaExclamationTriangle;
      break;
    default: // Default to info style, using FaIdCard as per your original default
      bgColor = 'bg-blue-500'; textColor = 'text-white'; borderColor = 'border-blue-700'; Icon = FaIdCard; 
  }
  return (
    <div
      className={`fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}
                  ${bgColor} ${textColor} border-l-4 ${borderColor} flex items-center justify-between min-w-[300px]`}
    >
      <div className="flex items-center">
        <Icon size={20} className="mr-3 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
          <FaTimesCircle size={18} /> {/* Consistent dismiss icon */}
        </button>
      )}
    </div>
  );
};


const FichePaieAdmin = () => {
  const currentYear = new Date().getFullYear();
  const [mois, setMois] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [annee, setAnnee] = useState(String(currentYear));
  const [employeId, setEmployeId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Unified notification state
  const [notification, setNotificationState] = useState({ message: '', type: '', show: false });

  const showAppNotification = (message, type = 'success', duration = 4000) => {
    setNotificationState({ message, type, show: true });
    setTimeout(() => {
        setNotificationState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const getAdminToken = () => {
    return localStorage.getItem('admin_token');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Clear previous notifications
    setNotificationState(prev => ({ ...prev, show: false }));


    if (!/^(0[1-9]|1[0-2])$/.test(mois)) {
      showAppNotification("Le mois doit être au format MM (01-12).", 'warning');
      setLoading(false);
      return;
    }
    if (!/^\d{4}$/.test(annee) || parseInt(annee) < 2000 || parseInt(annee) > currentYear + 5) {
      showAppNotification(`L'année doit être un nombre à 4 chiffres (ex: ${currentYear}).`, 'warning');
      setLoading(false);
      return;
    }


    const body = JSON.stringify({ mois, annee: parseInt(annee) });
    const token = getAdminToken();

    if (!token) {
      showAppNotification("Administrateur non authentifié. Veuillez vous reconnecter.", 'error');
      setLoading(false);
      return;
    }

    try {
      let url;
      if (employeId.trim() !== '') {
        if (!/^\d+$/.test(employeId.trim())) {
          showAppNotification("L'ID de l'employé doit être un nombre.", 'warning');
          setLoading(false);
          return;
        }
        url = `http://127.0.0.1:8000/api/fiche-paie/send-one/${employeId.trim()}`;
      } else {
        url = 'http://127.0.0.1:8000/api/fiche-paie/send-all';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status} lors de l'envoi`);
      }

      showAppNotification(data.message || "Fiches de paie envoyées avec succès.", 'success');
      // Optionally reset form fields
      // setMois(String(new Date().getMonth() + 1).padStart(2, '0'));
      // setAnnee(String(currentYear));
      // setEmployeId('');
    } catch (error) {
      console.error("Erreur d'envoi FichePaie:", error);
      showAppNotification(error.message || "Une erreur s'est produite lors de l'envoi.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFEB]"> {/* Full page background */}
      <ThemedNotification 
        message={notification.message} 
        type={notification.type} 
        show={notification.show} 
        onDismiss={() => setNotificationState(prev => ({ ...prev, show: false}))}
      />

      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6"> {/* Constrained header content */}
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Générer et Envoyer les Fiches de Paie</h1>
          <p className="text-sm text-[#567C8D] mt-0.5">Sélectionnez le mois, l'année et éventuellement un employé spécifique.</p>
        </header>
      </div>

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Constrained main content */}
          <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg p-6"> {/* Form container with existing styles */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="mois" className="block text-sm font-medium text-[#2F4156] mb-1">
                    Mois <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mois"
                    type="text"
                    value={mois}
                    onChange={(e) => setMois(e.target.value)}
                    placeholder="MM (ex: 05)"
                    required
                    maxLength="2"
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white text-sm
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="annee" className="block text-sm font-medium text-[#2F4156] mb-1">
                    Année <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="annee"
                    type="text"
                    value={annee}
                    onChange={(e) => setAnnee(e.target.value)}
                    placeholder={`AAAA (ex: ${currentYear})`}
                    required
                    maxLength="4"
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white text-sm
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="employeId" className="block text-sm font-medium text-[#2F4156] mb-1">
                  ID de l'employé (optionnel)
                </label>
                <input
                  id="employeId"
                  type="text"
                  value={employeId}
                  onChange={(e) => setEmployeId(e.target.value)}
                  placeholder="Laisser vide pour envoyer à tous les employés"
                  className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white text-sm
                             focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                />
                 <p className="mt-1 text-xs text-[#567C8D]">Si renseigné, la fiche sera envoyée uniquement à cet employé.</p>
              </div>

              <div className="flex justify-end pt-3 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-md shadow-sm 
                             text-white font-medium text-sm transition-all duration-200
                             bg-[#2F4156] hover:bg-[#3b5068]
                             ${loading ? 'opacity-75 cursor-not-allowed' : 'transform hover:scale-[1.02] active:scale-95'}`}
                >
                  {loading ? <FaSpinner size={18} className="animate-spin" /> : <FaPaperPlane size={16} />}
                  {loading ? 'Envoi en cours...' : 'Envoyer Fiches de Paie'}
                </button>
              </div>
            </form>
          </div>
      </main>
      <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
        <footer className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Génération des Fiches de Paie © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default FichePaieAdmin;