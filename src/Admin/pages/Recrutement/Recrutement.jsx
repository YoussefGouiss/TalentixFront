import React, { useState, useEffect } from 'react';
import {
  FaPlusCircle, FaPencilAlt, FaTrashAlt, FaTimes, FaCheck, FaSpinner, FaExclamationCircle,
  FaCheckCircle, FaTimesCircle, FaUsers, FaSearch, FaBuilding // Added FaBuilding
} from 'react-icons/fa'; // Updated icons

// Re-using the ThemedNotification
const ThemedNotification = ({ message, type, show, onDismiss }) => {
  if (!show) return null;
  let bgColor, textColor, borderColor, Icon;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-500'; textColor = 'text-white'; borderColor = 'border-green-700'; Icon = FaCheckCircle;
      break;
    case 'error':
      bgColor = 'bg-red-500'; textColor = 'text-white'; borderColor = 'border-red-700'; Icon = FaTimesCircle;
      break;
    default:
      bgColor = 'bg-blue-500'; textColor = 'text-white'; borderColor = 'border-blue-700'; Icon = FaCheckCircle;
  }
  return (
    <div
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}
                  ${bgColor} ${textColor} border-l-4 ${borderColor} flex items-center justify-between`}
    >
      <div className="flex items-center">
        <Icon size={20} className="mr-3 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
          <FaTimes size={18} />
        </button>
      )}
    </div>
  );
};


// Form Modal Themed
const RecruitmentFormModal = ({ isOpen, onClose, onSubmit, formData, handleChange, formMode, actionLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg w-full max-w-2xl my-auto transform transition-all">
        <div className="flex justify-between items-center p-5 border-b border-[#C8D9E6]">
          <h3 className="text-xl font-semibold text-[#2F4156]">
            {formMode === 'add' ? 'Nouveau Recrutement' : 'Modifier le Recrutement'}
          </h3>
          <button onClick={onClose} className="text-[#567C8D] hover:text-[#2F4156]">
            <FaTimesCircle size={24} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {[
              { label: 'Titre', name: 'titre', type: 'text', required: true, placeholder: "Ex: Développeur Full-Stack" },
              { label: 'Poste', name: 'poste', type: 'text', required: true, placeholder: "Ex: Ingénieur Logiciel Senior" },
              { label: 'Date de début', name: 'date_debut', type: 'date', required: true },
              { label: 'Date de fin', name: 'date_fin', type: 'date', required: true },
            ].map(field => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-[#2F4156] mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  id={field.name} type={field.type} name={field.name}
                  value={formData[field.name]} onChange={handleChange}
                  required={field.required} placeholder={field.placeholder}
                  className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
                             focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                />
              </div>
            ))}
            <div className="md:col-span-2">
                <label htmlFor="statut" className="block text-sm font-medium text-[#2F4156] mb-1">Statut</label>
                <select
                    id="statut" name="statut" value={formData.statut} onChange={handleChange}
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                >
                    <option value="en cours">En cours</option>
                    <option value="cloture">Clôturé</option>
                </select>
            </div>
             <div className="md:col-span-2">
                <label htmlFor="descriptionPoste" className="block text-sm font-medium text-[#2F4156] mb-1">Description du poste</label>
                <textarea
                    id="descriptionPoste" name="descriptionPoste" value={formData.descriptionPoste} onChange={handleChange}
                    rows="3" placeholder="Décrivez les responsabilités..."
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="descriptionProfil" className="block text-sm font-medium text-[#2F4156] mb-1">Profil recherché</label>
                <textarea
                    id="descriptionProfil" name="descriptionProfil" value={formData.descriptionProfil} onChange={handleChange}
                    rows="3" placeholder="Décrivez les compétences et qualifications requises..."
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-[#C8D9E6] bg-[#F5EFEB]/50">
            <button
              type="button" onClick={onClose} disabled={actionLoading.id === 'form'}
              className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md 
                         transition-colors duration-200 flex items-center font-medium text-sm disabled:opacity-70"
            > <FaTimes size={16} className="mr-2" /> Annuler </button>
            <button
              type="submit" disabled={actionLoading.id === 'form'}
              className={`px-5 py-2 text-white rounded-md shadow-sm transition-all duration-200 flex items-center font-medium text-sm
                         ${formMode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                         ${actionLoading.id === 'form' ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {actionLoading.id === 'form' && actionLoading.type === 'submit' ? <FaSpinner size={16} className="mr-2 animate-spin" /> : <FaCheck size={16} className="mr-2" />}
              {formMode === 'add' ? 'Ajouter' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function Recrutement() {
    const [recruitments, setRecruitments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState('add');
    const [currentId, setCurrentId] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [actionLoading, setActionLoading] = useState({ id: null, type: null });
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        titre: '', poste: '', descriptionPoste: '', descriptionProfil: '',
        date_debut: '', date_fin: '', statut: 'en cours'
    });

    const API_BASE_URL = 'http://localhost:8000/api';

    useEffect(() => { fetchRecruitments(); }, []);

    useEffect(() => {
        let timer;
        if (notification.show) {
          timer = setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
        }
        return () => clearTimeout(timer);
      }, [notification]);

    const showAppNotification = (message, type = 'success') => { // Renamed to avoid conflict
        setNotification({ show: true, message, type });
    };

    const fetchRecruitments = async () => {
        setLoading(true); setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/recrutements`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json', 'Accept': 'application/json',
                }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Impossible de récupérer les recrutements.');
            }
            const data = await response.json();
            setRecruitments(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message); setRecruitments([]);
        } finally { setLoading(false); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const clearSearch = () => setSearchTerm('');

    const resetForm = () => {
        setFormData({
            titre: '', poste: '', descriptionPoste: '', descriptionProfil: '',
            date_debut: '', date_fin: '', statut: 'en cours'
        });
        setCurrentId(null); setFormMode('add');
    };

    const handleAddClick = () => { resetForm(); setShowForm(true); };

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
        setCurrentId(recruitment.id); setShowForm(true); setFormMode('edit');
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.titre || !formData.poste || !formData.date_debut || !formData.date_fin) {
            showAppNotification('Veuillez remplir tous les champs obligatoires (*)', 'error'); return;
        }
        if (new Date(formData.date_fin) < new Date(formData.date_debut)) {
            showAppNotification('La date de fin doit être après la date de début.', 'error'); return;
        }

        setActionLoading({ id: 'form', type: 'submit' });
        try {
            const url = formMode === 'add' ? `${API_BASE_URL}/admin/recrutements` : `${API_BASE_URL}/admin/recrutements/${currentId}`;
            const method = formMode === 'add' ? 'POST' : 'PUT';
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json', 'Accept': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message || responseData.error || 'Une erreur est survenue.');
            
            showAppNotification(formMode === 'add' ? 'Recrutement ajouté!' : 'Recrutement mis à jour!');
            setShowForm(false); resetForm(); fetchRecruitments();
        } catch (err) {
            showAppNotification(err.message, 'error');
        } finally { setActionLoading({ id: null, type: null }); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce recrutement?')) return;
        setActionLoading({ id, type: 'delete' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/recrutements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Accept': 'application/json',
                }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || 'Impossible de supprimer.');
            }
            showAppNotification('Recrutement supprimé!');
            fetchRecruitments();
        } catch (err) {
            showAppNotification(err.message, 'error');
        } finally { setActionLoading({ id: null, type: null }); }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'en cours' ? 'cloture' : 'en cours';
        setActionLoading({ id, type: 'status' });
        try {
            const recruitmentToUpdate = recruitments.find(r => r.id === id);
            if (!recruitmentToUpdate) throw new Error('Recrutement non trouvé.');
            
            // Preserve other fields, only update status
            const payload = { ...recruitmentToUpdate, statut: newStatus };
            delete payload.id; // Don't send ID in body for PUT usually
            delete payload.created_at;
            delete payload.updated_at;


            const response = await fetch(`${API_BASE_URL}/admin/recrutements/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json', 'Accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message || responseData.error || 'Impossible de modifier le statut.');
            
            showAppNotification(`Statut changé en "${newStatus === 'en cours' ? 'En cours' : 'Clôturé'}"`);
            fetchRecruitments();
        } catch (err) {
            showAppNotification(err.message, 'error');
        } finally { setActionLoading({ id: null, type: null }); }
    };

    const getStatusBadgeClass = (status) => {
        return status === 'en cours'
            ? 'text-green-700 bg-green-100 border-green-300'
            : 'text-gray-700 bg-gray-100 border-gray-300';
    };

    const filteredRecruitments = recruitments.filter(r =>
        (r.titre && r.titre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.poste && r.poste.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <ThemedNotification 
                message={notification.message} 
                type={notification.type} 
                show={notification.show} 
                onDismiss={() => setNotification({ show: false, message: '', type: '' })}
            />

            <div className="max-w-6xl mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
                <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestion des Recrutements</h1>
                        <p className="text-sm text-[#567C8D] mt-0.5">Créez et gérez les offres de recrutement.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a href="/admin/candidateur" // Consider using useNavigate if it's an internal route
                           className="flex items-center gap-2 px-4 py-2 bg-[#567C8D] hover:bg-[#4A6582] text-white rounded-md shadow-sm transition-colors text-sm font-medium">
                            <FaUsers size={16} /> Candidatures
                        </a>
                        <button onClick={handleAddClick}
                                className="flex items-center gap-2 px-4 py-2 bg-[#2F4156] hover:bg-[#3b5068] text-white rounded-md shadow-sm transition-colors text-sm font-medium">
                            <FaPlusCircle size={16} /> Nouveau Recrutement
                        </button>
                    </div>
                </header>

                <div className="p-6">
                    {!loading && !error && recruitments.length > 0 && (
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text" placeholder="Rechercher par titre ou poste..."
                                    value={searchTerm} onChange={handleSearchChange}
                                    className="w-full pl-10 pr-10 py-2.5 border border-[#C8D9E6] rounded-md text-[#2F4156] bg-white
                                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] focus:outline-none transition-all"
                                />
                                <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#567C8D]/80" size={16}/>
                                {searchTerm && (
                                    <button onClick={clearSearch} aria-label="Effacer la recherche"
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-[#567C8D]/70 hover:text-[#2F4156]">
                                        <FaTimesCircle size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <FaSpinner className="w-8 h-8 text-[#567C8D] animate-spin mb-3" />
                            <p className="text-[#567C8D]">Chargement des recrutements...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 bg-red-100 text-red-700 rounded-md border border-red-200 flex items-center">
                            <FaExclamationCircle className="w-5 h-5 mr-3" /> {error}
                        </div>
                    ) : recruitments.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-[#C8D9E6]">
                            <FaBuilding size={36} className="text-[#C8D9E6] mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-[#2F4156] mb-1">Aucun recrutement</h3>
                            <p className="text-sm text-[#567C8D] mb-5">Commencez par ajouter une nouvelle offre.</p>
                            <button onClick={handleAddClick}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#2F4156] text-white rounded-md hover:bg-[#3b5068] mx-auto text-sm font-medium">
                                <FaPlusCircle size={16} /> Ajouter Recrutement
                            </button>
                        </div>
                    ) : filteredRecruitments.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-[#C8D9E6]">
                            <FaSearch size={36} className="text-[#C8D9E6] mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-[#2F4156] mb-1">Aucun résultat</h3>
                            <p className="text-sm text-[#567C8D]">Aucun recrutement ne correspond à "{searchTerm}".</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-[#C8D9E6]/30">
                                    <tr>
                                        {['Titre', 'Poste', 'Période', 'Statut', 'Actions'].map(header => (
                                            <th key={header} className={`py-3 px-4 text-xs font-semibold text-[#2F4156] uppercase tracking-wider ${header === 'Actions' ? 'text-right' : 'text-left'}`}>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#C8D9E6]/70">
                                    {filteredRecruitments.map((r) => (
                                        <tr key={r.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                                            <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]">{r.titre}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{r.poste}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">
                                                {formatDateForDisplay(r.date_debut)} - {formatDateForDisplay(r.date_fin)}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(r.statut)}`}>
                                                    {r.statut === 'en cours' ? 'En cours' : 'Clôturé'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => toggleStatus(r.id, r.statut)}
                                                            disabled={actionLoading.id === r.id && actionLoading.type === 'status'}
                                                            className={`p-1.5 rounded-md transition-colors
                                                                        ${r.statut === 'en cours' ? 'text-green-600 hover:bg-green-500/20' : 'text-gray-600 hover:bg-gray-500/20'}
                                                                        ${actionLoading.id === r.id && actionLoading.type === 'status' ? 'opacity-50 cursor-wait' : ''}`}
                                                            title={r.statut === 'en cours' ? 'Clôturer' : 'Réactiver'}>
                                                        {actionLoading.id === r.id && actionLoading.type === 'status' ? <FaSpinner className="animate-spin" size={16}/>
                                                         : r.statut === 'en cours' ? <FaTimesCircle size={16}/> : <FaCheckCircle size={16}/>}
                                                    </button>
                                                    <button onClick={() => handleEditClick(r)}
                                                            className="p-1.5 text-blue-600 rounded-md hover:bg-blue-500/20 hover:text-blue-700 transition-colors" title="Modifier">
                                                        <FaPencilAlt size={14}/>
                                                    </button>
                                                    <button onClick={() => handleDelete(r.id)}
                                                            disabled={actionLoading.id === r.id && actionLoading.type === 'delete'}
                                                            className={`p-1.5 text-red-600 rounded-md hover:bg-red-500/20 hover:text-red-700 transition-colors
                                                                        ${actionLoading.id === r.id && actionLoading.type === 'delete' ? 'opacity-50 cursor-wait' : ''}`} title="Supprimer">
                                                        {actionLoading.id === r.id && actionLoading.type === 'delete' ? <FaSpinner className="animate-spin" size={16}/> : <FaTrashAlt size={14}/>}
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

                <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
                    Gestion des Recrutements © {new Date().getFullYear()}
                </footer>
            </div>

            <RecruitmentFormModal
                isOpen={showForm}
                onClose={() => { setShowForm(false); resetForm(); }}
                onSubmit={handleSubmit}
                formData={formData}
                handleChange={handleChange}
                formMode={formMode}
                actionLoading={actionLoading}
            />
        </>
    );
}