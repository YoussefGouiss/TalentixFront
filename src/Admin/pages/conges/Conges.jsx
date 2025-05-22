import { useState, useEffect, useCallback } from 'react';
import {
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner, FaFilter, FaEye,
  FaCheck, FaTimes
} from 'react-icons/fa';

// Re-usable animated components

const Notification = ({ show, message, type, onDismiss }) => {
  if (!show && !message) return null; // Added this line to prevent rendering if no message
  return (
    <div
      className={`fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}
                  ${type === 'success' ? 'bg-green-500 text-white border-l-4 border-green-700' : ''}
                  ${type === 'error' ? 'bg-red-500 text-white border-l-4 border-red-700' : ''}
                  ${type === 'warning' ? 'bg-yellow-400 text-yellow-800 border-l-4 border-yellow-600' : ''}
                  flex items-center justify-between min-w-[300px]`} // Added min-w
    >
      <div className="flex items-center">
        {type === 'success' && <FaCheckCircle size={20} className="mr-3 flex-shrink-0" />}
        {type === 'error' && <FaTimesCircle size={20} className="mr-3 flex-shrink-0" />}
        {type === 'warning' && <FaExclamationTriangle size={20} className="mr-3 flex-shrink-0" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
        <FaTimes size={18} />
      </button>
    </div>
  );
};

const SkeletonLoader = ({ rows = 5 }) => (
  <div className="animate-pulse p-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`grid grid-cols-5 md:grid-cols-6 gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center`}>
        <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Employe */}
        <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Début */}
        <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Fin */}
        <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1 hidden md:block"></div> {/* Motif */}
        <div className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div> {/* Statut */}
        <div className="h-8 bg-[#C8D9E6]/70 rounded w-full col-span-1 flex gap-2 p-1"> {/* Actions */}
            <div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div>
            <div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);


