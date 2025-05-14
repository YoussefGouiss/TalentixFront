import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Edit3, X, Check, Loader, CalendarDays, AlertTriangle, Info } from 'lucide-react';

// Re-usable animated components (assuming they are in separate files or defined above)

const SlideDown = ({ isVisible, children }) => (
  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isVisible ? 'max-h-[1000px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'}`}>
    {children}
  </div>
);

const Notification = ({ show, message, type, onDismiss }) => {
  if (!show) return null;
  return (
    <div 
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl text-sm font-medium
                  transform transition-all duration-300 ease-in-out
                  ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                  ${type === 'success' ? 'bg-green-500 text-white' : ''}
                  ${type === 'error' ? 'bg-red-500 text-white' : ''}
                  ${type === 'warning' ? 'bg-yellow-400 text-gray-800' : ''}
                  flex items-center justify-between`}
    >
      <div className="flex items-center">
        {type === 'success' && <Check size={20} className="mr-2" />}
        {type === 'error' && <AlertTriangle size={20} className="mr-2" />}
        {type === 'warning' && <Info size={20} className="mr-2" />}
        {message}
      </div>
      <button onClick={onDismiss} className="ml-4 text-current hover:opacity-75">
        <X size={18} />
      </button>
    </div>
  );
};

const SkeletonLoader = ({ rows = 3, cols = 4 }) => (
  <div className="animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`grid grid-cols-${cols + 1} gap-4 py-4 border-b border-gray-200`}>
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-4 bg-gray-200 rounded col-span-1"></div>
        ))}
        <div className="h-8 bg-gray-200 rounded w-20 col-span-1 justify-self-end"></div>
      </div>
    ))}
  </div>
);

const API_URL = 'http://localhost:8000/api'; // Your API base URL

