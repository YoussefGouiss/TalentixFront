import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, X, Check, Loader, AlertCircle, XCircle, Users, Search } from 'lucide-react'; // Added Search icon

export default function Recrutement() {
    // State
    const [recruitments, setRecruitments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
    const [currentId, setCurrentId] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [actionLoading, setActionLoading] = useState({ id: null, type: null }); // For button loading states
    const [searchTerm, setSearchTerm] = useState(''); // New state for search

    // Form state
    const [formData, setFormData] = useState({
        titre: '',
        poste: '',
        descriptionPoste: '',
        descriptionProfil: '',
        date_debut: '',
        date_fin: '',
        statut: 'en cours'
    });

    const API_BASE_URL = 'http://localhost:8000/api';

    // Fetch recruitments on component mount
    useEffect(() => {
        fetchRecruitments();
    }, []);

    // Show notification with auto-dismiss
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };

    // Fetch recruitments from API
    const fetchRecruitments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/recrutements`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setRecruitments(data);
            setError(null);
        } catch (err) {
            setError('Impossible de récupérer les recrutements');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Clear search term
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Reset form to default values
    const resetForm = () => {
        setFormData({
            titre: '',
            poste: '',
            descriptionPoste: '',
            descriptionProfil: '',
            date_debut: '',
            date_fin: '',
            statut: 'en cours'
        });
        setCurrentId(null);
        setFormMode('add');
    };

    // Open form for adding new recruitment
    const handleAddClick = () => {
        resetForm();
        setShowForm(true);
        setFormMode('add');
    };

    // Open form for editing recruitment
    const handleEditClick = (recruitment) => {
        setFormData({
            titre: recruitment.titre,
            poste: recruitment.poste,
            descriptionPoste: recruitment.descriptionPoste || '',
            descriptionProfil: recruitment.descriptionProfil || '',
            date_debut: formatDateForInput(recruitment.date_debut),
            date_fin: formatDateForInput(recruitment.date_fin),
            statut: recruitment.statut || 'en cours'
        });
        setCurrentId(recruitment.id);
        setShowForm(true);
        setFormMode('edit');
    };

    // Format date for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    };

    // Format date for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Submit form - either add or update
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.titre || !formData.poste || !formData.date_debut || !formData.date_fin) {
            showNotification('Veuillez remplir tous les champs obligatoires (*)', 'error');
            return;
        }

        const startDate = new Date(formData.date_debut);
        const endDate = new Date(formData.date_fin);
        if (endDate < startDate) {
            showNotification('La date de fin doit être postérieure à la date de début', 'error');
            return;
        }

        setActionLoading({ id: 'form', type: 'submit' });

        try {
            let response;
            if (formMode === 'add') {
                response = await fetch(`${API_BASE_URL}/admin/recrutements`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/admin/recrutements/${currentId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Une erreur est survenue');
            }

            showNotification(formMode === 'add' ? 'Recrutement ajouté avec succès' : 'Recrutement mis à jour avec succès');
            setShowForm(false);
            resetForm();
            fetchRecruitments();
        } catch (err) {
            showNotification(err.message || 'Une erreur est survenue', 'error');
            console.error(err);
        } finally {
            setActionLoading({ id: null, type: null });
        }
    };

    // Delete recruitment
    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce recrutement?')) {
            return;
        }

        setActionLoading({ id, type: 'delete' });

        try {
            const response = await fetch(`${API_BASE_URL}/admin/recrutements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Une erreur est survenue');
            }

            showNotification('Recrutement supprimé avec succès');
            fetchRecruitments(); // Refetch to update the list
            // If the deleted item was the last one matching the search, the search might now be empty.
            // No need to explicitly clearSearch here, the filter will re-apply.
        } catch (err) {
            showNotification(err.message || 'Impossible de supprimer le recrutement', 'error');
            console.error(err);
        } finally {
            setActionLoading({ id: null, type: null });
        }
    };

    // Toggle recruitment status
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'en cours' ? 'cloture' : 'en cours';
        setActionLoading({ id, type: 'status' });

        try {
            const recruitmentToUpdate = recruitments.find(r => r.id === id);
            if (!recruitmentToUpdate) {
                throw new Error('Recrutement non trouvé');
            }

            const response = await fetch(`${API_BASE_URL}/admin/recrutements/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...recruitmentToUpdate, // Send all existing data
                    statut: newStatus       // Only change status
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Une erreur est survenue';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            showNotification(`Statut changé en "${newStatus === 'en cours' ? 'En cours' : 'Clôturé'}"`);
            fetchRecruitments();
        } catch (err) {
            showNotification(err.message || 'Impossible de modifier le statut', 'error');
            console.error(err);
        } finally {
            setActionLoading({ id: null, type: null });
        }
    };

    // Get status badge styling
    const getStatusBadgeClass = (status) => {
        return status === 'en cours'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Filter recruitments based on search term
    const filteredRecruitments = recruitments.filter(recruitment =>
        (recruitment.titre && recruitment.titre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (recruitment.poste && recruitment.poste.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                <h2 className="text-xl font-semibold text-gray-800">Gestion des recrutements</h2>
                <div className="flex items-center space-x-3">
                    <a
                        href="/admin/candidateur"
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Demandes des candidats
                    </a>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Nouveau recrutement
                    </button>
                </div>
            </div>

            {/* Notification */}
            {notification.show && (
                <div className={`mx-6 mt-4 p-3 rounded-md ${notification.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
                    } flex justify-between items-center shadow-sm`}>
                    <div className="flex items-center">
                        {notification.type === 'error' ? (
                            <AlertCircle className="w-5 h-5 mr-2" />
                        ) : (
                            <Check className="w-5 h-5 mr-2" />
                        )}
                        <span>{notification.message}</span>
                    </div>
                    <button
                        onClick={() => setNotification({ show: false, message: '', type: '' })}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {/* Search Bar - Show if not loading, no error, and there are recruitments to search */}
                {!loading && !error && recruitments.length > 0 && (
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher par titre ou poste..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100"
                                    aria-label="Effacer la recherche"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-600">Chargement des recrutements...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                ) : recruitments.length === 0 ? ( // No recruitments at all
                    <div className="text-center py-16 flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <Users className="w-12 h-12 text-gray-400" /> {/* Changed icon for initial empty state */}
                        </div>
                        <p className="text-gray-600 text-lg mb-2">Aucun recrutement pour le moment</p>
                        <p className="text-gray-500 mb-6">Commencez par ajouter un nouveau recrutement.</p>
                        <button
                            onClick={handleAddClick}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Ajouter un recrutement
                        </button>
                    </div>
                ) : filteredRecruitments.length === 0 ? ( // Recruitments exist, but search yielded no results
                    <div className="text-center py-16 flex flex-col items-center">
                         <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-lg mb-2">Aucun recrutement ne correspond à votre recherche.</p>
                        <p className="text-gray-500">Essayez des termes différents ou effacez la recherche.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 shadow-sm border border-gray-200 rounded-md">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Titre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Poste
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Période
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecruitments.map((recruitment) => (
                                    <tr key={recruitment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{recruitment.titre}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{recruitment.poste}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {formatDateForDisplay(recruitment.date_debut)} - {formatDateForDisplay(recruitment.date_fin)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(recruitment.statut)}`}>
                                                {recruitment.statut === 'en cours' ? 'En cours' : 'Clôturé'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => toggleStatus(recruitment.id, recruitment.statut)}
                                                    disabled={actionLoading.id === recruitment.id && actionLoading.type === 'status'}
                                                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${recruitment.statut === 'en cours'
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
                                                        } ${actionLoading.id === recruitment.id && actionLoading.type === 'status' ? 'opacity-75 cursor-wait' : ''}`}
                                                    title={recruitment.statut === 'en cours' ? 'Clôturer' : 'Réactiver'}
                                                >
                                                    {actionLoading.id === recruitment.id && actionLoading.type === 'status' ? (
                                                        <Loader className="w-4 h-4 animate-spin" />
                                                    ) : recruitment.statut === 'en cours' ? (
                                                        <XCircle className="w-4 h-4" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(recruitment)}
                                                    disabled={actionLoading.id === recruitment.id} // Keep disabled if any action on this row
                                                    className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(recruitment.id)}
                                                    disabled={actionLoading.id === recruitment.id && actionLoading.type === 'delete'}
                                                    className={`flex items-center justify-center w-8 h-8 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${actionLoading.id === recruitment.id && actionLoading.type === 'delete' ? 'opacity-75 cursor-wait' : ''
                                                        }`}
                                                    title="Supprimer"
                                                >
                                                    {actionLoading.id === recruitment.id && actionLoading.type === 'delete' ? (
                                                        <Loader className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 pb-10 z-50 overflow-y-auto"> {/* Added pt-10 pb-10 for better scroll */}
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-auto animate-fadeIn"> {/* my-auto for vertical centering if content is short */}
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {formMode === 'add' ? 'Ajouter un recrutement' : 'Modifier le recrutement'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"> {/* Adjusted gap */}
                                <div className="md:col-span-1">
                                    <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1">
                                        Titre *
                                    </label>
                                    <input
                                        type="text"
                                        name="titre"
                                        id="titre"
                                        value={formData.titre}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: Développeur Full-Stack"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label htmlFor="poste" className="block text-sm font-medium text-gray-700 mb-1">
                                        Poste *
                                    </label>
                                    <input
                                        type="text"
                                        name="poste"
                                        id="poste"
                                        value={formData.poste}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ex: Ingénieur Logiciel Senior"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label htmlFor="date_debut" className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de début *
                                    </label>
                                    <input
                                        type="date"
                                        name="date_debut"
                                        id="date_debut"
                                        value={formData.date_debut}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label htmlFor="date_fin" className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de fin *
                                    </label>
                                    <input
                                        type="date"
                                        name="date_fin"
                                        id="date_fin"
                                        value={formData.date_fin}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2"> {/* Changed to col-span-2 for better layout, or keep as 1 for 3-col feel */}
                                    <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
                                        Statut *
                                    </label>
                                    <select
                                        name="statut"
                                        id="statut"
                                        value={formData.statut}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="en cours">En cours</option>
                                        <option value="cloture">Clôturé</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label htmlFor="descriptionPoste" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description du poste
                                    </label>
                                    <textarea
                                        name="descriptionPoste"
                                        id="descriptionPoste"
                                        rows="4"
                                        value={formData.descriptionPoste}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Décrivez les responsabilités et les missions du poste"
                                    ></textarea>
                                </div>

                                <div className="col-span-2">
                                    <label htmlFor="descriptionProfil" className="block text-sm font-medium text-gray-700 mb-1">
                                        Profil recherché
                                    </label>
                                    <textarea
                                        name="descriptionProfil"
                                        id="descriptionProfil"
                                        rows="4"
                                        value={formData.descriptionProfil}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Décrivez les compétences et qualifications requises"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                    disabled={actionLoading.id === 'form'}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center min-w-[120px]" // Increased min-width for loader
                                    disabled={actionLoading.id === 'form'}
                                >
                                    {actionLoading.id === 'form' && actionLoading.type === 'submit' ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            Traitement...
                                        </>
                                    ) : (
                                        formMode === 'add' ? 'Ajouter' : 'Mettre à jour'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}