import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const STORAGE_BASE_URL = 'http://127.0.0.1:8000/storage'; // Adjust if your storage URL is different
const ADMIN_TOKEN = localStorage.getItem('admin_token'); // Or however you manage your token

const AbsenceAdmin = () => {
    const [absences, setAbsences] = useState([]);
    const [employees, setEmployees] = useState([]); // For employee dropdown (optional future enhancement)

    // Form states for Add Modal
    const [addEmployeId, setAddEmployeId] = useState('');
    const [addDateDebut, setAddDateDebut] = useState('');
    const [addDateFin, setAddDateFin] = useState('');
    const [addMotif, setAddMotif] = useState('');

    // Form states for Edit Modal
    const [currentAbsenceToEdit, setCurrentAbsenceToEdit] = useState(null);
    const [editJustifiee, setEditJustifiee] = useState(false);
    const [editJustificatifFile, setEditJustificatifFile] = useState(null);

    const [message, setMessage] = useState({ text: '', type: '' }); // type can be 'success' or 'error'
    const [loading, setLoading] = useState(false);

    // Modal visibility states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // --- Helper for API calls ---
    const customFetch = useCallback(async (endpoint, options = {}) => {
        setLoading(true);
        let responseData;
        try {
            const headers = {
                'Accept': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`, // Add Authorization token
                ...options.headers,
            };

            // Don't set Content-Type for FormData, browser does it.
            if (!(options.body instanceof FormData) && options.method && ['POST', 'PUT'].includes(options.method.toUpperCase())) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
            
            // Try to parse JSON, but handle cases where it might not be (e.g. 204 No Content)
            try {
                responseData = await response.json();
            } catch (jsonError) {
                if (!response.ok) { // If not OK and not JSON, it's an issue
                    throw new Error(`HTTP error ${response.status} with non-JSON response`);
                }
                // If OK and not JSON (e.g. 204), responseData remains undefined, which is fine.
            }

            if (!response.ok) {
                const errorMsg = responseData?.message || `Error: ${response.status}`;
                const error = new Error(errorMsg);
                error.data = responseData; // Attach full data
                if (responseData?.errors) {
                    error.message = `Validation failed: ${Object.values(responseData.errors).flat().join(', ')}`;
                }
                throw error;
            }
            return responseData;
        } catch (error) {
            setMessage({ text: error.message || 'An API error occurred', type: 'error' });
            console.error('API Error:', error.data || error);
            throw error; // Re-throw to be caught by calling function if needed
        } finally {
            setLoading(false);
        }
    }, []); // ADMIN_TOKEN is read once, not a reactive dependency here. If it changes, component should re-evaluate.


    // --- Fetch all absences ---
    const fetchAbsences = useCallback(async () => {
        try {
            const data = await customFetch('/admin/absences');
            if (Array.isArray(data)) {
                setAbsences(data);
            } else { // Assuming Laravel pagination or specific structure like { data: [...] }
                setAbsences(Array.isArray(data.data) ? data.data : []);
                if (!Array.isArray(data.data) && !Array.isArray(data)) {
                     setMessage({ text: 'Format inattendu des données absences', type: 'error' });
                }
            }
        } catch (error) {
            // Error message already set by customFetch
            setAbsences([]);
        }
    }, [customFetch]);

    useEffect(() => {
        if(ADMIN_TOKEN){
            fetchAbsences();
            // TODO: Fetch employees if you want a dropdown for employe_id
            // fetchEmployees(); 
        } else {
            setMessage({ text: 'Admin token not found. Please login.', type: 'error' });
        }
    }, [fetchAbsences]);

    // --- Add Absence ---
    const handleAddAbsenceSubmit = async (e) => {
        e.preventDefault();
        if (!addEmployeId || !addDateDebut ) { // Motif can be optional based on controller
            setMessage({ text: 'Employee ID and Start Date are required.', type: 'error' });
            return;
        }
        try {
            const response = await customFetch('/admin/absences', {
                method: 'POST',
                body: JSON.stringify({
                    employe_id: addEmployeId,
                    date_debut: addDateDebut,
                    date_fin: addDateFin || null, // Send null if empty
                    motif: addMotif,
                }),
            });
            setMessage({ text: response.message || 'Absence ajoutée avec succès', type: 'success' });
            fetchAbsences(); // Re-fetch to get the latest list including the new one
            setShowAddModal(false); // Close modal
            // Reset add form fields
            setAddEmployeId('');
            setAddDateDebut('');
            setAddDateFin('');
            setAddMotif('');
        } catch (error) {
            // Error message is set by customFetch
        }
    };

    // --- Open Edit Modal ---
    const openEditModal = (absence) => {
        setCurrentAbsenceToEdit(absence);
        setEditJustifiee(absence.justifiee || false);
        setEditJustificatifFile(null); // Reset file input
        setShowEditModal(true);
        setMessage({ text: '', type: '' }); // Clear previous messages
    };

    // --- Validate Justification ---
    const handleValidateJustificationSubmit = async (e) => {
        e.preventDefault();
        if (!currentAbsenceToEdit) return;

        const formData = new FormData();
        formData.append('_method', 'PUT'); // Laravel method spoofing
        formData.append('justifiee', editJustifiee ? 'true' : 'false'); // Backend expects boolean as string

        if (editJustificatifFile) {
            formData.append('justificatif', editJustificatifFile);
        }

        try {
            const response = await customFetch(`/admin/absences/${currentAbsenceToEdit.id}/justification`, {
                method: 'POST', // Actual method is POST for FormData with _method spoofing
                body: formData,
            });
            setMessage({ text: response.message || 'Justification mise à jour avec succès', type: 'success' });
            // Update the specific absence in the list with new data from response
            setAbsences((prevAbsences) =>
                prevAbsences.map((abs) =>
                    abs.id === currentAbsenceToEdit.id ? { ...abs, ...response.data } : abs
                )
            );
            setShowEditModal(false); // Close modal
        } catch (error) {
            // Error message is set by customFetch
        }
    };


    // --- Message Timeout ---
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ text: '', type: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // --- Tailwind classes ---
    const inputClasses = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const buttonPrimaryClasses = "px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300";
    const buttonSecondaryClasses = "px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50";
    const modalOverlayClasses = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    const modalContentClasses = "bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto";

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA'); // YYYY-MM-DD for consistency with input type="date"
    };


    if (!ADMIN_TOKEN) {
        return <div className="p-8 text-center text-red-600 bg-red-100 border border-red-400 rounded-md">Admin token not found. Please login.</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Gestion des Absences</h2>

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
                <button onClick={() => setShowAddModal(true)} className={buttonPrimaryClasses}>
                    Ajouter une Absence
                </button>
            </div>

            {/* Add Absence Modal */}
            {showAddModal && (
                <div className={modalOverlayClasses}>
                    <div className={modalContentClasses}>
                        <h3 className="text-xl font-semibold mb-6 text-gray-700">Ajouter une Absence</h3>
                        <form onSubmit={handleAddAbsenceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Employé</label>
                                <input
                                    type="number" // Use number for ID
                                    value={addEmployeId}
                                    onChange={(e) => setAddEmployeId(e.target.value)}
                                    required
                                    className={inputClasses}
                                    placeholder="Entrez ID employé"
                                />
                                {/* Consider replacing with an employee select dropdown */}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                <input type="date" value={addDateDebut} onChange={(e) => setAddDateDebut(e.target.value)} required className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (optionnel)</label>
                                <input type="date" value={addDateFin} onChange={(e) => setAddDateFin(e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                                <textarea value={addMotif} onChange={(e) => setAddMotif(e.target.value)} className={`${inputClasses} min-h-[80px]`} placeholder="Motif de l'absence"></textarea>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className={buttonSecondaryClasses} disabled={loading}>Annuler</button>
                                <button type="submit" className={buttonPrimaryClasses} disabled={loading}>
                                    {loading ? 'Ajout...' : 'Ajouter Absence'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Justification Modal */}
            {showEditModal && currentAbsenceToEdit && (
                <div className={modalOverlayClasses}>
                    <div className={modalContentClasses}>
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Valider Justification</h3>
                        <p className="text-sm text-gray-600 mb-1">Employé: <span className="font-medium">{currentAbsenceToEdit.employe?.nom || 'N/A'}</span></p>
                        <p className="text-sm text-gray-600 mb-6">Absence du {formatDate(currentAbsenceToEdit.date_debut)} au {formatDate(currentAbsenceToEdit.date_fin)}</p>
                        
                        <form onSubmit={handleValidateJustificationSubmit} className="space-y-4" encType="multipart/form-data">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Statut Justification</label>
                                 <select
                                    value={editJustifiee ? 'true' : 'false'}
                                    onChange={(e) => setEditJustifiee(e.target.value === 'true')}
                                    className={`${inputClasses} mt-1`}
                                >
                                    <option value="true">Justifiée</option>
                                    <option value="false">Non justifiée</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier Justificatif (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setEditJustificatifFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100 focus:outline-none"
                                />
                                {currentAbsenceToEdit.justificatif && !editJustificatifFile && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Fichier actuel: <a href={`${STORAGE_BASE_URL}/${currentAbsenceToEdit.justificatif}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{currentAbsenceToEdit.justificatif.split('/').pop()}</a>. Laisser vide pour conserver.
                                    </p>
                                )}
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowEditModal(false)} className={buttonSecondaryClasses} disabled={loading}>Annuler</button>
                                <button type="submit" className={buttonPrimaryClasses} disabled={loading}>
                                    {loading ? 'Validation...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Absences Table */}
            <div className="mt-10 bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Employé', 'Date Début', 'Date Fin', 'Motif', 'Justifiée', 'Impact Salaire', 'Justificatif', 'Actions'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {absences.length > 0 ? (
                                absences.map((absence) => (
                                    <tr key={absence.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{absence.employe?.nom || 'N/A'}</td>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => openEditModal(absence)} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                                Gérer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                                        Aucune absence enregistrée.
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

export default AbsenceAdmin;