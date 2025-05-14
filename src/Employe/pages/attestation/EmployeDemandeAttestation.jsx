// src/components/employe/EmployeDemandeAttestation.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Search, ChevronDown, HelpCircle, Loader, Send, FileText, RefreshCw, X, CheckSquare, XCircle } from 'lucide-react';
import SlideDown from '../../common/SlideDown';
import Notification from '../../common/Notification';
import SkeletonLoader from '../../common/SkeletonLoader';

// Status options for display (consistent with admin view)
const STATUS_OPTIONS_DISPLAY = [
  { value: 'en attente', label: 'En Attente', color: 'bg-blue-500', icon: <Loader size={14} className="mr-1 animate-spin" /> },
  { value: 'accepte', label: 'Acceptée', color: 'bg-green-500', icon: <CheckSquare size={14} className="mr-1" /> }, // Assuming you might have this icon
  { value: 'refuse', label: 'Refusée', color: 'bg-red-500', icon: <XCircle size={14} className="mr-1" /> }, // Assuming XCircle for refuse
  // Add other statuses if your backend uses them for employees (e.g., 'en cours')
];

const getStatusDetails = (statusValue) => {
  const status = STATUS_OPTIONS_DISPLAY.find(s => s.value === statusValue?.toLowerCase());
  return status ? { label: status.label, color: status.color, icon: status.icon } : { label: statusValue, color: 'bg-gray-500', icon: null };
};

const PDF_STORAGE_BASE_URL = 'http://localhost:8000/storage/'; // For viewing PDFs if provided by admin

