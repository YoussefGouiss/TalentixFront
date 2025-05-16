// src/AbsenceAdmin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Search, ChevronDown, HelpCircle, Loader, FileText, Edit, UploadCloud, Plus, RefreshCcw, Filter, Calendar } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const STORAGE_BASE_URL = 'http://127.0.0.1:8000/storage';
const ADMIN_TOKEN = localStorage.getItem('admin_token');

// Re-using components from Employee.jsx or similar definitions if they are global
// For this example, I'll redefine them here for completeness, styled for Absences page.

const SlideDown = ({ isVisible, children }) => (
  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isVisible ? 'max-h-[1000px] opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}>
    {isVisible && children}
  </div>
);

const Notification = ({ show, message, type }) => (
  <div className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'} ${type === 'success' ? 'bg-[#567C8D] text-white border-l-4 border-[#2F4156]' : 'bg-red-500 text-white border-l-4 border-red-700'}`}>
    <div className="flex items-center"><span className="text-sm font-medium">{message}</span></div>
  </div>
);

const SkeletonLoaderAbsences = () => ( // Specific Skeleton for Absences
    <div className="animate-pulse p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-3.5 border-b border-[#C8D9E6]/40">
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/5"></div> {/* Employé */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/5"></div> {/* Dates */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/6 hidden sm:block"></div> {/* Durée */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/4"></div> {/* Motif */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/6"></div> {/* Statut */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/6 hidden md:block"></div> {/* Impact */}
          <div className="h-8 bg-[#C8D9E6]/80 rounded w-24"></div> {/* Actions */}
        </div>
      ))}
    </div>
);