export default function Conge() {
  const [conges, setConges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  // const [editingConge, setEditingConge] = useState(null); // For future update functionality

  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    motif: ''
  });

  const [leaveBalance, setLeaveBalance] = useState({
    jours_utilises: 0,
    solde_restant: 30, // Initial assumption
    jours_demandes_actuellement: 0,
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const getToken = () => {
    // IMPORTANT: Replace 'token' with the actual key you use for storing the employee's auth token
    return localStorage.getItem('employe_token'); 
  };

  const fetchConges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Utilisateur non authentifié.');
      }
      const response = await fetch(`${API_URL}/employe/conges`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des demandes de congé.');
      }
      
      const data = await response.json();
      setConges(data);

      // Calculate current year's approved leave days from fetched data
      const annee = new Date().getFullYear();
      const joursDejaPris = data
        .filter(conge => conge.statut === 'approuve' && new Date(conge.date_debut).getFullYear() === annee)
        .reduce((total, conge) => {
            const start = new Date(conge.date_debut);
            const end = new Date(conge.date_fin);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return total + diffDays;
        }, 0);

      setLeaveBalance(prev => ({
        ...prev,
        jours_utilises: joursDejaPris,
        solde_restant: 30 - joursDejaPris
      }));

    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies, so showNotification is stable

  useEffect(() => {
    fetchConges();
  }, [fetchConges]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, duration);
  };

  const resetForm = () => {
    setFormData({ date_debut: '', date_fin: '', motif: '' });
    // setEditingConge(null); // For future update
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic client-side validation
    if (!formData.date_debut || !formData.date_fin) {
      showNotification('Les dates de début et de fin sont requises.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (new Date(formData.date_fin) < new Date(formData.date_debut)) {
      showNotification('La date de fin ne peut pas être antérieure à la date de début.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (new Date(formData.date_debut) < new Date(new Date().setHours(0,0,0,0))) {
      showNotification('La date de début ne peut pas être dans le passé.', 'error');
      setIsSubmitting(false);
      return;
    }

    const token = getToken();
    if (!token) {
      showNotification('Utilisateur non authentifié. Veuillez vous reconnecter.', 'error');
      setIsSubmitting(false);
      return;
    }

    // const url = editingConge 
    //   ? `${API_URL}/employe/conges/${editingConge.id}` // For future update
    //   : `${API_URL}/employe/conges`;
    // const method = editingConge ? 'PUT' : 'POST';

    const url = `${API_URL}/employe/conges`;
    const method = 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = responseData.message || 'Une erreur est survenue.';
        if (responseData.errors) { // Laravel validation errors
          errorMessage = Object.values(responseData.errors).flat().join(' ');
        }
        if (response.status === 403 && responseData.jours_utilises !== undefined) {
          // Specific quota error message
           errorMessage = `Quota dépassé! ${responseData.message} (Utilisés: ${responseData.jours_utilises}, Demandés: ${responseData.jours_demandes}, Solde: ${responseData.solde_restant})`;
           setLeaveBalance({
            jours_utilises: responseData.jours_utilises,
            solde_restant: responseData.solde_restant,
            jours_demandes_actuellement: responseData.jours_demandes
          });
        }
        throw new Error(errorMessage);
      }
      
      // showNotification(editingConge ? 'Demande modifiée avec succès.' : 'Demande envoyée avec succès!', 'success');
      showNotification(responseData.message || 'Demande envoyée avec succès!', 'success');
      if (responseData.jours_utilises !== undefined) {
        setLeaveBalance({
          jours_utilises: responseData.jours_utilises + responseData.jours_demandes, // Update based on backend logic
          solde_restant: responseData.solde_restant,
          jours_demandes_actuellement: responseData.jours_demandes
        });
      }

      resetForm();
      fetchConges(); // Refresh the list

    } catch (err) {
      showNotification(err.message, 'error', 5000);
      console.error('Error submitting conge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleEdit = (conge) => { // For future update functionality
  //   if (conge.statut !== 'en_attente') {
  //     showNotification("Vous ne pouvez modifier qu'une demande 'en attente'.", "warning");
  //     return;
  //   }
  //   setFormData({
  //     date_debut: conge.date_debut.split('T')[0], // Format for date input
  //     date_fin: conge.date_fin.split('T')[0],     // Format for date input
  //     motif: conge.motif || ''
  //   });
  //   setEditingConge(conge);
  //   setShowForm(true);
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // };

  // const handleDelete = async (congeId, statut) => { // For future delete functionality
  //   if (statut !== 'en_attente') {
  //     showNotification("Vous ne pouvez supprimer qu'une demande 'en attente'.", "warning");
  //     return;
  //   }
  //   if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande de congé ?')) return;
    
  //   const token = getToken();
  //   if (!token) {
  //     showNotification('Utilisateur non authentifié.', 'error');
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`${API_URL}/employe/conges/${congeId}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Accept': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });
      
  //     const responseData = await response.json();
  //     if (!response.ok) {
  //       throw new Error(responseData.message || 'Erreur lors de la suppression.');
  //     }
      
  //     showNotification('Demande supprimée avec succès.', 'success');
  //     fetchConges(); // Refresh list
  //   } catch (err) {
  //     showNotification(err.message, 'error');
  //     console.error('Error deleting conge:', err);
  //   }
  // };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">En attente</span>;
      case 'approuve':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Approuvé</span>;
      case 'refuse':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Refusé</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <header className="bg-blue-600 text-white px-6 py-5">
          <h1 className="text-2xl font-bold">Mes Demandes de Congé</h1>
        </header>
        
        <Notification 
          show={notification.show} 
          message={notification.message} 
          type={notification.type}
          onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} 
        />
        
        <div className="p-6">
          {/* Leave Balance Info */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm text-center">
              <p className="text-sm font-medium text-blue-700">Solde Annuel Total</p>
              <p className="text-2xl font-bold text-blue-900">30 jours</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm text-center">
              <p className="text-sm font-medium text-green-700">Jours Approuvés (cette année)</p>
              <p className="text-2xl font-bold text-green-900">{leaveBalance.jours_utilises} jours</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm text-center">
              <p className="text-sm font-medium text-yellow-700">Solde Restant</p>
              <p className="text-2xl font-bold text-yellow-900">{leaveBalance.solde_restant} jours</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-end mb-6">
            <button 
              onClick={() => { setShowForm(!showForm); /* if (showForm) setEditingConge(null); */ }}
              className={`flex items-center px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 font-semibold ${
                showForm 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {showForm ? (
                <> <X className="mr-2" size={18} /> Annuler la demande </>
              ) : (
                <> <PlusCircle className="mr-2" size={18} /> Faire une demande de congé </>
              )}
            </button>
          </div>
          
          {/* Conge Form */}
          <SlideDown isVisible={showForm}>
            <div className={`bg-gray-50 rounded-lg shadow-inner p-6 mb-8`}>
              <h2 className="text-xl font-semibold mb-6 text-blue-700 border-b border-blue-200 pb-3">
                {/* {editingConge ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'} */}
                Nouvelle demande de congé
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date_debut" className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <input
                      type="date"
                      id="date_debut"
                      name="date_debut"
                      value={formData.date_debut}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-colors outline-none"
                      required
                      disabled={isSubmitting}
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    />
                  </div>
                  <div>
                    <label htmlFor="date_fin" className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input
                      type="date"
                      id="date_fin"
                      name="date_fin"
                      value={formData.date_fin}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-colors outline-none"
                      required
                      disabled={isSubmitting}
                      min={formData.date_debut || new Date().toISOString().split('T')[0]} // Prevent dates before start_date
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="motif" className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
                  <textarea
                    id="motif"
                    name="motif"
                    value={formData.motif}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-colors outline-none"
                    placeholder="Ex: Vacances annuelles, motif personnel..."
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200 flex items-center font-medium"
                    disabled={isSubmitting}
                  >
                    <X size={16} className="mr-2" />
                    Annuler
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center font-semibold ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <> <Loader size={18} className="mr-2 animate-spin" /> Envoi en cours... </>
                    ) : (
                      <> <Check size={18} className="mr-2" /> {/* {editingConge ? 'Mettre à jour' : 'Envoyer la demande'} */} Envoyer la demande </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>
          
          {/* Conges Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3.5">
              <h2 className="text-lg font-semibold text-gray-800">Historique des demandes</h2>
            </div>
            
            {isLoading ? (
              <div className="p-6"> <SkeletonLoader rows={4} cols={3} /> </div>
            ) : error && !conges.length ? ( // Show error only if no conges are loaded
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <p className="text-lg font-medium text-gray-700">{error}</p>
                <p className="text-gray-500 mt-2">Veuillez réessayer ou contacter le support.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de début</th>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de fin</th>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Motif</th>
                      <th scope="col" className="py-3.5 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      {/* <th scope="col" className="py-3.5 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conges.length === 0 && !isLoading ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <CalendarDays className="h-10 w-10 text-gray-400 mb-3" />
                            <p className="text-lg font-medium">Aucune demande de congé trouvée.</p>
                            <p className="text-sm text-gray-500">Vous pouvez faire une nouvelle demande en utilisant le bouton ci-dessus.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      conges.map((conge) => (
                        <tr key={conge.id} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{formatDate(conge.date_debut)}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{formatDate(conge.date_fin)}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell truncate max-w-xs">{conge.motif || '-'}</td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm">{getStatusBadge(conge.statut)}</td>
                          {/* <td className="py-4 px-4 whitespace-nowrap text-sm text-center">
                            {conge.statut === 'en_attente' && (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(conge)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                                  title="Modifier"
                                  // disabled={!isRouteAvailableForUpdate} // pseudo-code
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(conge.id, conge.statut)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors"
                                  title="Supprimer"
                                  // disabled={!isRouteAvailableForDelete} // pseudo-code
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td> */}
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
            Système de Gestion des Congés © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}