export default function EmployeDemandeAttestation() {
  const [myDemandes, setMyDemandes] = useState([]);
  const [attestationTypes, setAttestationTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formAnimation, setFormAnimation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date_demande');
  const [sortDirection, setSortDirection] = useState('desc');

  const [formData, setFormData] = useState({
    type_id: '',
    date_livraison: '',
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // API URLs for employee
  const MY_DEMANDES_API_URL = 'http://localhost:8000/api/employe/mes-demandes'; // !!! NEW: Endpoint to get employee's own demandes
  const ATTESTATION_TYPES_API_URL = 'http://localhost:8000/api/employe/attestations'; // Your route that returns all types
  const DEMANDE_API_URL = 'http://localhost:8000/api/employe/attestations'; // POST to create, DELETE for /id

  const getToken = () => localStorage.getItem('employe_token'); // Assuming 'token' for employee, adjust if different
  const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const fetchMyDemandes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(MY_DEMANDES_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération de vos demandes.');
      }
      const data = await response.json();
      setMyDemandes(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      setError(err.message || 'Impossible de charger vos demandes.');
      console.error('Error fetching my demandes:', err);
      setMyDemandes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttestationTypes = async () => {
    try {
      const response = await fetch(ATTESTATION_TYPES_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Erreur types attestations');
      const data = await response.json();
      setAttestationTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching attestation types:', err);
      showAppNotification('Impossible de charger les types d\'attestation.', 'error');
      setAttestationTypes([]);
    }
  };

  useEffect(() => {
    fetchMyDemandes();
    fetchAttestationTypes(); // Fetch types when component mounts
  }, []);

  const showAppNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormAnimation(false);
    setTimeout(() => {
      setFormData({ type_id: '', date_livraison: '' });
      setShowForm(false);
    }, 300);
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setIsFormLoading(true);
      // Fetch types again if needed, or ensure they are fresh
      if (attestationTypes.length === 0) fetchAttestationTypes();
      setTimeout(() => {
        setShowForm(true);
        setTimeout(() => {
          setFormAnimation(true);
          setIsFormLoading(false);
        }, 50);
      }, 300);
    }
  };

  const handleSubmitDemande = async (e) => {
    if (e) e.preventDefault();
    if (!formData.type_id || !formData.date_livraison) {
      showAppNotification("Veuillez sélectionner un type et une date de livraison.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(DEMANDE_API_URL, {
        method: 'POST',
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
        throw new Error(responseData.message || responseData.error || 'Erreur lors de la soumission de la demande.');
      }
      showAppNotification(responseData.message || 'Demande envoyée avec succès!');
      resetForm();
      fetchMyDemandes(); // Refresh the list
    } catch (err) {
      showAppNotification(err.message || 'Une erreur est survenue.', 'error');
      console.error('Error submitting demande:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDemande = async (demandeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande?')) return;
    // Add a loading state for individual row deletion if desired
    try {
      const response = await fetch(`${DEMANDE_API_URL}/${demandeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Erreur suppression.');
      }
      showAppNotification(responseData.message || 'Demande supprimée avec succès.');
      fetchMyDemandes(); // Refresh list
    } catch (err) {
      showAppNotification(err.message || 'Échec de la suppression.', 'error');
      console.error('Error deleting demande:', err);
    }
  };
  // **** ADD THIS HELPER FUNCTION ****
  const getNestedValue = (obj, path) => {
    if (!path) return undefined; // Added a check for undefined path
    return path.split('.').reduce((value, key) => (value && value[key] != null) ? value[key] : undefined, obj);
  };
  // *********************************

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredDemandes = [...myDemandes]
    .filter(demande => {
      const searchTermLower = searchTerm.toLowerCase();
      // Assuming your 'myDemandes' objects have 'attestation_type.type' after eager loading
      return (
        (demande.attestation_type?.type?.toLowerCase().includes(searchTermLower)) ||
        (demande.statut?.toLowerCase().includes(searchTermLower)) ||
        (demande.date_demande?.includes(searchTermLower)) ||
        (demande.date_livraison?.includes(searchTermLower))
      );
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let valA = sortField.includes('.') ? getNestedValue(a, sortField) : a[sortField];
      let valB = sortField.includes('.') ? getNestedValue(b, sortField) : b[sortField];

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (sortField === 'date_demande' || sortField === 'date_livraison') {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA instanceof Date && valB instanceof Date) {
        return sortDirection === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });

  const tableHeaders = [
    { label: 'Type d\'Attestation', field: 'attestation_type.type' }, // Adjust if field name is different
    { label: 'Date de Demande', field: 'date_demande' },
    { label: 'Date Livraison Souhaitée', field: 'date_livraison' },
    { label: 'Statut', field: 'statut' },
    { label: 'Document (si fourni)', field: 'pdf' },
  ];


  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-cyan-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-green-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">Mes Demandes d'Attestation</h1>
        </div>

        <Notification show={notification.show} message={notification.message} type={notification.type} />

        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Rechercher une demande..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-green-300 focus:border-green-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchMyDemandes}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition-colors duration-200"
              >
                <RefreshCw size={18} className={`mr-2 ${isLoading && !showForm ? 'animate-spin' : ''}`} />
                Actualiser Liste
              </button>
              <button
                onClick={toggleForm}
                disabled={isFormLoading}
                className={`flex items-center px-4 py-2 rounded-lg shadow transition-all duration-200 w-full md:w-auto justify-center ${showForm
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  } ${isFormLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isFormLoading ? (
                  <><Loader className="mr-2 animate-spin" size={18} />Chargement...</>
                ) : showForm ? (
                  <><X className="mr-2" size={18} />Annuler Demande</>
                ) : (
                  <><PlusCircle className="mr-2" size={18} />Nouvelle Demande</>
                )}
              </button>
            </div>
          </div>

          <SlideDown isVisible={showForm}>
            <div className={`bg-gray-100 rounded-lg shadow-inner p-6 mb-8 transition-opacity duration-500 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-xl font-semibold mb-6 text-green-700 border-b pb-2">
                Faire une Nouvelle Demande
              </h2>
              <form onSubmit={handleSubmitDemande} className="space-y-4">
                <div>
                  <label htmlFor="type_id" className="block text-sm font-medium text-gray-700">Type d'Attestation</label>
                  <select
                    name="type_id"
                    id="type_id"
                    value={formData.type_id}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm outline-none"
                    required
                    disabled={isSubmitting || attestationTypes.length === 0}
                  >
                    <option value="">-- Sélectionner un type --</option>
                    {attestationTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.type}</option>
                    ))}
                  </select>
                  {attestationTypes.length === 0 && <p className="text-xs text-red-500 mt-1">Chargement des types...</p>}
                </div>
                <div>
                  <label htmlFor="date_livraison" className="block text-sm font-medium text-gray-700">Date de Livraison Souhaitée</label>
                  <input
                    type="date"
                    name="date_livraison"
                    id="date_livraison"
                    value={formData.date_livraison}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]} // Prevent past dates
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm outline-none"
                    required
                    disabled={isSubmitting}
                  />
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
                    disabled={isSubmitting || !formData.type_id || !formData.date_livraison}
                    className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md flex items-center ${(isSubmitting || !formData.type_id || !formData.date_livraison) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isSubmitting ? (
                      <><Loader size={16} className="mr-2 animate-spin" />Envoi...</>
                    ) : (
                      <><Send size={16} className="mr-2" />Envoyer la Demande</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>

          <div className="bg-white border rounded-lg shadow-sm overflow-hidden mt-8">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="font-medium text-gray-700">Historique de Mes Demandes</h2>
            </div>
            {isLoading && !myDemandes.length ? (
              <SkeletonLoader rows={3} cols={tableHeaders.length + 1} />
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                <HelpCircle size={48} className="mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium">{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      {tableHeaders.map((header) => (
                        <th
                          key={header.field}
                          className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort(header.field)}
                        >
                          <div className="flex items-center">
                            {header.label}
                            {sortField === header.field && <ChevronDown className={`ml-1 w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedAndFilteredDemandes.length === 0 ? (
                      <tr>
                        <td colSpan={tableHeaders.length + 1} className="px-4 py-8 text-center text-gray-500">
                          <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          Vous n'avez aucune demande pour le moment.
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredDemandes.map((demande) => {
                        const statusDetails = getStatusDetails(demande.statut);
                        // Ensure your 'demande' object from 'MY_DEMANDES_API_URL' includes 'attestation_type.type'
                        const attestationTypeName = demande.attestation_type?.type || 'N/A';
                        const currentPdfUrl = demande.pdf ? `${PDF_STORAGE_BASE_URL}${demande.pdf}` : null;

                        return (
                          <tr key={demande.id} className="hover:bg-green-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-700">{attestationTypeName}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                              {new Date(demande.date_demande).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                              {new Date(demande.date_livraison).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 inline-flex items-center text-xs font-semibold rounded-full ${statusDetails.color} text-white`}>
                                {statusDetails.icon}
                                {statusDetails.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                              {currentPdfUrl ? (
                                <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
                                  <FileText size={16} className="mr-1" /> Voir Document
                                </a>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {/* Employee can usually only delete 'en attente' demandes, adjust if needed */}
                              {demande.statut === 'en attente' ? (
                                <button
                                  onClick={() => handleDeleteDemande(demande.id)}
                                  className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-200"
                                  title="Annuler la Demande"
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Non modifiable</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
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