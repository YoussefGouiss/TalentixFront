import React, { useState, useEffect } from 'react';
// Admin-theme icons from react-icons/fa
import { 
    FaPlusCircle, FaTrashAlt, FaSearch, FaChevronDown, FaQuestionCircle, FaSpinner, 
    FaPaperPlane, FaFilePdf, FaSync, FaTimes, FaCheckSquare, FaTimesCircle, 
    FaFilter, FaExclamationTriangle // Added FaFilter just in case, FaExclamationTriangle for Notification
} from 'react-icons/fa'; 
// Lucide icon removed as FaSpinner is used for loading

// --- Themed Notification Component ---
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
        <FaTimesCircle size={18} />
      </button>
    </div>
  );
};

// --- Themed SkeletonLoader Component ---
const SkeletonLoader = ({ rows = 3, cols = 5 }) => (
  <div className="animate-pulse p-4">
    {[...Array(rows)].map((_, i) => (
      // Adjusted grid-cols to match number of data columns + action column
      <div key={i} className={`grid grid-cols-${cols + 1} gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center`}>
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div>
        ))}
        <div className="h-8 bg-[#C8D9E6]/70 rounded w-16 col-span-1 justify-self-center"></div>
      </div>
    ))}
  </div>
);

// --- SlideDown Component ---
const SlideDown = ({ isVisible, children }) => (
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      {isVisible && <div className="pt-2 pb-6">{children}</div>}
    </div>
  );

