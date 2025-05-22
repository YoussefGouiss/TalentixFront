import React, { useState, useEffect, useCallback } from 'react';
// Icons from react-icons/fa to match admin theme
import { 
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner, 
    FaTimes, FaPlusCircle, FaRegCalendarAlt, FaCheck
} from 'react-icons/fa';

// --- Re-usable components (Themed like Admin) ---

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

const SkeletonLoader = ({ rows = 3, cols = 3 }) => (
  <div className="animate-pulse p-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`grid grid-cols-4 md:grid-cols-4 gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center`}>
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div>
        ))}
        <div className="h-5 bg-[#C8D9E6]/70 rounded w-24 col-span-1 justify-self-start md:justify-self-auto"></div>
      </div>
    ))}
  </div>
);

const SlideDown = ({ isVisible, children }) => (
  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
    {isVisible && <div className="py-6">{children}</div>} 
  </div>
);

// --- API Configuration ---
const API_URL = 'http://localhost:8000/api'; // Your API base URL

// --- Main Component ---
export default function Conge() {
  const [conges, setConges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    motif: ''
  });

  const [leaveBalance, setLeaveBalance] = useState({
    jours_utilises: 0,
    solde_restant: 30, // Initial assumption, backend should ideally provide this
    jours_demandes_actuellement: 0,
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const getToken = () => {
    return localStorage.getItem('employe_token'); 
  };
  
  const showAppNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ show: true, message, type });
    const timer = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
    return () => clearTimeout(timer); 
  };

  const fetchConges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Utilisateur non authentifié.');
      }
      const response = await fetch(`${API_URL}/employe/conges`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur non spécifiée du serveur' }));
        throw new Error(errorData.message || 'Erreur lors de la récupération des demandes de congé.');
      }
      
      const data = await response.json();
      const congesData = Array.isArray(data.conges) ? data.conges : (Array.isArray(data) ? data : []);
      setConges(congesData);

      const annee = new Date().getFullYear();
      let joursDejaPris = 0;
      if (data.leave_balance && data.leave_balance.jours_utilises_annee_actuelle !== undefined) {
        joursDejaPris = data.leave_balance.jours_utilises_annee_actuelle || 0;
        setLeaveBalance({
            jours_utilises: joursDejaPris,
            solde_restant: data.leave_balance.solde_restant_total || (30 - joursDejaPris),
            jours_demandes_actuellement: 0,
        });
      } else {
        joursDejaPris = congesData
            .filter(conge => conge.statut === 'approuve' && new Date(conge.date_debut).getFullYear() === annee)
            .reduce((total, conge) => {
                const start = new Date(conge.date_debut);
                const end = new Date(conge.date_fin);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) return total;
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return total + diffDays;
            }, 0);
        setLeaveBalance(prev => ({
            ...prev,
            jours_utilises: joursDejaPris,
            solde_restant: (prev.solde_restant_initial || 30) - joursDejaPris
        }));
      }
    } catch (err) {
      setError(err.message);
      showAppNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchConges();
  }, [fetchConges]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'date_debut' && formData.date_fin && new Date(value) > new Date(formData.date_fin)) {
      setFormData(prev => ({ ...prev, date_fin: value }));
    }
  };

  const resetForm = () => {
    setFormData({ date_debut: '', date_fin: '', motif: '' });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.date_debut || !formData.date_fin) {
      showAppNotification('Les dates de début et de fin sont requises.', 'warning');
      setIsSubmitting(false);
      return;
    }
    if (new Date(formData.date_fin) < new Date(formData.date_debut)) {
      showAppNotification('La date de fin ne peut pas être antérieure à la date de début.', 'warning');
      setIsSubmitting(false);
      return;
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    if (new Date(formData.date_debut) < today) {
      showAppNotification('La date de début ne peut pas être dans le passé.', 'warning');
      setIsSubmitting(false);
      return;
    }

    const token = getToken();
    if (!token) {
      showAppNotification('Utilisateur non authentifié. Veuillez vous reconnecter.', 'error');
      setIsSubmitting(false);
      return;
    }

    const url = `${API_URL}/employe/conges`;
    const method = 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = responseData.message || 'Une erreur est survenue.';
        if (responseData.errors) { 
          errorMessage = Object.values(responseData.errors).flat().join(' ');
        }
        if (response.status === 403 && responseData.error === "Quota de congés dépassé") {
           errorMessage = `Quota dépassé! ${responseData.message || ''} (Utilisés: ${responseData.jours_utilises_annee_actuelle || 'N/A'}, Demandés: ${responseData.jours_demandes_periode || 'N/A'}, Solde après: ${responseData.solde_restant_apres_demande || 'N/A'})`;
           if (responseData.jours_utilises_annee_actuelle !== undefined) {
                setLeaveBalance({
                    jours_utilises: responseData.jours_utilises_annee_actuelle,
                    solde_restant: responseData.solde_restant_apres_demande,
                    jours_demandes_actuellement: responseData.jours_demandes_periode
                });
           }
        }
        throw new Error(errorMessage);
      }
      
      showAppNotification(responseData.message || 'Demande envoyée avec succès!', 'success');
      if (responseData.leave_balance) {
        setLeaveBalance({
          jours_utilises: responseData.leave_balance.jours_utilises_annee_actuelle,
          solde_restant: responseData.leave_balance.solde_restant_total,
          jours_demandes_actuellement: 0
        });
      } else {
        fetchConges(); 
      }
      resetForm();

    } catch (err) {
      showAppNotification(err.message, 'error', 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return <span className="px-2.5 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-full">En attente</span>;
      case 'approuve':
        return <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded-full">Approuvé</span>;
      case 'refuse':
        return <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 rounded-full">Refusé</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Mes Demandes de Congé</h1>
        </header>
      </div>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-sm text-center">
            <p className="text-sm font-medium text-[#567C8D]">Solde Annuel Total</p>
            <p className="text-2xl font-bold text-[#2F4156]">30 jours</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm text-center">
            <p className="text-sm font-medium text-green-700">Jours Approuvés (cette année)</p>
            <p className="text-2xl font-bold text-green-800">{leaveBalance.jours_utilises} jours</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-sm text-center">
            <p className="text-sm font-medium text-yellow-700">Solde Restant</p>
            <p className="text-2xl font-bold text-yellow-800">{leaveBalance.solde_restant} jours</p>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button 
            onClick={() => { setShowForm(!showForm); }}
            className={`flex items-center px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 font-semibold text-sm
                        ${showForm 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-[#567C8D] hover:bg-[#4A6582] text-white'
                        }`}
          >
            {showForm ? (
              <> <FaTimes className="mr-2" size={16} /> Annuler la demande </>
            ) : (
              <> <FaPlusCircle className="mr-2" size={16} /> Faire une demande </>
            )}
          </button>
        </div>
        
        <SlideDown isVisible={showForm}>
          <div className={`bg-slate-50 border border-slate-200 rounded-lg shadow-inner p-6 mb-8`}> {/* This mb-8 might be large if SlideDown's py-6 is also active */}
            <h2 className="text-xl font-semibold text-[#2F4156] border-b border-[#C8D9E6] pb-3 mb-6">
              Nouvelle demande de congé
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date_debut" className="block text-sm font-medium text-[#567C8D] mb-1">Date de début</label>
                  <input
                    type="date" id="date_debut" name="date_debut" value={formData.date_debut}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md 
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] 
                               transition-colors outline-none text-[#2F4156] bg-white"
                    required disabled={isSubmitting}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="date_fin" className="block text-sm font-medium text-[#567C8D] mb-1">Date de fin</label>
                  <input
                    type="date" id="date_fin" name="date_fin" value={formData.date_fin}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md 
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] 
                               transition-colors outline-none text-[#2F4156] bg-white"
                    required disabled={isSubmitting}
                    min={formData.date_debut || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="motif" className="block text-sm font-medium text-[#567C8D] mb-1">Motif (optionnel)</label>
                <textarea
                  id="motif" name="motif" value={formData.motif} onChange={handleInputChange}
                  rows="3"
                  className="w-full p-2.5 border border-[#C8D9E6] rounded-md 
                             focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] 
                             transition-colors outline-none text-[#2F4156] bg-white"
                  placeholder="Ex: Vacances annuelles, motif personnel..."
                  disabled={isSubmitting}
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={resetForm}
                  className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md 
                             transition-colors duration-200 flex items-center font-medium text-sm
                             disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <FaTimes size={16} className="mr-2" /> Annuler
                </button>
                
                <button
                  type="submit" disabled={isSubmitting}
                  className={`px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md 
                             transition-all duration-200 flex items-center font-semibold text-sm
                             disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <> <FaSpinner size={18} className="mr-2 animate-spin" /> Envoi... </>
                  ) : (
                    <> <FaCheck size={18} className="mr-2" /> Envoyer la demande </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </SlideDown>
        
        <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-4 py-3.5">
            <h2 className="text-lg font-semibold text-[#2F4156]">Historique des demandes</h2>
          </div>
          
          {isLoading ? (
            <SkeletonLoader rows={4} cols={3} /> 
          ) : error && !conges.length ? (
            <div className="p-10 text-center flex flex-col items-center">
              <FaExclamationTriangle size={40} className="mx-auto text-red-500 mb-4" />
              <p className="text-xl font-medium text-[#2F4156]">{error}</p>
              <p className="text-[#567C8D] mt-2">Veuillez réessayer ou contacter le support.</p>
               <button
                  onClick={fetchConges}
                  className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
              >
                  Réessayer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#C8D9E6]/30">
                  <tr>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Date de début</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Date de fin</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider hidden md:table-cell">Motif</th>
                    <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C8D9E6]/70">
                  {conges.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FaRegCalendarAlt size={36} className="mx-auto text-[#C8D9E6] mb-3" />
                          <p className="text-lg font-medium text-[#2F4156]">Aucune demande de congé.</p>
                          <p className="text-sm text-[#567C8D]">Commencez par faire une nouvelle demande.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    conges.map((conge) => (
                      <tr key={conge.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(conge.date_debut)}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(conge.date_fin)}</td>
                        <td className="py-3 px-4 text-sm text-[#567C8D] hidden md:table-cell truncate max-w-xs" title={conge.motif || ''}>
                          {conge.motif || <span className="italic text-gray-400">Aucun</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm">{getStatusBadge(conge.statut)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

       <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
         <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Système de Gestion des Congés © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}