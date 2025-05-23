import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTrashAlt, FaPencilAlt, FaPlusCircle, FaTimes, FaCheck, FaSearch,
  FaChevronDown, FaQuestionCircle, FaSpinner, FaListAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa';

// --- ThemedNotification Component ---
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
    case 'warning':
      bgColor = 'bg-yellow-400'; textColor = 'text-yellow-800'; borderColor = 'border-yellow-600'; Icon = FaExclamationTriangle;
      break;
    default:
      bgColor = 'bg-blue-500'; textColor = 'text-white'; borderColor = 'border-blue-700'; Icon = FaCheckCircle;
  }
  return (
    <div
      className={`fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}
                  ${bgColor} ${textColor} border-l-4 ${borderColor} flex items-center justify-between min-w-[300px]`}
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

// --- SlideDown Component ---
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

// --- Themed Skeleton Loader ---
const ThemedSkeletonLoader = ({ rows = 5 }) => {
  return (
    <div className="animate-pulse p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center">
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Type */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Description */}
          <div className="h-8 bg-[#C8D9E6]/70 rounded w-24 col-span-1 justify-self-center"></div> {/* Actions */}
        </div>
      ))}
    </div>
  );
};


export default function AttestationTypeManagement() {
  const [attestationTypes, setAttestationTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddButtonLoading, setIsAddButtonLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('type');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formAnimation, setFormAnimation] = useState(false);

  const [formData, setFormData] = useState({ type: '', description: '' });
  const [notification, setNotificationState] = useState({ show: false, message: '', type: 'success' });

  const API_URL = 'http://localhost:8000/api/admin/attestations';
  const getToken = () => localStorage.getItem('admin_token');
  const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const showAppNotification = (message, type = 'success', duration = 3000) => {
    setNotificationState({ show: true, message, type });
    setTimeout(() => {
      setNotificationState(prev => ({ ...prev, show: false }));
    }, duration);
  };


  const fetchAttestationTypes = async () => {
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json', 'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la récupération des types d\'attestation.');
      }
      const data = await response.json();
      setAttestationTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message); 
      showAppNotification(err.message, 'error');
      setAttestationTypes([]);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAttestationTypes(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.type.trim()) {
        showAppNotification("Le nom du type est requis.", "warning");
        return;
    }
    setIsSubmitting(true);

    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? 'PUT' : 'POST';
    const headers = {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    const csrfToken = getCsrfToken();
    if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;


    try {
      const response = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      const responseData = await response.json();
      if (!response.ok) {
        if (responseData.errors && typeof responseData.errors === 'object') {
            const firstErrorKey = Object.keys(responseData.errors)[0];
            const firstErrorMessage = responseData.errors[firstErrorKey][0];
            throw new Error(firstErrorMessage || `Erreur lors de ${editingId ? 'la mise à jour' : 'la création'}`);
        }
        throw new Error(responseData.message || `Erreur lors de ${editingId ? 'la mise à jour' : 'la création'}`);
      }
      
      await fetchAttestationTypes();
      showAppNotification(responseData.message || `Type ${editingId ? 'mis à jour' : 'ajouté'} avec succès!`, 'success');
      resetFormAndHide();
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce type d\'attestation?')) return;
    setIsSubmitting(true);
    try {
        const headers = {
            'Authorization': `Bearer ${getToken()}`,
            'Accept': 'application/json',
        };
        const csrfToken = getCsrfToken();
        if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
      if (response.status === 204) {
        await fetchAttestationTypes();
        showAppNotification('Type supprimé avec succès', 'success');
        return;
      }
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Erreur lors de la suppression');
      
      await fetchAttestationTypes();
      showAppNotification(responseData.message || 'Type supprimé avec succès', 'success');
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (attestationType) => {
    setFormData({ type: attestationType.type, description: attestationType.description || '' });
    setEditingId(attestationType.id);
    if (!showForm) {
        setShowForm(true);
        setTimeout(() => setFormAnimation(true), 50);
    } else {
        setFormAnimation(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFormAndHide = () => { 
    setFormAnimation(false);
    setTimeout(() => {
      setShowForm(false);
      setFormData({ type: '', description: '' });
      setEditingId(null);
    }, 300);
  };

  const toggleFormVisibility = () => { 
    if (showForm) {
      resetFormAndHide();
    } else {
      setEditingId(null); 
      setFormData({ type: '', description: '' }); 
      setIsAddButtonLoading(true);
      setTimeout(() => {
        setShowForm(true);
        setTimeout(() => {
             setFormAnimation(true);
             setIsAddButtonLoading(false);
        }, 50);
      }, 100); 
    }
  };

  const handleSort = (field) => {
    const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field); setSortDirection(newDirection);
  };

  const sortedAndFilteredTypes = [...attestationTypes]
    .filter(attType =>
      attType.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const valA = (typeof a[sortField] === 'string' ? a[sortField].toLowerCase() : a[sortField]) || '';
      const valB = (typeof b[sortField] === 'string' ? b[sortField].toLowerCase() : b[sortField]) || '';
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#F5EFEB]">
      <ThemedNotification 
        show={notification.show} 
        message={notification.message} 
        type={notification.type} 
        onDismiss={() => setNotificationState(prev => ({ ...prev, show: false }))}
      />

      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        {/* Changed max-w-4xl to max-w-6xl for wider header content */}
        <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Types d'Attestation</h1>
            <p className="text-sm text-[#567C8D] mt-0.5">Gérez les différents types d'attestations.</p>
          </div>
           <Link
                to="/admin/demandeAttestation" 
                className="flex items-center gap-2 px-4 py-2 bg-[#567C8D] hover:bg-[#4A6582] text-white rounded-md shadow-sm transition-colors text-sm font-medium"
            > <FaListAlt className="mr-1.5" size={16} /> Voir les Demandes </Link>
        </header>
      </div>

      {/* Changed max-w-4xl to max-w-6xl for wider main content */}
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-auto">
              <input
                type="text" placeholder="Rechercher un type..."
                className="pl-10 pr-3 py-2.5 border border-[#C8D9E6] rounded-lg w-full md:w-64
                           text-[#2F4156] bg-white placeholder-[#567C8D]/70 text-sm
                           focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all duration-200 outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#567C8D]/80" />
            </div>

            <button
              onClick={toggleFormVisibility} disabled={isAddButtonLoading || isSubmitting}
              className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 text-sm font-medium
                         w-full md:w-auto text-white
                         ${showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-[#2F4156] hover:bg-[#3b5068]'}
                         ${(isAddButtonLoading || isSubmitting) ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isAddButtonLoading ? <><FaSpinner className="mr-2 animate-spin" size={18} />Chargement...</>
               : showForm ? <><FaTimes className="mr-2" size={18} />Annuler</>
               : <><FaPlusCircle className="mr-2" size={18} />Ajouter Type</>}
            </button>
          </div>

          <SlideDown isVisible={showForm}>
            <div className={`bg-white border border-[#C8D9E6] rounded-xl shadow-lg p-6 mb-8
                           transition-opacity duration-300 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-xl font-semibold mb-6 text-[#2F4156] border-b border-[#C8D9E6] pb-3">
                {editingId ? 'Modifier le Type' : 'Nouveau Type d\'Attestation'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-[#2F4156] mb-1">
                    Nom du Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="type" id="type" value={formData.type} onChange={handleChange}
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white text-sm
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                    required disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#2F4156] mb-1">Description</label>
                  <textarea
                    name="description" id="description" value={formData.description} onChange={handleChange}
                    rows="3"
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white text-sm
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                    disabled={isSubmitting}
                    placeholder="Décrivez l'usage de ce type d'attestation (optionnel)"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[#C8D9E6] mt-4">
                  <button
                    type="button" onClick={resetFormAndHide} disabled={isSubmitting}
                    className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md 
                               transition-colors duration-200 flex items-center font-medium text-sm"
                  > <FaTimes size={16} className="mr-2" /> Annuler </button>
                  <button
                    type="submit" disabled={isSubmitting}
                    className={`px-5 py-2 text-white rounded-md shadow-sm transition-all duration-200 flex items-center font-medium text-sm
                               ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                               ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? <FaSpinner size={16} className="mr-2 animate-spin" /> 
                                   : editingId ? <FaCheck size={16} className="mr-2" /> 
                                   : <FaPlusCircle size={16} className="mr-2" />}
                    {isSubmitting ? 'Traitement...' : editingId ? 'Mettre à Jour' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>

          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden mt-8">
            <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-5 py-3.5">
              <h2 className="font-semibold text-[#2F4156]">Liste des Types d'Attestation</h2>
            </div>
            {isLoading ? (
              <ThemedSkeletonLoader rows={attestationTypes.length > 0 ? attestationTypes.length : 3} />
            ) : error && sortedAndFilteredTypes.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <FaExclamationTriangle size={40} className="text-red-500 mb-4" />
                <p className="text-xl font-medium text-[#2F4156]">{error}</p>
                <p className="text-[#567C8D] mt-2">Veuillez vérifier votre connexion ou réessayer.</p>
                <button
                    onClick={fetchAttestationTypes}
                    className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
                > Réessayer </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      {[{key: 'type', label: 'Type'}, {key: 'description', label: 'Description'}].map(header => (
                        <th key={header.key}
                            className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider cursor-pointer hover:bg-[#C8D9E6]/60 transition-colors"
                            onClick={() => handleSort(header.key)}>
                          <div className="flex items-center">
                            {header.label}
                            {sortField === header.key && <FaChevronDown className={`ml-1.5 w-3 h-3 transition-transform duration-200 text-[#567C8D] ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {sortedAndFilteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaSearch className="h-12 w-12 text-[#C8D9E6] mb-3" />
                            <p className="text-lg font-medium text-[#2F4156]">Aucun type trouvé</p>
                            <p className="text-sm text-[#567C8D]">
                                {searchTerm ? "Essayez d'ajuster votre recherche ou " : ""}
                                <button onClick={toggleFormVisibility} className="text-[#567C8D] hover:text-[#2F4156] underline font-medium">
                                 ajoutez un nouveau type.
                                </button>
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredTypes.map((attType) => (
                        <tr key={attType.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150 text-sm">
                          <td className="py-3 px-4 text-[#2F4156] font-medium whitespace-nowrap">{attType.type}</td>
                          <td className="py-3 px-4 text-[#567C8D] max-w-xl" title={attType.description || ''}> {/* Increased max-w for description */}
                            {attType.description ? (
                                <span className="line-clamp-2">{attType.description}</span>
                            ) : (
                                <i className="text-gray-400">Non spécifiée</i>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => handleEdit(attType)}
                                className="p-1.5 text-[#567C8D] rounded-md hover:bg-[#567C8D]/10 hover:text-[#2F4156] transition-colors"
                                title="Modifier"
                                disabled={isSubmitting}
                              > <FaPencilAlt size={14} /> </button>
                              <button
                                onClick={() => handleDelete(attType.id)}
                                className="p-1.5 text-red-600 rounded-md hover:bg-red-500/10 hover:text-red-700 transition-colors"
                                title="Supprimer"
                                disabled={isSubmitting}
                              > <FaTrashAlt size={14} /> </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </main>
      {/* Changed max-w-4xl to max-w-6xl for wider footer content */}
      <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Gestion des Types d'Attestation © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}