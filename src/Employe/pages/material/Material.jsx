import { useState, useEffect } from "react";
import { Trash2, Edit, Plus, Check, X, RefreshCw, Loader2, Save } from "lucide-react";

// Main component
export default function MaterialEmploye() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    motif: "",
    quantite: 1
  });

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
      const response = await fetch('http://localhost:8000/api/material',{
        method : 'GET',
        headers :{
          'Authorization': `Bearer ${localStorage.getItem('employe_token')}`,
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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantite' ? parseInt(value) || 0 : value
    }));
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      if (editMode) {
        // Update existing material
        const response = await fetch(`http://localhost:8000/api/material/${currentId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('employe_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to update material');
        
        // Update local state
        setMaterials(materials.map(material => 
          material.id === currentId ? { ...material, ...formData } : material
        ));
        setActionSuccess("Matériel mis à jour avec succès!");
      } else {
        // Create new material
        const response = await fetch('http://localhost:8000/api/material', {
          method: 'POST',
          headers: {
          'Authorization': `Bearer ${localStorage.getItem('employe_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to create material');
        
        const newMaterial = await response.json();
        setMaterials([...materials, newMaterial]);
        setActionSuccess("Nouvelle demande créée avec succès!");
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete a material
  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande de matériel?')) return;
    
    setDeleteLoading(id);
    try {
      const response = await fetch(`http://localhost:8000/api/material/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('employe_token')}`,
            }
      });

      if (!response.ok) throw new Error('Failed to delete material');
      
      // Remove from local state
      setMaterials(materials.filter(material => material.id !== id));
      setError(null);
      setActionSuccess("Demande supprimée avec succès!");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Edit a material - populate form with existing data
  const handleEdit = (material) => {
    setFormData({
      nom: material.nom,
      motif: material.motif,
      quantite: material.quantite
    });
    setCurrentId(material.id);
    setEditMode(true);
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      nom: "",
      motif: "",
      quantite: 1
    });
    setCurrentId(null);
    setEditMode(false);
    setShowForm(false);
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mx-auto border border-gray-100">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Matériaux</h2>
        <div className="flex space-x-3">
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
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (editMode) resetForm();
            }}
            className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 shadow-sm ${
              showForm 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-700'
            }`}
          >
            {showForm ? 'Annuler' : (
              <>
                <Plus size={16} className="mr-2" />
                Nouvelle Demande
              </>
            )}
          </button>
        </div>
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

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-md border border-gray-200 transition-all duration-300 ease-in-out">
          <h3 className="text-lg font-medium mb-6 text-gray-800 flex items-center">
            {editMode ? (
              <>
                <Edit size={18} className="mr-2 text-blue-600" />
                Modifier la demande
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2 text-green-600" />
                Nouvelle demande de matériel
              </>
            )}
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du matériel
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Nom du matériel demandé"
                />
              </div>
              <div>
                <label htmlFor="quantite" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité
                </label>
                <input
                  type="number"
                  id="quantite"
                  name="quantite"
                  min="1"
                  value={formData.quantite}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="motif" className="block text-sm font-medium text-gray-700 mb-1">
                Motif de la demande
              </label>
              <textarea
                id="motif"
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Décrivez pourquoi vous avez besoin de ce matériel..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 shadow-sm border border-gray-300"
                disabled={formLoading}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm border border-blue-700 flex items-center"
              >
                {formLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {editMode ? 'Mettre à jour' : 'Soumettre'}
                  </>
                )}
              </button>
            </div>
          </div>
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
              <p className="text-gray-400 text-sm mt-1">Créez une nouvelle demande avec le bouton "Nouvelle Demande"</p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
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
                <tr key={material.id} className="hover:bg-gray-50 transition-colors duration-150">
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
                      {material.statut === 'en_attente' && (
                        <>
                          <button
                            onClick={() => handleEdit(material)}
                            className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id)}
                            disabled={deleteLoading === material.id}
                            className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                            title="Supprimer"
                          >
                            {deleteLoading === material.id ? 
                              <Loader2 size={16} className="animate-spin" /> : 
                              <Trash2 size={16} />
                            }
                          </button>
                        </>
                      )}
                      {material.statut !== 'en_attente' && (
                        <span className="bg-gray-100 text-gray-500 text-xs italic px-3 py-1 rounded-md">Non modifiable</span>
                      )}
                    </div>
                  </td>
                </tr>
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