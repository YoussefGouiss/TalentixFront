import React, { useEffect, useState } from 'react';
import {
  FaUsers, FaSearch, FaFilter, FaSpinner, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaCalendarAlt, FaUserAlt
} from 'react-icons/fa'; // Updated icons
import { useNavigate } from 'react-router-dom';

// Fixed-position success/error notification component (can be extracted if used more widely)
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
      bgColor = 'bg-blue-500'; textColor = 'text-white'; borderColor = 'border-blue-700'; Icon = FaCheckCircle; // Default to info or similar
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
          <FaTimes size={18} />
        </button>
      )}
    </div>
  );
};


export default function DemandesFormationsAdmin() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentUpdatingId, setCurrentUpdatingId] = useState(null); // Track which item is being updated
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');

  const API_URL = "http://localhost:8000/api/admin/demandes-formations";

  const fetchDemandes = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erreur non spécifiée du serveur."}));
        throw new Error(errorData.message || "Erreur lors de la récupération des demandes.");
      }
      
      const data = await response.json();
      setDemandes(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.message);
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Clear messages automatically
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(''), 3000);
    }
    if (error) {
      timer = setTimeout(() => setError(null), 5000); // Longer for errors
    }
    return () => clearTimeout(timer);
  }, [successMessage, error]);


  const updateDemandeStatus = async (demandeId, nouveauStatut) => {
    setUpdatingStatus(true);
    setCurrentUpdatingId(demandeId); // Specific item loading
    setError(null); // Clear previous errors before new action
    setSuccessMessage('');

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_URL}/${demandeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Erreur lors de la mise à jour du statut");
      }
      
      await fetchDemandes(); 
      setSuccessMessage(`Statut mis à jour: ${nouveauStatut}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingStatus(false);
      setCurrentUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const demandesFiltrees = demandes.filter(demande => {
    if (filtreStatut !== 'tous' && demande.statut !== filtreStatut) {
      return false;
    }
    if (filtreRecherche) {
      const rechercheLower = filtreRecherche.toLowerCase();
      const nomEmploye = demande.employe?.nom?.toLowerCase() || '';
      const prenomEmploye = demande.employe?.prenom?.toLowerCase() || '';
      const nomComplet = `${prenomEmploye} ${nomEmploye}`.trim();
      const titreFormation = demande.formation?.titre?.toLowerCase() || '';
      if (!nomComplet.includes(rechercheLower) && !titreFormation.includes(rechercheLower)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by creation date

  const hasAnyPendingRequests = demandesFiltrees.some(demande => demande.statut === 'en attente');

  const getStatutBadgeClass = (statut) => {
    // Using themed badge styles from previous components
    switch (statut) {
      case 'approuvée':
        return "text-green-700 bg-green-100 border-green-300";
      case 'rejetée':
        return "text-red-700 bg-red-100 border-red-300";
      case 'en attente':
      default:
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'approuvée':
        return <FaCheckCircle size={14} className="text-green-600" />;
      case 'rejetée':
        return <FaTimesCircle size={14} className="text-red-600" />;
      case 'en attente':
      default:
        return <FaClock size={14} className="text-yellow-600" />;
    }
  };

  const getRowClass = (statut) => {
    // Subtle hover/bg for processed items
    switch (statut) {
      case 'approuvée':
        return 'hover:bg-green-100/50 bg-green-50/30';
      case 'rejetée':
        return 'hover:bg-red-100/50 bg-red-50/30';
      default:
        return 'hover:bg-[#C8D9E6]/20'; // Themed hover for pending
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
        message={error} 
        type="error" 
        show={!!error}
        onDismiss={() => setError(null)}
      />

      <div className="max-w-6xl mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
        <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Demandes de Formation</h1>
            <p className="text-sm text-[#567C8D] mt-0.5">Gérez les inscriptions aux formations.</p>
          </div>
          <button
            onClick={() => navigate('/admin/formation')} // Assuming this is the correct route
            className="flex items-center gap-2 px-4 py-2 bg-[#567C8D] hover:bg-[#4A6582] text-white rounded-md shadow-sm transition-colors text-sm font-medium"
          >
            <FaArrowLeft size={16} />
            <span>Retour aux Formations</span>
          </button>
        </header>

        <div className="p-6">
          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="searchDemande" className="block text-sm font-medium text-[#2F4156] mb-1">Rechercher</label>
                <div className="relative">
                  <input
                    id="searchDemande"
                    type="text"
                    value={filtreRecherche}
                    onChange={(e) => setFiltreRecherche(e.target.value)}
                    placeholder="Nom employé, titre formation..."
                    className="w-full pl-10 pr-3 py-2.5 border border-[#C8D9E6] rounded-md focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all duration-200 outline-none text-[#2F4156]"
                  />
                  <FaSearch size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#567C8D]/80" />
                </div>
              </div>
              
              <div className="md:w-60">
                <label htmlFor="filterStatus" className="block text-sm font-medium text-[#2F4156] mb-1">Statut</label>
                <div className="relative">
                  <select
                    id="filterStatus"
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-[#C8D9E6] rounded-md appearance-none focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all duration-200 outline-none text-[#2F4156] bg-white"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="en attente">En attente</option>
                    <option value="approuvée">Approuvées</option>
                    <option value="rejetée">Rejetées</option>
                  </select>
                  <FaFilter size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#567C8D]/80" />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <FaSpinner size={32} className="animate-spin text-[#567C8D] mx-auto mb-3" />
                <p className="text-[#567C8D]">Chargement des demandes...</p>
              </div>
            </div>
          ) : demandesFiltrees.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-[#C8D9E6]">
                <FaUsers size={36} className="text-[#C8D9E6] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#2F4156] mb-1">Aucune demande trouvée</h3>
                <p className="text-sm text-[#567C8D]">
                  Aucune demande ne correspond à vos critères de filtre.
                </p>
            </div>
          ) : (
            <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Formation</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Employé</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Date Demande</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Statut</th>
                      {hasAnyPendingRequests && (
                        <th className="py-3 px-4 text-right text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {demandesFiltrees.map((demande) => (
                      <tr key={demande.id} className={`transition-colors duration-150 ${getRowClass(demande.statut)}`}>
                        <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-[#2F4156]">{demande.formation?.titre || 'N/A'}</div>
                            {demande.formation?.date_debut && (
                              <div className="text-xs text-[#567C8D] flex items-center gap-1 mt-0.5">
                                <FaCalendarAlt size={11} />
                                <span>
                                  {formatDate(demande.formation?.date_debut)} - {formatDate(demande.formation?.date_fin)}
                                </span>
                              </div>
                            )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-[#2F4156]">
                              {demande.employe?.prenom || ''} {demande.employe?.nom || 'N/A'}
                            </div>
                            {demande.employe?.email && (
                              <div className="text-xs text-[#567C8D] flex items-center gap-1 mt-0.5">
                                <FaUserAlt size={10} />
                                <span>{demande.employe?.email}</span>
                              </div>
                            )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(demande.created_at)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatutBadgeClass(demande.statut)}`}>
                            {getStatutIcon(demande.statut)}
                            {demande.statut.charAt(0).toUpperCase() + demande.statut.slice(1)}
                          </span>
                        </td>
                        {demande.statut === 'en attente' && (
                          <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => updateDemandeStatus(demande.id, 'approuvée')}
                                disabled={updatingStatus}
                                className="flex items-center justify-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                title="Approuver"
                              >
                                {updatingStatus && currentUpdatingId === demande.id ? <FaSpinner size={14} className="animate-spin mr-1" /> : <FaCheck size={14} className="mr-1" />}
                                Approuver
                              </button>
                              <button
                                onClick={() => updateDemandeStatus(demande.id, 'rejetée')}
                                disabled={updatingStatus}
                                className="flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                title="Rejeter"
                              >
                                {updatingStatus && currentUpdatingId === demande.id ? <FaSpinner size={14} className="animate-spin mr-1" /> : <FaTimes size={14} className="mr-1" />}
                                Rejeter
                              </button>
                            </div>
                          </td>
                        )}
                        {demande.statut !== 'en attente' && hasAnyPendingRequests && (
                          <td className="px-6 py-4 whitespace-nowrap"></td> // Placeholder for alignment
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
            Gestion des Demandes de Formation © {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}