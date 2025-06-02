import React, { useState, useEffect } from 'react'; // Removed useRef as it's not used
import {
    FaSearch, FaChevronDown, FaQuestionCircle, FaSpinner, FaSync,
    FaTimesCircle, FaFilePdf, FaTrashAlt, FaCheckCircle, FaClock, FaFilter, FaDollarSign, FaUserAlt, FaAlignLeft
} from 'react-icons/fa';

// --- Themed Notification Component (Keep as is from your example) ---
const ThemedNotification = ({ message, type, show, onDismiss }) => {
  if (!show) return null;
  let bgColor, textColor, borderColor, Icon;
  switch (type) {
    case 'success': bgColor = 'bg-green-500'; textColor = 'text-white'; borderColor = 'border-green-700'; Icon = FaCheckCircle; break;
    case 'error': bgColor = 'bg-red-500'; textColor = 'text-white'; borderColor = 'border-red-700'; Icon = FaTimesCircle; break;
    default: bgColor = 'bg-blue-500'; textColor = 'text-white'; borderColor = 'border-blue-700'; Icon = FaCheckCircle;
  }
  return (
    <div
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}
                  ${bgColor} ${textColor} border-l-4 ${borderColor} flex items-center justify-between min-w-[300px]`}
    >
      <div className="flex items-center">
        <Icon size={20} className="mr-3 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
          <FaTimesCircle size={18} />
        </button>
      )}
    </div>
  );
};

// --- Themed SkeletonLoader Component (Keep as is from your example) ---
const ThemedSkeletonLoader = ({ rows = 5, cols = 6 }) => { // Adjusted cols for admin table
  return (
    <div className="animate-pulse p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`grid grid-cols-${cols + 1} gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center`}>
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div>
          ))}
          <div className="h-8 bg-[#C8D9E6]/70 rounded w-full col-span-1"></div>
        </div>
      ))}
    </div>
  );
};

// --- Status Configuration ---
const STATUS_OPTIONS = [
  { value: 'en attente', label: 'En Attente', icon: <FaClock size={13} className="mr-1.5" /> },
  { value: 'approuvé', label: 'Approuvée', icon: <FaCheckCircle size={13} className="mr-1.5" /> },
  { value: 'refusé', label: 'Refusée', icon: <FaTimesCircle size={13} className="mr-1.5" /> },
];

const STATUS_OPTIONS_FOR_FILTER = [
  { value: 'all', label: 'Tous les Statuts' },
  ...STATUS_OPTIONS,
];

const getStatusDetails = (statusValue) => {
  const status = STATUS_OPTIONS.find(s => s.value === statusValue?.toLowerCase());
  if (status) {
    let colorClass = '';
    if (status.value === 'en attente') colorClass = 'text-yellow-700 bg-yellow-100 border-yellow-300';
    else if (status.value === 'approuvé') colorClass = 'text-green-700 bg-green-100 border-green-300';
    else if (status.value === 'refusé') colorClass = 'text-red-700 bg-red-100 border-red-300';
    return { label: status.label, colorClass, icon: status.icon };
  }
  return { label: statusValue || 'Inconnu', colorClass: 'text-gray-700 bg-gray-100 border-gray-300', icon: <FaQuestionCircle size={13} className="mr-1.5"/> };
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((value, key) => (value && value[key] != null) ? value[key] : undefined, obj);
};

// IMPORTANT: This must match your Laravel setup (public/storage symlink)
const JUSTIFICATION_STORAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function AdminRemboursementList() {
  const [remboursements, setRemboursements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  const [filterStatus, setFilterStatus] = useState('all');

  const [updatingStatusRemboursementId, setUpdatingStatusRemboursementId] = useState(null);
  const [deletingRemboursementId, setDeletingRemboursementId] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api/admin/remboursements';

  const getToken = () => localStorage.getItem('admin_token');
  const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'); // If using CSRF with Sanctum (uncommon for API)

  const fetchRemboursements = async () => { 
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json', 'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: Impossible de récupérer les demandes.`);
      }
      const data = await response.json();
      setRemboursements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message); setRemboursements([]);
      showAppNotification(err.message, 'error');
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (getToken()) {
        fetchRemboursements();
    } else {
        setError("Token administrateur non trouvé. Veuillez vous reconnecter.");
        setIsLoading(false);
        showAppNotification("Accès refusé: Token manquant.", "error");
    }
  }, []);

  useEffect(() => {
    let timer;
    if (notification.show) {
        timer = setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
    }
    return () => clearTimeout(timer);
  }, [notification.show]);

  const showAppNotification = (message, type = 'success') => { 
    setNotification({ show: true, message, type });
  };

  const handleUpdateStatus = async (remboursementId, newStatus) => {
    // Controller only accepts 'approuvé' or 'refusé'
    if (newStatus !== 'approuvé' && newStatus !== 'refusé') {
        // This case shouldn't happen if the select options are correct
        showAppNotification("Statut de mise à jour invalide.", "warning");
        return;
    }

    setUpdatingStatusRemboursementId(remboursementId);
    const headers = {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json', 'Accept': 'application/json',
    };
    const csrfToken = getCsrfToken(); if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

    try {
      const response = await fetch(`${API_BASE_URL}/${remboursementId}`, {
        method: 'PUT', headers, body: JSON.stringify({ status: newStatus }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Erreur lors de la mise à jour du statut.');
      
      showAppNotification(responseData.message || 'Statut mis à jour.');
      // The controller returns the updated remboursement object in 'data'
      const updatedRemboursement = responseData.data || responseData; 
      setRemboursements(prevRemboursements =>
        prevRemboursements.map(r => (r.id === remboursementId ? { ...updatedRemboursement } : r)) // Use full updated object
      );
    } catch (err) {
      showAppNotification(err.message, 'error');
       setRemboursements(prev => [...prev]); // Force re-render to reset select if it visually changed
    } finally { setUpdatingStatusRemboursementId(null); }
  };

  const handleDeleteRemboursement = async (remboursementId) => {
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande de remboursement ?")) return;
      setDeletingRemboursementId(remboursementId);
      const headers = {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json',
      };
      const csrfToken = getCsrfToken(); if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

      try {
          const response = await fetch(`${API_BASE_URL}/${remboursementId}`, {
              method: 'DELETE', headers,
          });
          // Controller returns JSON message for delete
          const responseData = await response.json();
          if (!response.ok) {
              throw new Error(responseData.message || `Erreur ${response.status} lors de la suppression.`);
          }
          
          showAppNotification(responseData.message);
          setRemboursements(prevRemboursements => prevRemboursements.filter(r => r.id !== remboursementId));
      } catch (err) {
          showAppNotification(err.message, 'error');
      } finally {
          setDeletingRemboursementId(null);
      }
  };

  const handleSort = (field) => { 
    const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field); setSortDirection(newDirection);
  };

  const sortedAndFilteredRemboursements = [...remboursements]
    .filter(remboursement => { 
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearchTerm = (
        (remboursement.id?.toString().includes(searchTermLower)) ||
        (getNestedValue(remboursement, 'employe.nom')?.toLowerCase().includes(searchTermLower)) ||
        (getNestedValue(remboursement, 'employe.prenom')?.toLowerCase().includes(searchTermLower)) ||
        (getNestedValue(remboursement, 'employe.email')?.toLowerCase().includes(searchTermLower)) ||
        (remboursement.type?.toLowerCase().includes(searchTermLower)) ||
        (String(remboursement.montant)?.includes(searchTermLower)) ||
        (remboursement.status?.toLowerCase().includes(searchTermLower)) ||
        (remboursement.created_at && new Date(remboursement.created_at).toLocaleDateString('fr-FR').includes(searchTermLower))
      );
      const matchesStatusFilter = filterStatus === 'all' || remboursement.status?.toLowerCase() === filterStatus;
      return matchesSearchTerm && matchesStatusFilter;
    })
    .sort((a,b) => {
        if (!sortField) return 0;
        let valA = getNestedValue(a, sortField); let valB = getNestedValue(b, sortField);
        valA = valA == null ? '' : valA; valB = valB == null ? '' : valB;
        
        if (sortField.includes('created_at') || sortField.includes('updated_at')) {
            const dateA = valA ? new Date(valA).getTime() : 0; const dateB = valB ? new Date(valB).getTime() : 0;
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortField === 'montant') {
            return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }
        valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

  const tableHeaders = [ 
    { label: 'ID', field: 'id' }, { label: 'Employé', field: 'employe.nom' },
    { label: 'Type', field: 'type' }, { label: 'Montant', field: 'montant' },
    { label: 'Date Dem.', field: 'created_at' }, { label: 'Justificatif', field: 'justification', sortable: false },
    { label: 'Statut', field: 'status' },
  ];

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!getToken() && !isLoading && error?.includes("Token")) {
  I
  }

  return (
    <>
      <ThemedNotification 
        show={notification.show} message={notification.message} type={notification.type} 
        onDismiss={() => setNotification(prev => ({...prev, show: false}))}
      />

      <div className="max-w-full mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
        <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Demandes de Remboursement</h1>
            <p className="text-sm text-[#567C8D] mt-0.5">Gérer les demandes de remboursement.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchRemboursements} disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-sm transition-colors text-sm font-medium text-white
                          bg-[#2F4156] hover:bg-[#3b5068] ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            > <FaSync size={15} className={isLoading ? 'animate-spin' : ''} /> Actualiser </button>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text" placeholder="Rechercher..."
                className="w-full pl-10 pr-10 py-2.5 border border-[#C8D9E6] rounded-lg text-[#2F4156] bg-white placeholder-[#567C8D]/70 focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#567C8D]/80" size={16}/>
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-[#567C8D]/70 hover:text-[#2F4156]"><FaTimesCircle size={18} /></button>
                )}
            </div>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <select
                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border border-[#C8D9E6] rounded-lg text-[#2F4156] bg-white appearance-none focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all outline-none"
              >
                {STATUS_OPTIONS_FOR_FILTER.map(option => ( <option key={option.value} value={option.value}>{option.label}</option> ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#567C8D]"><FaFilter size={14} /></div>
            </div>
          </div>

          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-5 py-3.5">
              <h2 className="font-semibold text-[#2F4156]">Liste des Demandes ({sortedAndFilteredRemboursements.length})</h2>
            </div>
            {isLoading && !remboursements.length ? (
              <ThemedSkeletonLoader rows={7} cols={tableHeaders.length} />
            ) : error && !remboursements.length ? (
              <div className="p-12 text-center flex flex-col items-center">
                {/* Error display ... */}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th key={header.field} className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider cursor-pointer hover:bg-[#C8D9E6]/60 transition-colors" onClick={() => header.sortable !== false && handleSort(header.field)}>
                          <div className="flex items-center">
                            {header.label}
                            {header.sortable !== false && sortField === header.field && <FaChevronDown className={`ml-1.5 w-3 h-3 transition-transform duration-200 text-[#567C8D] ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {sortedAndFilteredRemboursements.length === 0 ? ( 
                      <tr><td colSpan={tableHeaders.length + 1} className="px-4 py-12 text-center">{/* No results ... */}</td></tr>
                    ) : (
                      sortedAndFilteredRemboursements.map((remboursement) => {
                        const statusDetails = getStatusDetails(remboursement.status);
                        // 'remboursement.justification' will be like 'pdfs/filename.ext'
                        const justificationPath = remboursement.justification;
                        let currentJustificationUrl = null;
                        if (justificationPath) {
                            currentJustificationUrl = `${JUSTIFICATION_STORAGE_BASE_URL}${justificationPath}`;
                        }

                        const isUpdatingThisStatus = updatingStatusRemboursementId === remboursement.id;
                        const isDeletingThisRemboursement = deletingRemboursementId === remboursement.id;
                        const disableActions = isUpdatingThisStatus || isDeletingThisRemboursement;
                        
                        // Options for admin to change status to
                        const statusChangeOptions = STATUS_OPTIONS.filter(opt => opt.value === 'approuvé' || opt.value === 'refusé');
                        
                        return (
                          <tr key={remboursement.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150 text-sm">
                            <td className="py-3 px-4 whitespace-nowrap text-[#2F4156] font-medium">{remboursement.id}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-medium text-[#2F4156] flex items-center"><FaUserAlt size={12} className="mr-2 text-gray-400"/>{getNestedValue(remboursement, 'employe.nom') || 'N/A'} {getNestedValue(remboursement, 'employe.prenom') || ''}</div>
                                {getNestedValue(remboursement, 'employe.email') && <div className="text-xs text-[#567C8D] pl-5">{getNestedValue(remboursement, 'employe.email')}</div>}
                            </td>
                            <td className="py-3 px-4 text-[#567C8D]"><div className="flex items-center"><FaAlignLeft size={12} className="mr-2 text-gray-400"/>{remboursement.type || 'N/A'}</div></td>
                            <td className="py-3 px-4 whitespace-nowrap text-[#567C8D] text-right"><div className="flex items-center justify-end">{parseFloat(remboursement.montant).toFixed(2)} €<FaDollarSign size={12} className="ml-1 text-gray-400"/></div></td>
                            <td className="py-3 px-4 whitespace-nowrap text-[#567C8D]">{formatDateForDisplay(remboursement.created_at)}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              {currentJustificationUrl ? (
                                <a href={currentJustificationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 text-xs font-medium p-1 hover:bg-blue-50 rounded-md"><FaFilePdf size={14}/> Voir</a>
                              ) : <span className="text-xs text-gray-400 italic">Aucun</span>}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusDetails.colorClass}`}>{statusDetails.icon} {statusDetails.label}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col items-center gap-2 w-full max-w-[180px] mx-auto">
                                <div className="w-full border border-[#C8D9E6]/70 p-2 rounded-md bg-[#F5EFEB]/40">
                                  {isUpdatingThisStatus ? (
                                      <div className="flex justify-center items-center h-[34px]"><FaSpinner size={18} className="animate-spin text-[#567C8D]" /></div>
                                    ) : (
                                    <div className="relative w-full">
                                      <select
                                        value={remboursement.status} // Show current status
                                        onChange={(e) => handleUpdateStatus(remboursement.id, e.target.value)}
                                        disabled={disableActions}
                                        className="w-full pl-3 pr-8 py-1.5 text-xs border border-[#A0B9CD] focus:border-[#567C8D] rounded-md shadow-sm appearance-none bg-white text-[#2F4156] hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-[#567C8D] disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        {/* Current status as the default selected (but visually distinct or non-selectable for change) */}
                                        <option value={remboursement.status} disabled hidden>{statusDetails.label}</option>
                                        {/* Options to change to */}
                                        {statusChangeOptions.map(option => (
                                          <option key={option.value} value={option.value}>
                                            {option.label === 'Approuvée' ? 'Approuver' : (option.label === 'Refusée' ? 'Refuser' : option.label)}
                                          </option>
                                        ))}
                                        {/* If current status is 'en attente', explicitly add it as a non-changeable display option if not already covered */}
                                        {remboursement.status === 'en attente' && !statusChangeOptions.some(opt => opt.value === 'en attente') && (
                                            <option value="en attente" disabled>{getStatusDetails('en attente').label}</option>
                                        )}
                                      </select>
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#567C8D]"><FaChevronDown size={12} /></div>
                                    </div>
                                    )}
                                </div>
                                <div className="w-full mt-1 border border-red-300/50 p-2 rounded-md bg-red-50/30">
                                    <button type="button" onClick={() => handleDeleteRemboursement(remboursement.id)} disabled={disableActions} title="Supprimer cette demande" className="w-full text-xs px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md inline-flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                        {isDeletingThisRemboursement ? <FaSpinner size={13} className="animate-spin mr-1.5" /> : <FaTrashAlt size={12} className="mr-1.5" />}
                                        Supprimer Demande
                                    </button>
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
        <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
            Gestion des Demandes de Remboursement © {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}