export default function AbsenceAdmin() {
    const [absences, setAbsences] = useState([]);
    const [employees, setEmployees] = useState([]); // For employee dropdown in form
    const [isLoading, setIsLoading] = useState(true); // For initial data fetch
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submissions (add/edit)
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formAnimation, setFormAnimation] = useState(false); // For inner form opacity transition

    // Add/Edit Form state
    const [currentAbsence, setCurrentAbsence] = useState(null); // For editing
    const [formData, setFormData] = useState({
        employe_id: '', date_debut: '', date_fin: '', motif: '', justifiee: null, justificatifFile: null
    });

    // UI states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('date_debut');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('all');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const inputClasses = "w-full p-2.5 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] sm:text-sm text-[#2F4156] bg-white placeholder-[#567C8D]/70 transition-colors duration-150 disabled:bg-gray-100/50 disabled:cursor-not-allowed";
    const buttonPrimaryClasses = `px-5 py-2.5 bg-[#2F4156] text-white font-semibold rounded-md shadow-md hover:bg-[#3b5068] focus:outline-none focus:ring-2 focus:ring-[#567C8D] focus:ring-opacity-70 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center text-sm`;
    const buttonSecondaryClasses = "px-4 py-2.5 bg-[#C8D9E6]/60 text-[#2F4156] font-semibold rounded-md shadow-sm hover:bg-[#C8D9E6] focus:outline-none focus:ring-2 focus:ring-[#567C8D] focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 text-sm";


    const customFetch = useCallback(async (endpoint, options = {}) => { /* ... (same as before) ... */
        setIsSubmitting(true); // Use isSubmitting for active API calls
        let responseData;
        try {
            const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${ADMIN_TOKEN}`, ...options.headers };
            if (!(options.body instanceof FormData) && options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
                headers['Content-Type'] = 'application/json';
            }
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
            try {
                responseData = await response.json();
            } catch (jsonError) {
                if (!response.ok && response.status !== 204) throw new Error(`HTTP error ${response.status} (non-JSON)`);
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
            setNotification({ text: error.message || 'API Error', type: 'error', show: true });
            console.error('API Error:', error.data || error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const [absencesData, employeesData] = await Promise.all([
                customFetch('/admin/absences').catch(e => { console.error("Failed to fetch absences", e); return []; }), // Allow partial success
                customFetch('/employes').catch(e => { console.error("Failed to fetch employees", e); return []; })      // Fetch all employees for dropdown
            ]);

            const absencesArray = Array.isArray(absencesData) ? absencesData : (Array.isArray(absencesData.data) ? absencesData.data : []);
            const employeesArray = Array.isArray(employeesData) ? employeesData : (Array.isArray(employeesData.message) ? employeesData.message : []);
            
            setAbsences(absencesArray.map(abs => ({ ...abs, employeNom: abs.employe?.nom || `ID: ${abs.employe_id}` })));
            setEmployees(employeesArray);

        } catch (error) {
            // error state is set by customFetch if one of the calls fully fails and throws
            // If partial failure, console logs above.
            if (!absences.length && !employees.length) { // If both fail, set a general error
                 setError("Impossible de charger les données initiales.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [customFetch]); // Removed absences and employees from dependency array

    useEffect(() => {
        if (ADMIN_TOKEN) {
            fetchAllData();
        } else {
            setError('Token administrateur non trouvé.');
            setIsLoading(false);
        }
    }, []); // Removed fetchAllData from dependency array to prevent re-fetch loops

    const handleFormChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (name === "justificatifFile") {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const showAppNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3500);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employe_id || !formData.date_debut || !formData.motif) {
            showAppNotification('Employé, Date de début et Motif sont requis.', 'error'); return;
        }

        const dataToSend = new FormData();
        dataToSend.append('employe_id', formData.employe_id);
        dataToSend.append('date_debut', formData.date_debut);
        if (formData.date_fin) dataToSend.append('date_fin', formData.date_fin);
        dataToSend.append('motif', formData.motif);
        // For edit, backend needs to know if 'justifiee' is being set
        if (currentAbsence) { // If editing
            dataToSend.append('justifiee', formData.justifiee ? '1' : '0'); // Send as 1 or 0
            if (formData.justificatifFile) {
                dataToSend.append('justificatif', formData.justificatifFile);
            }
            dataToSend.append('_method', 'PUT'); // Method spoofing for Laravel
        }


        const endpoint = currentAbsence ? `/admin/absences/${currentAbsence.id}` : '/admin/absences';
        // For FormData with PUT, actual method is POST with _method field
        const method = currentAbsence ? 'POST' : 'POST';


        try {
            const response = await customFetch(endpoint, { method, body: dataToSend });
            showAppNotification(response.message || `Absence ${currentAbsence ? 'mise à jour' : 'ajoutée'}!`, 'success');
            fetchAllData(); // Re-fetch all data to reflect changes
            resetAndHideForm();
        } catch (error) { /* Handled by customFetch */ }
    };
    
    const openEditForm = (absence) => {
        setCurrentAbsence(absence);
        setFormData({
            employe_id: absence.employe_id || '',
            date_debut: absence.date_debut ? formatDateForInput(absence.date_debut) : '',
            date_fin: absence.date_fin ? formatDateForInput(absence.date_fin) : '',
            motif: absence.motif || '',
            justifiee: absence.justifiee === 1 || absence.justifiee === true, // Normalize to boolean
            justificatifFile: null // Reset file
        });
        if (!showForm) {
            setShowForm(true);
            setTimeout(() => setFormAnimation(true), 50);
        } else {
            setFormAnimation(true); // If form already open, ensure it's visible
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
        if (showForm && !currentAbsence) { // If add form is open
            resetAndHideForm();
        } else { // Open add form
            setCurrentAbsence(null); // Ensure we are in "add" mode
            setFormData({ employe_id: '', date_debut: '', date_fin: '', motif: '', justifiee: null, justificatifFile: null });
            setShowForm(true);
            setTimeout(() => setFormAnimation(true), 50);
        }
    };
    
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        // Assuming dateString is YYYY-MM-DD HH:MM:SS or similar, extract YYYY-MM-DD
        return dateString.split(' ')[0];
    };

    const handleSort = (field) => { /* ... (same logic as before) ... */
        const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
        setSortField(field); setSortDirection(newDirection);
    };
    const sortedAndFilteredAbsences = absences && absences.length > 0 ? [...absences] /* ... (same sort/filter logic as before) ... */
    .filter(absence => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (absence.employe?.nom || absence.employeNom || '').toLowerCase().includes(searchTermLower) ||
        (absence.employe?.email || '').toLowerCase().includes(searchTermLower) ||
        (absence.motif || '').toLowerCase().includes(searchTermLower)
      );
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'justified') return matchesSearch && (absence.justifiee === true || absence.justifiee === 1);
      if (filterStatus === 'unjustified') return matchesSearch && (absence.justifiee === false || absence.justifiee === 0);
      if (filterStatus === 'pending') return matchesSearch && absence.justifiee === null;
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortField]; let valB = b[sortField];
      if (sortField === 'employeNom') { // Special handling for nested field
          valA = (a.employe?.nom || '').toLowerCase();
          valB = (b.employe?.nom || '').toLowerCase();
      } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
      }
      if (typeof valB === 'string') {
          valB = valB.toLowerCase();
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }) : [];


    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
    const calculateDuration = (startDate, endDate) => { /* ... (same as before) ... */
        if (!startDate) return 'N/A';
        const start = new Date(startDate); const end = endDate ? new Date(endDate) : start;
        if (end < start) return 1; // Or handle as error
        return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };
    const stats = {
        total: absences.length,
        justified: absences.filter(a => a.justifiee === 1 || a.justifiee === true).length,
        pending: absences.filter(a => a.justifiee === null).length,
    };


    if (!ADMIN_TOKEN && !isLoading) {
        return (
          <div className="p-12 text-center flex flex-col items-center">
            <HelpCircle size={40} className="text-red-500 mb-4" />
            <p className="text-xl font-medium text-[#2F4156]">Accès non autorisé</p>
            <p className="text-[#567C8D] mt-2">Token administrateur non trouvé. Veuillez vous connecter.</p>
          </div>
        );
    }

    return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2F4156]">Gestion des Absences</h1>
        <p className="text-sm text-[#567C8D] mt-1">Suivez et gérez les absences des employés.</p>
      </div>

      <Notification show={notification.show} message={notification.message} type={notification.type} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <input type="text" placeholder="Rechercher..."
                   className={`pl-10 pr-4 py-2.5 border border-[#C8D9E6] rounded-lg w-full sm:w-64 focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-sm ${inputClasses.replace('w-full p-2.5', '')}`}
                   value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#567C8D]/80" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select className={`block w-full p-2.5 pr-10 appearance-none ${inputClasses.replace('shadow-sm', '')}`}
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
            {currentAbsence ? 'Modifier l\'Absence' : 'Ajouter une Absence'}
          </h2>
          <form onSubmit={handleFormSubmit} encType={currentAbsence ? "multipart/form-data" : undefined}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="employe_id" className="block text-sm font-medium text-[#2F4156] mb-1">Employé <span className="text-red-500">*</span></label>
                <div className="relative">
                    <select id="employe_id" name="employe_id" value={formData.employe_id} onChange={handleFormChange} required className={`${inputClasses} appearance-none pr-8`}>
                    <option value="">Sélectionner un employé...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenom || ''}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#567C8D]/80 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="motif" className="block text-sm font-medium text-[#2F4156] mb-1">Motif <span className="text-red-500">*</span></label>
                <input id="motif" type="text" name="motif" value={formData.motif} onChange={handleFormChange} required className={inputClasses} placeholder="Ex: Maladie, Congé personnel"/>
              </div>
              <div>
                <label htmlFor="date_debut" className="block text-sm font-medium text-[#2F4156] mb-1">Date de début <span className="text-red-500">*</span></label>
                <input id="date_debut" type="date" name="date_debut" value={formData.date_debut} onChange={handleFormChange} required className={inputClasses}/>
              </div>
              <div>
                <label htmlFor="date_fin" className="block text-sm font-medium text-[#2F4156] mb-1">Date de fin (optionnel)</label>
                <input id="date_fin" type="date" name="date_fin" value={formData.date_fin} onChange={handleFormChange} min={formData.date_debut} className={inputClasses}/>
              </div>
              {currentAbsence && ( // Fields for editing only
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#2F4156] mb-1">Statut Justification</label>
                    <div className="relative">
                        <select name="justifiee" value={formData.justifiee === null ? '' : String(formData.justifiee)} onChange={(e) => setFormData(prev => ({...prev, justifiee: e.target.value === '' ? null : e.target.value === 'true'}))} className={`${inputClasses} appearance-none pr-8`}>
                        <option value="">En attente</option>
                        <option value="true">Justifiée</option>
                        <option value="false">Non Justifiée</option>
                        </select>
                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#567C8D]/80 pointer-events-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="justificatifFile" className="block text-sm font-medium text-[#2F4156] mb-1">Fichier Justificatif (PDF, JPG, PNG)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#C8D9E6] border-dashed rounded-md hover:border-[#567C8D] transition-colors">
                        <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-10 w-10 text-[#567C8D]/80" />
                            <div className="flex text-sm text-[#567C8D]">
                            <label htmlFor="justificatifFile_input" className="relative cursor-pointer bg-white rounded-md font-medium text-[#2F4156] hover:text-[#567C8D] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#567C8D]">
                                <span>Télécharger un fichier</span>
                                <input id="justificatifFile_input" name="justificatifFile" type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFormChange} />
                            </label>
                            <p className="pl-1">ou glissez-déposez</p>
                            </div>
                            <p className="text-xs text-[#567C8D]/70">Max. 2MB</p>
                        </div>
                    </div>
                    {formData.justificatifFile && <p className="text-xs text-green-600 mt-1">Fichier: {formData.justificatifFile.name}</p>}
                    {currentAbsence?.justificatif && !formData.justificatifFile && (
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
                {isSubmitting ? <><Loader size={16} className="mr-2 animate-spin"/>Enregistrement...</> : <><Check size={16} className="mr-2"/>{currentAbsence ? 'Mettre à jour' : 'Enregistrer'}</>}
              </button>
            </div>
          </form>
        </div>
      </SlideDown>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* ... Stats Cards (Same Theming) ... */}
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Total des absences</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">En attente</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Justifiées</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{stats.justified}</p>
        </div>
      </div>

      <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-5 py-3.5">
          <h2 className="font-semibold text-[#2F4156]">Liste des Absences</h2>
        </div>
        {isLoading ? ( <SkeletonLoaderAbsences /> )
        : error ? ( /* Error Display */
            <div className="p-12 text-center flex flex-col items-center">
                <HelpCircle size={40} className="text-red-500 mb-4" />
                <p className="text-xl font-medium text-[#2F4156]">{error}</p>
                <button onClick={fetchAllData} className={`mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium flex items-center`}>
                    <RefreshCcw className="w-4 h-4 mr-2"/> Réessayer
                </button>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="text-xs text-[#2F4156] uppercase bg-[#C8D9E6]/40">
                <tr>
                  {[{label: 'Employé', field: 'employeNom'}, {label: 'Dates', field: 'date_debut'}, {label: 'Durée', field: 'duration', sortable: false}, {label: 'Motif', field: 'motif'}, {label: 'Statut', field: 'justifiee', sortable: false}, {label: 'Impact Sal.', field: 'impact_salaire', sortable: false}, {label: 'Justificatif', field: 'justificatif', sortable: false}].map(col => (
                    <th key={col.field || col.label}
                        className={`py-3 px-4 text-left font-semibold tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-[#C8D9E6]/70' : ''} transition-colors
                                   ${['Durée', 'Impact Sal.', 'Justificatif'].includes(col.label) ? 'hidden sm:table-cell' : ''}
                                   ${col.label === 'Impact Sal.' ? 'hidden md:table-cell' : ''}`}
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
                {sortedAndFilteredAbsences.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-12 text-center"><div className="flex flex-col items-center"><Search className="h-12 w-12 text-[#C8D9E6] mb-3" /><p className="text-lg font-medium text-[#2F4156]">Aucune absence</p><p className="text-sm text-[#567C8D]">Vérifiez les filtres.</p></div></td></tr>
                ) : (
                  sortedAndFilteredAbsences.map((absence) => (
                    <tr key={absence.id} className="hover:bg-[#C8D9E6]/20 transition-colors">
                      <td className="py-3 px-4 text-[#2F4156] font-medium whitespace-nowrap">
                        {absence.employeNom || 'N/A'}
                        <div className="text-xs text-[#567C8D]">{absence.employeEmail || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-[#567C8D] whitespace-nowrap">{formatDate(absence.date_debut)}{absence.date_fin && absence.date_fin !== absence.date_debut ? ` - ${formatDate(absence.date_fin)}` : ''}</td>
                      <td className="py-3 px-4 text-[#567C8D] hidden sm:table-cell whitespace-nowrap">{calculateDuration(absence.date_debut, absence.date_fin)}j</td>
                      <td className="py-3 px-4 text-[#2F4156] max-w-[200px] truncate" title={absence.motif}>{absence.motif || <span className="text-[#C8D9E6]/80">-</span>}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {absence.justifiee === 1 || absence.justifiee === true ? <span className="bg-[#567C8D]/20 text-[#2F4156] text-xs font-semibold px-2.5 py-1 rounded-full">Justifiée</span>
                         : (absence.justifiee === 0 || absence.justifiee === false) ? <span className="bg-red-500/10 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Non Justifiée</span>
                         : <span className="bg-yellow-500/10 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">En attente</span>}
                      </td>
                      <td className="py-3 px-4 text-center hidden md:table-cell">
                        {absence.impact_salaire ? <span className="text-red-500 font-bold text-lg" title="Impact sur salaire">!</span> : <span className="text-green-500 font-bold text-lg" title="Aucun impact">✓</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {absence.justificatif ? <a href={`${STORAGE_BASE_URL}/${absence.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-[#567C8D] hover:text-[#2F4156]"><FileText size={18} className="inline-block"/></a> : <span className="text-[#C8D9E6]/80">-</span>}
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
        <div className="flex items-center justify-between mt-6 bg-white border border-[#C8D9E6] p-4 rounded-xl shadow-sm">
          <div className="text-sm text-[#567C8D]">
            Affichage de <span className="font-semibold text-[#2F4156]">{sortedAndFilteredAbsences.length}</span> sur <span className="font-semibold text-[#2F4156]">{absences.length}</span> absences
          </div>
          {/* Basic pagination example */}
          <div className="flex space-x-1">
            <button className="px-3 py-1.5 bg-white border border-[#C8D9E6] rounded-md text-xs font-medium text-[#567C8D] hover:bg-[#C8D9E6]/30 disabled:opacity-50" disabled>Précédent</button>
            <button className="px-3 py-1.5 bg-[#567C8D] border border-[#567C8D] rounded-md text-xs font-medium text-white">1</button>
            <button className="px-3 py-1.5 bg-white border border-[#C8D9E6] rounded-md text-xs font-medium text-[#567C8D] hover:bg-[#C8D9E6]/30 disabled:opacity-50" disabled>Suivant</button>
          </div>
        </div>
      )}
    </>
  );
}