// src/AbsenceAdmin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Search, ChevronDown, HelpCircle, Loader, FileText, Edit, UploadCloud, Plus, RefreshCcw, Filter } from 'lucide-react'; // Removed Calendar as it wasn't used

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const STORAGE_BASE_URL = 'http://127.0.0.1:8000/storage';
const ADMIN_TOKEN = localStorage.getItem('admin_token');

const SlideDown = ({ isVisible, children }) => (
  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isVisible ? 'max-h-[1000px] opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}>
    {isVisible && children}
  </div>
);

const Notification = ({ show, message, type, onDismiss }) => (
  <div 
    className={`fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out flex items-center justify-between min-w-[300px]
                ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'} 
                ${type === 'success' ? 'bg-[#567C8D] text-white border-l-4 border-[#2F4156]' : ''}
                ${type === 'error' ? 'bg-red-500 text-white border-l-4 border-red-700' : ''}
                ${type === 'warning' ? 'bg-yellow-400 text-yellow-800 border-l-4 border-yellow-600' : ''}`}
  >
    <div className="flex items-center">
      {/* Optional: Add icons based on type here */}
      <span className="text-sm font-medium">{message}</span>
    </div>
    {onDismiss && (
      <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
        <X size={18} />
      </button>
    )}
  </div>
);


const SkeletonLoaderAbsences = () => (
    <div className="animate-pulse p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center">
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Employé */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Dates */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1 hidden sm:block"></div> {/* Durée */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Motif */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Statut */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1 hidden md:block"></div> {/* Impact */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1 hidden sm:block"></div> {/* Justificatif */}
          <div className="h-8 bg-[#C8D9E6]/80 rounded w-16 col-span-1 justify-self-center"></div> {/* Actions */}
        </div>
      ))}
    </div>
);


