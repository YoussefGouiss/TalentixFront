import { useState, useEffect } from "react";
import {
  FaSync, FaCheck, FaTimes, FaSpinner, FaEye, FaCheckCircle, FaTimesCircle,
  FaThumbsDown, FaThumbsUp, FaBoxOpen, FaExclamationTriangle // Added FaExclamationTriangle for error notification
} from "react-icons/fa";


// --- Notification Component (Themed) ---
const Notification = ({ show, message, type, onDismiss }) => {
  if (!show && !message) return null; 
  const visibilityClasses = show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none';
  return (
    <div
      className={`fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
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


// Main component
export default function MaterialAdmin() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); 
  const [actionType, setActionType] = useState(''); 
  
  const [notification, setNotificationState] = useState({ show: false, message: '', type: '' });

  const [showDetailsId, setShowDetailsId] = useState(null);
  const [showRejectionFormForId, setShowRejectionFormForId] = useState(null); 
  const [rejectionReason, setRejectionReason] = useState("");
  
  const API_BASE_URL = 'http://localhost:8000/api/admin/material';

  const showAppNotification = (message, type = 'success', duration = 3000) => {
    setNotificationState({ show: true, message, type });
    setTimeout(() => {
      setNotificationState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null); 
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur non spécifiée du serveur' }));
        throw new Error(errorData.message || 'Impossible de récupérer les demandes de matériel.');
      }
      const data = await response.json();
      setMaterials(Array.isArray(data) ? data : []); 
      setError(null);
    } catch (err) {
      setError(err.message);
      showAppNotification(err.message, 'error');
      setMaterials([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    setActionType(status === 'approuve' ? 'approve' : 'reject');
    
    try {
      if (status === 'rejete' && !rejectionReason.trim() && showRejectionFormForId === id) {
        showAppNotification('Veuillez fournir une justification pour le rejet.', 'warning');
        setActionLoading(null);
        setActionType('');
        return;
      }
      
      const payload = { statut: status };
      
      if (status === 'rejete' && rejectionReason.trim() && showRejectionFormForId === id) {
        payload.explication = rejectionReason.trim();
      }

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Échec de la mise à jour du statut.`);
      }
      
      const updatedMaterial = await response.json();
      
      // Update local state optimistically or with response data
      setMaterials(prevMaterials => prevMaterials.map(material => 
        material.id === id ? { 
          ...material, 
          ...updatedMaterial, // Prefer API response if it's complete
          statut: status, 
          explication: (status === 'rejete' && rejectionReason.trim() && showRejectionFormForId === id) ? rejectionReason.trim() : (updatedMaterial.explication || material.explication)
        } : material
      ));
      
      showAppNotification(`Demande ${status === 'approuve' ? 'approuvée' : 'rejetée'} avec succès!`, 'success');
      if (status === 'rejete' && showRejectionFormForId === id) {
          setShowRejectionFormForId(null); 
          setRejectionReason("");
      }
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
      setActionType('');
    }
  };

  const toggleDetails = (id) => {
    const newDetailsId = showDetailsId === id ? null : id;
    setShowDetailsId(newDetailsId);
    if (newDetailsId !== id || newDetailsId === null) { 
      setShowRejectionFormForId(null); 
      setRejectionReason("");
    }
  };
  
  const handleShowRejectionForm = (id) => {
    setShowDetailsId(id); 
    setShowRejectionFormForId(id); 
    setRejectionReason(""); 
  };

  const StatusBadge = ({ status }) => {
    let badgeStyle = "px-2.5 py-1 text-xs font-semibold rounded-full border ";
    switch (status) {
      case 'en_attente':
        badgeStyle += "text-yellow-700 bg-yellow-100 border-yellow-300";
        return <span className={badgeStyle}>En attente</span>;
      case 'approuve':
        badgeStyle += "text-green-700 bg-green-100 border-green-300";
        return <span className={badgeStyle}>Approuvé</span>;
      case 'rejete':
        badgeStyle += "text-red-700 bg-red-100 border-red-300";
        return <span className={badgeStyle}>Rejeté</span>;
      default:
        badgeStyle += "text-gray-700 bg-gray-100 border-gray-300";
        return <span className={badgeStyle}>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFEB]">
      <Notification 
        show={notification.show} 
        message={notification.message} 
        type={notification.type}
        onDismiss={() => setNotificationState(prev => ({ ...prev, show: false }))} 
      />

      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Gestion des Demandes de Matériel</h1>
          <button 
            onClick={() => fetchMaterials()}
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium
                        ${loading || actionLoading ? 'bg-[#C8D9E6]/50 text-[#567C8D] cursor-not-allowed' 
                                 : 'bg-[#567C8D] hover:bg-[#4A6582] text-white shadow-sm'}`}
            disabled={loading || actionLoading}
          >
            {loading && !actionLoading ? 
              <FaSpinner size={16} className="mr-2 animate-spin" /> : 
              <FaSync size={16} className="mr-2" />
            }
            Actualiser
          </button>
        </header>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Error message is now handled by the global Notification component */}

          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-4 py-3.5">
                <h2 className="text-lg font-semibold text-[#2F4156]">Liste des Demandes</h2>
            </div>
            {loading ? (
              <div className="flex justify-center items-center p-12 bg-white">
                <div className="flex flex-col items-center">
                  <FaSpinner className="animate-spin text-[#567C8D]" size={32} />
                  <p className="mt-3 text-[#567C8D]">Chargement des données...</p>
                </div>
              </div>
            ) : materials.length === 0 && !error ? ( 
              <div className="text-center p-12 bg-white">
                <div className="flex flex-col items-center">
                  <FaBoxOpen size={36} className="text-[#C8D9E6] mb-3" />
                  <p className="text-lg font-medium text-[#2F4156]">Aucune demande de matériel</p>
                  <p className="text-sm text-[#567C8D]">Il n'y a pas de demandes à afficher pour le moment.</p>
                </div>
              </div>
            ) : error && materials.length === 0 ? ( // Specific message if fetch failed and list is empty
                <div className="text-center p-12 bg-white">
                    <div className="flex flex-col items-center">
                        <FaExclamationTriangle size={36} className="text-red-400 mb-3" />
                        <p className="text-lg font-medium text-[#2F4156]">Erreur de chargement</p>
                        <p className="text-sm text-[#567C8D]">{error}</p>
                        <button 
                            onClick={() => fetchMaterials()}
                            className="mt-4 px-3 py-1.5 bg-[#567C8D] hover:bg-[#4A6582] text-white rounded-md shadow-sm text-xs font-semibold flex items-center"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      {['Employé', 'Matériel', 'Motif', 'Quantité', 'Statut'].map(header => (
                        <th key={header} className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider"> {/* Centered Actions Header */}
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {materials.map((material) => (
                      <>
                        <tr key={material.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                          <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]">{material.employe_nom || (material.employe ? `${material.employe.nom} ${material.employe.prenom}`: 'N/A')}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-[#2F4156]">{material.nom}</td>
                          <td className="py-3 px-4 text-sm text-[#567C8D] max-w-sm truncate" title={material.motif}>{material.motif}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-center text-[#2F4156]">{material.quantite}</td>
                          <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={material.statut} /></td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm">
                            <div className="flex justify-center items-center gap-2"> {/* Centered actions */}
                              <button
                                onClick={() => toggleDetails(material.id)}
                                className="p-1.5 text-[#567C8D] rounded-md hover:bg-[#567C8D]/10 hover:text-[#2F4156] transition-colors"
                                title="Voir détails/Actions"
                              > <FaEye size={16} /> </button>
                              
                              {material.statut === 'en_attente' && ( // Quick actions only if en_attente and details not open
                                !showDetailsId && ( // Hide quick actions if details are open for any item
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(material.id, 'approuve')}
                                    disabled={actionLoading === material.id}
                                    className="p-1.5 text-green-600 rounded-md hover:bg-green-500/10 hover:text-green-700 transition-colors"
                                    title="Approuver Rapidement"
                                  >
                                    {(actionLoading === material.id && actionType === 'approve') ? <FaSpinner size={16} className="animate-spin" /> : <FaThumbsUp size={16} />}
                                  </button>
                                  <button
                                    onClick={() => handleShowRejectionForm(material.id)} // This will open details
                                    disabled={actionLoading === material.id}
                                    className="p-1.5 text-red-600 rounded-md hover:bg-red-500/10 hover:text-red-700 transition-colors"
                                    title="Rejeter (avec motif)"
                                  >
                                    <FaThumbsDown size={16} />
                                  </button>
                                </>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {showDetailsId === material.id && (
                          <tr className="bg-[#F5EFEB]/60 border-t border-b border-[#C8D9E6]/50">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                  <h4 className="text-sm font-semibold text-[#2F4156] md:col-span-2">Détails de la demande:</h4>
                                  <p className="text-sm text-[#567C8D]"><span className="font-medium text-[#2F4156]">Demandeur:</span> {material.employe_nom || (material.employe ? `${material.employe.nom} ${material.employe.prenom}`: 'N/A')}</p>
                                  <p className="text-sm text-[#567C8D]"><span className="font-medium text-[#2F4156]">Date demande:</span> {new Date(material.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                  <p className="md:col-span-2 text-sm text-[#567C8D]"><span className="font-medium text-[#2F4156]">Motif complet:</span> {material.motif}</p>
                                </div>
                                
                                {material.statut === 'rejete' && material.explication && (
                                  <div className="bg-red-50 p-3 rounded-md border border-red-200 mt-2">
                                    <p className="text-sm text-red-700"><span className="font-medium">Raison du rejet:</span> {material.explication}</p>
                                  </div>
                                )}
                                
                                {material.statut === 'en_attente' && (
                                  <div className="space-y-3 mt-3 pt-3 border-t border-[#C8D9E6]/70">
                                    {showRejectionFormForId === material.id && (
                                      <div>
                                        <label htmlFor={`rejectionReason-${material.id}`} className="block text-sm font-medium text-[#2F4156] mb-1">
                                          Justification du rejet <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                          id={`rejectionReason-${material.id}`}
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          rows="2"
                                          className="w-full p-2 border border-[#C8D9E6] rounded-md shadow-sm 
                                                     focus:ring-1 focus:ring-red-500 focus:border-red-500 
                                                     transition-colors outline-none text-[#2F4156] bg-white"
                                          placeholder="Expliquez pourquoi cette demande est rejetée..."
                                        ></textarea>
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-end items-center gap-3">
                                      {/* Close details button now handled by toggleDetails via FaEye icon */}
                                      
                                      {!showRejectionFormForId && ( 
                                        <button
                                          onClick={() => handleStatusUpdate(material.id, 'approuve')}
                                          disabled={actionLoading === material.id}
                                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm text-xs font-semibold flex items-center disabled:opacity-60"
                                        >
                                          {(actionLoading === material.id && actionType === 'approve') ? <FaSpinner size={14} className="animate-spin mr-1.5" /> : <FaCheckCircle size={14} className="mr-1.5" />}
                                          Approuver la Demande
                                        </button>
                                      )}
                                      
                                      {showRejectionFormForId === material.id ? (
                                        <button
                                          onClick={() => handleStatusUpdate(material.id, 'rejete')}
                                          disabled={actionLoading === material.id || !rejectionReason.trim()}
                                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm text-xs font-semibold flex items-center disabled:opacity-60"
                                        >
                                          {(actionLoading === material.id && actionType === 'reject') ? <FaSpinner size={14} className="animate-spin mr-1.5" /> : <FaTimesCircle size={14} className="mr-1.5" />}
                                          Confirmer Rejet
                                        </button>
                                      ) : ( 
                                        <button
                                          onClick={() => handleShowRejectionForm(material.id)}
                                          disabled={actionLoading === material.id}
                                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm text-xs font-semibold flex items-center disabled:opacity-60"
                                        >
                                          <FaTimesCircle size={14} className="mr-1.5" />
                                          Rejeter (avec motif)
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </main>
      <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Gestion de Matériel © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}