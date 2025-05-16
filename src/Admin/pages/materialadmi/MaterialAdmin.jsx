import { useState, useEffect } from "react";
import {
  FaSync, FaCheck, FaTimes, FaSpinner, FaEye, FaCheckCircle, FaTimesCircle,
  FaThumbsDown, FaThumbsUp, FaBoxOpen // Added FaBoxOpen for empty state
} from "react-icons/fa";

// Main component
export default function MaterialAdmin() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Stores ID of item being processed
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject' for specific spinner
  const [actionSuccess, setActionSuccess] = useState(null);
  const [showDetailsId, setShowDetailsId] = useState(null);
  const [showRejectionFormForId, setShowRejectionFormForId] = useState(null); // Store ID for which rejection form is shown
  const [rejectionReason, setRejectionReason] = useState("");
  
  const API_BASE_URL = 'http://localhost:8000/api/admin/material';

  // Fetch materials on component mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Success message timer
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Fetch materials from API
  const fetchMaterials = async () => {
    setLoading(true);
    setError(null); // Reset error before fetching
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
      setMaterials(Array.isArray(data) ? data : []); // Ensure materials is always an array
      setError(null);
    } catch (err) {
      setError(err.message);
      setMaterials([]); // Clear materials on error
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject
  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    setActionType(status === 'approuve' ? 'approve' : 'reject');
    
    try {
      if (status === 'rejete' && !rejectionReason.trim() && showRejectionFormForId === id) {
        // Only validate rejection reason if the form was explicitly shown for this item and action
        alert('Veuillez fournir une justification pour le rejet');
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
      
      if (updatedMaterial && updatedMaterial.id) {
        setMaterials(prevMaterials => prevMaterials.map(material => 
          material.id === updatedMaterial.id ? updatedMaterial : material
        ));
      } else { // Fallback if API doesn't return full item
        setMaterials(prevMaterials => prevMaterials.map(material => 
          material.id === id ? { 
            ...material, 
            statut: status, 
            explication: (status === 'rejete' && rejectionReason.trim() && showRejectionFormForId === id) ? rejectionReason.trim() : material.explication 
          } : material
        ));
      }
      
      setActionSuccess(`Demande ${status === 'approuve' ? 'approuvée' : 'rejetée'} avec succès!`);
      if (status === 'rejete' && showRejectionFormForId === id) {
          setShowRejectionFormForId(null); // Close rejection form if it was open for this item
          setRejectionReason("");
      }
       // Optionally close details view after action, or leave it open
       // setShowDetailsId(null); 
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.message); // Show specific error from API if available
    } finally {
      setActionLoading(null);
      setActionType('');
    }
  };

  const toggleDetails = (id) => {
    const newDetailsId = showDetailsId === id ? null : id;
    setShowDetailsId(newDetailsId);
    if (newDetailsId !== id || newDetailsId === null) { // If closing or switching
      setShowRejectionFormForId(null); // Close any open rejection form
      setRejectionReason("");
    }
  };
  
  const handleShowRejectionForm = (id) => {
    setShowDetailsId(id); // Ensure details are open
    setShowRejectionFormForId(id); // Set which item's rejection form is active
    setRejectionReason(""); // Clear previous reason
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

  // Debug function can remain if useful for development
  // const logMaterialState = (id) => {
  //   const material = materials.find(m => m.id === id);
  //   console.log("Material state:", material);
  // };

  return (
    <>
      {/* Success message - Themed */}
      {actionSuccess && (
        <div className="fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out translate-y-0 opacity-100 bg-green-500 text-white border-l-4 border-green-700 flex items-center animate-fade-in">
          <FaCheckCircle size={20} className="mr-3 flex-shrink-0" />
          <span className="text-sm font-medium">{actionSuccess}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
        <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6] flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Demandes de Matériel</h1>
          <button 
            onClick={() => fetchMaterials()}
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium
                        ${loading ? 'bg-[#C8D9E6]/50 text-[#567C8D] cursor-not-allowed' 
                                 : 'bg-[#567C8D] hover:bg-[#4A6582] text-white shadow-sm'}`}
            disabled={loading}
          >
            {loading ? 
              <FaSpinner size={16} className="mr-2 animate-spin" /> : 
              <FaSync size={16} className="mr-2" />
            }
            Actualiser
          </button>
        </header>

        <div className="p-6">
          {/* Error message - Themed */}
          {error && !loading && ( // Only show error if not loading, to prevent overlap
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 flex items-center border border-red-300 shadow-sm">
              <FaTimesCircle size={18} className="mr-2" />
              Erreur: {error}
            </div>
          )}

          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-12 bg-white">
                <div className="flex flex-col items-center">
                  <FaSpinner className="animate-spin text-[#567C8D]" size={32} />
                  <p className="mt-3 text-[#567C8D]">Chargement des données...</p>
                </div>
              </div>
            ) : materials.length === 0 && !error ? ( // Show empty state only if no error
              <div className="text-center p-12 bg-white">
                <div className="flex flex-col items-center">
                  <FaBoxOpen size={36} className="text-[#C8D9E6] mb-3" />
                  <p className="text-lg font-medium text-[#2F4156]">Aucune demande de matériel</p>
                  <p className="text-sm text-[#567C8D]">Il n'y a pas de demandes à afficher pour le moment.</p>
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
                      <th className="py-3 px-4 text-right text-xs font-semibold text-[#2F4156] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {materials.map((material) => (
                      <>
                        <tr key={material.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                          <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]">{material.employe_nom || 'N/A'}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-[#2F4156]">{material.nom}</td>
                          <td className="py-3 px-4 text-sm text-[#567C8D] max-w-xs truncate" title={material.motif}>{material.motif}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-[#2F4156]">{material.quantite}</td>
                          <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={material.statut} /></td>
                          <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => toggleDetails(material.id)}
                                className="p-1.5 text-[#567C8D] rounded-md hover:bg-[#567C8D]/20 hover:text-[#2F4156] transition-colors"
                                title="Voir détails"
                              > <FaEye size={16} /> </button>
                              
                              {material.statut === 'en_attente' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(material.id, 'approuve')}
                                    disabled={actionLoading === material.id}
                                    className="p-1.5 text-green-600 rounded-md hover:bg-green-500/20 hover:text-green-700 transition-colors"
                                    title="Approuver"
                                  >
                                    {(actionLoading === material.id && actionType === 'approve') ? <FaSpinner size={16} className="animate-spin" /> : <FaThumbsUp size={16} />}
                                  </button>
                                  <button
                                    onClick={() => handleShowRejectionForm(material.id)}
                                    disabled={actionLoading === material.id}
                                    className="p-1.5 text-red-600 rounded-md hover:bg-red-500/20 hover:text-red-700 transition-colors"
                                    title="Rejeter"
                                  >
                                    {(actionLoading === material.id && actionType === 'reject' && showRejectionFormForId !== material.id) ? <FaSpinner size={16} className="animate-spin" /> : <FaThumbsDown size={16} />}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {showDetailsId === material.id && (
                          <tr className="bg-[#F5EFEB]/50">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-[#2F4156]">Détails de la demande:</h4>
                                  <p className="mt-1 text-sm text-[#567C8D]"><span className="font-medium">Motif complet:</span> {material.motif}</p>
                                </div>
                                
                                {material.statut === 'rejete' && material.explication && (
                                  <div className="bg-red-100 p-3 rounded-md border border-red-200">
                                    <p className="text-sm text-red-700"><span className="font-medium">Raison du rejet:</span> {material.explication}</p>
                                  </div>
                                )}
                                
                                {material.statut === 'en_attente' && (
                                  <div className="space-y-3">
                                    {showRejectionFormForId === material.id && (
                                      <div>
                                        <label htmlFor={`rejectionReason-${material.id}`} className="block text-sm font-medium text-[#2F4156] mb-1">
                                          Justification du rejet
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
                                    
                                    <div className="flex justify-end items-center gap-3 pt-2 border-t border-[#C8D9E6]/50">
                                      <button
                                        onClick={() => toggleDetails(material.id)} // This will also close rejection form
                                        className="px-3 py-1.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md transition-colors text-xs font-medium"
                                      >
                                        Fermer Détails
                                      </button>
                                      
                                      {!showRejectionFormForId && ( // Show approve if rejection form isn't active for this ID
                                        <button
                                          onClick={() => handleStatusUpdate(material.id, 'approuve')}
                                          disabled={actionLoading === material.id}
                                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm text-xs font-semibold flex items-center disabled:opacity-60"
                                        >
                                          {(actionLoading === material.id && actionType === 'approve') ? <FaSpinner size={14} className="animate-spin mr-1.5" /> : <FaCheckCircle size={14} className="mr-1.5" />}
                                          Approuver
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
                                      ) : ( // If rejection form is not shown for this ID, show button to open it
                                        <button
                                          onClick={() => handleShowRejectionForm(material.id)}
                                          disabled={actionLoading === material.id}
                                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm text-xs font-semibold flex items-center disabled:opacity-60"
                                        >
                                          <FaTimesCircle size={14} className="mr-1.5" />
                                          Rejeter
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
        </div>
        <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
            Gestion de Matériel © {new Date().getFullYear()}
        </footer>
      </div>

      {/* Style for fade-in animation (can be moved to a global CSS if used elsewhere) */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
} 