import { useState, useEffect } from "react";
import { RefreshCw, Check, X, Loader2, Eye, CheckCircle, XCircle, ThumbsDown, ThumbsUp } from "lucide-react";

// Main component
export default function MaterialAdmin() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [showDetailsId, setShowDetailsId] = useState(null);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
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
    try {
      const response = await fetch('http://localhost:8000/api/admin/material', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();
      setMaterials(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject
  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    
    try {
      // If rejecting, ensure we have a reason
      if (status === 'rejete' && !rejectionReason.trim()) {
        alert('Veuillez fournir une justification pour le rejet');
        setActionLoading(null);
        return;
      }
      
      const payload = {
        statut: status
      };
      
      // Only add explication to payload when rejecting and there's a reason
      if (status === 'rejete' && rejectionReason.trim()) {
        payload.explication = rejectionReason.trim();
      }

      const response = await fetch(`http://localhost:8000/api/admin/material/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Failed to ${status === 'approuve' ? 'approve' : 'reject'} material`);
      
      // Update local state with the updated material
      const updatedMaterial = await response.json();
      
      // If the API returns the updated material directly
      if (updatedMaterial && updatedMaterial.id) {
        setMaterials(materials.map(material => 
          material.id === updatedMaterial.id ? updatedMaterial : material
        ));
      } else {
        // Fallback to our local update if API doesn't return the updated item
        setMaterials(materials.map(material => 
          material.id === id ? { 
            ...material, 
            statut: status, 
            explication: status === 'rejete' ? rejectionReason.trim() : material.explication 
          } : material
        ));
      }
      
      setActionSuccess(`Demande ${status === 'approuve' ? 'approuvée' : 'rejetée'} avec succès!`);
      setShowDetailsId(null);
      setShowRejectionForm(false);
      setRejectionReason("");
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle details for a specific material
  const toggleDetails = (id) => {
    setShowDetailsId(prevId => prevId === id ? null : id);
    setShowRejectionForm(false);
    setRejectionReason("");
  };
  
  // Show rejection form
  const handleShowRejectionForm = (id) => {
    setShowDetailsId(id);
    setShowRejectionForm(true);
  };

  // Status badge with appropriate colors
  const StatusBadge = ({ status }) => {
    const statusMap = {
      en_attente: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
      approuve: { label: "Approuvé", color: "bg-green-100 text-green-800 border border-green-200" },
      rejete: { label: "Rejeté", color: "bg-red-100 text-red-800 border border-red-200" },
      default: { label: status, color: "bg-gray-100 text-gray-800 border border-gray-200" }
    };
    
    const { label, color } = statusMap[status] || statusMap.default;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color} shadow-sm`}>
        {label}
      </span>
    );
  };

  // Debug function to log the state of a material
  const logMaterialState = (id) => {
    const material = materials.find(m => m.id === id);
    console.log("Material state:", material);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mx-auto border border-gray-100">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Demandes de Matériel</h2>
        <button 
          onClick={() => fetchMaterials()}
          className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200 shadow-sm border border-blue-100"
          disabled={loading}
        >
          {loading ? 
            <Loader2 size={16} className="mr-2 animate-spin" /> : 
            <RefreshCw size={16} className="mr-2" />
          }
          Actualiser
        </button>
      </div>

      {/* Success message */}
      {actionSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 flex items-center border border-green-100 shadow-sm animate-fade-in">
          <Check size={18} className="mr-2" />
          {actionSuccess}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 flex items-center border border-red-100 shadow-sm">
          <X size={18} className="mr-2" />
          Erreur: {error}
        </div>
      )}

      {/* Materials Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        {loading ? (
          <div className="flex justify-center p-12 bg-white">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Chargement des données...</p>
            </div>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center p-12 bg-white">
            <div className="flex flex-col items-center">
              <div className="rounded-full h-16 w-16 bg-gray-100 flex items-center justify-center mb-4">
                <RefreshCw size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucune demande de matériel trouvée.</p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom d'employe
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom du matériel
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motif
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => (
                <>
                  <tr key={material.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{material.employe_nom}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{material.nom}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">{material.motif}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{material.quantite}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={material.statut} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => { toggleDetails(material.id); logMaterialState(material.id); }}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          title="Voir détails"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {material.statut === 'en_attente' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(material.id, 'approuve')}
                              disabled={actionLoading === material.id}
                              className="text-green-600 hover:text-green-800 bg-green-50 p-2 rounded-full hover:bg-green-100 transition-colors duration-200"
                              title="Approuver"
                            >
                              {actionLoading === material.id ? 
                                <Loader2 size={16} className="animate-spin" /> : 
                                <ThumbsUp size={16} />
                              }
                            </button>
                            <button
                              onClick={() => handleShowRejectionForm(material.id)}
                              disabled={actionLoading === material.id}
                              className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                              title="Rejeter"
                            >
                              <ThumbsDown size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded details row */}
                  {showDetailsId === material.id && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-800">Détails de la demande</h4>
                            <p className="mt-1 text-sm text-gray-600"><span className="font-medium">Motif complet:</span> {material.motif}</p>
                          </div>
                          
                          {material.statut === 'rejete' && material.explication && (
                            <div className="bg-red-50 p-3 rounded-md border border-red-100">
                              <p className="text-sm text-red-700"><span className="font-medium">Raison du rejet:</span> {material.explication}</p>
                            </div>
                          )}
                          
                          {material.statut === 'en_attente' && (
                            <div className="space-y-3">
                              {/* Only show justification field if we're in reject mode */}
                              {showRejectionForm && showDetailsId === material.id && (
                                <div>
                                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                                    Justification du rejet
                                  </label>
                                  <textarea
                                    id="rejectionReason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows="2"
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                                    placeholder="Expliquez pourquoi cette demande est rejetée..."
                                  ></textarea>
                                </div>
                              )}
                              
                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={() => toggleDetails(material.id)}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                >
                                  Annuler
                                </button>
                                
                                {!showRejectionForm && (
                                  <button
                                    onClick={() => handleStatusUpdate(material.id, 'approuve')}
                                    disabled={actionLoading === material.id}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center"
                                  >
                                    <CheckCircle size={14} className="mr-1" />
                                    Approuver
                                  </button>
                                )}
                                
                                {showRejectionForm ? (
                                  <button
                                    onClick={() => handleStatusUpdate(material.id, 'rejete')}
                                    disabled={actionLoading === material.id}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center"
                                  >
                                    <XCircle size={14} className="mr-1" />
                                    Confirmer le rejet
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleShowRejectionForm(material.id)}
                                    disabled={actionLoading === material.id}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center"
                                  >
                                    <XCircle size={14} className="mr-1" />
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
        )}
      </div>

      {/* Style for fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}