// --- Status Configuration ---
const STATUS_OPTIONS_DISPLAY = [
  { value: 'en attente', label: 'En Attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <FaSpinner size={14} className="mr-1.5 animate-spin" /> },
  { value: 'acceptee', label: 'Acceptée', color: 'bg-green-100 text-green-700 border-green-300', icon: <FaCheckSquare size={14} className="mr-1.5" /> },
  { value: 'refusee', label: 'Refusée', color: 'bg-red-100 text-red-700 border-red-300', icon: <FaTimesCircle size={14} className="mr-1.5" /> },
];

const getStatusDetails = (statusValue) => {
  const status = STATUS_OPTIONS_DISPLAY.find(s => s.value === statusValue?.toLowerCase());
  return status 
    ? { label: status.label, colorClasses: status.color, icon: status.icon } 
    : { label: statusValue || 'N/A', colorClasses: 'bg-gray-100 text-gray-700 border-gray-300', icon: <FaQuestionCircle size={14} className="mr-1.5"/> };
};

const PDF_STORAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function EmployeDemandeAttestation() {
  const [myDemandes, setMyDemandes] = useState([]);
  const [attestationTypes, setAttestationTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date_demande');
  const [sortDirection, setSortDirection] = useState('desc');

  const [formData, setFormData] = useState({
    type_id: '',
    date_livraison: '',
  });

  const [notification, setNotificationState] = useState({
    show: false, message: '', type: 'success',
  });

  const MY_DEMANDES_API_URL = 'http://localhost:8000/api/employe/mes-demandes';
  const ATTESTATION_TYPES_API_URL = 'http://localhost:8000/api/employe/attestations'; // This seems to be for GET types and POST new demande
  // const DEMANDE_API_URL = 'http://localhost:8000/api/employe/attestations'; // Already defined above

  const getToken = () => localStorage.getItem('employe_token');

  const showAppNotification = (message, type = 'success') => {
    setNotificationState({ show: true, message, type });
    setTimeout(() => {
      setNotificationState({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const fetchMyDemandes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(MY_DEMANDES_API_URL, {
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la récupération de vos demandes.');
      }
      const data = await response.json();
      setMyDemandes(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
    } catch (err) {
      showAppNotification(err.message || 'Impossible de charger vos demandes.', 'error');
      setMyDemandes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttestationTypes = async () => {
    // Could add a specific loading state for types if it's slow and blocks form
    try {
      const response = await fetch(ATTESTATION_TYPES_API_URL, { // Assuming this endpoint provides types on GET
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error('Erreur de chargement des types d\'attestation.');
      const data = await response.json();
      // Adapt based on how your API returns types.
      // If /api/employe/attestations on GET returns types:
      setAttestationTypes(Array.isArray(data) ? data : (Array.isArray(data.types) ? data.types : []));
    } catch (err) {
      showAppNotification(err.message || 'Impossible de charger les types d\'attestation.', 'error');
      setAttestationTypes([]);
    }
  };

  useEffect(() => {
    fetchMyDemandes();
    fetchAttestationTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ type_id: '', date_livraison: '' });
    setShowForm(false);
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      if (attestationTypes.length === 0) fetchAttestationTypes();
      setShowForm(true);
    }
  };

  const handleSubmitDemande = async (e) => {
    e.preventDefault();
    if (!formData.type_id || !formData.date_livraison) {
      showAppNotification("Veuillez sélectionner un type et une date de livraison.", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(ATTESTATION_TYPES_API_URL, { // POST to the same endpoint for attestations
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Erreur lors de la soumission.');
      }
      showAppNotification(responseData.message || 'Demande envoyée avec succès!', 'success');
      resetForm();
      fetchMyDemandes();
    } catch (err) {
      showAppNotification(err.message || 'Une erreur est survenue.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDemande = async (demandeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette demande?')) return;
    setIsSubmitting(true); 
    try {
      // Assuming DELETE request for a specific demande goes to /api/employe/mes-demandes/{id}
      // or /api/employe/attestations/{id} - adjust API URL if needed.
      // Using MY_DEMANDES_API_URL for consistency with how they are fetched.
      const response = await fetch(`${MY_DEMANDES_API_URL}/${demandeId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
      });
      const responseData = await response.json().catch(() => null);
      if (!response.ok && response.status !== 204) { 
        throw new Error(responseData?.message || responseData?.error || 'Erreur de suppression.');
      }
      showAppNotification(responseData?.message || 'Demande annulée avec succès.', 'success');
      fetchMyDemandes();
    } catch (err) {
      showAppNotification(err.message || 'Échec de l\'annulation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((value, key) => (value && value[key] != null) ? value[key] : undefined, obj);
  };

  const handleSort = (field) => {
    setSortDirection(prevDirection => (sortField === field ? (prevDirection === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortField(field);
  };

  const sortedAndFilteredDemandes = [...myDemandes]
    .filter(demande => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        demande.attestation_type?.type?.toLowerCase().includes(searchTermLower) ||
        demande.statut?.toLowerCase().includes(searchTermLower) ||
        demande.date_demande?.includes(searchTermLower) || // Assuming date format includes searchable parts
        demande.date_livraison?.includes(searchTermLower)
      );
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let valA = sortField.includes('.') ? getNestedValue(a, sortField) : a[sortField];
      let valB = sortField.includes('.') ? getNestedValue(b, sortField) : b[sortField];
      valA = valA == null ? '' : valA; valB = valB == null ? '' : valB;
      if (sortField === 'date_demande' || sortField === 'date_livraison') {
        valA = new Date(valA); valB = new Date(valB);
        return sortDirection === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
      }
      return sortDirection === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

  const tableHeaders = [
    { label: 'Type d\'Attestation', field: 'attestation_type.type' },
    { label: 'Date Demande', field: 'date_demande' },
    { label: 'Livraison Souhaitée', field: 'date_livraison' },
    { label: 'Statut', field: 'statut' },
    { label: 'Document', field: 'pdf_path' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const inputClasses = "w-full p-2.5 border border-[#C8D9E6] rounded-md focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-colors outline-none text-[#2F4156] bg-white text-sm";
  const selectClasses = `${inputClasses} appearance-none`;
  const buttonPrimaryClasses = "flex items-center justify-center px-4 py-2 bg-[#567C8D] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-[#4A6582] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
  const buttonSecondaryClasses = "flex items-center justify-center px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] text-sm font-medium rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed";

  if (!getToken()) {
      return (
            <div className="min-h-screen bg-[#F5EFEB] flex items-center justify-center p-4 md:p-6">
                <Notification show={notification.show} message={notification.message} type={notification.type} onDismiss={() => setNotificationState(p => ({...p, show: false}))} />
                <div className="p-8 text-center text-red-600 bg-red-100 border border-red-300 rounded-lg shadow-md max-w-md w-full">
                    <FaExclamationTriangle size={32} className="mx-auto mb-3 text-red-500" />
                    <h2 className="text-xl font-semibold mb-2">Accès Refusé</h2>
                    <p className="text-sm">Token employé non trouvé. Veuillez vous reconnecter pour accéder à cette page.</p>
                </div>
            </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F5EFEB]">
      <Notification show={notification.show} message={notification.message} type={notification.type} onDismiss={() => setNotificationState(p => ({...p, show: false}))} />

      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Mes Demandes d'Attestation</h1>
        </header>
      </div>

      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto sm:flex-grow max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-[#A0B9CD]" size={16} />
              </div>
              <input
                type="text" placeholder="Rechercher..."
                className="w-full pl-10 pr-3 py-2.5 border border-[#C8D9E6] rounded-md focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-colors outline-none text-[#2F4156] bg-white text-sm"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={fetchMyDemandes} disabled={isLoading || isSubmitting} className={buttonSecondaryClasses}>
                <FaSync size={16} className={`mr-2 ${isLoading && !isSubmitting ? 'animate-spin' : ''}`} /> Actualiser
              </button>
              <button onClick={toggleForm} className={`${showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-[#567C8D] hover:bg-[#4A6582]'} text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-all duration-150 flex items-center justify-center w-full sm:w-auto`} disabled={isSubmitting}>
                {showForm ? <FaTimes size={16} className="mr-2" /> : <FaPlusCircle size={16} className="mr-2" />}
                {showForm ? 'Annuler' : 'Nouvelle Demande'}
              </button>
            </div>
          </div>

          <SlideDown isVisible={showForm}>
            <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-inner p-6 mb-6">
              <h2 className="text-xl font-semibold text-[#2F4156] border-b border-[#C8D9E6] pb-3 mb-6">
                Faire une Nouvelle Demande
              </h2>
              <form onSubmit={handleSubmitDemande} className="space-y-4">
                <div>
                  <label htmlFor="type_id" className="block text-sm font-medium text-[#567C8D] mb-1">Type d'Attestation <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select name="type_id" id="type_id" value={formData.type_id} onChange={handleChange} className={selectClasses} required disabled={isSubmitting || attestationTypes.length === 0}>
                      <option value="">-- Sélectionner un type --</option>
                      {attestationTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.type}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <FaChevronDown className="h-4 w-4 text-[#A0B9CD]" />
                    </div>
                  </div>
                  {attestationTypes.length === 0 && !isLoading && <p className="text-xs text-red-500 mt-1">Aucun type d'attestation disponible.</p>}
                  {attestationTypes.length === 0 && isLoading && <p className="text-xs text-yellow-600 mt-1">Chargement des types...</p>}
                </div>
                <div>
                  <label htmlFor="date_livraison" className="block text-sm font-medium text-[#567C8D] mb-1">Date de Livraison Souhaitée <span className="text-red-500">*</span></label>
                  <input type="date" name="date_livraison" id="date_livraison" value={formData.date_livraison} onChange={handleChange} min={new Date().toISOString().split("T")[0]} className={inputClasses} required disabled={isSubmitting} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={resetForm} className={buttonSecondaryClasses} disabled={isSubmitting}>
                    <FaTimes size={16} className="mr-2" /> Annuler
                  </button>
                  <button type="submit" disabled={isSubmitting || !formData.type_id || !formData.date_livraison} className={buttonPrimaryClasses}>
                    {isSubmitting ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaPaperPlane size={16} className="mr-2" />}
                    Envoyer
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>

          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-4 py-3.5">
              <h2 className="text-lg font-semibold text-[#2F4156]">Historique de Mes Demandes</h2>
            </div>
            {isLoading && myDemandes.length === 0 ? (
              <SkeletonLoader rows={3} cols={tableHeaders.length} />
            ) : !isLoading && sortedAndFilteredDemandes.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <FaSearch size={40} className="mx-auto text-[#A0B9CD] mb-4" />
                <p className="text-xl font-medium text-[#2F4156]">Aucune demande trouvée.</p>
                <p className="text-[#567C8D] mt-2">
                    {searchTerm ? "Essayez d'ajuster vos filtres ou " : "Vous n'avez pas encore fait de demande. "}
                    <button onClick={toggleForm} className="text-[#567C8D] hover:text-[#2F4156] underline font-medium">
                        Faire une nouvelle demande
                    </button>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th key={header.field} className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider cursor-pointer hover:bg-[#C8D9E6]/50 transition-colors" onClick={() => handleSort(header.field)}>
                          <div className="flex items-center">
                            {header.label}
                            {sortField === header.field && <FaChevronDown className={`ml-1.5 w-3 h-3 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {sortedAndFilteredDemandes.map((demande) => {
                      const statusDetails = getStatusDetails(demande.statut);
                      const attestationTypeName = demande.attestation_type?.type || 'N/A';
                      const currentPdfUrl = demande.pdf_path ? `${PDF_STORAGE_BASE_URL}${demande.pdf_path}` : null;

                      return (
                        <tr key={demande.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                          <td className="py-3 px-4 text-sm text-[#567C8D] whitespace-nowrap">{attestationTypeName}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(demande.date_demande)}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(demande.date_livraison)}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${statusDetails.colorClasses}`}>
                              {statusDetails.icon}
                              {statusDetails.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                            {currentPdfUrl ? (
                              <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" className="text-[#567C8D] hover:text-[#2F4156] hover:underline inline-flex items-center justify-center p-1 hover:bg-slate-100 rounded-md" title="Voir le PDF">
                                <FaFilePdf size={18} />
                              </a>
                            ) : (<span className="text-gray-400 italic">-</span>)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {(demande.statut === 'en attente' || demande.statut === null) && (
                              <button onClick={() => handleDeleteDemande(demande.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors" title="Annuler la Demande" disabled={isSubmitting}>
                                {isSubmitting ? <FaSpinner className="animate-spin" size={16}/> : <FaTrashAlt size={16} />}
                              </button>
                            )}
                            {demande.statut !== 'en attente' && demande.statut !== null && (
                                <span className="text-xs text-gray-400 italic">Traité</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
          <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
              Gestion des Attestations © {new Date().getFullYear()}
          </footer>
        </div>
      </div>
  );
}