import React, { useState, useEffect } from "react";
import { 
    FaPlus, FaEdit, FaTrashAlt, FaTimesCircle, FaCheckCircle, 
    FaExclamationTriangle, FaSpinner, FaSync, FaSave, FaBoxOpen 
} from 'react-icons/fa';

// --- Themed Notification Component ---
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
        <FaTimesCircle size={18} /> {/* Changed from FaTimes to FaTimesCircle for consistency with icon theme */}
      </button>
    </div>
  );
};

// --- SlideDown Component ---
const SlideDown = ({ isVisible, children }) => (
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      {isVisible && <div className="pt-2 pb-6">{children}</div>}
    </div>
  );


export default function MaterialEmploye() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [notification, setNotificationState] = useState({ show: false, message: '', type: '' });
  
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    motif: "",
    quantite: 1
  });

  const showAppNotification = (message, type = 'success', duration = 3000) => {
    setNotificationState({ show: true, message, type });
    setTimeout(() => {
      setNotificationState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/material',{
        headers :{
          'Authorization': `Bearer ${localStorage.getItem('employe_token')}`,
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Erreur de récupération des matériaux.');
      }
      const data = await response.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMaterials();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantite' ? Math.max(1, parseInt(value) || 1) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.motif.trim()) {
        showAppNotification("Le nom du matériel et le motif sont requis.", "warning");
        return;
    }
    setFormLoading(true);
    const url = editMode ? `http://localhost:8000/api/material/${currentId}` : 'http://localhost:8000/api/material';
    const method = editMode ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('employe_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || `Échec de ${editMode ? 'mise à jour' : 'création'}.`);
      
      showAppNotification(responseData.message || `Demande ${editMode ? 'mise à jour' : 'créée'} avec succès!`, 'success');
      fetchMaterials(); 
      resetForm();
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande de matériel?')) return;
    setDeleteLoadingId(id);
    try {
      const response = await fetch(`http://localhost:8000/api/material/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('employe_token')}`, 'Accept': 'application/json' }
      });
      let responseData = {};
      if (response.status !== 204) {
          responseData = await response.json();
      }
      if (!response.ok && response.status !== 204) throw new Error(responseData.message || 'Échec de la suppression.');
      
      showAppNotification(responseData.message || "Demande supprimée avec succès!", 'success');
      setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== id));
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      nom: material.nom,
      motif: material.motif,
      quantite: material.quantite
    });
    setCurrentId(material.id);
    setEditMode(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ nom: "", motif: "", quantite: 1 });
    setCurrentId(null);
    setEditMode(false);
    setShowForm(false);
  };

  const toggleForm = () => {
    if (showForm) {
        resetForm();
    } else {
        setShowForm(true);
         window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when opening form
    }
  };
  
  const StatusBadge = ({ status }) => {
    let style = { label: status, colorClasses: 'bg-gray-100 text-gray-700 border-gray-300' }; 
    switch (status?.toLowerCase()) {
      case 'en_attente':
        style = { label: "En attente", colorClasses: "bg-yellow-100 text-yellow-700 border-yellow-300" };
        break;
      case 'approuve':
        style = { label: "Approuvé", colorClasses: "bg-green-100 text-green-700 border-green-300" };
        break;
      case 'rejete': // Assuming 'rejete' as a possible status
        style = { label: "Rejeté", colorClasses: "bg-red-100 text-red-700 border-red-300" };
        break;
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.colorClasses}`}>
        {style.label}
      </span>
    );
  };

  const inputClasses = "w-full p-2.5 border border-[#C8D9E6] rounded-md focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-colors outline-none text-[#2F4156] bg-white text-sm";
  const buttonPrimaryClasses = "flex items-center justify-center px-4 py-2 bg-[#567C8D] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-[#4A6582] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
  const buttonSecondaryClasses = "flex items-center justify-center px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] text-sm font-medium rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed";


  return (
    <div className="min-h-screen bg-[#F5EFEB]"> {/* Removed p-4 md:p-6 */}
      <Notification 
        show={notification.show} 
        message={notification.message} 
        type={notification.type}
        onDismiss={() => setNotificationState(prev => ({ ...prev, show: false }))} 
      />

      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Mes Demandes de Matériel</h1>
        </header>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-end items-center mb-6 gap-3">
            <button onClick={fetchMaterials} disabled={loading || formLoading} className={buttonSecondaryClasses}>
              <FaSync size={16} className={`mr-2 ${loading && !formLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button onClick={toggleForm} className={`${showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-[#567C8D] hover:bg-[#4A6582]'} text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-all duration-150 flex items-center justify-center w-full sm:w-auto`} disabled={formLoading}>
              {showForm ? <FaTimesCircle size={16} className="mr-2" /> : <FaPlus size={16} className="mr-2" />}
              {showForm ? 'Annuler' : 'Nouvelle Demande'}
            </button>
          </div>

          <SlideDown isVisible={showForm}>
            <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-inner p-6 mb-6"> {/* Consider if mb-6 is needed given SlideDown py-6 */}
              <h3 className="text-xl font-semibold text-[#2F4156] border-b border-[#C8D9E6] pb-3 mb-6 flex items-center">
                {editMode ? <FaEdit size={18} className="mr-2 text-[#567C8D]" /> : <FaPlus size={18} className="mr-2 text-[#567C8D]" />}
                {editMode ? 'Modifier la demande' : 'Nouvelle demande de matériel'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-[#567C8D] mb-1">Nom du matériel <span className="text-red-500">*</span></label>
                    <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange} required className={inputClasses} placeholder="Ex: Clavier ergonomique"/>
                  </div>
                  <div>
                    <label htmlFor="quantite" className="block text-sm font-medium text-[#567C8D] mb-1">Quantité <span className="text-red-500">*</span></label>
                    <input type="number" id="quantite" name="quantite" min="1" value={formData.quantite} onChange={handleChange} required className={inputClasses}/>
                  </div>
                </div>
                <div>
                  <label htmlFor="motif" className="block text-sm font-medium text-[#567C8D] mb-1">Motif <span className="text-red-500">*</span></label>
                  <textarea id="motif" name="motif" value={formData.motif} onChange={handleChange} required rows="3" placeholder="Pourquoi avez-vous besoin de ce matériel?" className={`${inputClasses} min-h-[80px]`}></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={resetForm} className={buttonSecondaryClasses} disabled={formLoading}>
                    <FaTimesCircle size={16} className="mr-2" /> Annuler
                  </button>
                  <button type="submit" disabled={formLoading} className={buttonPrimaryClasses}>
                    {formLoading ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaSave size={16} className="mr-2" />}
                    {editMode ? 'Mettre à jour' : 'Soumettre'}
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>

          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
             <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-4 py-3.5">
                <h2 className="text-lg font-semibold text-[#2F4156]">Historique des Demandes</h2>
            </div>
            {loading && materials.length === 0 ? (
                 <div className="p-4 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="grid grid-cols-5 gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center">
                        {[...Array(4)].map((_,j) => <div key={j} className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div>)}
                        <div className="h-8 bg-[#C8D9E6]/70 rounded w-full col-span-1 flex gap-1 p-1">
                            <div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div><div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div>
                        </div>
                        </div>
                    ))}
                </div>
            ) : !loading && materials.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <FaBoxOpen size={40} className="mx-auto text-[#A0B9CD] mb-4" />
                <p className="text-xl font-medium text-[#2F4156]">Aucune demande de matériel.</p>
                <p className="text-[#567C8D] mt-2">Vous n'avez pas encore soumis de demande.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Nom Matériel</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Motif</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Qté</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Statut</th>
                      <th className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {materials.map((material) => (
                      <tr key={material.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                        <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]">{material.nom}</td>
                        <td className="py-3 px-4 text-sm text-[#567C8D] whitespace-normal max-w-xs break-words" title={material.motif}>{material.motif}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-center text-[#567C8D]">{material.quantite}</td>
                        <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={material.statut} /></td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                          {material.statut === 'en_attente' ? (
                            <div className="flex justify-center items-center gap-2">
                              <button onClick={() => handleEdit(material)} className="text-[#567C8D] hover:text-[#2F4156] p-1.5 hover:bg-[#E2E8F0] rounded-md transition-colors" title="Modifier" disabled={formLoading || deleteLoadingId !== null}>
                                <FaEdit size={16} />
                              </button>
                              <button onClick={() => handleDelete(material.id)} disabled={deleteLoadingId === material.id || formLoading} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-100 rounded-md transition-colors" title="Supprimer">
                                {deleteLoadingId === material.id ? <FaSpinner size={16} className="animate-spin" /> : <FaTrashAlt size={16} />}
                              </button>
                            </div>
                          ) : (<span className="text-xs text-gray-400 italic">Traité</span>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </main>

      <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Gestion des Demandes de Matériel © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}