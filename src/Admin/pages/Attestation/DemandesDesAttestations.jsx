// src/components/admin/AttestationDemandeList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Search, ChevronDown, HelpCircle, Loader, RefreshCw, ArrowLeftCircle, Paperclip, XCircle, FileText, UploadCloud, Send, Trash2 } from 'lucide-react'; // Added Trash2
import Notification from '../../common/Notification';
import SkeletonLoader from '../../common/SkeletonLoader';

// ... (STATUS_OPTIONS, getStatusDetails, getNestedValue, PDF_STORAGE_BASE_URL remain the same) ...
const STATUS_OPTIONS = [
  { value: 'en attente', label: 'En Attente', color: 'bg-blue-500', icon: <Loader size={14} className="mr-1 animate-spin" /> },
  { value: 'accepte', label: 'Acceptée', color: 'bg-green-500', icon: <CheckSquare size={14} className="mr-1" /> },
  { value: 'refuse', label: 'Refusée', color: 'bg-red-500', icon: <CheckSquare size={14} className="mr-1" /> },
];

const getStatusDetails = (statusValue) => {
  const status = STATUS_OPTIONS.find(s => s.value === statusValue?.toLowerCase());
  return status ? { label: status.label, color: status.color, icon: status.icon } : { label: statusValue, color: 'bg-gray-500', icon: null };
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((value, key) => (value && value[key] != null) ? value[key] : undefined, obj);
};

const PDF_STORAGE_BASE_URL = 'http://localhost:8000/storage/';


