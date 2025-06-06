
import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaPlus, FaEdit, FaTrashAlt, FaTimesCircle, FaCheckCircle, 
    FaExclamationTriangle, FaSpinner, FaPaperclip, FaCalendarAlt
} from 'react-icons/fa';

// --- Notification Component ---
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


// --- API Configuration ---
const API_BASE_URL = 'http://localhost:8000/api';
const STORAGE_BASE_URL = 'http://localhost:8000/storage';
const EMPLOYE_TOKEN_KEY = 'employe_token';

// --- Main Component ---
const AbsenceEmploye = () => {
    const [myAbsences, setMyAbsences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [notification, setNotificationState] = useState({ text: '', type: '', show: false });

    const [showDemandeModal, setShowDemandeModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [currentAbsenceToEdit, setCurrentAbsenceToEdit] = useState(null);
    const [absenceToDelete, setAbsenceToDelete] = useState(null);

    const [demandeDateDebut, setDemandeDateDebut] = useState('');
    const [demandeDateFin, setDemandeDateFin] = useState('');
    const [demandeMotif, setDemandeMotif] = useState('');
    const [demandeJustificatifFile, setDemandeJustificatifFile] = useState(null);

    const [editDateDebut, setEditDateDebut] = useState('');
    const [editDateFin, setEditDateFin] = useState('');
    const [editMotif, setEditMotif] = useState('');
    const [editJustificatifFile, setEditJustificatifFile] = useState(null);

    const showAppNotification = (text, type = 'success', duration = 4000) => {
        setNotificationState({ text, type, show: true });
        setTimeout(() => {
            setNotificationState(prev => ({ ...prev, show: false }));
        }, duration);
    };
    
    const customFetch = useCallback(async (endpoint, options = {}) => {
        const formAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase());
        if (formAction) setIsSubmitting(true); else setLoading(true);

        let responseData;
        const token = localStorage.getItem(EMPLOYE_TOKEN_KEY);
        if (!token) {
            showAppNotification('Authentification requise. Veuillez vous reconnecter.', 'error');
            if (formAction) setIsSubmitting(false); else setLoading(false);
            throw new Error('Token non trouvé');
        }

        try {
            const headers = {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            };
            if (!(options.body instanceof FormData) && options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
                if (options.body) headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

            if (response.status === 204 && options.method?.toUpperCase() === 'DELETE') {
                if (formAction) setIsSubmitting(false); else setLoading(false);
                return { message: 'Suppression réussie.' };
            }
            
            responseData = await response.json().catch(() => {
                if (!response.ok) throw new Error(`Erreur HTTP ${response.status} - Réponse non-JSON.`);
                return null;
            });

            if (!response.ok) {
                const errorMsg = responseData?.message || `Erreur: ${response.status}`;
                const error = new Error(errorMsg);
                error.data = responseData;
                if (responseData?.errors) {
                    error.message = `Validation échouée: ${Object.values(responseData.errors).flat().join(', ')}`;
                }
                throw error;
            }
            return responseData;
        } catch (error) {
            showAppNotification(error.message || 'Une erreur API est survenue.', 'error');
            throw error;
        } finally {
            if (formAction) setIsSubmitting(false); else setLoading(false);
        }
    }, []);


    const fetchMesAbsences = useCallback(async () => {
        try {
            const data = await customFetch('/employe/absences');
            setMyAbsences(Array.isArray(data) ? data : []);
            if (!Array.isArray(data) && data !== null){
                 showAppNotification('Format inattendu pour les données d\'absences.', 'warning');
            }
        } catch (error) {
            setMyAbsences([]);
        }
    }, [customFetch]);

    useEffect(() => {
        const token = localStorage.getItem(EMPLOYE_TOKEN_KEY);
        if (token) {
            fetchMesAbsences();
        } else {
            // The component will render the "Token non trouvé" message below.
        }
    }, [fetchMesAbsences]);

    const handleDemandeAbsenceSubmit = async (e) => {
        e.preventDefault();
        if (!demandeDateDebut || !demandeMotif) {
            showAppNotification('Date de début et Motif sont requis.', 'warning');
            return;
        }
        if (demandeDateFin && new Date(demandeDateFin) < new Date(demandeDateDebut)) {
            showAppNotification('La date de fin ne peut pas être antérieure à la date de début.', 'warning');
            return;
        }

        const formDataPayload = new FormData();
        formDataPayload.append('date_debut', demandeDateDebut);
        if (demandeDateFin) formDataPayload.append('date_fin', demandeDateFin);
        formDataPayload.append('motif', demandeMotif);
        if (demandeJustificatifFile) {
            formDataPayload.append('justificatif', demandeJustificatifFile);
        }

        try {
            const response = await customFetch('/employe/absences', {
                method: 'POST',
                body: formDataPayload,
            });
            showAppNotification(response.message || 'Demande d\'absence envoyée.', 'success');
            fetchMesAbsences();
            setShowDemandeModal(false);
            setDemandeDateDebut(''); setDemandeDateFin(''); setDemandeMotif(''); setDemandeJustificatifFile(null);
            const fileInput = document.getElementById('demandeJustificatifFile');
            if (fileInput) fileInput.value = null;
        } catch (error) { /* Handled by customFetch */ }
    };

    const openEditModal = (absence) => {
        setCurrentAbsenceToEdit(absence);
        setEditDateDebut(absence.date_debut.split('T')[0]);
        setEditDateFin(absence.date_fin ? absence.date_fin.split('T')[0] : '');
        setEditMotif(absence.motif);
        setEditJustificatifFile(null);
        setShowEditModal(true);
    };

    const handleUpdateAbsenceSubmit = async (e) => {
        e.preventDefault();
        if (!currentAbsenceToEdit || !editDateDebut || !editMotif) {
            showAppNotification('Date de début et Motif sont requis pour la mise à jour.', 'warning');
            return;
        }
        if (editDateFin && new Date(editDateFin) < new Date(editDateDebut)) {
            showAppNotification('La date de fin ne peut pas être antérieure à la date de début.', 'warning');
            return;
        }

        const formDataPayload = new FormData();
        formDataPayload.append('date_debut', editDateDebut);
        if (editDateFin) formDataPayload.append('date_fin', editDateFin);
        formDataPayload.append('motif', editMotif);
        if (editJustificatifFile) {
            formDataPayload.append('justificatif', editJustificatifFile);
        }
        formDataPayload.append('_method', 'PUT'); // For Laravel to recognize as PUT

        try {
            const response = await customFetch(`/employe/absences/${currentAbsenceToEdit.id}`, {
                method: 'POST', 
                body: formDataPayload,
            });
            showAppNotification(response.message || 'Demande mise à jour.', 'success');
            fetchMesAbsences();
            setShowEditModal(false);
        } catch (error) { /* Handled by customFetch */ }
    };

    const openDeleteConfirmModal = (absence) => {
        setAbsenceToDelete(absence);
        setShowDeleteConfirmModal(true);
    };

    const handleDeleteAbsence = async () => {
        if (!absenceToDelete) return;
        try {
            const response = await customFetch(`/employe/absences/${absenceToDelete.id}`, { method: 'DELETE' });
            showAppNotification(response.message || 'Demande supprimée.', 'success');
            fetchMesAbsences();
            setShowDeleteConfirmModal(false);
            setAbsenceToDelete(null);
        } catch (error) {
            setShowDeleteConfirmModal(false);
        }
    };

    const canModifyOrDelete = (createdAtString, statutAdmin) => {
        if (statutAdmin && statutAdmin !== 'en_attente') return false;
        if (!createdAtString) return true;
        const createdAt = new Date(createdAtString);
        const now = new Date();
        const diffInMilliseconds = now - createdAt;
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
        return diffInHours <= 48;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-CA');
    };
    
    const inputClasses = "w-full p-2.5 border border-[#C8D9E6] rounded-md focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-colors outline-none text-[#2F4156] bg-white text-sm";
    const buttonPrimaryClasses = "flex items-center justify-center px-4 py-2 bg-[#567C8D] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-[#4A6582] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
    const buttonSecondaryClasses = "flex items-center justify-center px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] text-sm font-medium rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed";
    const buttonDangerClasses = "flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
    
    const modalOverlayClasses = "fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[900] p-4";
    const modalContentClasses = "bg-white border border-[#C8D9E6] rounded-xl shadow-xl w-full max-w-lg p-6 transform transition-all max-h-[90vh] overflow-y-auto";
    const fileInputClasses = "block w-full text-sm text-[#567C8D] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#E2E8F0] file:text-[#2F4156] hover:file:bg-[#CBD5E1] focus:outline-none";

    const getAbsenceStatusBadge = (statutAdmin, justifiee) => {
        if (statutAdmin === 'validee') {
            return <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded-full">Validée</span>;
        }
        if (statutAdmin === 'rejetee') {
            return <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 rounded-full">Rejetée</span>;
        }
        if (justifiee) {
             return <span className="px-2.5 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-full">En attente (Justifiée)</span>;
        }
        return <span className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-full">En attente (Non Just.)</span>;
    };

    if (!localStorage.getItem(EMPLOYE_TOKEN_KEY)) {
        return (
            <div className="min-h-screen bg-[#F5EFEB] flex items-center justify-center p-4 md:p-6">
                <Notification 
                    show={notification.show} 
                    message={notification.text} 
                    type={notification.type}
                    onDismiss={() => setNotificationState(prev => ({ ...prev, show: false }))} 
                />
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
            <Notification 
                show={notification.show} 
                message={notification.text} 
                type={notification.type}
                onDismiss={() => setNotificationState(prev => ({ ...prev, show: false }))} 
            />

            <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
                {/* Removed max-w-*, mx-auto. Relies on px-* for side margins. */}
                <header className="px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#2F4156]">Mes Demandes d'Absence</h1>
                </header>
            </div>

            {/* Removed max-w-*, mx-auto. Relies on px-* for side margins. */}
            <main className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 text-right">
                    <button onClick={() => setShowDemandeModal(true)} className={buttonPrimaryClasses}>
                        <FaPlus size={16} className="mr-2"/> Demander une Absence
                    </button>
                </div>

                {/* Demande Absence Modal - Stays the same (fixed, centered) */}
                {showDemandeModal && (
                    <div className={modalOverlayClasses}>
                        <div className={modalContentClasses}>
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#C8D9E6]">
                                <h3 className="text-xl font-semibold text-[#2F4156]">Nouvelle Demande d'Absence</h3>
                                <button onClick={() => setShowDemandeModal(false)} className="text-[#567C8D] hover:text-[#2F4156]">
                                <FaTimesCircle size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleDemandeAbsenceSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Date de début <span className="text-red-500">*</span></label>
                                    <input type="date" value={demandeDateDebut} onChange={(e) => setDemandeDateDebut(e.target.value)} required className={inputClasses} min={new Date().toISOString().split("T")[0]} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Date de fin (optionnel)</label>
                                    <input type="date" value={demandeDateFin} onChange={(e) => setDemandeDateFin(e.target.value)} className={inputClasses} min={demandeDateDebut || new Date().toISOString().split("T")[0]} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Motif <span className="text-red-500">*</span></label>
                                    <textarea value={demandeMotif} onChange={(e) => setDemandeMotif(e.target.value)} required className={`${inputClasses} min-h-[80px]`} placeholder="Motif de votre absence"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Justificatif (PDF, JPG, PNG)</label>
                                    <input id="demandeJustificatifFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDemandeJustificatifFile(e.target.files[0])} className={fileInputClasses}/>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowDemandeModal(false)} className={buttonSecondaryClasses} disabled={isSubmitting}>Annuler</button>
                                    <button type="submit" className={buttonPrimaryClasses} disabled={isSubmitting}>
                                        {isSubmitting ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaCheckCircle size={18} className="mr-2" />}
                                        Envoyer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Absence Modal - Stays the same */}
                {showEditModal && currentAbsenceToEdit && (
                        <div className={modalOverlayClasses}>
                        <div className={modalContentClasses}>
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#C8D9E6]">
                                <h3 className="text-xl font-semibold text-[#2F4156]">Modifier ma Demande</h3>
                                <button onClick={() => setShowEditModal(false)} className="text-[#567C8D] hover:text-[#2F4156]">
                                <FaTimesCircle size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateAbsenceSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Date de début <span className="text-red-500">*</span></label>
                                    <input type="date" value={editDateDebut} onChange={(e) => setEditDateDebut(e.target.value)} required className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Date de fin (optionnel)</label>
                                    <input type="date" value={editDateFin} onChange={(e) => setEditDateFin(e.target.value)} className={inputClasses} min={editDateDebut}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Motif <span className="text-red-500">*</span></label>
                                    <textarea value={editMotif} onChange={(e) => setEditMotif(e.target.value)} required className={`${inputClasses} min-h-[80px]`} placeholder="Motif de votre absence"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#567C8D] mb-1">Justificatif (Remplacer)</label>
                                    <input id="editJustificatifFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setEditJustificatifFile(e.target.files[0])} className={fileInputClasses} />
                                    {currentAbsenceToEdit.justificatif && !editJustificatifFile && (
                                        <p className="text-xs text-[#567C8D] mt-1">
                                            Actuel: <a href={`${STORAGE_BASE_URL}/${currentAbsenceToEdit.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-[#567C8D] hover:underline hover:text-[#2F4156]">{currentAbsenceToEdit.justificatif.split('/').pop()}</a>
                                        </p>
                                    )}
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowEditModal(false)} className={buttonSecondaryClasses} disabled={isSubmitting}>Annuler</button>
                                    <button type="submit" className={buttonPrimaryClasses} disabled={isSubmitting}>
                                        {isSubmitting ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaCheckCircle size={18} className="mr-2" />}
                                        Mettre à Jour
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal - Stays the same */}
                {showDeleteConfirmModal && absenceToDelete && (
                    <div className={modalOverlayClasses}>
                        <div className={modalContentClasses}>
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#C8D9E6]">
                                <h3 className="text-xl font-semibold text-[#2F4156]">Confirmer la Suppression</h3>
                                <button onClick={() => setShowDeleteConfirmModal(false)} className="text-[#567C8D] hover:text-[#2F4156]">
                                <FaTimesCircle size={24} />
                                </button>
                            </div>
                            <p className="text-sm text-[#567C8D] mb-6">
                                Êtes-vous sûr de vouloir supprimer cette demande du <span className="font-semibold text-[#2F4156]">{formatDate(absenceToDelete.date_debut)}</span>
                                {absenceToDelete.date_fin && ` au ${formatDate(absenceToDelete.date_fin)}`} ?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowDeleteConfirmModal(false)} className={buttonSecondaryClasses} disabled={isSubmitting}>
                                    Annuler
                                </button>
                                <button onClick={handleDeleteAbsence} className={buttonDangerClasses} disabled={isSubmitting}>
                                    {isSubmitting ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaTrashAlt size={16} className="mr-2" />}
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* This div will now expand to full width (minus main's padding) */}
                <div className="mt-8 bg-white border border-[#C8D9E6] rounded-lg shadow-xl overflow-hidden"> {/* Added shadow-xl for more emphasis */}
                        {loading && !isSubmitting && myAbsences.length === 0 && (
                        <div className="p-6 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                            <div key={i} className="grid grid-cols-4 sm:grid-cols-8 gap-4 py-4 border-b border-[#C8D9E6]/40 items-center">
                                {[...Array(7)].map((_,j) => <div key={j} className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div>)}
                                <div className="h-8 bg-[#C8D9E6]/70 rounded w-full col-span-1 flex gap-1 p-1">
                                    <div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div><div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                    {!loading && myAbsences.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center">
                            <FaCalendarAlt size={48} className="mx-auto text-[#A0B9CD] mb-5" />
                            <p className="text-xl font-medium text-[#2F4156]">Aucune demande d'absence.</p>
                            <p className="text-[#567C8D] mt-2">Vous n'avez pas encore soumis de demande d'absence.</p>
                        </div>
                    )}
                    {myAbsences.length > 0 && (
                    <div className="overflow-x-auto"> {/* This handles horizontal scroll if content is too wide */}
                        <table className="min-w-full"> {/* Ensures table tries to fill its container */}
                            <thead className="bg-[#C8D9E6]/30">
                                <tr>

                                    <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-[#2F4156] uppercase tracking-wider">Début</th>
                                    <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-[#2F4156] uppercase tracking-wider">Fin</th>
                                    {/* Increased max-width for Motif to max-w-lg */}
                                    <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-[#2F4156] uppercase tracking-wider hidden md:table-cell">Motif</th>
                                    <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-[#2F4156] uppercase tracking-wider">Justif.</th>
                                    <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-[#2F4156] uppercase tracking-wider">Fichier</th>
                                    <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-[#2F4156] uppercase tracking-wider">Statut Admin</th>
                                    <th scope="col" className="py-4 px-6 text-center text-sm font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#C8D9E6]/70">
                                {myAbsences.map((absence) => {
                                    const canAction = canModifyOrDelete(absence.created_at, absence.statut_admin);
                                    return (
                                    <tr key={absence.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(absence.date_debut)}</td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(absence.date_fin)}</td>
                                        {/* Increased max-width for Motif to max-w-lg */}
                                        <td className="py-4 px-6 text-sm text-[#567C8D] whitespace-normal max-w-lg break-words hidden md:table-cell" title={absence.motif}>{absence.motif || '-'}</td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-center">
                                            {absence.justifiee ? 
                                                <FaCheckCircle className="text-green-500 mx-auto" title="Oui"/> : 
                                                <FaTimesCircle className="text-red-500 mx-auto" title="Non"/>
                                            }
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm text-center">
                                            {absence.justificatif ? (
                                                <a href={`${STORAGE_BASE_URL}/${absence.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-[#567C8D] hover:text-[#2F4156] hover:underline inline-block">
                                                    <FaPaperclip size={16} />
                                                </a>
                                            ) : ('-')}
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm">{getAbsenceStatusBadge(absence.statut_admin, absence.justifiee)}</td>
                                        <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                                            {canAction ? (
                                                <div className="flex justify-center items-center gap-3">
                                                    <button onClick={() => openEditModal(absence)} className="text-[#567C8D] hover:text-[#2F4156] p-1.5 hover:bg-slate-100 rounded-md" title="Modifier">
                                                        <FaEdit size={16} />
                                                    </button>
                                                    <button onClick={() => openDeleteConfirmModal(absence)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md" title="Supprimer">
                                                        <FaTrashAlt size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Verrouillé</span>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>
            </main>

            <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80 mt-12"> {/* Added mt-12 for more spacing */}
                {/* Removed max-w-*, mx-auto. Relies on px-* for side margins. */}
                <footer className="px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-[#567C8D]">
                    Gestion des Absences © {new Date().getFullYear()}
                </footer>
            </div>
        </div>
    );
};

export default AbsenceEmploye;