const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => { // Added maxWidth prop
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white border border-[#C8D9E6] rounded-xl shadow-lg w-full ${maxWidth} p-6 transform transition-all max-h-[90vh] overflow-y-auto`}> {/* Added max-h and overflow */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#C8D9E6]">
          <h3 className="text-xl font-semibold text-[#2F4156]">{title}</h3>
          <button onClick={onClose} className="text-[#567C8D] hover:text-[#2F4156]">
            <FaTimesCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const API_URL = 'http://localhost:8000/api/admin';

export default function Conges() {
  const [conges, setConges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentCongeForAction, setCurrentCongeForAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const getAdminToken = () => {
    return localStorage.getItem('admin_token'); 
  };

  const showAppNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const fetchAdminConges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error('Administrateur non authentifié.');
      }
      const response = await fetch(`${API_URL}/conges`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur non spécifiée du serveur' }));
        throw new Error(errorData.message || 'Erreur lors de la récupération des demandes.');
      }
      
      const data = await response.json();
      setConges(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
    } catch (err) {
      setError(err.message);
      showAppNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminConges();
  }, [fetchAdminConges]);

  const handleStatusUpdate = async (congeId, newStatus, explication = null) => {
    setIsSubmittingAction(true);
    const token = getAdminToken();
    if (!token) {
      showAppNotification('Administrateur non authentifié.', 'error');
      setIsSubmittingAction(false);
      setCurrentCongeForAction(null);
      return;
    }

    const payload = { statut: newStatus };
    if (newStatus === 'rejete' && explication) {
      payload.explication = explication;
    } else if (newStatus === 'rejete' && !explication) {
      showAppNotification('Une explication est requise pour un refus.', 'warning');
      setIsSubmittingAction(false);
      // Do not clear currentCongeForAction here to keep modal open
      return;
    }

    try {
      const response = await fetch(`${API_URL}/conges/${congeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Erreur lors de la mise à jour du statut.');
      }

      showAppNotification(responseData.message || 'Statut mis à jour avec succès.', 'success');
      fetchAdminConges(); // Refresh list
      if (newStatus === 'rejete') {
        setShowRejectionModal(false);
        setRejectionReason('');
      }
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setIsSubmittingAction(false);
      if (newStatus !== 'rejete' || (newStatus === 'rejete' && explication) ) { // Clear only if not a failed rejection due to missing reason
         setCurrentCongeForAction(null);
      }
    }
  };

  const openRejectionModal = (conge) => {
    setCurrentCongeForAction({...conge, action: 'rejete'});
    setShowRejectionModal(true);
  };

  const handleSubmitRejection = () => {
    if (!rejectionReason.trim()) {
      showAppNotification('Veuillez fournir une explication pour le refus.', 'warning');
      return; // Keep modal open
    }
    if (currentCongeForAction) {
      handleStatusUpdate(currentCongeForAction.id, 'rejete', rejectionReason);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return <span className="px-2.5 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-full">En attente</span>;
      case 'approuve':
        return <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded-full">Approuvé</span>;
      case 'rejete':
        return <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 rounded-full">Rejeté</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const filteredConges = conges.filter(conge => {
    if (filterStatus === 'all') return true;
    return conge.statut === filterStatus;
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); // Sort by most recent

  const getEmployeeDisplay = (conge) => {
    if (conge.employe && conge.employe.nom) {
        return `${conge.employe.nom} ${conge.employe.prenom || ''}`;
    }
    return conge.employe_id ? `Employé ID: ${conge.employe_id}` : 'Employé inconnu';
  };

  return (
    <div className="min-h-screen bg-[#F5EFEB]"> {/* Full page background */}
      <Notification 
        show={notification.show} 
        message={notification.message} 
        type={notification.type}
        onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} 
      />

      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Validation des Demandes de Congé</h1>
        </header>
      </div>
        
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Main content container */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Title removed as it's in the header now */}
            {/* Filters */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#C8D9E6] shadow-sm ml-auto"> {/* Moved filter to right */}
              <FaFilter size={18} className="text-[#567C8D]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-[#2F4156] font-medium focus:outline-none p-1.5 rounded-md border-transparent focus:border-[#567C8D] focus:ring-0 text-sm" // Added text-sm
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="approuve">Approuvées</option>
                <option value="rejete">Rejetées</option>
              </select>
            </div>
          </div>
          
          <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-4 py-3.5">
                <h2 className="text-lg font-semibold text-[#2F4156]">Liste des Demandes</h2>
            </div>
            {isLoading ? (
              <div className="p-1"><SkeletonLoader rows={5} /></div>
            ) : error && !filteredConges.length ? (
              <div className="p-10 text-center flex flex-col items-center">
                <FaExclamationTriangle size={40} className="mx-auto text-red-500 mb-4" />
                <p className="text-xl font-medium text-[#2F4156]">{error}</p>
                <p className="text-[#567C8D] mt-2">Impossible de charger les demandes. Veuillez réessayer.</p>
                <button
                    onClick={fetchAdminConges}
                    className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
                >
                    Réessayer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#C8D9E6]/30">
                    <tr>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Employé</th>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Début</th>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Fin</th>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider hidden md:table-cell">Motif</th>
                      <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Statut</th>
                      <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D9E6]/70">
                    {filteredConges.length === 0 && !isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaEye size={36} className="mx-auto text-[#C8D9E6] mb-3" />
                            <p className="text-lg font-medium text-[#2F4156]">Aucune demande</p>
                            <p className="text-sm text-[#567C8D]">Aucune demande ne correspond à "{filterStatus === 'all' ? 'tous les statuts' : filterStatus}".</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredConges.map((conge) => (
                        <tr key={conge.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                          <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]" title={getEmployeeDisplay(conge)}>{getEmployeeDisplay(conge)}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(conge.date_debut)}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(conge.date_fin)}</td>
                          <td className="py-3 px-4 text-sm text-[#567C8D] hidden md:table-cell truncate max-w-sm" title={conge.motif || ''}>{conge.motif || <span className="italic text-gray-400">Aucun</span>}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm">{getStatusBadge(conge.statut)}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                            {conge.statut === 'en_attente' ? (
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => { setCurrentCongeForAction({...conge, action: 'approuve'}); handleStatusUpdate(conge.id, 'approuve'); }}
                                  disabled={isSubmittingAction && currentCongeForAction?.id === conge.id}
                                  className="flex items-center justify-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                  title="Approuver"
                                >
                                  {isSubmittingAction && currentCongeForAction?.id === conge.id && currentCongeForAction?.action === 'approuve' ? <FaSpinner size={14} className="animate-spin mr-1" /> : <FaCheck size={14} className="mr-1" />}
                                  Approuver
                                </button>
                                <button
                                  onClick={() => openRejectionModal(conge)}
                                  disabled={isSubmittingAction && currentCongeForAction?.id === conge.id}
                                  className="flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                  title="Rejeter"
                                >
                                 {isSubmittingAction && currentCongeForAction?.id === conge.id && currentCongeForAction?.action === 'rejete' ? <FaSpinner size={14} className="animate-spin mr-1" /> : <FaTimes size={14} className="mr-1" />}
                                  Rejeter
                                </button>
                              </div>
                            ) : conge.statut === 'rejete' && conge.explication ? (
                                <p className="text-xs text-[#567C8D] italic px-2 truncate max-w-[150px] sm:max-w-[200px]" title={`Motif du rejet: ${conge.explication}`}>
                                    {conge.explication}
                                </p>
                            ) : (
                                <span className="text-xs text-[#A0AEC0] italic">Traité</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </main>
      <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Interface Administrateur © {new Date().getFullYear()}
        </footer>
      </div>

      <Modal 
        isOpen={showRejectionModal} 
        onClose={() => { setShowRejectionModal(false); setRejectionReason(''); setCurrentCongeForAction(null); }}
        title="Motif du Rejet"
        maxWidth="max-w-lg" // Slightly wider modal for textarea
      >
        <div className="space-y-4">
          <p className="text-sm text-[#567C8D]">
            Veuillez fournir une explication pour le rejet de la demande de congé pour <span className="font-semibold text-[#2F4156]">{currentCongeForAction ? getEmployeeDisplay(currentCongeForAction) : ''}</span>.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows="4"
            className="w-full p-2.5 border border-[#C8D9E6] rounded-md shadow-sm 
                       focus:ring-1 focus:ring-red-500 focus:border-red-500 
                       transition-colors outline-none text-[#2F4156] bg-white
                       disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            placeholder="Ex: Période de forte activité, manque de personnel..."
            disabled={isSubmittingAction}
          ></textarea>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#C8D9E6]">
            <button
              type="button"
              onClick={() => { setShowRejectionModal(false); setRejectionReason(''); setCurrentCongeForAction(null); }}
              className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md 
                         transition-colors duration-200 flex items-center font-medium text-sm
                         disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmittingAction}
            >
              <FaTimes size={16} className="mr-2" />
              Annuler
            </button>
            <button
              onClick={handleSubmitRejection}
              disabled={isSubmittingAction || !rejectionReason.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md 
                         transition-all duration-200 flex items-center font-semibold text-sm
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingAction ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaCheckCircle size={18} className="mr-2" />}
              Confirmer le Rejet
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}