export default function AttestationDemandeList() {
  const [demandes, setDemandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date_demande');
  const [sortDirection, setSortDirection] = useState('desc');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  const [updatingStatusDemandeId, setUpdatingStatusDemandeId] = useState(null);
  const [uploadingPdfDemandeId, setUploadingPdfDemandeId] = useState(null);
  const [deletingPdfDemandeId, setDeletingPdfDemandeId] = useState(null); // New state for PDF deletion loader

  const [selectedPdfForUpload, setSelectedPdfForUpload] = useState({});
  const fileInputRefs = useRef({});

  const DEMANDES_API_URL = 'http://localhost:8000/api/admin/attestation-demandes';
  const UPDATE_STATUS_ONLY_API_URL = 'http://localhost:8000/api/admin/updateStatut';
  const ATTESTATION_API_BASE_URL = 'http://localhost:8000/api/admin/attestations'; // Base for PDF actions

  const getToken = () => localStorage.getItem('admin_token');
  const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const fetchDemandes = async () => { /* ... same ... */ 
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(DEMANDES_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}: Impossible de récupérer les demandes.`);
      }
      const data = await response.json();
      setDemandes(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      setError(err.message || 'Impossible de charger les demandes.');
      console.error('Error fetching demandes:', err);
      setDemandes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const showAppNotification = (message, type = 'success') => { /* ... same ... */ 
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handlePdfSelection = (event, demandeId) => { /* ... same ... */ 
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        showAppNotification("Veuillez sélectionner un fichier PDF.", "error");
        event.target.value = null; 
        setSelectedPdfForUpload(prev => ({ ...prev, [demandeId]: null }));
        return;
      }
      setSelectedPdfForUpload(prev => ({ ...prev, [demandeId]: file }));
    }
  };
  const clearSelectedPdf = (demandeId) => { /* ... same ... */ 
    setSelectedPdfForUpload(prev => ({ ...prev, [demandeId]: null }));
    if (fileInputRefs.current[demandeId]) {
      fileInputRefs.current[demandeId].value = null; 
    }
  };

  const handleUpdateStatus = async (demandeId, newStatus) => { /* ... same ... */ 
    setUpdatingStatusDemandeId(demandeId);
    try {
      const response = await fetch(`${UPDATE_STATUS_ONLY_API_URL}/${demandeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({ statut: newStatus }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Erreur lors de la mise à jour du statut.');
      }
      showAppNotification(responseData.message || 'Statut mis à jour.');
      const updatedAttestation = responseData.data || responseData;
      setDemandes(prevDemandes =>
        prevDemandes.map(d => (d.id === demandeId ? { ...d, statut: updatedAttestation.statut } : d))
      );
    } catch (err) {
      showAppNotification(err.message || 'Échec de la mise à jour du statut.', 'error');
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatusDemandeId(null);
    }
  };

  const handleSubmitPdf = async (demandeId) => { /* ... same ... */ 
    const fileToUpload = selectedPdfForUpload[demandeId];
    if (!fileToUpload) {
      showAppNotification("Aucun PDF sélectionné pour soumettre.", "error");
      return;
    }
    setUploadingPdfDemandeId(demandeId);
    const formData = new FormData();
    formData.append('pdf', fileToUpload);
    formData.append('_method', 'PUT');
    try {
      const response = await fetch(`${ATTESTATION_API_BASE_URL}/${demandeId}/pdf`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: formData,
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Erreur lors de la soumission du PDF.');
      }
      showAppNotification(responseData.message || 'PDF soumis avec succès.');
      const updatedAttestation = responseData.data || responseData;
      setDemandes(prevDemandes =>
        prevDemandes.map(d => (d.id === demandeId ? { ...d, pdf: updatedAttestation.pdf } : d))
      );
      clearSelectedPdf(demandeId);
    } catch (err) {
      showAppNotification(err.message || 'Échec de la soumission du PDF.', 'error');
      console.error('Error submitting PDF:', err);
    } finally {
      setUploadingPdfDemandeId(null);
    }
  };

  // New function to handle PDF deletion
  const handleDeletePdf = async (demandeId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce PDF ?")) return;

    setDeletingPdfDemandeId(demandeId);
    try {
        // !!! Ensure your backend supports DELETE on this endpoint for PDF removal
        const response = await fetch(`${ATTESTATION_API_BASE_URL}/${demandeId}/pdf`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || responseData.error || 'Erreur lors de la suppression du PDF.');
        }
        showAppNotification(responseData.message || 'PDF supprimé avec succès.');
        setDemandes(prevDemandes =>
            prevDemandes.map(d => (d.id === demandeId ? { ...d, pdf: null } : d)) // Set pdf to null locally
        );
    } catch (err) {
        showAppNotification(err.message || 'Échec de la suppression du PDF.', 'error');
        console.error('Error deleting PDF:', err);
    } finally {
        setDeletingPdfDemandeId(null);
    }
  };


  const handleSort = (field) => { /* ... same ... */ 
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const sortedAndFilteredDemandes = [...demandes]
    .filter(demande => { /* ... same filter ... */ 
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (demande.id && demande.id.toString().includes(searchTermLower)) ||
        (getNestedValue(demande, 'employe.nom')?.toLowerCase().includes(searchTermLower)) ||
        (getNestedValue(demande, 'employe.email')?.toLowerCase().includes(searchTermLower)) ||
        (getNestedValue(demande, 'attestation_type.type')?.toLowerCase().includes(searchTermLower)) ||
        (demande.statut?.toLowerCase().includes(searchTermLower)) ||
        (demande.date_demande?.toLowerCase().includes(searchTermLower)) ||
        (demande.date_livraison?.toLowerCase().includes(searchTermLower)) ||
        (demande.pdf?.toLowerCase().includes(searchTermLower))
      );
    })
    .sort((a,b) => { /* ... same sort ... */
        if (!sortField) return 0;
        let valA = getNestedValue(a, sortField);
        let valB = getNestedValue(b, sortField);

        if (valA == null) valA = '';
        if (valB == null) valB = '';

        if (sortField === 'date_demande' || sortField === 'date_livraison') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        } else if (valA instanceof Date && valB instanceof Date) {
            const timeA = valA.getTime();
            const timeB = valB.getTime();
            if (isNaN(timeA) && isNaN(timeB)) return 0;
            if (isNaN(timeA)) return sortDirection === 'asc' ? 1 : -1;
            if (isNaN(timeB)) return sortDirection === 'asc' ? -1 : 1;
            return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        }
    });

  const tableHeaders = [ /* ... same ... */ 
    { label: 'ID', field: 'id' },
    { label: 'Employé', field: 'employe.nom' },
    { label: 'Type', field: 'attestation_type.type' },
    { label: 'Date Dem.', field: 'date_demande' },
    { label: 'Date Livr.', field: 'date_livraison' },
    { label: 'Doc. PDF Actuel', field: 'pdf' },
    { label: 'Statut', field: 'statut' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden px-2">
        {/* ... (Header, Notification, Search/Action buttons remain the same) ... */}
        <div className="bg-teal-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">Gestion des Demandes d'Attestation</h1>
        </div>
        <Notification show={notification.show} message={notification.message} type={notification.type} />
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-72 focus:ring-2 focus:ring-teal-300 focus:border-teal-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/attestations"
                className="flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow"
              >
                <ArrowLeftCircle size={18} className="mr-2" />
                Types
              </Link>
              <button
                onClick={fetchDemandes}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow"
              >
                <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>


          <div className="bg-white border rounded-lg shadow-sm overflow-hidden mt-8">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="font-medium text-gray-700">Liste des Demandes</h2>
            </div>
            {isLoading && !demandes.length ? (
              <SkeletonLoader rows={5} cols={tableHeaders.length + 1} />
            ) : error ? (
              <div className="p-8 text-center text-red-600"> {/* ... error display ... */} 
                <HelpCircle size={48} className="mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium">{error}</p>
                <p className="text-sm">Veuillez <button onClick={fetchDemandes} className="text-blue-500 hover:underline">réessayer</button>.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead> {/* ... table headers ... */}
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedAndFilteredDemandes.length === 0 ? ( /* ... no data ... */ 
                      <tr>
                        <td colSpan={tableHeaders.length + 1} className="px-4 py-8 text-center text-gray-500">
                          <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          Aucune demande trouvée.
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredDemandes.map((demande) => {
                        const statusDetails = getStatusDetails(demande.statut);
                        const currentPdfUrl = demande.pdf ? `${PDF_STORAGE_BASE_URL}${demande.pdf}` : null;
                        const isUploadingThisPdf = uploadingPdfDemandeId === demande.id;
                        const isDeletingThisPdf = deletingPdfDemandeId === demande.id;
                        const isUpdatingThisStatus = updatingStatusDemandeId === demande.id;
                        const disableActions = isUploadingThisPdf || isDeletingThisPdf || isUpdatingThisStatus;
                        
                        return (
                          <tr key={demande.id} className="hover:bg-teal-50 transition-colors">
                            {/* ... other tds ... */}
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">{demande.id}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-medium">{getNestedValue(demande, 'employe.nom') || 'N/A'}</span>
                                {getNestedValue(demande, 'employe.email') && 
                                    <div className="text-xs text-gray-500">{getNestedValue(demande, 'employe.email')}</div>
                                }
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{getNestedValue(demande, 'attestation_type.type') || 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                              {demande.date_demande ? new Date(demande.date_demande).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                              {demande.date_livraison ? new Date(demande.date_livraison).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                              {currentPdfUrl ? (
                                <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
                                  <FileText size={16} className="mr-1"/> Voir PDF
                                </a>
                              ) : (
                                <span className="text-gray-400">Aucun</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 inline-flex items-center text-xs font-semibold rounded-full ${statusDetails.color} text-white`}>
                                {statusDetails.icon}
                                {statusDetails.label}
                              </span>
                            </td>


                            {/* REFINED ACTIONS COLUMN */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col space-y-3 items-center w-52"> {/* Wider for more buttons */}
                                
                                {/* PDF Management Section */}
                                <div className="w-full border border-gray-200 p-2 rounded-md bg-gray-50">
                                  <p className="text-xs font-semibold text-gray-600 mb-1 text-left">Document PDF</p>
                                  <input 
                                    type="file" 
                                    accept="application/pdf"
                                    className="hidden"
                                    ref={el => fileInputRefs.current[demande.id] = el}
                                    onChange={(e) => handlePdfSelection(e, demande.id)}
                                    disabled={disableActions}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => fileInputRefs.current[demande.id]?.click()}
                                    disabled={disableActions}
                                    className="w-full mb-1 text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 inline-flex items-center justify-center disabled:opacity-50"
                                  >
                                    <UploadCloud size={14} className="mr-1" /> 
                                    Joindre/Remplacer
                                  </button>

                                  {selectedPdfForUpload[demande.id] && (
                                    <>
                                      <div className="my-1 text-xs text-gray-600 flex items-center justify-between bg-yellow-50 p-1 rounded">
                                        <span className="truncate max-w-[100px]" title={selectedPdfForUpload[demande.id].name}>
                                          <Paperclip size={12} className="inline mr-1 text-yellow-700" />
                                          {selectedPdfForUpload[demande.id].name}
                                        </span>
                                        <button onClick={() => clearSelectedPdf(demande.id)} className="ml-1 text-red-500 hover:text-red-700" disabled={isUploadingThisPdf}>
                                          <XCircle size={14} />
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleSubmitPdf(demande.id)}
                                        disabled={isUploadingThisPdf || !selectedPdfForUpload[demande.id]}
                                        className="w-full text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md inline-flex items-center justify-center disabled:opacity-50"
                                      >
                                        {isUploadingThisPdf ? <Loader size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                                        Soumettre PDF Sélectionné
                                      </button>
                                    </>
                                  )}

                                  {currentPdfUrl && !selectedPdfForUpload[demande.id] && ( // Show delete only if a PDF exists and no new one is staged
                                      <button
                                          type="button"
                                          onClick={() => handleDeletePdf(demande.id)}
                                          disabled={isDeletingThisPdf || disableActions && !isDeletingThisPdf} // Disable if deleting or another action is active
                                          className="mt-1 w-full text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md inline-flex items-center justify-center disabled:opacity-50"
                                      >
                                          {isDeletingThisPdf ? <Loader size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
                                          Supprimer PDF Actuel
                                      </button>
                                  )}
                                </div>
                                
                                {/* Status Update Section */}
                                <div className="w-full border border-gray-200 p-2 rounded-md bg-gray-50">
                                  <p className="text-xs font-semibold text-gray-600 mb-1 text-left">Statut de la Demande</p>
                                   {isUpdatingThisStatus ? <Loader size={20} className="animate-spin text-teal-500 mx-auto" /> :
                                   (
                                    <div className="relative w-full">
                                     <select
                                      value={demande.statut}
                                      onChange={(e) => handleUpdateStatus(demande.id, e.target.value)}
                                      disabled={disableActions}
                                      className="form-select block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-md shadow-sm appearance-none bg-white hover:border-gray-400 disabled:opacity-50"
                                    >
                                      {STATUS_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                      <ChevronDown size={16} />
                                    </div>
                                    </div>
                                    )}
                                </div>
                              </div>
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