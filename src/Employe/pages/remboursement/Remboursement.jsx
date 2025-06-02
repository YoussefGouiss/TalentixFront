import React, { useState, useEffect, useRef } from 'react';
import {
    FaPlusCircle, FaTrashAlt, FaSearch, FaChevronDown, FaQuestionCircle, FaSpinner,
    FaPaperPlane, FaFilePdf, FaSync, FaTimes, FaCheckCircle, FaTimesCircle,
    FaExclamationTriangle, FaEdit, FaDollarSign, FaAlignLeft, FaFileAlt
} from 'react-icons/fa';

// --- Themed Notification Component (Keep as is from your example) ---
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

// --- Themed SkeletonLoader Component (Keep as is from your example) ---
const SkeletonLoader = ({ rows = 3, cols = 5 }) => (
  <div className="animate-pulse p-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`grid grid-cols-${cols + 1} gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center`}>
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div>
        ))}
        <div className="h-8 bg-[#C8D9E6]/70 rounded w-24 col-span-1 justify-self-center"></div>
      </div>
    ))}
  </div>
);

// --- SlideDown Component (Keep as is from your example) ---
const SlideDown = ({ isVisible, children }) => (
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      {isVisible && <div className="pt-2 pb-6">{children}</div>}
    </div>
  );

