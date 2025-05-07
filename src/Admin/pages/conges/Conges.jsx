import { useState, useEffect } from 'react';
import { Check, X, Calendar, Clock, User, MessageCircle } from 'lucide-react';

export default function Conges() {
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConge, setSelectedConge] = useState(null);
  const [explication, setExplication] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Simuler le chargement des données depuis l'API
  useEffect(() => {
    // Simule un appel API avec des données factices
    setTimeout(() => {
      const mockConges = [
        {
          id: 1,
          employe_nom: 'Dupont',
          employe_prenom: 'Jean',
          date_debut: '2025-05-10',
          date_fin: '2025-05-15',
          motif: 'Vacances',
          statut: 'en_attente',
          created_at: '2025-05-01'
        },
        {
          id: 2,
          employe_nom: 'Martin',
          employe_prenom: 'Sophie',
          date_debut: '2025-05-15',
          date_fin: '2025-05-16',
          motif: 'Rendez-vous médical',
          statut: 'en_attente',
          created_at: '2025-05-02'
        },
        {
          id: 3,
          employe_nom: 'Durand',
          employe_prenom: 'Marie',
          date_debut: '2025-06-01',
          date_fin: '2025-06-15',
          motif: 'Congés d\'été',
          statut: 'en_attente',
          created_at: '2025-05-03'
        }
      ];
      setConges(mockConges);
      setLoading(false);
    }, 1000);
  }, []);

  const openModal = (conge) => {
    setSelectedConge(conge);
    setExplication('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedConge(null);
    setExplication('');
  };

  const updateCongeStatus = (status) => {
    if (status === 'rejete' && !explication) {
      setErrorMessage('Une explication est requise pour un refus.');
      return;
    }

    setErrorMessage('');
    
    // Simuler l'appel à l'API pour mettre à jour le statut
    const updatedConges = conges.map(conge => {
      if (conge.id === selectedConge.id) {
        return {
          ...conge,
          statut: status,
          explication: status === 'rejete' ? explication : null
        };
      }
      return conge;
    });

    // Simuler le délai d'attente de l'API
    setTimeout(() => {
      setConges(updatedConges);
      setSuccessMessage(`La demande de congé a été ${status === 'approuve' ? 'approuvée' : 'rejetée'} avec succès.`);
      closeModal();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }, 500);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approuve':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejete':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-gray-500">Chargement des données...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 text-red-600 rounded-md">
        Une erreur est survenue lors du chargement des données.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 pb-2 border-b border-gray-200">Gestion des demandes de congés</h2>
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}

      {conges.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune demande de congé en attente.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de demande</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {conges.map((conge) => (
                <tr key={conge.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">
                        {conge.employe_prenom} {conge.employe_nom}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-500">
                        {formatDate(conge.date_debut)} - {formatDate(conge.date_fin)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{conge.motif}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(conge.statut)}`}>
                      {conge.statut === 'approuve' ? 'Approuvé' : 
                       conge.statut === 'rejete' ? 'Rejeté' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-500">{formatDate(conge.created_at)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {conge.statut === 'en_attente' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(conge)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Traiter
                        </button>
                      </div>
                    )}
                    {conge.statut !== 'en_attente' && (
                      <span className="text-gray-400">Traité</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de traitement */}
      {modalOpen && selectedConge && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Traiter la demande de congé
              </h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Employé</p>
                  <p className="font-medium">{selectedConge.employe_prenom} {selectedConge.employe_nom}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Période</p>
                  <p className="font-medium">{formatDate(selectedConge.date_debut)} - {formatDate(selectedConge.date_fin)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Motif</p>
                  <p className="font-medium">{selectedConge.motif}</p>
                </div>
                
                <div>
                  <label htmlFor="explication" className="block text-sm font-medium text-gray-700 mb-1">
                    Explication (obligatoire en cas de refus)
                  </label>
                  <textarea
                    id="explication"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Veuillez saisir une explication en cas de refus..."
                    value={explication}
                    onChange={(e) => setExplication(e.target.value)}
                  ></textarea>
                  
                  {errorMessage && (
                    <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={closeModal}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={() => updateCongeStatus('rejete')}
              >
                <X className="inline-block h-4 w-4 mr-1" />
                Refuser
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                onClick={() => updateCongeStatus('approuve')}
              >
                <Check className="inline-block h-4 w-4 mr-1" />
                Approuver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}