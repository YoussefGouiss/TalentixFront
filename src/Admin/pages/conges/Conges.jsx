import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, MessageSquare, Loader, AlertTriangle, ListFilter, Eye } from 'lucide-react';

// Re-usable animated components (assuming they are in separate files or defined above)
const Notification = ({ show, message, type, onDismiss }) => {
  if (!show) return null;
  return (
    <div 
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl text-sm font-medium
                  transform transition-all duration-300 ease-in-out
                  ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                  ${type === 'success' ? 'bg-green-500 text-white' : ''}
                  ${type === 'error' ? 'bg-red-500 text-white' : ''}
                  ${type === 'warning' ? 'bg-yellow-500 text-gray-800' : ''}
                  flex items-center justify-between`}
    >
      <div className="flex items-center">
        {type === 'success' && <CheckCircle size={20} className="mr-2" />}
        {type === 'error' && <AlertTriangle size={20} className="mr-2" />}
        {type === 'warning' && <MessageSquare size={20} className="mr-2" />}
        {message}
      </div>
      <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
        <XCircle size={18} />
      </button>
    </div>
  );
};

const SkeletonLoader = ({ rows = 5, cols = 5 }) => (
  <div className="animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`grid grid-cols-${cols + 1} gap-4 py-4 border-b border-gray-200 items-center`}>
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-5 bg-gray-200 rounded col-span-1"></div>
        ))}
        <div className="h-8 bg-gray-200 rounded w-full col-span-1 flex gap-2">
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const API_URL = 'http://localhost:8000/api/admin'; // Admin specific API base URL

export default function Conges() {
  const [conges, setConges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'en_attente', 'approuve', 'rejete'
  
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
    // IMPORTANT: Replace 'admin_token' with the actual key you use for storing the admin's auth token
    return localStorage.getItem('admin_token'); 
  };

  const showAppNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
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
      const response = await fetch(`${API_URL}/conges`, { // Uses '/admin/conges'
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des demandes.');
      }
      
      const data = await response.json();
      // Assuming data is an array of conges. If it's nested (e.g. data.conges), adjust here.
      setConges(Array.isArray(data) ? data : []); 
    } catch (err) {
      setError(err.message);
      showAppNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []); // showAppNotification can be a dependency if not stable

  useEffect(() => {
    fetchAdminConges();
  }, [fetchAdminConges]);

  const handleStatusUpdate = async (congeId, newStatus, explication = null) => {
    setIsSubmittingAction(true);
    const token = getAdminToken();
    if (!token) {
      showAppNotification('Administrateur non authentifié.', 'error');
      setIsSubmittingAction(false);
      return;
    }

    const payload = { statut: newStatus };
    if (newStatus === 'rejete' && explication) {
      payload.explication = explication;
    } else if (newStatus === 'rejete' && !explication) {
      showAppNotification('Une explication est requise pour un refus.', 'warning');
      setIsSubmittingAction(false);
      return; // API will also catch this but good for UX
    }

    try {
      const response = await fetch(`${API_URL}/conges/${congeId}`, { // Uses '/admin/conges/{id}'
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
      fetchAdminConges(); // Refresh the list
      if (newStatus === 'rejete') {
        setShowRejectionModal(false);
        setRejectionReason('');
      }
      setCurrentCongeForAction(null);

    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const openRejectionModal = (conge) => {
    setCurrentCongeForAction(conge);
    setShowRejectionModal(true);
  };

  const handleSubmitRejection = () => {
    if (!rejectionReason.trim()) {
      showAppNotification('Veuillez fournir une explication pour le refus.', 'warning');
      return;
    }
    if (currentCongeForAction) {
      handleStatusUpdate(currentCongeForAction.id, 'rejete', rejectionReason);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return <span className="px-2.5 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">En attente</span>;
      case 'approuve':
        return <span className="px-2.5 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Approuvé</span>;
      case 'rejete':
        return <span className="px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Rejeté</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">{status}</span>;
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
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); // Sort by creation date, newest first


  // Display employee identifier. Prefers `conge.employe.name` if available from eager loading, falls back to `employe_id`
  const getEmployeeDisplay = (conge) => {
    if (conge.employe && conge.employe.nom) { // Assuming 'nom' field on employe object
        return `${conge.employe.nom} ${conge.employe.prenom || ''}`;
    }
    return `Employé ID: ${conge.employe_id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <header className="bg-slate-700 text-white px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight">Validation des Demandes de Congé</h1>
        </header>
        
        <Notification 
          show={notification.show} 
          message={notification.message} 
          type={notification.type}
          onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} 
        />
        
        <div className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800">Liste des Demandes</h2>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <ListFilter size={20} className="text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none p-1.5 rounded-md"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="approuve">Approuvées</option>
                <option value="rejete">Rejetées</option>
              </select>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-6"> <SkeletonLoader rows={5} cols={4} /> </div>
            ) : error && !filteredConges.length ? (
              <div className="p-10 text-center">
                <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
                <p className="text-xl font-medium text-gray-700">{error}</p>
                <p className="text-gray-500 mt-2">Impossible de charger les demandes. Veuillez réessayer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Employé</th>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Début</th>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Fin</th>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">Motif</th>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Statut</th>
                      <th scope="col" className="py-3.5 px-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredConges.length === 0 && !isLoading ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                          <Eye size={32} className="mx-auto text-slate-400 mb-3" />
                          <p className="text-lg font-medium">Aucune demande correspondant à ce filtre.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredConges.map((conge) => (
                        <tr key={conge.id} className="hover:bg-slate-50 transition-colors duration-150">
                          <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-slate-800">{getEmployeeDisplay(conge)}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600">{formatDate(conge.date_debut)}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600">{formatDate(conge.date_fin)}</td>
                          <td className="py-4 px-4 text-sm text-gray-600 hidden md:table-cell truncate max-w-xs" title={conge.motif || ''}>{conge.motif || <span className="italic text-gray-400">Aucun</span>}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm">{getStatusBadge(conge.statut)}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-center">
                            {conge.statut === 'en_attente' ? (
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(conge.id, 'approuve')}
                                  disabled={isSubmittingAction && currentCongeForAction?.id === conge.id}
                                  className="flex items-center justify-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60"
                                  title="Approuver"
                                >
                                  {isSubmittingAction && currentCongeForAction?.id === conge.id && currentCongeForAction?.action === 'approuve' ? <Loader size={14} className="animate-spin mr-1" /> : <CheckCircle size={14} className="mr-1" />}
                                  Approuver
                                </button>
                                <button
                                  onClick={() => { openRejectionModal(conge); setCurrentCongeForAction({...conge, action: 'rejete'}); }}
                                  disabled={isSubmittingAction && currentCongeForAction?.id === conge.id}
                                  className="flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60"
                                  title="Rejeter"
                                >
                                 {isSubmittingAction && currentCongeForAction?.id === conge.id && currentCongeForAction?.action === 'rejete' ? <Loader size={14} className="animate-spin mr-1" /> : <XCircle size={14} className="mr-1" />}
                                  Rejeter
                                </button>
                              </div>
                            ) : conge.statut === 'rejete' && conge.explication ? (
                                <p className="text-xs text-gray-500 italic px-2" title={conge.explication}>
                                    Motif refus: {conge.explication.substring(0,30)}{conge.explication.length > 30 && '...'}
                                </p>
                            ) : (
                                <span className="text-xs text-gray-400 italic">Traité</span>
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
        </div>
        <footer className="text-center py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            Interface Administrateur © {new Date().getFullYear()}
        </footer>
      </div>

      <Modal 
        isOpen={showRejectionModal} 
        onClose={() => { setShowRejectionModal(false); setRejectionReason(''); setCurrentCongeForAction(null); }}
        title="Motif du Rejet"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Veuillez fournir une explication pour le rejet de la demande de congé pour <span className="font-semibold">{currentCongeForAction ? getEmployeeDisplay(currentCongeForAction) : ''}</span>.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows="4"
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-400 focus:border-red-500 transition-colors outline-none"
            placeholder="Ex: Période de forte activité, manque de personnel..."
            disabled={isSubmittingAction}
          ></textarea>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowRejectionModal(false); setRejectionReason(''); setCurrentCongeForAction(null); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200 font-medium"
              disabled={isSubmittingAction}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmitRejection}
              disabled={isSubmittingAction || !rejectionReason.trim()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-md transition-all duration-200 flex items-center font-semibold disabled:opacity-60"
            >
              {isSubmittingAction ? <Loader size={18} className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
              Confirmer le Rejet
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}