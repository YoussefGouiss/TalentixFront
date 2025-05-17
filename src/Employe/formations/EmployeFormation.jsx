import React, { useEffect, useState } from 'react';
// Admin-theme icons from react-icons/fa
import { 
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSearch, FaFilter, FaUserPlus, FaSpinner, FaBookReader
} from 'react-icons/fa'; 
// Keep Lucide icons that are specific to this component's needs or if preferred
import { BookOpen, Calendar, Clock, Loader2 as LucideLoader } from 'lucide-react'; // Loader2 for loading state

// Notification component (defined above or imported)
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
                  flex items-center justify-between min-w-[300px]`}
    >
      <div className="flex items-center">
        {type === 'success' && <FaCheckCircle size={20} className="mr-3 flex-shrink-0" />}
        {type === 'error' && <FaTimesCircle size={20} className="mr-3 flex-shrink-0" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
        <FaTimesCircle size={18} />
      </button>
    </div>
  );
};


export default function EmployeFormations() {
  const [formations, setFormations] = useState([]);
  const [mesFormations, setMesFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInscriptionId, setLoadingInscriptionId] = useState(null); // Store ID of formation being registered
  const [error, setError] = useState(null);
  const [notification, setNotificationState] = useState({ show: false, message: '', type: '' }); // Use the Notification component
  
  const [filtreRecherche, setFiltreRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [activeTab, setActiveTab] = useState('disponibles');

  const showAppNotification = (message, type = 'success', duration = 3000) => {
    setNotificationState({ show: true, message, type });
    setTimeout(() => {
      setNotificationState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const fetchFormations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("employe_token");
      const response = await fetch("http://localhost:8000/api/employe/formations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Erreur lors de la récupération des formations disponibles.");
      }
      const data = await response.json();
      setFormations(Array.isArray(data) ? data : []);
    } catch (error) {
      showAppNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMesFormations = async () => {
    // No separate loading state for this, usually fetched with main data or on tab switch
    try {
      const token = localStorage.getItem("employe_token");
      const response = await fetch("http://localhost:8000/api/employe/demandes-formations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Erreur lors de la récupération de vos demandes de formation.");
      }
      const data = await response.json();
      setMesFormations(Array.isArray(data) ? data : []);
    } catch (error) {
      showAppNotification(error.message, 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'disponibles') {
      fetchFormations();
    }
    // Always fetch "mes formations" as it's needed for checking inscription status
    fetchMesFormations(); 
  }, [activeTab]);


  const handleInscription = async (formationId) => {
    setLoadingInscriptionId(formationId);
    try {
      const token = localStorage.getItem("employe_token");
      const response = await fetch(`http://localhost:8000/api/employe/formations/${formationId}/demande`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ formation_id: formationId }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription à la formation.");
      }
      
      showAppNotification(data.message || "Demande d'inscription envoyée avec succès!", 'success');
      await fetchMesFormations(); // Refresh my applications
      // Optionally, refetch available formations if their status display changes based on application
      // await fetchFormations();

    } catch (error) {
      showAppNotification(error.message, 'error');
    } finally {
      setLoadingInscriptionId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric' // Admin theme date format
    });
  };

  const isDejaInscrit = (formationId) => {
    return mesFormations.some(demande => demande.formation?.id === formationId);
  };

  const getDemandeStatut = (formationId) => {
    const demande = mesFormations.find(d => d.formation?.id === formationId);
    return demande ? demande.statut : null;
  };

  // Admin-themed status badges
  const getStatutBadgeClass = (statut) => {
    switch (statut?.toLowerCase()) { // Handle potential case inconsistencies
      case 'approuvée':
      case 'approuve': // Admin theme uses 'approuve'
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejetée':
      case 'rejete': // Admin theme uses 'rejete'
        return 'bg-red-100 text-red-700 border-red-300';
      case 'en attente':
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'approuvée':
      case 'approuve':
        return <FaCheckCircle size={14} className="text-green-600" />;
      case 'rejetée':
      case 'rejete':
        return <FaTimesCircle size={14} className="text-red-600" />;
      case 'en attente':
      default:
        return <Clock size={14} className="text-yellow-600" />; // Lucide Clock is fine
    }
  };
  
  const formationsFiltrees = activeTab === 'disponibles' 
    ? formations.filter(formation => filtreRecherche ? formation.titre.toLowerCase().includes(filtreRecherche.toLowerCase()) : true)
    : mesFormations.filter(demande => {
        const statutMatch = filtreStatut === 'tous' || demande.statut === filtreStatut;
        const rechercheMatch = filtreRecherche ? demande.formation?.titre.toLowerCase().includes(filtreRecherche.toLowerCase()) : true;
        return statutMatch && rechercheMatch;
      }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); // Sort "mes formations" by creation date


  return (
    <div className="min-h-screen bg-[#F5EFEB] p-4 md:p-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onDismiss={() => setNotificationState(prev => ({ ...prev, show: false }))}
      />

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6]">
          <h1 className="text-2xl font-bold tracking-tight">Formations</h1>
        </header>

        <div className="p-6">
          {/* Tabs - Admin theme style */}
          <div className="mb-6 border-b border-[#C8D9E6] flex">
            <button
              className={`px-4 py-2.5 text-sm font-medium transition-colors duration-150
                          ${activeTab === 'disponibles'
                            ? 'border-b-2 border-[#2F4156] text-[#2F4156]'
                            : 'text-[#567C8D] hover:text-[#2F4156]'}`}
              onClick={() => { setActiveTab('disponibles'); setFiltreRecherche(''); /* Reset search on tab change */ }}
            >
              Formations Disponibles
            </button>
            <button
              className={`px-4 py-2.5 text-sm font-medium transition-colors duration-150
                          ${activeTab === 'mes-formations'
                            ? 'border-b-2 border-[#2F4156] text-[#2F4156]'
                            : 'text-[#567C8D] hover:text-[#2F4156]'}`}
              onClick={() => { setActiveTab('mes-formations'); setFiltreRecherche(''); }}
            >
              Mes Inscriptions
            </button>
          </div>

          {/* Filters - Admin theme style */}
          <div className="mb-6 bg-white p-4 rounded-lg border border-[#C8D9E6] shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-grow">
                <label htmlFor="search-formation" className="block text-xs font-medium text-[#567C8D] mb-1">Rechercher une formation</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-[#A0B9CD]" size={16} />
                  </div>
                  <input
                    type="text" id="search-formation"
                    value={filtreRecherche}
                    onChange={(e) => setFiltreRecherche(e.target.value)}
                    placeholder="Par titre..."
                    className="w-full pl-10 pr-3 py-2.5 border border-[#C8D9E6] rounded-md 
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] 
                               transition-colors outline-none text-[#2F4156] bg-white text-sm"
                  />
                </div>
              </div>
              
              {activeTab === 'mes-formations' && (
                <div className="sm:w-auto min-w-[180px]">
                  <label htmlFor="filter-status" className="block text-xs font-medium text-[#567C8D] mb-1">Filtrer par statut</label>
                   <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaFilter className="text-[#A0B9CD]" size={14} />
                    </div>
                    <select
                        id="filter-status"
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 border border-[#C8D9E6] rounded-md appearance-none
                                   focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] 
                                   transition-colors outline-none text-[#2F4156] bg-white text-sm"
                    >
                        <option value="tous">Tous les statuts</option>
                        <option value="en attente">En attente</option>
                        <option value="approuvée">Approuvées</option>
                        <option value="rejetée">Rejetées</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-[#A0B9CD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Content Area */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <FaSpinner size={40} className="animate-spin text-[#567C8D] mb-4" />
              <p className="text-[#567C8D] text-lg">Chargement...</p>
            </div>
          ) : formationsFiltrees.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                <FaBookReader size={48} className="mx-auto text-[#A0B9CD] mb-4" />
                <h3 className="text-xl font-semibold text-[#2F4156] mb-2">Aucune formation trouvée</h3>
                <p className="text-[#567C8D]">
                {activeTab === 'disponibles'
                    ? "Il n'y a pas de formations disponibles correspondant à vos critères."
                    : "Vous n'avez aucune demande de formation correspondant à vos critères."}
                </p>
            </div>
          ) : activeTab === 'disponibles' ? (
            // Card Layout for available formations
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formationsFiltrees.map((formation) => {
                const inscriptionStatut = getDemandeStatut(formation.id);
                const dejaInscrit = isDejaInscrit(formation.id);
                
                return (
                  <div key={formation.id} className="bg-white rounded-lg shadow-md border border-[#C8D9E6] overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-200">
                    <div className="p-5 flex-grow">
                      <h3 className="text-lg font-semibold text-[#2F4156] mb-2 line-clamp-2">{formation.titre}</h3>
                      <div className="space-y-2 mb-3 text-sm text-[#567C8D]">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-[#A0B9CD] flex-shrink-0" />
                          <span>Début: {formatDate(formation.date_debut)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2 text-[#A0B9CD] flex-shrink-0" />
                          <span>Fin: {formatDate(formation.date_fin)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[#567C8D] line-clamp-3 mb-4">
                        {formation.description || "Aucune description."}
                      </p>
                    </div>
                    <div className="px-5 pb-5 pt-3 border-t border-[#C8D9E6]/70 bg-slate-50/50">
                      {dejaInscrit ? (
                        <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium border ${getStatutBadgeClass(inscriptionStatut)}`}>
                          {getStatutIcon(inscriptionStatut)}
                          {inscriptionStatut === 'en attente' ? 'Demande en attente' : 
                           (inscriptionStatut === 'approuvée' || inscriptionStatut === 'approuve') ? 'Inscription confirmée' : 
                           (inscriptionStatut === 'rejetée' || inscriptionStatut === 'rejete') ? 'Demande rejetée' : 'Statut inconnu'}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInscription(formation.id)}
                          disabled={loadingInscriptionId === formation.id}
                          className="w-full flex items-center justify-center px-4 py-2 bg-[#567C8D] hover:bg-[#4A6582] text-white text-sm font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {loadingInscriptionId === formation.id ? (
                            <FaSpinner size={18} className="animate-spin mr-2" />
                          ) : (
                            <FaUserPlus size={16} className="mr-2" />
                          )}
                          S'inscrire
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             // Table Layout for "Mes formations"
            <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Titre de la Formation</th>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Date de Début</th>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Date de Fin</th>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {formationsFiltrees.map((demande) => (
                      <tr key={demande.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                        <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]">{demande.formation?.titre || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(demande.formation?.date_debut)}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(demande.formation?.date_fin)}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatutBadgeClass(demande.statut)}`}>
                            {getStatutIcon(demande.statut)}
                            {demande.statut.charAt(0).toUpperCase() + demande.statut.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
            Portail Formations Employé © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}