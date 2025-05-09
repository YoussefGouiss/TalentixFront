import React, { useEffect, useState } from 'react';
import { CalendarDays, PlusCircle, Pencil, Trash2, X, Check, Loader2, FileText, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FormationAdmin() {
  const navigate = useNavigate();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    places_disponibles: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchFormations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("http://localhost:8000/api/admin/formations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Erreur lors de la récupération des formations");
      
      const data = await response.json();
      setFormations(data);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear specific field error when typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.titre) errors.titre = "Le titre est requis";
    if (!formData.date_debut) errors.date_debut = "La date de début est requise";
    if (!formData.date_fin) errors.date_fin = "La date de fin est requise";
    if (formData.date_fin && formData.date_debut && new Date(formData.date_fin) < new Date(formData.date_debut)) {
      errors.date_fin = "La date de fin doit être après la date de début";
    }
    if (!formData.places_disponibles) {
      errors.places_disponibles = "Le nombre de places disponibles est requis";
    } else if (isNaN(formData.places_disponibles) || parseInt(formData.places_disponibles) <= 0) {
      errors.places_disponibles = "Le nombre de places doit être un nombre positif";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const url = editingId 
        ? `http://localhost:8000/api/admin/formations/${editingId}`
        : "http://localhost:8000/api/admin/formations";
      
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors) {
          setFormErrors(data.errors);
        } else {
          throw new Error(data.message || "Une erreur s'est produite");
        }
        return;
      }
      
      // Success handling
      setSuccessMessage(editingId ? "Formation mise à jour avec succès" : "Formation ajoutée avec succès");
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form
      resetForm();
      
      // Refresh formations list
      fetchFormations();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) return;
    
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`http://localhost:8000/api/admin/formations/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Échec de la suppression");
      
      setSuccessMessage("Formation supprimée avec succès");
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh formations list
      fetchFormations();
      
    } catch (error) {
      setError(error.message);
    }
  };

  const startEdit = (formation) => {
    setEditingId(formation.id);
    setFormData({
      titre: formation.titre,
      description: formation.description || '',
      date_debut: formation.date_debut,
      date_fin: formation.date_fin,
      places_disponibles: formation.places_disponibles || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      date_debut: '',
      date_fin: '',
      places_disponibles: ''
    });
    setFormErrors({});
    setEditingId(null);
    setShowAddForm(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Formations</h1>
          <p className="text-gray-600 mt-1">Créez et gérez les formations disponibles</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/demandes-formations')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Users size={18} />
            <span>Demandes de formations</span>
            <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            {showAddForm ? <X size={18} /> : <PlusCircle size={18} />}
            {showAddForm ? "Annuler" : "Ajouter une formation"}
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md shadow-sm flex items-center gap-3">
          <div className="p-1 bg-green-100 rounded-full">
            <Check size={18} className="text-green-600" />
          </div>
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm flex items-center gap-3">
          <div className="p-1 bg-red-100 rounded-full">
            <X size={18} className="text-red-600" />
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-full">
              {editingId ? <Pencil size={20} className="text-blue-600" /> : <FileText size={20} className="text-blue-600" />}
            </div>
            <h2 className="text-xl font-semibold">
              {editingId ? "Modifier la formation" : "Ajouter une nouvelle formation"}
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre*
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-md ${formErrors.titre ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Titre de la formation"
              />
              {formErrors.titre && (
                <p className="mt-1 text-sm text-red-600">{formErrors.titre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md min-h-24 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="Description de la formation (optionnel)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début*
                </label>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md ${formErrors.date_debut ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                />
                {formErrors.date_debut && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.date_debut}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin*
                </label>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md ${formErrors.date_fin ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                />
                {formErrors.date_fin && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.date_fin}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Places disponibles*
              </label>
              <input
                type="number"
                name="places_disponibles"
                value={formData.places_disponibles}
                onChange={handleInputChange}
                min="1"
                className={`w-full p-3 border rounded-md ${formErrors.places_disponibles ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
                placeholder="Nombre de places disponibles"
              />
              {formErrors.places_disponibles && (
                <p className="mt-1 text-sm text-red-600">{formErrors.places_disponibles}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-all shadow-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-sm font-medium"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : editingId ? <Check size={18} /> : <PlusCircle size={18} />}
                {submitting ? "Envoi..." : editingId ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formations List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement des formations...</p>
          </div>
        </div>
      ) : formations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="max-w-sm mx-auto">
            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune formation disponible</h3>
            <p className="text-gray-500 mb-6">Aucune formation n'a été ajoutée pour le moment.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto"
            >
              <PlusCircle size={18} />
              <span>Ajouter une formation</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <div 
              key={formation.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg hover:translate-y-px"
            >
              <div className="p-6">
                <h3 className="font-bold text-xl mb-3 text-gray-800">{formation.titre}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="inline-flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                    <CalendarDays size={16} />
                    <span className="font-medium">
                      Du {formatDate(formation.date_debut)} au {formatDate(formation.date_fin)}
                    </span>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                    <Users size={16} />
                    <span className="font-medium">
                      {formation.places_disponibles || 0} places disponibles
                    </span>
                  </div>
                </div>
                
                {formation.description && (
                  <div className="mt-3 mb-6">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {formation.description}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => startEdit(formation)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={16} />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDelete(formation.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}