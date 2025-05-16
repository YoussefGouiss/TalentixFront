import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaSpinner, FaCheckCircle, FaTimesCircle, FaIdCard } from 'react-icons/fa';

// Re-using the ThemedNotification (or it can be a shared component)
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
    default:
      bgColor = 'bg-blue-500'; textColor = 'text-white'; borderColor = 'border-blue-700'; Icon = FaIdCard; 
  }
  return (
    <div
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}
                  ${bgColor} ${textColor} border-l-4 ${borderColor} flex items-center justify-between`}
    >
      <div className="flex items-center">
        <Icon size={20} className="mr-3 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
          <FaTimesCircle size={18} />
        </button>
      )}
    </div>
  );
};


const FichePaieAdmin = () => {
  const currentYear = new Date().getFullYear();
  const [mois, setMois] = useState(String(new Date().getMonth() + 1).padStart(2, '0')); // Default to current month
  const [annee, setAnnee] = useState(String(currentYear)); // Default to current year
  const [employeId, setEmployeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-clear messages
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(''), 3000);
    }
    if (errorMessage) {
      timer = setTimeout(() => setErrorMessage(''), 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const getAdminToken = () => {
    // IMPORTANT: Replace 'admin_token' with the actual key you use for storing the admin's auth token
    return localStorage.getItem('admin_token');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (!/^(0[1-9]|1[0-2])$/.test(mois)) {
      setErrorMessage("Le mois doit être au format MM (01-12).");
      setLoading(false);
      return;
    }
    if (!/^\d{4}$/.test(annee) || parseInt(annee) < 2000 || parseInt(annee) > currentYear + 5) {
      setErrorMessage(`L'année doit être un nombre à 4 chiffres (ex: ${currentYear}).`);
      setLoading(false);
      return;
    }


    const body = JSON.stringify({ mois, annee: parseInt(annee) });
    const token = getAdminToken();

    if (!token) {
      setErrorMessage("Administrateur non authentifié. Veuillez vous reconnecter.");
      setLoading(false);
      // Optionally redirect to login
      // window.location.href = '/login-admin'; 
      return;
    }

    try {
      let url;
      if (employeId.trim() !== '') {
        if (!/^\d+$/.test(employeId.trim())) {
          setErrorMessage("L'ID de l'employé doit être un nombre.");
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
        // Handle specific 401 for token issues separately if desired,
        // but generally, backend should return clear messages.
        throw new Error(data.message || `Erreur ${response.status} lors de l'envoi`);
      }

      setSuccessMessage(data.message || "Fiches de paie envoyées avec succès.");
      // Optionally reset form fields
      // setMois(String(new Date().getMonth() + 1).padStart(2, '0'));
      // setAnnee(String(currentYear));
      // setEmployeId('');
    } catch (error) {
      console.error("Erreur d'envoi FichePaie:", error);
      setErrorMessage(error.message || "Une erreur s'est produite lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ThemedNotification 
        message={successMessage} 
        type="success" 
        show={!!successMessage} 
        onDismiss={() => setSuccessMessage('')}
      />
      <ThemedNotification 
        message={errorMessage} 
        type="error" 
        show={!!errorMessage}
        onDismiss={() => setErrorMessage('')}
      />

      <div className="max-w-2xl mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
        <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6]">
          <h1 className="text-2xl font-bold tracking-tight">Générer et Envoyer les Fiches de Paie</h1>
          <p className="text-sm text-[#567C8D] mt-0.5">Sélectionnez le mois, l'année et éventuellement un employé spécifique.</p>
        </header>

        <div className="p-6">
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
                  className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
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
                  className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
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
                className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
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
        <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
            Génération des Fiches de Paie © {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
};

export default FichePaieAdmin;