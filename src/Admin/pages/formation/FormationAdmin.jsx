import React, { useEffect, useState } from 'react';
import {
  FaCalendarAlt, FaPlusCircle, FaPencilAlt, FaTrashAlt, FaTimes, FaCheck, FaSpinner, FaFileAlt, FaChevronRight, FaUsers, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa'; // Updated icons
import { useNavigate } from 'react-router-dom';

// Re-using the ThemedNotification from DemandesFormationsAdmin (or it can be a shared component)
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
      bgColor = 'bg-blue-500'; textColor = 'text-white'; borderColor = 'border-blue-700'; Icon = FaCheckCircle;
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
  const [isAddButtonLoading, setIsAddButtonLoading] = useState(false); // For toggle form animation
  const [formAnimation, setFormAnimation] = useState(false);

  const API_URL = "http://localhost:8000/api/admin/formations";

  const fetchFormations = async () => {
    setLoading(true);
    setError(null);
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
        throw new Error(errorData.message || "Erreur lors de la récupération des formations.");
      }
      
      const data = await response.json();
      setFormations(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.message);
      setFormations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  // Clear messages automatically
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(''), 3000);
    }
    if (error && !formErrors.length) { // Don't clear general error if there are form-specific errors
      timer = setTimeout(() => setError(null), 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage, error, formErrors]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.titre.trim()) errors.titre = "Le titre est requis";
    if (!formData.date_debut) errors.date_debut = "La date de début est requise";
    if (!formData.date_fin) errors.date_fin = "La date de fin est requise";
    if (formData.date_fin && formData.date_debut && new Date(formData.date_fin) < new Date(formData.date_debut)) {
      errors.date_fin = "La date de fin doit être après la date de début";
    }
    if (!formData.places_disponibles) {
      errors.places_disponibles = "Le nombre de places est requis";
    } else if (isNaN(formData.places_disponibles) || parseInt(formData.places_disponibles) < 0) { // Allow 0 places
      errors.places_disponibles = "Le nombre de places doit être un nombre positif ou nul";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null); // Clear general error before submit
    try {
      const token = localStorage.getItem("admin_token");
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors) { // Handle Laravel validation errors
          const backendErrors = {};
          for (const key in data.errors) {
            backendErrors[key] = data.errors[key][0]; // Take the first error message for each field
          }
          setFormErrors(backendErrors);
        } else {
          throw new Error(data.message || "Une erreur s'est produite lors de la soumission.");
        }
        return; // Stop execution if there are errors
      }
      
      setSuccessMessage(editingId ? "Formation mise à jour!" : "Formation ajoutée!");
      resetFormAndHide(); // Use the animated hide
      fetchFormations();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ? Cela pourrait affecter les demandes associées.")) return;
    
    // Indicate loading state for this specific delete action if needed
    // setDeletingId(id); 
    setError(null);
    setSuccessMessage('');
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Échec de la suppression de la formation.");
      }
      
      setSuccessMessage("Formation supprimée avec succès");
      fetchFormations();
      
    } catch (err) {
      setError(err.message);
    } finally {
      // setDeletingId(null);
    }
  };

  const startEdit = (formation) => {
    setEditingId(formation.id);
    setFormData({
      titre: formation.titre,
      description: formation.description || '',
      date_debut: formation.date_debut, // Assuming API returns YYYY-MM-DD
      date_fin: formation.date_fin,     // Assuming API returns YYYY-MM-DD
      places_disponibles: formation.places_disponibles.toString() // Ensure it's a string for input
    });
    setFormErrors({});
    if (!showAddForm) {
        setShowAddForm(true);
        setTimeout(() => setFormAnimation(true), 50);
    } else {
        setFormAnimation(true); // Already open, just ensure animation state is correct
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFormAndHide = () => {
    setFormAnimation(false);
    setTimeout(() => {
      setShowAddForm(false);
      setFormData({ titre: '', description: '', date_debut: '', date_fin: '', places_disponibles: '' });
      setFormErrors({});
      setEditingId(null);
    }, 300); // Match animation duration
  };

  const toggleFormVisibility = () => {
    if (showAddForm) {
      resetFormAndHide();
    } else {
      setEditingId(null); // Ensure it's an add operation
      setFormData({ titre: '', description: '', date_debut: '', date_fin: '', places_disponibles: '' });
      setFormErrors({});
      setIsAddButtonLoading(true);
      setTimeout(() => { // Simulate a slight delay for UX if desired, or remove
        setShowAddForm(true);
        setTimeout(() => {
             setFormAnimation(true);
             setIsAddButtonLoading(false);
        }, 50); // Animation trigger
      }, 100); // Delay before showing form
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Animated form transition component
  const SlideDown = ({ isVisible, children }) => {
    return (
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isVisible ? 'max-h-[1000px] opacity-100 py-2' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        {isVisible && children}
      </div>
    );
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
        show={!!error && !Object.keys(formErrors).length} // Show general error if no form errors
        onDismiss={() => setError(null)}
      />

      <div className="max-w-6xl mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
        <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des Formations</h1>
            <p className="text-sm text-[#567C8D] mt-0.5">Créez et gérez les formations disponibles.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/demandes-formations')}
              className="flex items-center gap-2 px-4 py-2 bg-[#567C8D] hover:bg-[#4A6582] text-white rounded-md shadow-sm transition-colors text-sm font-medium"
            >
              <FaUsers size={16} />
              <span>Demandes</span>
              <FaChevronRight size={14} />
            </button>
            <button 
              onClick={toggleFormVisibility}
              disabled={isAddButtonLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-sm transition-all duration-200 text-sm font-medium
                         text-white justify-center 
                         ${showAddForm ? 'bg-red-500 hover:bg-red-600' : 'bg-[#2F4156] hover:bg-[#3b5068]'}
                         ${isAddButtonLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isAddButtonLoading ? (<><FaSpinner className="animate-spin" size={18} /> Chargement...</>)
              : showAddForm ? ( <><FaTimes size={18} /> Annuler</> )
              : ( <><FaPlusCircle size={18} /> Ajouter Formation</> )}
            </button>
          </div>
        </header>

        <div className="p-6">
          <SlideDown isVisible={showAddForm}>
            <div className={`bg-white border border-[#C8D9E6] rounded-xl shadow-lg p-6 mb-8
                           transition-opacity duration-300 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[#C8D9E6]">
                <div className={`p-2 rounded-full ${editingId ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {editingId ? <FaPencilAlt size={18} className="text-blue-600" /> : <FaFileAlt size={18} className="text-green-600" />}
                </div>
                <h2 className="text-xl font-semibold text-[#2F4156]">
                  {editingId ? "Modifier la Formation" : "Ajouter une Nouvelle Formation"}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="titre" className="block text-sm font-medium text-[#2F4156] mb-1">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="titre" type="text" name="titre" value={formData.titre} onChange={handleInputChange}
                    className={`w-full p-2.5 border rounded-md text-[#2F4156] bg-white
                                ${formErrors.titre ? 'border-red-500 focus:ring-red-500' : 'border-[#C8D9E6] focus:border-[#567C8D]'} 
                                focus:ring-1 focus:outline-none transition-all`}
                    placeholder="Titre de la formation"
                  />
                  {formErrors.titre && <p className="mt-1 text-xs text-red-600">{formErrors.titre}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#2F4156] mb-1">Description</label>
                  <textarea
                    id="description" name="description" value={formData.description} onChange={handleInputChange}
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md min-h-[80px] text-[#2F4156] bg-white
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                    placeholder="Description (optionnel)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="date_debut" className="block text-sm font-medium text-[#2F4156] mb-1">
                      Date de début <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="date_debut" type="date" name="date_debut" value={formData.date_debut} onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-md text-[#2F4156] bg-white
                                  ${formErrors.date_debut ? 'border-red-500 focus:ring-red-500' : 'border-[#C8D9E6] focus:border-[#567C8D]'}
                                  focus:ring-1 focus:outline-none transition-all`}
                    />
                    {formErrors.date_debut && <p className="mt-1 text-xs text-red-600">{formErrors.date_debut}</p>}
                  </div>
                  <div>
                    <label htmlFor="date_fin" className="block text-sm font-medium text-[#2F4156] mb-1">
                      Date de fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="date_fin" type="date" name="date_fin" value={formData.date_fin} onChange={handleInputChange}
                      className={`w-full p-2.5 border rounded-md text-[#2F4156] bg-white
                                  ${formErrors.date_fin ? 'border-red-500 focus:ring-red-500' : 'border-[#C8D9E6] focus:border-[#567C8D]'}
                                  focus:ring-1 focus:outline-none transition-all`}
                    />
                    {formErrors.date_fin && <p className="mt-1 text-xs text-red-600">{formErrors.date_fin}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="places_disponibles" className="block text-sm font-medium text-[#2F4156] mb-1">
                    Places disponibles <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="places_disponibles" type="number" name="places_disponibles" value={formData.places_disponibles} onChange={handleInputChange}
                    min="0"
                    className={`w-full p-2.5 border rounded-md text-[#2F4156] bg-white
                                ${formErrors.places_disponibles ? 'border-red-500 focus:ring-red-500' : 'border-[#C8D9E6] focus:border-[#567C8D]'}
                                focus:ring-1 focus:outline-none transition-all`}
                    placeholder="Nombre de places"
                  />
                  {formErrors.places_disponibles && <p className="mt-1 text-xs text-red-600">{formErrors.places_disponibles}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#C8D9E6] mt-6">
                  <button
                    type="button" onClick={resetFormAndHide}
                    disabled={submitting}
                    className="px-4 py-2 bg-[#C8D9E6]/50 hover:bg-[#C8D9E6]/80 text-[#2F4156] rounded-md transition-colors duration-200 flex items-center font-medium text-sm"
                  >
                    <FaTimes size={16} className="mr-2" /> Annuler
                  </button>
                  <button
                    type="submit" // Changed to submit
                    disabled={submitting}
                    className={`px-5 py-2 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center font-medium text-sm
                               ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                               ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? <FaSpinner size={16} className="mr-2 animate-spin" /> 
                               : editingId ? <FaCheck size={16} className="mr-2" /> 
                               : <FaPlusCircle size={16} className="mr-2" />}
                    {submitting ? "Envoi..." : editingId ? "Mettre à jour" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <FaSpinner size={32} className="animate-spin text-[#567C8D] mx-auto mb-3" />
              <p className="text-[#567C8D]">Chargement des formations...</p>
            </div>
          ) : formations.length === 0 && !showAddForm ? ( // Only show empty state if form is not open
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-[#C8D9E6]">
              <FaFileAlt size={36} className="text-[#C8D9E6] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2F4156] mb-1">Aucune formation disponible</h3>
              <p className="text-sm text-[#567C8D] mb-5">Commencez par ajouter une nouvelle formation.</p>
              <button
                onClick={toggleFormVisibility}
                className="flex items-center gap-2 px-4 py-2 bg-[#2F4156] text-white rounded-md hover:bg-[#3b5068] mx-auto text-sm font-medium"
              >
                <FaPlusCircle size={16} /> Ajouter une Formation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formations.map((formation) => (
                <div 
                  key={formation.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-[#C8D9E6] transition-all hover:shadow-xl flex flex-col"
                >
                  <div className="p-5 flex-grow">
                    <h3 className="font-semibold text-lg mb-2 text-[#2F4156]">{formation.titre}</h3>
                    
                    <div className="flex flex-col space-y-1.5 text-xs mb-3">
                      <div className="inline-flex items-center gap-2 text-[#567C8D]">
                        <FaCalendarAlt className="text-[#567C8D]/80" size={13}/>
                        <span>
                          {formatDate(formation.date_debut)} - {formatDate(formation.date_fin)}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 text-[#567C8D]">
                        <FaUsers className="text-[#567C8D]/80" size={13}/>
                        <span>
                          {formation.places_disponibles || 0} places
                        </span>
                      </div>
                    </div>
                    
                    {formation.description && (
                      <p className="text-[#567C8D] text-sm line-clamp-3 leading-relaxed">
                        {formation.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2 p-3 border-t border-[#C8D9E6]/50 bg-[#F5EFEB]/30">
                    <button
                      onClick={() => startEdit(formation)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-100/70 hover:bg-blue-200/70 rounded-md transition-colors text-xs font-medium"
                      title="Modifier"
                    > <FaPencilAlt size={13} /> Modifier </button>
                    <button
                      onClick={() => handleDelete(formation.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-100/70 hover:bg-red-200/70 rounded-md transition-colors text-xs font-medium"
                      title="Supprimer"
                    > <FaTrashAlt size={13} /> Supprimer </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
            Gestion des Formations © {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}