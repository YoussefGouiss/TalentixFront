// src/components/admin/AttestationTypeManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { Trash2, Edit, PlusCircle, X, Check, Search, ChevronDown, HelpCircle, Loader, ListChecks } from 'lucide-react'; // Added ListChecks icon
import SlideDown from '../../common/SlideDown';
import Notification from '../../common/Notification';
import SkeletonLoader from '../../common/SkeletonLoader';

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

  const [formData, setFormData] = useState({
    type: '',
    description: '',
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const API_URL = 'http://localhost:8000/api/admin/attestations';

  const getToken = () => localStorage.getItem('admin_token');
  const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const fetchAttestationTypes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des types d\'attestation');
      }

      const data = await response.json();
      setAttestationTypes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Impossible de charger les données');
      console.error('Error fetching attestation types:', err);
      setAttestationTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttestationTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showAppNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Erreur lors de ${editingId ? 'la mise à jour' : 'la création'}`);
      }

      await fetchAttestationTypes();
      showAppNotification(responseData.message || `Type d'attestation ${editingId ? 'mis à jour' : 'ajouté'} avec succès`);
      resetForm();
    } catch (err) {
      showAppNotification(err.message || 'Une erreur est survenue', 'error');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type d\'attestation?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Erreur lors de la suppression');
      }

      await fetchAttestationTypes();
      showAppNotification(responseData.message || 'Type d\'attestation supprimé avec succès');
    } catch (err) {
      showAppNotification(err.message || 'Échec de la suppression', 'error');
      console.error('Error deleting attestation type:', err);
    }
  };

  const handleEdit = (attestationType) => {
    setFormData({
      type: attestationType.type,
      description: attestationType.description,
    });
    setEditingId(attestationType.id);
    if (!showForm) {
        setShowForm(true);
        setTimeout(() => setFormAnimation(true), 50);
    } else {
        setFormAnimation(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormAnimation(false);
    setTimeout(() => {
      setFormData({ type: '', description: '' });
      setEditingId(null);
      setShowForm(false);
    }, 300);
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setIsAddButtonLoading(true);
      setEditingId(null);
      setFormData({ type: '', description: '' });
      setTimeout(() => {
        setShowForm(true);
        setTimeout(() => {
          setFormAnimation(true);
          setIsAddButtonLoading(false);
        }, 50);
      }, 300); 
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredTypes = [...attestationTypes]
    .filter(attType =>
      attType.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">Gestion des Types d'Attestation</h1>
        </div>

        <Notification show={notification.show} message={notification.message} type={notification.type} />

        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Rechercher un type..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"> {/* Wrapper for buttons */}
              <button
                onClick={toggleForm}
                disabled={isAddButtonLoading}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow transition-all duration-200 w-full sm:w-auto ${
                  showForm
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white' // Adjusted color for distinction
                } ${isAddButtonLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isAddButtonLoading ? (
                  <><Loader className="mr-2 animate-spin" size={18} />Chargement...</>
                ) : showForm ? (
                  <><X className="mr-2" size={18} />Annuler Ajout/Modif</>
                ) : (
                  <><PlusCircle className="mr-2" size={18} />Ajouter un Type</>
                )}
              </button>

              {/* Button to navigate to Demande List */}
              <Link
                to="/admin/demandeAttestation" // Make sure this route is defined in your React Router setup
                className="flex items-center justify-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow transition-all duration-200 w-full sm:w-auto"
              >
                <ListChecks className="mr-2" size={18} />
                Voir les Demandes
              </Link>
            </div>
          </div>

          <SlideDown isVisible={showForm}>
            <div className={`bg-gray-100 rounded-lg shadow-inner p-6 mb-8 transition-opacity duration-500 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-xl font-semibold mb-6 text-indigo-700 border-b pb-2">
                {editingId ? 'Modifier le Type d\'Attestation' : 'Ajouter un Nouveau Type d\'Attestation'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">Nom du Type</label>
                  <input
                    type="text"
                    name="type"
                    id="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm outline-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    id="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm outline-none"
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition-colors duration-200 flex items-center"
                    disabled={isSubmitting}
                  >
                    <X size={16} className="mr-2" /> Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <><Loader size={16} className="mr-2 animate-spin" />Traitement...</>
                    ) : (
                      <><Check size={16} className="mr-2" />{editingId ? 'Mettre à Jour' : 'Enregistrer'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>

          <div className="bg-white border rounded-lg shadow-sm overflow-hidden mt-8">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="font-medium text-gray-700">Liste des Types d'Attestation</h2>
            </div>
            {isLoading ? (
              <SkeletonLoader rows={5} cols={2} />
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                <HelpCircle size={48} className="mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium">{error}</p>
                <p className="text-sm">Veuillez vérifier votre connexion ou réessayer plus tard.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th
                        className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">
                          Type
                          {sortField === 'type' && <ChevronDown className={`ml-1 w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('description')}
                      >
                        <div className="flex items-center">
                          Description
                          {sortField === 'description' && <ChevronDown className={`ml-1 w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedAndFilteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                          <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          Aucun type d'attestation trouvé.
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredTypes.map((attType) => (
                        <tr key={attType.id} className="hover:bg-indigo-50 transition-colors duration-150">
                          <td className="py-3 px-4 whitespace-nowrap">{attType.type}</td>
                          <td className="py-3 px-4">{attType.description}</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(attType)}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors duration-200"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(attType.id)}
                                className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-200"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
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
        </div>
      </div>
    </div>
  );
}