export default function AbsenceAdmin() {
    const [absences, setAbsences] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formAnimation, setFormAnimation] = useState(false);

    const [currentAbsence, setCurrentAbsence] = useState(null);
    const [formData, setFormData] = useState({
        employe_id: '', date_debut: '', date_fin: '', motif: '', justifiee: null, justificatifFile: null
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('date_debut');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('all');
    const [notification, setNotificationState] = useState({ show: false, message: '', type: 'success' });

    const inputClasses = "w-full p-2.5 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] sm:text-sm text-[#2F4156] bg-white placeholder-[#567C8D]/70 transition-colors duration-150 disabled:bg-gray-100/50 disabled:cursor-not-allowed";
    const buttonPrimaryClasses = `px-5 py-2.5 bg-[#2F4156] text-white font-semibold rounded-md shadow-md hover:bg-[#3b5068] focus:outline-none focus:ring-2 focus:ring-[#567C8D] focus:ring-opacity-70 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center text-sm`;
    const buttonSecondaryClasses = "px-4 py-2.5 bg-[#C8D9E6]/60 text-[#2F4156] font-semibold rounded-md shadow-sm hover:bg-[#C8D9E6] focus:outline-none focus:ring-2 focus:ring-[#567C8D] focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 text-sm";

    const showAppNotification = (message, type = 'success') => {
        setNotificationState({ show: true, message, type });
        // setTimeout(() => setNotificationState(prev => ({ ...prev, show: false })), 3500);
    };
    
    const dismissNotification = () => {
        setNotificationState(prev => ({ ...prev, show: false }));
    };

    const customFetch = useCallback(async (endpoint, options = {}) => {
        setIsSubmitting(true);
        let responseData;
        try {
            const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${ADMIN_TOKEN}`, ...options.headers };
            if (!(options.body instanceof FormData) && options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
                headers['Content-Type'] = 'application/json';
            }
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
            
            if (response.status === 204) { // No Content
                return { success: true, message: options.successMessage || 'Opération réussie.' };
            }

            try {
                responseData = await response.json();
            } catch (jsonError) {
                if (!response.ok) throw new Error(`HTTP error ${response.status} (non-JSON response)`);
                // If response is ok but not JSON (e.g. plain text success message), handle it if necessary
                responseData = { message: await response.text() }; // Or handle as appropriate
            }

            if (!response.ok) {
                const errorMsg = responseData?.message || responseData?.error || `Error ${response.status}`;
                const error = new Error(errorMsg);
                error.data = responseData;
                if (responseData?.errors) error.message = `Validation: ${Object.values(responseData.errors).flat().join(', ')}`;
                throw error;
            }
            return responseData || { success: true };
        } catch (error) {
            showAppNotification(error.message || 'Erreur API', 'error');
            console.error('API Error:', error.data || error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }, []); // ADMIN_TOKEN is read from localStorage on each call, so not a dependency here. showAppNotification could be, but its definition is stable.

    const fetchAllData = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const [absencesResponse, employeesResponse] = await Promise.all([
                customFetch('/admin/absences').catch(e => { console.error("Failed to fetch absences", e); return { data: [] }; }),
                customFetch('/employes').catch(e => { console.error("Failed to fetch employees", e); return { message: [] }; })
            ]);
            
            const absencesData = absencesResponse.data || absencesResponse; // Adapt based on actual structure
            const employeesData = employeesResponse.message || employeesResponse.data || employeesResponse; // Adapt

            const absencesArray = Array.isArray(absencesData) ? absencesData : [];
            const employeesArray = Array.isArray(employeesData) ? employeesData : [];
            
            setAbsences(absencesArray.map(abs => ({ 
                ...abs, 
                employeNom: abs.employe?.nom ? `${abs.employe.nom} ${abs.employe.prenom || ''}`.trim() : `ID: ${abs.employe_id}`,
                employeEmail: abs.employe?.email || ''
            })));
            setEmployees(employeesArray);

        } catch (error) {
            // error state is set by customFetch if one of the calls fully fails and throws
            if (!absences.length && !employees.length) {
                 setError("Impossible de charger les données initiales.");
                 showAppNotification("Impossible de charger les données initiales.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    }, [customFetch]); // customFetch is memoized

    useEffect(() => {
        if (ADMIN_TOKEN) {
            fetchAllData();
        } else {
            setError('Token administrateur non trouvé.');
            showAppNotification('Token administrateur non trouvé. Veuillez vous reconnecter.', 'error');
            setIsLoading(false);
        }
    }, [fetchAllData]); // fetchAllData is memoized, ADMIN_TOKEN is stable inside useEffect closure


    const handleFormChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (name === "justificatifFile") {
            setFormData(prev => ({ ...prev, justificatifFile: files[0] }));
        } else if (name === "justifiee") {
             setFormData(prev => ({...prev, justifiee: value === '' ? null : (value === 'true')}));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };


    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employe_id || !formData.date_debut || !formData.motif) {
            showAppNotification('Employé, Date de début et Motif sont requis.', 'warning'); return;
        }

        const dataToSend = new FormData();

        if (currentAbsence) { // Editing/Justifying
            const endpoint = `/admin/absences/${currentAbsence.id}/justification`;
            
            // For 'justifiee', send '1' for true, '0' for false. If null, it means 'pending'.
            // The backend API /validerJustification should define how to handle 'pending' (e.g. if 'justifiee' field is nullable or not sent)
            if (formData.justifiee !== null) {
                dataToSend.append('justifiee', formData.justifiee ? '1' : '0');
            } else {
                // If your backend expects 'justifiee' to be explicitly set to null or an empty string for pending, adjust here.
                // e.g., dataToSend.append('justifiee', ''); or don't append if it's implicitly pending.
                // For now, we only send '1' or '0'.
            }

            if (formData.justificatifFile) {
                dataToSend.append('justificatif', formData.justificatifFile);
            }
            dataToSend.append('_method', 'PUT'); // Laravel method spoofing for PUT via POST

            try {
                const response = await customFetch(endpoint, { method: 'POST', body: dataToSend, successMessage: 'Absence mise à jour avec succès!' });
                showAppNotification(response.message || 'Absence mise à jour!', 'success');
                fetchAllData();
                resetAndHideForm();
            } catch (error) { /* Handled by customFetch, notification shown there */ }

        } else { // Adding new absence
            const endpoint = '/admin/absences';
            dataToSend.append('employe_id', formData.employe_id);
            dataToSend.append('date_debut', formData.date_debut);
            if (formData.date_fin) dataToSend.append('date_fin', formData.date_fin);
            dataToSend.append('motif', formData.motif);
            // 'justifiee' and 'justificatif' are not typically sent when creating a new absence.
            // The backend 'ajouterAbsencePourEmploye' should handle defaults (e.g., justifiee = null).

            try {
                const response = await customFetch(endpoint, { method: 'POST', body: dataToSend, successMessage: 'Absence ajoutée avec succès!' });
                showAppNotification(response.message || 'Absence ajoutée!', 'success');
                fetchAllData();
                resetAndHideForm();
            } catch (error) { /* Handled by customFetch */ }
        }
    };
    
    const openEditForm = (absence) => {
        setCurrentAbsence(absence);
        setFormData({
            employe_id: absence.employe_id || '',
            date_debut: absence.date_debut ? formatDateForInput(absence.date_debut) : '',
            date_fin: absence.date_fin ? formatDateForInput(absence.date_fin) : '',
            motif: absence.motif || '',
            justifiee: absence.justifiee === 1 ? true : (absence.justifiee === 0 ? false : null), // Normalize to boolean or null
            justificatifFile: null
        });
        if (!showForm) {
            setShowForm(true);
            setTimeout(() => setFormAnimation(true), 50);
        } else {
            setFormAnimation(true);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetAndHideForm = () => {
        setFormAnimation(false);
        setTimeout(() => {
            setShowForm(false);
            setCurrentAbsence(null);
            setFormData({ employe_id: '', date_debut: '', date_fin: '', motif: '', justifiee: null, justificatifFile: null });
        }, 300);
    };

    const toggleAddForm = () => {
        if (showForm && !currentAbsence) {
            resetAndHideForm();
        } else {
            setCurrentAbsence(null);
            setFormData({ employe_id: '', date_debut: '', date_fin: '', motif: '', justifiee: null, justificatifFile: null }); // Reset for add
            setShowForm(true);
            setTimeout(() => setFormAnimation(true), 50);
            if (currentAbsence) window.scrollTo({ top: 0, behavior: 'smooth' }); // If was editing, scroll to top
        }
    };
    
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.split(' ')[0];
    };

    const handleSort = (field) => {
        const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
        setSortField(field); setSortDirection(newDirection);
    };

    const sortedAndFilteredAbsences = absences && absences.length > 0 ? [...absences]
    .filter(absence => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (absence.employeNom || '').toLowerCase().includes(searchTermLower) ||
        (absence.employeEmail || '').toLowerCase().includes(searchTermLower) ||
        (absence.motif || '').toLowerCase().includes(searchTermLower)
      );
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'justified') return matchesSearch && (absence.justifiee === true || absence.justifiee === 1);
      if (filterStatus === 'unjustified') return matchesSearch && (absence.justifiee === false || absence.justifiee === 0);
      if (filterStatus === 'pending') return matchesSearch && absence.justifiee === null; // Check for actual null
      return true; // Should be matchesSearch if not any specific status
    })
    .sort((a, b) => {
      let valA = a[sortField]; 
      let valB = b[sortField];

      if (sortField === 'employeNom') {
          valA = (a.employeNom || '').toLowerCase();
          valB = (b.employeNom || '').toLowerCase();
      } else if (sortField === 'date_debut' || sortField === 'date_fin') {
          valA = new Date(a[sortField] || 0); // Handle null dates for sorting
          valB = new Date(b[sortField] || 0);
          return sortDirection === 'asc' ? valA - valB : valB - valA;
      } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
      }
      if (typeof valB === 'string') {
          valB = valB.toLowerCase();
      }
      
      // Handle null or undefined for general comparison
      if (valA == null && valB != null) return sortDirection === 'asc' ? -1 : 1;
      if (valA != null && valB == null) return sortDirection === 'asc' ? 1 : -1;
      if (valA == null && valB == null) return 0;


      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }) : [];


    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
    
    const calculateDuration = (startDate, endDate) => {
        if (!startDate) return 'N/A';
        const start = new Date(startDate); 
        const end = endDate ? new Date(endDate) : new Date(startDate); // If no end date, duration is 1 day.
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Date invalide';
        if (end < start) return '1j'; // Or handle as error / show more descriptive text

        // Calculate difference in days, ensuring it's at least 1 day
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return (diffDays + 1) + 'j'; // Add 1 because it's inclusive
    };

    const stats = {
        total: absences.length,
        justified: absences.filter(a => a.justifiee === 1 || a.justifiee === true).length,
        unjustified: absences.filter(a => a.justifiee === 0 || a.justifiee === false).length, // Added for completeness
        pending: absences.filter(a => a.justifiee === null).length,
    };


    if (!ADMIN_TOKEN && !isLoading) {
        return (
          <div className="min-h-screen bg-[#F5EFEB] flex items-center justify-center p-4 md:p-6">
            <Notification show={notification.show} message={notification.message} type={notification.type} onDismiss={dismissNotification} />
            <div className="p-8 text-center text-red-600 bg-red-100 border border-red-300 rounded-lg shadow-md max-w-md w-full">
                <HelpCircle size={40} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-[#2F4156]">Accès non autorisé</h2>
                <p className="text-sm text-[#567C8D] mt-1">Token administrateur non trouvé. Veuillez vous connecter.</p>
            </div>
          </div>
        );
    }

    return (
    <div className="p-4 md:p-6 bg-[#F5EFEB] min-h-screen"> {/* Added page background and padding */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2F4156]">Gestion des Absences</h1>
        <p className="text-sm text-[#567C8D] mt-1">Suivez et gérez les absences des employés.</p>
      </div>

      <Notification show={notification.show} message={notification.message} type={notification.type} onDismiss={dismissNotification} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <input type="text" placeholder="Rechercher par nom, email, motif..."
                   className={`pl-10 pr-4 py-2.5 border border-[#C8D9E6] rounded-lg w-full sm:w-64 focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-sm bg-white ${inputClasses.replace('w-full p-2.5 shadow-sm', '')}`}
                   value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#567C8D]/80" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select className={`block w-full p-2.5 pr-10 appearance-none bg-white ${inputClasses.replace('shadow-sm', '')}`}
                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="justified">Justifiées</option>
              <option value="unjustified">Non justifiées</option>
              <option value="pending">En attente</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#567C8D]/80 pointer-events-none" />
          </div>
        </div>
        <button onClick={toggleAddForm}
                className={`flex items-center px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 w-full md:w-auto justify-center transform hover:scale-[1.02] active:scale-95 text-white font-medium text-sm ${showForm && !currentAbsence ? 'bg-red-500 hover:bg-red-600' : 'bg-[#567C8D] hover:bg-[#4A6582]'}`}>
          {showForm && !currentAbsence ? (<><X className="mr-2" size={18}/>Annuler Ajout</>) : (<><Plus className="mr-2" size={18}/>Ajouter Absence</>)}
        </button>
      </div>

      <SlideDown isVisible={showForm}>
        <div className={`bg-white border border-[#C8D9E6] rounded-xl shadow-xl p-6 md:p-8 mb-8 transition-opacity duration-300 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-xl font-semibold mb-6 text-[#2F4156] border-b border-[#C8D9E6] pb-3">
            {currentAbsence ? 'Gérer la Justification de l\'Absence' : 'Ajouter une Absence'}
          </h2>
          <form onSubmit={handleFormSubmit} encType="multipart/form-data"> {/* Always use multipart for simplicity if file might be involved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="employe_id" className="block text-sm font-medium text-[#2F4156] mb-1">Employé <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select id="employe_id" name="employe_id" value={formData.employe_id} onChange={handleFormChange} required className={`${inputClasses} appearance-none pr-8`} disabled={!!currentAbsence || isSubmitting || employees.length === 0}>
                    <option value="">Sélectionner un employé...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenom || ''}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#567C8D]/80 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="motif" className="block text-sm font-medium text-[#2F4156] mb-1">Motif <span className="text-red-500">*</span></label>
                <input id="motif" type="text" name="motif" value={formData.motif} onChange={handleFormChange} required className={inputClasses} placeholder="Ex: Maladie, Congé personnel" disabled={!!currentAbsence && !currentAbsence.can_edit_motif /* hypothetical */} />
              </div>
              <div>
                <label htmlFor="date_debut" className="block text-sm font-medium text-[#2F4156] mb-1">Date de début <span className="text-red-500">*</span></label>
                <input id="date_debut" type="date" name="date_debut" value={formData.date_debut} onChange={handleFormChange} required className={inputClasses} disabled={!!currentAbsence}/>
              </div>
              <div>
                <label htmlFor="date_fin" className="block text-sm font-medium text-[#2F4156] mb-1">Date de fin (optionnel)</label>
                <input id="date_fin" type="date" name="date_fin" value={formData.date_fin} onChange={handleFormChange} min={formData.date_debut} className={inputClasses} disabled={!!currentAbsence}/>
              </div>
              
              {currentAbsence && (
                <>
                  <div className="md:col-span-2">
                    <label htmlFor="justifiee" className="block text-sm font-medium text-[#2F4156] mb-1">Statut Justification</label>
                    <div className="relative">
                        <select id="justifiee" name="justifiee" value={formData.justifiee === null ? '' : String(formData.justifiee)} onChange={handleFormChange} className={`${inputClasses} appearance-none pr-8`} disabled={isSubmitting}>
                        <option value="">En attente</option>
                        <option value="true">Justifiée</option>
                        <option value="false">Non Justifiée</option>
                        </select>
                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#567C8D]/80 pointer-events-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="justificatifFile_input" className="block text-sm font-medium text-[#2F4156] mb-1">Fichier Justificatif (Optionnel: PDF, JPG, PNG)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#C8D9E6] border-dashed rounded-md hover:border-[#567C8D] transition-colors">
                        <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-10 w-10 text-[#567C8D]/80" />
                            <div className="flex text-sm text-[#567C8D]">
                            <label htmlFor="justificatifFile_input" className="relative cursor-pointer bg-white rounded-md font-medium text-[#2F4156] hover:text-[#567C8D] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#567C8D]">
                                <span>Télécharger un fichier</span>
                                <input id="justificatifFile_input" name="justificatifFile" type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFormChange} disabled={isSubmitting}/>
                            </label>
                            <p className="pl-1">ou glissez-déposez</p>
                            </div>
                            <p className="text-xs text-[#567C8D]/70">Max. 2MB</p>
                        </div>
                    </div>
                    {formData.justificatifFile && <p className="text-xs text-green-600 mt-1">Nouveau: {formData.justificatifFile.name}</p>}
                    {currentAbsence?.justificatif && (
                        <p className="text-xs text-[#567C8D] mt-1">Actuel: <a href={`${STORAGE_BASE_URL}/${currentAbsence.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-[#567C8D] hover:underline font-medium">{currentAbsence.justificatif.split('/').pop()}</a></p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#C8D9E6]">
              <button type="button" onClick={resetAndHideForm} className={buttonSecondaryClasses} disabled={isSubmitting}>
                <X size={16} className="mr-2" /> Annuler
              </button>
              <button type="submit" className={buttonPrimaryClasses} disabled={isSubmitting}>
                {isSubmitting ? <><Loader size={16} className="mr-2 animate-spin"/>Enregistrement...</> : <><Check size={16} className="mr-2"/>{currentAbsence ? 'Mettre à jour' : 'Enregistrer l\'Absence'}</>}
              </button>
            </div>
          </form>
        </div>
      </SlideDown>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Total des absences</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{stats.total}</p>
        </div>
         <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Justifiées</h3>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.justified}</p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Non Justifiées</h3>
          <p className="text-3xl font-bold text-red-600 mt-1">{stats.unjustified}</p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">En attente</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-[#C8D9E6] bg-[#F0F5F9]/80 px-5 py-3.5 flex justify-between items-center"> {/* Adjusted header background */}
          <h2 className="font-semibold text-[#2F4156]">Liste des Absences</h2>
          <button onClick={fetchAllData} disabled={isLoading || isSubmitting} className="p-1.5 rounded-md hover:bg-[#C8D9E6]/50 text-[#567C8D] transition-colors" title="Actualiser la liste">
            <RefreshCcw size={16} className={isLoading && !isSubmitting ? 'animate-spin' : ''}/>
          </button>
        </div>
        {isLoading ? ( <SkeletonLoaderAbsences /> )
        : error && sortedAndFilteredAbsences.length === 0 ? ( 
            <div className="p-12 text-center flex flex-col items-center">
                <HelpCircle size={40} className="text-red-500 mb-4" />
                <p className="text-xl font-medium text-[#2F4156]">{error}</p>
                <button onClick={fetchAllData} className={`mt-6 ${buttonPrimaryClasses}`}>
                    <RefreshCcw className="w-4 h-4 mr-2"/> Réessayer
                </button>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="text-xs text-[#2F4156] uppercase bg-[#E2E8F0]/60"> {/* Slightly adjusted header color */}
                <tr>
                  {[{label: 'Employé', field: 'employeNom'}, {label: 'Dates', field: 'date_debut'}, {label: 'Durée', field: 'duration', sortable: false, className: 'hidden sm:table-cell'}, {label: 'Motif', field: 'motif'}, {label: 'Statut', field: 'justifiee'}, {label: 'Impact Sal.', field: 'impact_salaire', sortable: false, className: 'hidden md:table-cell text-center'}, {label: 'Justificatif', field: 'justificatif', sortable: false, className: 'text-center'}].map(col => (
                    <th key={col.field || col.label}
                        className={`py-3 px-4 text-left font-semibold tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-[#C8D9E6]/70' : ''} transition-colors ${col.className || ''}`}
                        onClick={() => col.sortable !== false && handleSort(col.field)}>
                      <div className="flex items-center">
                        {col.label}
                        {col.sortable !== false && sortField === col.field && <ChevronDown className={`ml-1.5 w-3.5 h-3.5 text-[#567C8D] ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center font-semibold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C8D9E6]/70 text-sm">
                {sortedAndFilteredAbsences.length === 0 && !error ? (
                  <tr><td colSpan="8" className="px-4 py-12 text-center"><div className="flex flex-col items-center"><Search className="h-12 w-12 text-[#C8D9E6] mb-3" /><p className="text-lg font-medium text-[#2F4156]">Aucune absence trouvée</p><p className="text-sm text-[#567C8D]">Vérifiez les filtres ou ajoutez une nouvelle absence.</p></div></td></tr>
                ) : (
                  sortedAndFilteredAbsences.map((absence) => (
                    <tr key={absence.id} className="hover:bg-[#E2E8F0]/30 transition-colors"> {/* Adjusted hover color */}
                      <td className="py-3 px-4 text-[#2F4156] font-medium whitespace-nowrap">
                        {absence.employeNom || 'N/A'}
                        <div className="text-xs text-[#567C8D]">{absence.employeEmail || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-[#567C8D] whitespace-nowrap">{formatDate(absence.date_debut)}{absence.date_fin && absence.date_fin !== absence.date_debut ? ` - ${formatDate(absence.date_fin)}` : ''}</td>
                      <td className="py-3 px-4 text-[#567C8D] hidden sm:table-cell whitespace-nowrap">{calculateDuration(absence.date_debut, absence.date_fin)}</td>
                      <td className="py-3 px-4 text-[#2F4156] max-w-[180px] truncate" title={absence.motif}>{absence.motif || <span className="text-[#A0AEC0]">-</span>}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {absence.justifiee === 1 || absence.justifiee === true ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-300">Justifiée</span>
                         : (absence.justifiee === 0 || absence.justifiee === false) ? <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-300">Non Justifiée</span>
                         : <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-yellow-300">En attente</span>}
                      </td>
                      <td className="py-3 px-4 text-center hidden md:table-cell">
                        {absence.impact_salaire === 1 || absence.impact_salaire === true ? <span className="text-red-500 font-bold" title="Impact sur salaire">Oui</span> : <span className="text-green-500" title="Aucun impact">Non</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {absence.justificatif ? <a href={`${STORAGE_BASE_URL}/${absence.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-[#567C8D] hover:text-[#2F4156] inline-block p-1 hover:bg-slate-100 rounded-md" title="Voir justificatif"><FileText size={18}/></a> : <span className="text-[#A0AEC0]">-</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => openEditForm(absence)} className="p-1.5 text-[#567C8D] hover:text-[#2F4156] rounded-md hover:bg-[#C8D9E6]/40 transition-colors" title="Gérer Justification"><Edit size={16}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

       {!isLoading && sortedAndFilteredAbsences.length > 0 && (
        <div className="flex items-center justify-between mt-6 bg-white border border-[#C8D9E6] p-3 rounded-xl shadow-sm">
          <div className="text-sm text-[#567C8D]">
            Affichage de <span className="font-semibold text-[#2F4156]">{sortedAndFilteredAbsences.length}</span> sur <span className="font-semibold text-[#2F4156]">{absences.length}</span> absences.
          </div>
          {/* Pagination can be added here if needed */}
        </div>
      )}
    </div>
  );
}