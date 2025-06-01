  import React, { useState, useEffect, useRef } from 'react';
  import { Link } from 'react-router-dom';
  import {
    FaCheckSquare, FaSearch, FaChevronDown, FaQuestionCircle, FaSpinner, FaSync, FaArrowLeft,
    FaPaperclip, FaTimesCircle, FaFilePdf, FaUpload, FaPaperPlane, FaTrashAlt, FaCheckCircle, FaClock, FaFilter // Added FaFilter for the dropdown
  } from 'react-icons/fa';

  // --- Themed Stubs / Re-used Components ---
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

  const ThemedSkeletonLoader = ({ rows = 5, cols = 7 }) => {
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
  // --- End Themed Stubs ---


  const STATUS_OPTIONS_FOR_SELECT = [ // Used for the select dropdown in actions
    { value: 'en attente', label: 'En Attente', icon: <FaClock size={13} className="mr-1.5" /> },
    { value: 'accepte', label: 'Acceptée', icon: <FaCheckCircle size={13} className="mr-1.5" /> },
    { value: 'refuse', label: 'Refusée', icon: <FaTimesCircle size={13} className="mr-1.5" /> },
  ];

  const STATUS_OPTIONS_FOR_FILTER = [ // Used for the filter dropdown
    { value: 'all', label: 'Tous les Statuts' },
    ...STATUS_OPTIONS_FOR_SELECT,
  ];


  const getStatusDetails = (statusValue) => {
    const status = STATUS_OPTIONS_FOR_SELECT.find(s => s.value === statusValue?.toLowerCase());
    if (status) {
      let colorClass = '';
      if (status.value === 'en attente') colorClass = 'text-yellow-700 bg-yellow-100 border-yellow-300';
      else if (status.value === 'accepte') colorClass = 'text-green-700 bg-green-100 border-green-300';
      else if (status.value === 'refuse') colorClass = 'text-red-700 bg-red-100 border-red-300';
      return { label: status.label, colorClass, icon: status.icon };
    }
    return { label: statusValue || 'Inconnu', colorClass: 'text-gray-700 bg-gray-100 border-gray-300', icon: <FaQuestionCircle size={13} className="mr-1.5"/> };
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
    
    const [filterStatus, setFilterStatus] = useState('all');

    const [updatingStatusDemandeId, setUpdatingStatusDemandeId] = useState(null);
    const [uploadingPdfDemandeId, setUploadingPdfDemandeId] = useState(null);
    const [deletingPdfDemandeId, setDeletingPdfDemandeId] = useState(null);
    const [deletingAttestationDemandeId, setDeletingAttestationDemandeId] = useState(null); // <<< New state for deleting demande

    const [selectedPdfForUpload, setSelectedPdfForUpload] = useState({});
    const fileInputRefs = useRef({});

    const DEMANDES_API_URL = 'http://localhost:8000/api/admin/attestation-demandes';
    const UPDATE_STATUS_ONLY_API_URL = 'http://localhost:8000/api/admin/updateStatut';
    const ATTESTATION_API_BASE_URL = 'http://localhost:8000/api/admin/attestations'; // Used for PDF upload/delete
    const DELETE_ATTESTATION_DEMANDE_API_URL = 'http://localhost:8000/api/admin/deleteAttestation'; // <<< New API URL for deleting demande


    const getToken = () => localStorage.getItem('admin_token');
    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const fetchDemandes = async () => { 
      setIsLoading(true); setError(null);
      try {
        const response = await fetch(DEMANDES_API_URL, {
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
        setDemandes(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
      } catch (err) {
        setError(err.message); setDemandes([]);
        showAppNotification(err.message, 'error');
      } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchDemandes(); }, []);

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

    const handlePdfSelection = (event, demandeId) => { 
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
    const clearSelectedPdf = (demandeId) => { 
      setSelectedPdfForUpload(prev => ({ ...prev, [demandeId]: null }));
      if (fileInputRefs.current[demandeId]) {
        fileInputRefs.current[demandeId].value = null; 
      }
    };

    const handleUpdateStatus = async (demandeId, newStatus) => { 
      setUpdatingStatusDemandeId(demandeId);
      const headers = {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json', 'Accept': 'application/json',
      };
      const csrfToken = getCsrfToken(); if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

      try {
        const response = await fetch(`${UPDATE_STATUS_ONLY_API_URL}/${demandeId}`, {
          method: 'PUT', headers, body: JSON.stringify({ statut: newStatus }),
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || responseData.error || 'Erreur lors de la mise à jour.');
        
        showAppNotification(responseData.message || 'Statut mis à jour avec succès.');
        const updatedAttestation = responseData.data || responseData; 
        setDemandes(prevDemandes =>
          prevDemandes.map(d => (d.id === demandeId ? { ...d, statut: updatedAttestation.statut } : d))
        );
      } catch (err) {
        showAppNotification(err.message, 'error');
      } finally { setUpdatingStatusDemandeId(null); }
    };

    const handleSubmitPdf = async (demandeId) => { 
      const fileToUpload = selectedPdfForUpload[demandeId];
      if (!fileToUpload) { showAppNotification("Aucun PDF sélectionné.", "error"); return; }
      setUploadingPdfDemandeId(demandeId);

      const formDataBody = new FormData();
      formDataBody.append('pdf', fileToUpload);
      formDataBody.append('_method', 'PUT'); 

      const headers = {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json',
      };
      const csrfToken = getCsrfToken(); if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

      try {
        const response = await fetch(`${ATTESTATION_API_BASE_URL}/${demandeId}/pdf`, { 
          method: 'POST', headers, body: formDataBody,
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || responseData.error || 'Erreur lors de la soumission du PDF.');
        
        showAppNotification(responseData.message || 'PDF soumis avec succès.');
        const updatedAttestation = responseData.data || responseData;
        setDemandes(prevDemandes =>
          prevDemandes.map(d => (d.id === demandeId ? { ...d, pdf: updatedAttestation.pdf, statut: updatedAttestation.statut || d.statut } : d))
        );
        clearSelectedPdf(demandeId);
      } catch (err) {
        showAppNotification(err.message, 'error');
      } finally { setUploadingPdfDemandeId(null); }
    };

    const handleDeletePdf = async (demandeId) => {
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce PDF ? Cette action est irréversible.")) return;
      setDeletingPdfDemandeId(demandeId);
      const headers = {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json',
      };
      const csrfToken = getCsrfToken(); if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

      try {
          const response = await fetch(`${ATTESTATION_API_BASE_URL}/${demandeId}/pdf`, { method: 'DELETE', headers });
          let responseMessage = 'PDF supprimé avec succès.';
          if (response.status !== 204 && response.ok) { // If there's content (e.g., 200 with JSON)
              const responseData = await response.json().catch(() => null);
              responseMessage = responseData?.message || responseMessage;
          } else if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || errorData.error || 'Erreur lors de la suppression du PDF.');
          }
          
          showAppNotification(responseMessage);
          setDemandes(prevDemandes =>
              prevDemandes.map(d => (d.id === demandeId ? { ...d, pdf: null } : d))
          );
      } catch (err) {
          showAppNotification(err.message, 'error');
      } finally { setDeletingPdfDemandeId(null); }
    };

    // <<< New handler for deleting an attestation demande >>>
    const handleDeleteAttestationDemande = async (demandeId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande d'attestation ? Cette action est irréversible et supprimera également le PDF associé s'il existe.")) return;
        setDeletingAttestationDemandeId(demandeId);
        const headers = {
            'Authorization': `Bearer ${getToken()}`,
            'Accept': 'application/json',
        };
        const csrfToken = getCsrfToken(); if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

        try {
            const response = await fetch(`${DELETE_ATTESTATION_DEMANDE_API_URL}/${demandeId}`, {
                method: 'DELETE',
                headers,
            });

            if (response.ok) { // Covers 200-299, including 204
                let successMessage = 'Demande supprimée avec succès.';
                if (response.status !== 204) { // If there's content (e.g., 200 with JSON)
                    try {
                        const responseData = await response.json();
                        successMessage = responseData.message || successMessage;
                    } catch (jsonError) {
                        // Could be text, or just use default message for 200 with non-JSON
                        const textResponse = await response.text().catch(() => '');
                        successMessage = textResponse || successMessage;
                    }
                }
                showAppNotification(successMessage);
                setDemandes(prevDemandes => prevDemandes.filter(d => d.id !== demandeId));
            } else { // Handle non-ok responses (4xx, 5xx)
                let errorMessage = 'Erreur lors de la suppression de la demande.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (jsonError) {
                    const textError = await response.text().catch(() => '');
                    errorMessage = textError || `Erreur ${response.status}: ${response.statusText || 'Impossible de traiter la réponse.'}`;
                }
                throw new Error(errorMessage);
            }
        } catch (err) {
            showAppNotification(err.message, 'error');
        } finally {
            setDeletingAttestationDemandeId(null);
        }
    };


    const handleSort = (field) => { 
      const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
      setSortField(field); setSortDirection(newDirection);
    };

    const sortedAndFilteredDemandes = [...demandes]
      .filter(demande => { 
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearchTerm = (
          (demande.id?.toString().includes(searchTermLower)) ||
          (getNestedValue(demande, 'employe.nom')?.toLowerCase().includes(searchTermLower)) ||
          (getNestedValue(demande, 'employe.prenom')?.toLowerCase().includes(searchTermLower)) ||
          (getNestedValue(demande, 'employe.email')?.toLowerCase().includes(searchTermLower)) ||
          (getNestedValue(demande, 'attestation_type.type')?.toLowerCase().includes(searchTermLower)) ||
          (demande.statut?.toLowerCase().includes(searchTermLower)) ||
          (demande.date_demande && new Date(demande.date_demande).toLocaleDateString('fr-FR').includes(searchTermLower))
        );

        const matchesStatusFilter = filterStatus === 'all' || demande.statut?.toLowerCase() === filterStatus;

        return matchesSearchTerm && matchesStatusFilter;
      })
      .sort((a,b) => {
          if (!sortField) return 0;
          let valA = getNestedValue(a, sortField);
          let valB = getNestedValue(b, sortField);

          if (valA == null) valA = ''; if (valB == null) valB = '';
          
          if (sortField.includes('date_')) {
              const dateA = valA ? new Date(valA).getTime() : 0;
              const dateB = valB ? new Date(valB).getTime() : 0;
              return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
          }
          
          if (typeof valA === 'number' && typeof valB === 'number') {
              return sortDirection === 'asc' ? valA - valB : valB - valA;
          }
          
          valA = String(valA).toLowerCase(); 
          valB = String(valB).toLowerCase();

          if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
      });

    const tableHeaders = [ 
      { label: 'ID', field: 'id' }, { label: 'Employé', field: 'employe.nom' },
      { label: 'Type', field: 'attestation_type.type' }, { label: 'Date Dem.', field: 'date_demande' },
      { label: 'Date Livr.', field: 'date_livraison' }, { label: 'Doc. PDF', field: 'pdf', sortable: false },
      { label: 'Statut', field: 'statut' },
    ];

    const formatDateForDisplay = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };


    return (
      <>
        <ThemedNotification 
          show={notification.show} message={notification.message} type={notification.type} 
          onDismiss={() => setNotification(prev => ({...prev, show: false}))}
        />

        <div className="max-w-full mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
          <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Demandes d'Attestation</h1>
              <p className="text-sm text-[#567C8D] mt-0.5">Gérez les demandes d'attestation des employés.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/attestations"
                className="flex items-center gap-2 px-4 py-2 bg-[#567C8D] hover:bg-[#4A6582] text-white rounded-md shadow-sm transition-colors text-sm font-medium"
              > <FaArrowLeft size={16} /> Types d'Attestation </Link>
              <button
                onClick={fetchDemandes} disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-sm transition-colors text-sm font-medium text-white
                            bg-[#2F4156] hover:bg-[#3b5068] ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              > <FaSync size={15} className={isLoading ? 'animate-spin' : ''} /> Actualiser </button>
            </div>
          </header>

          <div className="p-6">
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <input
                  type="text" placeholder="Rechercher (ID, Employé, Type, Statut, Date...)"
                  className="w-full pl-10 pr-10 py-2.5 border border-[#C8D9E6] rounded-lg text-[#2F4156] bg-white
                            placeholder-[#567C8D]/70
                            focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all outline-none"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#567C8D]/80" size={16}/>
                  {searchTerm && (
                      <button onClick={() => setSearchTerm('')} aria-label="Effacer la recherche"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-[#567C8D]/70 hover:text-[#2F4156]">
                          <FaTimesCircle size={18} />
                      </button>
                  )}
              </div>
              <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-[#C8D9E6] rounded-lg text-[#2F4156] bg-white
                            appearance-none
                            focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all outline-none"
                >
                  {STATUS_OPTIONS_FOR_FILTER.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#567C8D]">
                  <FaFilter size={14} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-5 py-3.5">
                <h2 className="font-semibold text-[#2F4156]">Liste des Demandes ({sortedAndFilteredDemandes.length})</h2>
              </div>
              {isLoading && !demandes.length ? (
                <ThemedSkeletonLoader rows={7} cols={tableHeaders.length} />
              ) : error && !demandes.length ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <FaQuestionCircle size={40} className="text-red-500 mb-4" />
                  <p className="text-xl font-medium text-[#2F4156]">{error}</p>
                  <p className="text-[#567C8D] mt-2">Veuillez vérifier votre connexion ou réessayer.</p>
                  <button
                      onClick={fetchDemandes}
                      className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
                  > Réessayer </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#C8D9E6]/30">
                      <tr>
                        {tableHeaders.map((header) => (
                          <th key={header.field}
                              className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider cursor-pointer hover:bg-[#C8D9E6]/60 transition-colors"
                              onClick={() => header.sortable !== false && handleSort(header.field)}>
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
                      {sortedAndFilteredDemandes.length === 0 ? ( 
                        <tr>
                          <td colSpan={tableHeaders.length + 1} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                                  <FaSearch className="h-12 w-12 text-[#C8D9E6] mb-3" />
                                  <p className="text-lg font-medium text-[#2F4156]">Aucune demande trouvée</p>
                                  <p className="text-sm text-[#567C8D]">Vérifiez vos filtres ou attendez de nouvelles demandes.</p>
                              </div>
                          </td>
                        </tr>
                      ) : (
                        sortedAndFilteredDemandes.map((demande) => {
                          const statusDetails = getStatusDetails(demande.statut);
                          const currentPdfUrl = demande.pdf ? `${PDF_STORAGE_BASE_URL}${demande.pdf}` : null;
                          const isUploadingThisPdf = uploadingPdfDemandeId === demande.id;
                          const isDeletingThisPdf = deletingPdfDemandeId === demande.id;
                          const isUpdatingThisStatus = updatingStatusDemandeId === demande.id;
                          const isDeletingThisDemande = deletingAttestationDemandeId === demande.id; // <<< Check if this demande is being deleted
                          
                          // <<< Update disableActions to include deleting demande state >>>
                          const disableActions = isUploadingThisPdf || isDeletingThisPdf || isUpdatingThisStatus || isDeletingThisDemande;
                          
                          return (
                            <tr key={demande.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150 text-sm">
                              <td className="py-3 px-4 whitespace-nowrap text-[#2F4156] font-medium">{demande.id}</td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="font-medium text-[#2F4156]">{getNestedValue(demande, 'employe.nom') || 'N/A'} {getNestedValue(demande, 'employe.prenom') || ''}</div>
                                  {getNestedValue(demande, 'employe.email') && 
                                      <div className="text-xs text-[#567C8D]">{getNestedValue(demande, 'employe.email')}</div>}
                              </td>
                              <td className="py-3 px-4 text-[#567C8D]">{getNestedValue(demande, 'attestation_type.type') || 'N/A'}</td>
                              <td className="py-3 px-4 whitespace-nowrap text-[#567C8D]">{formatDateForDisplay(demande.date_demande)}</td>
                              <td className="py-3 px-4 whitespace-nowrap text-[#567C8D]">{formatDateForDisplay(demande.date_livraison)}</td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {currentPdfUrl ? (
                                  <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" 
                                    className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 text-xs font-medium">
                                    <FaFilePdf size={14}/> Voir PDF
                                  </a>
                                ) : <span className="text-xs text-gray-400 italic">Aucun</span>}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusDetails.colorClass}`}>
                                  {statusDetails.icon} {statusDetails.label}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex flex-col items-center gap-2 w-full max-w-[220px] mx-auto">
                                  
                                  <div className="w-full border border-[#C8D9E6]/70 p-2 rounded-md bg-[#F5EFEB]/40 space-y-1.5">
                                    <button
                                      type="button"
                                      onClick={() => fileInputRefs.current[demande.id]?.click()}
                                      disabled={disableActions}
                                      title="Joindre ou remplacer le PDF"
                                      className="w-full text-xs px-2 py-1.5 border border-[#A0B9CD] hover:border-[#567C8D] rounded-md 
                                                text-[#2F4156] hover:bg-[#E2E8F0] inline-flex items-center justify-center 
                                                transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    > <FaUpload size={13} className="mr-1.5" /> Joindre/Remplacer PDF </button>
                                    <input type="file" accept="application/pdf" className="hidden"
                                          ref={el => fileInputRefs.current[demande.id] = el}
                                          onChange={(e) => handlePdfSelection(e, demande.id)}
                                          disabled={disableActions} />

                                    {selectedPdfForUpload[demande.id] && (
                                      <div className="text-xs text-[#567C8D] flex items-center justify-between bg-yellow-100/70 p-1.5 rounded border border-yellow-300/50">
                                        <div className="flex items-center truncate max-w-[120px]" title={selectedPdfForUpload[demande.id].name}>
                                          <FaPaperclip size={12} className="mr-1 text-yellow-600 flex-shrink-0" />
                                          <span className="truncate">{selectedPdfForUpload[demande.id].name}</span>
                                        </div>
                                        <button onClick={() => clearSelectedPdf(demande.id)} className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0" disabled={isUploadingThisPdf}>
                                          <FaTimesCircle size={14} />
                                        </button>
                                      </div>
                                    )}
                                    <button
                                          type="button"
                                          onClick={() => handleSubmitPdf(demande.id)}
                                          disabled={isUploadingThisPdf || !selectedPdfForUpload[demande.id] || disableActions}
                                          title="Soumettre le PDF sélectionné"
                                          className="w-full text-xs px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md 
                                                  inline-flex items-center justify-center transition-colors
                                                  disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          {isUploadingThisPdf ? <FaSpinner size={13} className="animate-spin mr-1.5" /> : <FaPaperPlane size={12} className="mr-1.5" />}
                                          Soumettre PDF
                                      </button>
                                    {currentPdfUrl && !selectedPdfForUpload[demande.id] && (
                                        <button
                                            type="button" onClick={() => handleDeletePdf(demande.id)}
                                            disabled={isDeletingThisPdf || (disableActions && !isDeletingThisPdf)}
                                            title="Supprimer le PDF actuel"
                                            className="w-full text-xs px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md 
                                                      inline-flex items-center justify-center transition-colors
                                                      disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isDeletingThisPdf ? <FaSpinner size={13} className="animate-spin mr-1.5" /> : <FaTrashAlt size={12} className="mr-1.5" />}
                                            Supprimer PDF
                                        </button>
                                    )}
                                  </div>
                                  
                                  <div className="w-full border border-[#C8D9E6]/70 p-2 rounded-md bg-[#F5EFEB]/40">
                                    {isUpdatingThisStatus ? (
                                        <div className="flex justify-center items-center h-[34px]">
                                            <FaSpinner size={18} className="animate-spin text-[#567C8D]" />
                                        </div>
                                      ) : (
                                      <div className="relative w-full">
                                      <select
                                        value={demande.statut}
                                        onChange={(e) => handleUpdateStatus(demande.id, e.target.value)}
                                        disabled={disableActions}
                                        className="w-full pl-3 pr-8 py-1.5 text-xs border border-[#A0B9CD] focus:border-[#567C8D] 
                                                  rounded-md shadow-sm appearance-none bg-white text-[#2F4156]
                                                  hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-[#567C8D]
                                                  disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        {STATUS_OPTIONS_FOR_SELECT.map(option => (
                                          <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                      </select>
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#567C8D]">
                                        <FaChevronDown size={12} />
                                      </div>
                                      </div>
                                      )}
                                  </div>

                                  {/* <<< New Delete Demande Button >>> */}
                                  <div className="w-full mt-1 border border-red-300/50 p-2 rounded-md bg-red-50/30">
                                      <button
                                          type="button"
                                          onClick={() => handleDeleteAttestationDemande(demande.id)}
                                          disabled={disableActions}
                                          title="Supprimer cette demande d'attestation"
                                          className="w-full text-xs px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md 
                                                    inline-flex items-center justify-center transition-colors
                                                    disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                          {isDeletingThisDemande ? <FaSpinner size={13} className="animate-spin mr-1.5" /> : <FaTrashAlt size={12} className="mr-1.5" />}
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
              Gestion des Demandes d'Attestation © {new Date().getFullYear()}
          </footer>
        </div>
      </>
    );
  }