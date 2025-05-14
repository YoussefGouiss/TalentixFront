import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';
const STORAGE_BASE_URL = 'http://localhost:8000/storage'; // Adjust if your storage URL is different
const EMPLOYE_TOKEN = localStorage.getItem('employe_token'); // Or your employee auth token key

const AbsenceEmploye = () => {
    const [myAbsences, setMyAbsences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' or 'error'

    // Modal States
    const [showDemandeModal, setShowDemandeModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [currentAbsenceToEdit, setCurrentAbsenceToEdit] = useState(null);
    const [absenceToDelete, setAbsenceToDelete] = useState(null);

    // Form States for Demande Modal
    const [demandeDateDebut, setDemandeDateDebut] = useState('');
    const [demandeDateFin, setDemandeDateFin] = useState('');
    const [demandeMotif, setDemandeMotif] = useState('');
    const [demandeJustificatifFile, setDemandeJustificatifFile] = useState(null);

    // Form States for Edit Modal (populated from currentAbsenceToEdit)
    const [editDateDebut, setEditDateDebut] = useState('');
    const [editDateFin, setEditDateFin] = useState('');
    const [editMotif, setEditMotif] = useState('');
    const [editJustificatifFile, setEditJustificatifFile] = useState(null);


    // --- Custom Fetch Helper ---
    const customFetch = useCallback(async (endpoint, options = {}) => {
        setLoading(true);
        let responseData;
        try {
            const headers = {
                'Accept': 'application/json',
                'Authorization': `Bearer ${EMPLOYE_TOKEN}`,
                ...options.headers,
            };

            if (!(options.body instanceof FormData) && options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
                if (options.body) headers['Content-Type'] = 'application/json';
            }


            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

            try {
                responseData = await response.json();
            } catch (jsonError) {
                // Handle cases like 204 No Content for DELETE which might not return JSON
                if (response.ok && response.status === 204) {
                    setLoading(false);
                    return { message: 'Opération réussie (pas de contenu).' }; // Or a specific success message
                }
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status} with non-JSON response`);
                }
                // If OK and not JSON, might be fine, responseData remains undefined.
            }


            if (!response.ok) {
                const errorMsg = responseData?.message || `Error: ${response.status}`;
                const error = new Error(errorMsg);
                error.data = responseData;
                if (responseData?.errors) {
                    error.message = `Validation failed: ${Object.values(responseData.errors).flat().join(', ')}`;
                }
                throw error;
            }
            return responseData;
        } catch (error) {
            setMessage({ text: error.message || 'An API error occurred', type: 'error' });
            console.error('API Error:', error.data || error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);


    // --- Fetch "Mes Absences" ---
    const fetchMesAbsences = useCallback(async () => {
        try {
            const data = await customFetch('/employe/absences');
            setMyAbsences(Array.isArray(data) ? data : []);
            if (!Array.isArray(data)){
                 setMessage({ text: 'Format inattendu des données absences', type: 'error' });
            }
        } catch (error) {
            // Error message handled by customFetch
            setMyAbsences([]);
        }
    }, [customFetch]);

    useEffect(() => {
        if (EMPLOYE_TOKEN) {
            fetchMesAbsences();
        } else {
            setMessage({ text: 'Employee token not found. Please login.', type: 'error' });
        }
    }, [fetchMesAbsences]);


    // --- Demander une Absence ---
    const handleDemandeAbsenceSubmit = async (e) => {
        e.preventDefault();
        if (!demandeDateDebut || !demandeMotif) {
            setMessage({ text: 'Date de début et Motif sont requis.', type: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('date_debut', demandeDateDebut);
        if (demandeDateFin) formData.append('date_fin', demandeDateFin);
        formData.append('motif', demandeMotif);
        if (demandeJustificatifFile) {
            formData.append('justificatif', demandeJustificatifFile);
        }

        try {
            const response = await customFetch('/employe/absences', {
                method: 'POST',
                body: formData,
            });
            setMessage({ text: response.message || 'Demande d\'absence envoyée.', type: 'success' });
            fetchMesAbsences();
            setShowDemandeModal(false);
            // Reset form
            setDemandeDateDebut('');
            setDemandeDateFin('');
            setDemandeMotif('');
            setDemandeJustificatifFile(null);
            if (document.getElementById('demandeJustificatifFile')) { // Reset file input display
                 document.getElementById('demandeJustificatifFile').value = null;
            }
        } catch (error) {
            // Error message set by customFetch
        }
    };


    // --- Open Edit Modal ---
    const openEditModal = (absence) => {
        setCurrentAbsenceToEdit(absence);
        setEditDateDebut(absence.date_debut.split('T')[0]); // Format YYYY-MM-DD
        setEditDateFin(absence.date_fin ? absence.date_fin.split('T')[0] : '');
        setEditMotif(absence.motif);
        setEditJustificatifFile(null); // Reset file input
        setShowEditModal(true);
        setMessage({ text: '', type: '' });
    };

    // --- Update Absence ---
    const handleUpdateAbsenceSubmit = async (e) => {
        e.preventDefault();
        if (!currentAbsenceToEdit || !editDateDebut || !editMotif) {
            setMessage({ text: 'Date de début et Motif sont requis pour la mise à jour.', type: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('date_debut', editDateDebut);
        if (editDateFin) formData.append('date_fin', editDateFin);
        formData.append('motif', editMotif);
        if (editJustificatifFile) {
            formData.append('justificatif', editJustificatifFile);
        }
        formData.append('_method', 'PUT'); // Method spoofing for Laravel

        try {
            const response = await customFetch(`/employe/absences/${currentAbsenceToEdit.id}`, {
                method: 'POST', // Actual method is POST due to FormData and _method
                body: formData,
            });
            setMessage({ text: response.message || 'Demande mise à jour.', type: 'success' });
            fetchMesAbsences();
            setShowEditModal(false);
        } catch (error) {
            // Error set by customFetch
        }
    };

    // --- Open Delete Confirm Modal ---
    const openDeleteConfirmModal = (absence) => {
        setAbsenceToDelete(absence);
        setShowDeleteConfirmModal(true);
        setMessage({ text: '', type: '' });
    };

    // --- Delete Absence ---
    const handleDeleteAbsence = async () => {
        if (!absenceToDelete) return;
        try {
            const response = await customFetch(`/employe/absences/${absenceToDelete.id}`, {
                method: 'DELETE',
            });
            setMessage({ text: response.message || 'Demande supprimée.', type: 'success' });
            setMyAbsences(prev => prev.filter(abs => abs.id !== absenceToDelete.id));
            setShowDeleteConfirmModal(false);
            setAbsenceToDelete(null);
        } catch (error) {
            // Error set by customFetch
            setShowDeleteConfirmModal(false); // Close modal even on error
        }
    };

    // --- Helper to check if absence can be modified/deleted (within 48 hours) ---
    const canModifyOrDelete = (createdAtString) => {
        if (!createdAtString) return false;
        const createdAt = new Date(createdAtString);
        const now = new Date();
        const diffInMilliseconds = now - createdAt;
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
        return diffInHours <= 48;
    };


    // --- Message Timeout ---
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ text: '', type: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // --- Tailwind classes (similar to Admin component) ---
    const inputClasses = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const buttonPrimaryClasses = "px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300";
    const buttonSecondaryClasses = "px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50";
    const buttonDangerClasses = "px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:bg-red-300";
    const modalOverlayClasses = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    const modalContentClasses = "bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto";
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-CA'); // YYYY-MM-DD
    };

    if (!EMPLOYE_TOKEN) {
        return <div className="p-8 text-center text-red-600 bg-red-100 border border-red-400 rounded-md">Token employé non trouvé. Veuillez vous connecter.</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Mes Demandes d'Absence</h2>

            {loading && (
                <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-[100] overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin border-t-blue-500"></div>
                    <h2 className="text-center text-white text-xl font-semibold">Chargement...</h2>
                </div>
            )}

            {message.text && (
                <div className={`p-3 mb-4 rounded-md text-center font-semibold ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                    {message.text}
                </div>
            )}

            <div className="mb-6 text-center">
                <button onClick={() => setShowDemandeModal(true)} className={buttonPrimaryClasses}>
                    Demander une Absence
                </button>
            </div>

            {/* Demande Absence Modal */}
            {showDemandeModal && (
                <div className={modalOverlayClasses}>
                    <div className={modalContentClasses}>
                        <h3 className="text-xl font-semibold mb-6 text-gray-700">Nouvelle Demande d'Absence</h3>
                        <form onSubmit={handleDemandeAbsenceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début <span className="text-red-500">*</span></label>
                                <input type="date" value={demandeDateDebut} onChange={(e) => setDemandeDateDebut(e.target.value)} required className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (optionnel)</label>
                                <input type="date" value={demandeDateFin} onChange={(e) => setDemandeDateFin(e.target.value)} className={inputClasses} min={demandeDateDebut} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif <span className="text-red-500">*</span></label>
                                <textarea value={demandeMotif} onChange={(e) => setDemandeMotif(e.target.value)} required className={`${inputClasses} min-h-[80px]`} placeholder="Motif de votre absence"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Justificatif (optionnel - PDF, JPG, PNG)</label>
                                <input
                                    id="demandeJustificatifFile"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setDemandeJustificatifFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none"
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowDemandeModal(false)} className={buttonSecondaryClasses} disabled={loading}>Annuler</button>
                                <button type="submit" className={buttonPrimaryClasses} disabled={loading}>
                                    {loading ? 'Envoi...' : 'Envoyer la Demande'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Absence Modal */}
            {showEditModal && currentAbsenceToEdit && (
                 <div className={modalOverlayClasses}>
                    <div className={modalContentClasses}>
                        <h3 className="text-xl font-semibold mb-6 text-gray-700">Modifier ma Demande</h3>
                        <form onSubmit={handleUpdateAbsenceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début <span className="text-red-500">*</span></label>
                                <input type="date" value={editDateDebut} onChange={(e) => setEditDateDebut(e.target.value)} required className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (optionnel)</label>
                                <input type="date" value={editDateFin} onChange={(e) => setEditDateFin(e.target.value)} className={inputClasses} min={editDateDebut}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif <span className="text-red-500">*</span></label>
                                <textarea value={editMotif} onChange={(e) => setEditMotif(e.target.value)} required className={`${inputClasses} min-h-[80px]`} placeholder="Motif de votre absence"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Justificatif (optionnel - PDF, JPG, PNG)</label>
                                <input
                                    id="editJustificatifFile"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setEditJustificatifFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none"
                                />
                                {currentAbsenceToEdit.justificatif && !editJustificatifFile && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Fichier actuel: <a href={`${STORAGE_BASE_URL}/${currentAbsenceToEdit.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{currentAbsenceToEdit.justificatif.split('/').pop()}</a>. Laisser vide pour conserver ou remplacer.
                                    </p>
                                )}
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowEditModal(false)} className={buttonSecondaryClasses} disabled={loading}>Annuler</button>
                                <button type="submit" className={buttonPrimaryClasses} disabled={loading}>
                                    {loading ? 'Mise à jour...' : 'Mettre à Jour'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && absenceToDelete && (
                <div className={modalOverlayClasses}>
                    <div className={modalContentClasses}>
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Confirmer la Suppression</h3>
                        <p className="text-gray-600 mb-6">
                            Êtes-vous sûr de vouloir supprimer cette demande d'absence du {formatDate(absenceToDelete.date_debut)} au {formatDate(absenceToDelete.date_fin)} ?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowDeleteConfirmModal(false)} className={buttonSecondaryClasses} disabled={loading}>
                                Annuler
                            </button>
                            <button onClick={handleDeleteAbsence} className={buttonDangerClasses} disabled={loading}>
                                {loading ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* My Absences Table */}
            <div className="mt-10 bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Date Début', 'Date Fin', 'Motif', 'Justifiée', 'Impact Salaire', 'Justificatif', 'Statut Admin', 'Actions'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {myAbsences.length > 0 ? (
                                myAbsences.map((absence) => {
                                    const canEditOrDelete = canModifyOrDelete(absence.created_at);
                                    return (
                                    <tr key={absence.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(absence.date_debut)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(absence.date_fin)}</td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs break-words">{absence.motif || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {absence.justifiee ? 
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Oui</span> : 
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Non</span>
                                            }
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {absence.impact_salaire ? 
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Oui</span> : 
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Non</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {absence.justificatif ? (
                                                <a href={`${STORAGE_BASE_URL}/${absence.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline text-xs">
                                                    Voir Fichier
                                                </a>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {absence.cree_par_admin || (absence.justifiee && absence.justificatif) ? // Basic logic for admin validation status
                                                (absence.justifiee ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Validée</span>
                                                                 : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Rejetée</span>)
                                                : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">En attente</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {canEditOrDelete && !absence.cree_par_admin && ( // Cannot edit admin-created absences from here
                                                <>
                                                <button onClick={() => openEditModal(absence)} className="text-indigo-600 hover:text-indigo-900 hover:underline text-xs" title="Modifier">
                                                    Modifier
                                                </button>
                                                <button onClick={() => openDeleteConfirmModal(absence)} className="text-red-600 hover:text-red-900 hover:underline text-xs" title="Supprimer">
                                                    Supprimer
                                                </button>
                                                </>
                                            )}
                                            {(!canEditOrDelete || absence.cree_par_admin) && (
                                                <span className="text-gray-400 text-xs italic">Verrouillé</span>
                                            )}
                                        </td>
                                    </tr>
                                )})
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                                        Vous n'avez aucune demande d'absence pour le moment.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AbsenceEmploye;