// --- Status Configuration ---
const STATUS_OPTIONS_DISPLAY = [
  { value: 'en attente', label: 'En Attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <FaSpinner size={14} className="mr-1.5 animate-spin" /> },
  { value: 'approuvé', label: 'Approuvée', color: 'bg-green-100 text-green-700 border-green-300', icon: <FaCheckCircle size={14} className="mr-1.5" /> },
  { value: 'refusé', label: 'Refusée', color: 'bg-red-100 text-red-700 border-red-300', icon: <FaTimesCircle size={14} className="mr-1.5" /> },
];

const getStatusDetails = (statusValue) => {
  const status = STATUS_OPTIONS_DISPLAY.find(s => s.value === statusValue?.toLowerCase());
  return status
    ? { label: status.label, colorClasses: status.color, icon: status.icon }
    : { label: statusValue || 'N/A', colorClasses: 'bg-gray-100 text-gray-700 border-gray-300', icon: <FaQuestionCircle size={14} className="mr-1.5"/> };
};

const JUSTIFICATION_STORAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function EmployeRemboursements() {
  const [remboursements, setRemboursements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingActionId, setSubmittingActionId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRemboursement, setEditingRemboursement] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const [formData, setFormData] = useState({
    type: '',
    montant: '',
    justification: null,
  });
  const justificationInputRef = useRef(null);

  const [notification, setNotificationState] = useState({
    show: false, message: '', type: 'success',
  });

  const API_BASE_URL = 'http://localhost:8000/api/employe/remboursements';
  const getToken = () => localStorage.getItem('employe_token');

  const showAppNotification = (message, type = 'success') => {
    setNotificationState({ show: true, message, type });
    setTimeout(() => {
      setNotificationState({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const fetchRemboursements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Aucune demande n'a été trouvée." }));
        if (response.status === 404 && errorData.message === "Aucune demande n'a été trouvée.") {
            setRemboursements([]);
        } else {
            throw new Error(errorData.message || 'Erreur lors de la récupération de vos demandes.');
        }
      } else {
        const data = await response.json();
        setRemboursements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      showAppNotification(err.message || 'Impossible de charger vos demandes.', 'error');
      if (!err.message.includes("Aucune demande")) {
        setRemboursements([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) {
        fetchRemboursements();
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, justification: e.target.files[0] || null }));
  };

  const resetForm = () => {
    setFormData({ type: '', montant: '', justification: null });
    if (justificationInputRef.current) {
        justificationInputRef.current.value = "";
    }
    setEditingRemboursement(null);
    setShowForm(false);
  };

  const toggleForm = (remboursementToEdit = null) => {
    if (showForm && !remboursementToEdit && !editingRemboursement) {
        resetForm(); return;
    }
    if (showForm && editingRemboursement && !remboursementToEdit) {
        resetForm(); return;
    }
    if (remboursementToEdit) {
      setEditingRemboursement(remboursementToEdit);
      setFormData({
        type: remboursementToEdit.type || '',
        montant: remboursementToEdit.montant || '',
        justification: null,
      });
      setShowForm(true);
    } else {
      setEditingRemboursement(null);
      setFormData({ type: '', montant: '', justification: null });
      if (justificationInputRef.current) justificationInputRef.current.value = "";
      setShowForm(true);
    }
  };

  const handleSubmitRemboursement = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.montant) {
      showAppNotification("Veuillez remplir le type et le montant.", "warning"); return;
    }
    if (parseFloat(formData.montant) <= 0) {
      showAppNotification("Le montant doit être supérieur à zéro.", "warning"); return;
    }
    setIsSubmitting(true);
    setSubmittingActionId(editingRemboursement ? editingRemboursement.id : 'new');
    const submissionData = new FormData();
    submissionData.append('type', formData.type);
    submissionData.append('montant', formData.montant);
    if (formData.justification) {
      submissionData.append('justification', formData.justification);
    }
    let url = API_BASE_URL;
    if (editingRemboursement) {
      url = `${API_BASE_URL}/${editingRemboursement.id}`;
      submissionData.append('_method', 'PUT');
    }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json', },
        body: submissionData,
      });
      const responseData = await response.json();
      if (!response.ok) {
        const message = responseData.errors ? Object.values(responseData.errors).flat().join(' ') : (responseData.message || 'Erreur lors de la soumission.');
        throw new Error(message);
      }
      showAppNotification(responseData.message || `Demande ${editingRemboursement ? 'mise à jour' : 'envoyée'}!`, 'success');
      resetForm();
      fetchRemboursements();
    } catch (err) {
      showAppNotification(err.message || 'Une erreur est survenue.', 'error');
    } finally {
      setIsSubmitting(false);
      setSubmittingActionId(null);
    }
  };

  const handleDeleteRemboursement = async (remboursementId) => {
    if (!window.confirm('Supprimer cette demande (si en attente)?')) return;
    setIsSubmitting(true);
    setSubmittingActionId(remboursementId);
    try {
      const response = await fetch(`${API_BASE_URL}/${remboursementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.message || 'Erreur de suppression.');
      }
      showAppNotification(responseData?.message || 'Demande supprimée.', 'success');
      fetchRemboursements();
    } catch (err) {
      showAppNotification(err.message || 'Échec de la suppression.', 'error');
    } finally {
      setIsSubmitting(false);
      setSubmittingActionId(null);
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

  const sortedAndFilteredRemboursements = [...remboursements]
    .filter(demande => { /* ... filter logic ... */
      const searchTermLower = searchTerm.toLowerCase();
      return (
        demande.type?.toLowerCase().includes(searchTermLower) ||
        String(demande.montant)?.toLowerCase().includes(searchTermLower) ||
        demande.status?.toLowerCase().includes(searchTermLower) ||
        demande.created_at?.toLowerCase().includes(searchTermLower)
      );
    })
    .sort((a, b) => { /* ... sort logic ... */
      if (!sortField) return 0;
      let valA = getNestedValue(a, sortField); let valB = getNestedValue(b, sortField);
      valA = valA == null ? '' : valA; valB = valB == null ? '' : valB;
      if (sortField === 'created_at' || sortField === 'updated_at') {
        const dateA = new Date(valA); const dateB = new Date(valB);
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return sortDirection === 'asc' ? 1 : -1;
        if (isNaN(dateB.getTime())) return sortDirection === 'asc' ? -1 : 1;
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      if (sortField === 'montant') {
        return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      return sortDirection === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

  const tableHeaders = [
    { label: 'Type', field: 'type', className: 'w-2/5' }, // Give 'Type' more width
    { label: 'Montant (€)', field: 'montant', className: 'w-1/5 text-right' }, // text-right for numbers
    { label: 'Date Demande', field: 'created_at', className: 'w-1/5' },
    { label: 'Statut', field: 'status', className: 'w-1/5' },
    { label: 'Justif.', field: 'justification', sortable: false, className: 'w-auto text-center' }, // 'w-auto' for small content
  ];

  const formatDate = (dateString) => { /* ... format date ... */
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const inputClasses = "w-full p-2.5 border border-[#C8D9E6] rounded-md focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-colors outline-none text-[#2F4156] bg-white text-sm";
  const buttonPrimaryClasses = "flex items-center justify-center px-4 py-2 bg-[#567C8D] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-[#4A6582] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
  const buttonSecondaryClasses = "flex items-center justify-center px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] text-sm font-medium rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed";

  if (!getToken()) { /* ... No token UI ... */
      return ( <div className="min-h-screen bg-[#F5EFEB] flex items-center justify-center p-4 md:p-6"> <Notification show={notification.show} message={notification.message} type={notification.type} onDismiss={() => setNotificationState(p => ({...p, show: false}))} /> <div className="p-8 text-center text-red-600 bg-red-100 border border-red-300 rounded-lg shadow-md max-w-md w-full"> <FaExclamationTriangle size={32} className="mx-auto mb-3 text-red-500" /> <h2 className="text-xl font-semibold mb-2">Accès Refusé</h2> <p className="text-sm">Token employé non trouvé. Veuillez vous reconnecter pour accéder à cette page.</p> </div> </div> );
  }

  return (
    <div className="min-h-screen bg-[#F5EFEB]">
      <Notification show={notification.show} message={notification.message} type={notification.type} onDismiss={() => setNotificationState(p => ({...p, show: false}))} />

      {/* You can change max-w-5xl to max-w-6xl or max-w-7xl if you want the whole content area wider */}
      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6"> {/* CHANGED to max-w-6xl */}
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Mes Demandes de Remboursement</h1>
        </header>
      </div>

      {/* You can change max-w-5xl to max-w-6xl or max-w-7xl if you want the whole content area wider */}
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* CHANGED to max-w-6xl */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            {/* ... search and buttons ... */}
            <div className="relative w-full sm:w-auto sm:flex-grow max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <FaSearch className="text-[#A0B9CD]" size={16} /> </div>
              <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-3 py-2.5 border border-[#C8D9E6] rounded-md focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-colors outline-none text-[#2F4156] bg-white text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={fetchRemboursements} disabled={isLoading || isSubmitting} className={buttonSecondaryClasses}> <FaSync size={16} className={`mr-2 ${(isLoading && !isSubmitting) ? 'animate-spin' : ''}`} /> Actualiser </button>
              <button onClick={() => toggleForm()} className={`${showForm && !editingRemboursement ? 'bg-red-500 hover:bg-red-600' : 'bg-[#567C8D] hover:bg-[#4A6582]'} text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-all duration-150 flex items-center justify-center w-full sm:w-auto`} disabled={isSubmitting && submittingActionId !== null && !editingRemboursement}> {showForm && !editingRemboursement ? <FaTimes size={16} className="mr-2" /> : <FaPlusCircle size={16} className="mr-2" />} {showForm && !editingRemboursement ? 'Annuler Nouvelle' : 'Nouveau Remboursement'} </button>
            </div>
          </div>

          <SlideDown isVisible={showForm}>
            {/* ... form content ... */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-inner p-6 mb-6"> <h2 className="text-xl font-semibold text-[#2F4156] border-b border-[#C8D9E6] pb-3 mb-6 flex items-center"> {editingRemboursement ? <FaEdit className="mr-3 text-[#567C8D]" /> : <FaPlusCircle className="mr-3 text-[#567C8D]" />} {editingRemboursement ? 'Modifier la Demande' : 'Faire une Nouvelle Demande'} </h2> <form onSubmit={handleSubmitRemboursement} className="space-y-4"> <div> <label htmlFor="type" className="block text-sm font-medium text-[#567C8D] mb-1">Type <span className="text-red-500">*</span></label> <div className="relative"> <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaAlignLeft className="text-gray-400" /></span> <input type="text" name="type" id="type" value={formData.type} onChange={handleInputChange} className={`${inputClasses} pl-10`} placeholder="Ex: Frais de déplacement" required disabled={isSubmitting} /> </div> </div> <div> <label htmlFor="montant" className="block text-sm font-medium text-[#567C8D] mb-1">Montant (€) <span className="text-red-500">*</span></label> <div className="relative"> <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaDollarSign className="text-gray-400" /></span> <input type="number" name="montant" id="montant" value={formData.montant} onChange={handleInputChange} min="0.01" step="0.01" className={`${inputClasses} pl-10`} placeholder="Ex: 50.25" required disabled={isSubmitting} /> </div> </div> <div> <label htmlFor="justification" className="block text-sm font-medium text-[#567C8D] mb-1"> Justificatif <span className="text-xs text-gray-500">(PDF, JPG, PNG - max 2Mo)</span> {editingRemboursement && editingRemboursement.justification && <span className="text-xs text-blue-600 ml-2">(Optionnel: laisser vide pour conserver l'actuel)</span>} </label> <div className="relative"> <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaFileAlt className="text-gray-400" /></span> <input type="file" name="justification" id="justification" ref={justificationInputRef} onChange={handleFileChange} className={`${inputClasses} pl-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E2E8F0] file:text-[#567C8D] hover:file:bg-[#CBD5E1]`} accept=".pdf,.jpg,.jpeg,.png" disabled={isSubmitting} /> </div> {editingRemboursement && editingRemboursement.justification && ( <p className="text-xs text-gray-600 mt-1"> Actuel: <a href={`${JUSTIFICATION_STORAGE_BASE_URL}${editingRemboursement.justification}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{editingRemboursement.justification.split('/').pop()}</a> </p> )} </div> <div className="flex justify-end gap-3 pt-4"> <button type="button" onClick={resetForm} className={buttonSecondaryClasses} disabled={isSubmitting}> <FaTimes size={16} className="mr-2" /> Annuler </button> <button type="submit" disabled={isSubmitting || !formData.type || !formData.montant} className={buttonPrimaryClasses}> {isSubmitting && (submittingActionId === (editingRemboursement?.id || 'new')) ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaPaperPlane size={16} className="mr-2" />} {editingRemboursement ? 'Mettre à Jour' : 'Envoyer'} </button> </div> </form> </div>
          </SlideDown>

          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-4 py-3.5">
              <h2 className="text-lg font-semibold text-[#2F4156]">Historique de Mes Demandes</h2>
            </div>
            {isLoading && remboursements.length === 0 && !showForm ? (
              <SkeletonLoader rows={3} cols={tableHeaders.length} />
            ) : !isLoading && sortedAndFilteredRemboursements.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center"> <FaSearch size={40} className="mx-auto text-[#A0B9CD] mb-4" /> <p className="text-xl font-medium text-[#2F4156]"> {searchTerm ? "Aucune demande ne correspond à votre recherche." : "Aucune demande de remboursement trouvée."} </p> <p className="text-[#567C8D] mt-2"> {searchTerm ? "Essayez d'ajuster vos filtres." : "Vous n'avez pas encore fait de demande. "} {!searchTerm && ( <button onClick={() => toggleForm()} className="text-[#567C8D] hover:text-[#2F4156] underline font-medium"> Faire une nouvelle demande </button> )}. </p> </div>
            ) : (
              <div className="overflow-x-auto"> {/* This div will allow horizontal scrolling if table content is too wide */}
                <table className="min-w-full table-auto"> {/* table-auto can help with column widths */}
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th 
                          key={header.field} 
                          // Added specific width classes to headers
                          className={`py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider cursor-pointer hover:bg-[#C8D9E6]/50 transition-colors ${header.className || ''}`}
                          onClick={() => handleSort(header.field)}
                        >
                          <div className="flex items-center">
                            {header.label}
                            {sortField === header.field && <FaChevronDown className={`ml-1.5 w-3 h-3 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider w-1/6">Actions</th> {/* Gave Actions a width too */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {sortedAndFilteredRemboursements.map((demande) => {
                      const statusDetails = getStatusDetails(demande.status);
                      const justificationPath = demande.justification;
                      let justificationUrl = null;
                      if (justificationPath) {
                          justificationUrl = `${JUSTIFICATION_STORAGE_BASE_URL}${justificationPath}`;
                      }

                      return (
                        <tr key={demande.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                          {/* Apply the same width classes to td elements for consistency */}
                          <td className={`py-3 px-4 text-sm text-[#567C8D] whitespace-nowrap ${tableHeaders.find(h => h.field === 'type')?.className || ''}`}>{demande.type || 'N/A'}</td>
                          <td className={`py-3 px-4 whitespace-nowrap text-sm text-[#567C8D] ${tableHeaders.find(h => h.field === 'montant')?.className || ''}`}>{parseFloat(demande.montant).toFixed(2)} €</td>
                          <td className={`py-3 px-4 whitespace-nowrap text-sm text-[#567C8D] ${tableHeaders.find(h => h.field === 'created_at')?.className || ''}`}>{formatDate(demande.created_at)}</td>
                          <td className={`py-3 px-4 whitespace-nowrap ${tableHeaders.find(h => h.field === 'status')?.className || ''}`}>
                            <span className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${statusDetails.colorClasses}`}>
                              {statusDetails.icon} {statusDetails.label}
                            </span>
                          </td>
                          <td className={`py-3 px-4 whitespace-nowrap text-sm ${tableHeaders.find(h => h.field === 'justification')?.className || 'text-center'}`}>
                            {justificationUrl ? (
                              <a href={justificationUrl} target="_blank" rel="noopener noreferrer" className="text-[#567C8D] hover:text-[#2F4156] hover:underline inline-flex items-center justify-center p-1 hover:bg-slate-100 rounded-md" title="Voir le justificatif">
                                <FaFilePdf size={18} />
                              </a>
                            ) : (<span className="text-gray-400 italic">-</span>)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap w-1/6"> {/* Explicit width for actions column */}
                            {demande.status?.toLowerCase() === 'en attente' ? (
                              <div className="flex items-center justify-center gap-2"> <button onClick={() => toggleForm(demande)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-colors" title="Modifier la Demande" disabled={isSubmitting && submittingActionId === demande.id} > {isSubmitting && submittingActionId === demande.id && editingRemboursement?.id === demande.id ? <FaSpinner className="animate-spin" size={16}/> : <FaEdit size={16} />} </button> <button onClick={() => handleDeleteRemboursement(demande.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors" title="Supprimer la Demande" disabled={isSubmitting && submittingActionId === demande.id} > {isSubmitting && submittingActionId === demande.id && !editingRemboursement ? <FaSpinner className="animate-spin" size={16}/> : <FaTrashAlt size={16} />} </button> </div>
                            ) : ( <span className="text-xs text-gray-400 italic">Traité</span> )}
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
          <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]"> {/* CHANGED to max-w-6xl */}
              Gestion des Remboursements © {new Date().getFullYear()}
          </footer>
        </div>
      </div>
  );
}