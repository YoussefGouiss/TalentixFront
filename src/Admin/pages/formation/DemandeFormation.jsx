import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, Loader2, Check, X, Clock, CheckCircle, XCircle, ArrowLeft, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DemandesFormationsAdmin() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false); // Global flag for any update operation
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');

  // Récupérer les demandes de formation
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("http://localhost:8000/api/admin/demandes-formations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Erreur lors de la récupération des demandes de formation");
      
      const data = await response.json();
      setDemandes(data);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Mettre à jour le statut d'une demande
  const updateDemandeStatus = async (demandeId, nouveauStatut) => {
    setUpdatingStatus(true); // Disable all action buttons while an update is in progress
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`http://localhost:8000/api/admin/demandes-formations/${demandeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          statut: nouveauStatut 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour du statut");
      }
      
      // Mettre à jour la liste des demandes pour refléter le changement
      await fetchDemandes(); 
      
      setSuccessMessage(`Statut de la demande mis à jour avec succès: ${nouveauStatut}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingStatus(false); // Re-enable action buttons on other items
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Filtrer les demandes
  const demandesFiltrees = demandes.filter(demande => {
    if (filtreStatut !== 'tous' && demande.statut !== filtreStatut) {
      return false;
    }
    if (filtreRecherche) {
      const rechercheLower = filtreRecherche.toLowerCase();
      const nomEmploye = demande.employe?.nom?.toLowerCase() || '';
      const prenomEmploye = demande.employe?.prenom?.toLowerCase() || '';
      const nomComplet = `${prenomEmploye} ${nomEmploye}`;
      const titreFormation = demande.formation?.titre?.toLowerCase() || '';
      if (!nomComplet.includes(rechercheLower) && !titreFormation.includes(rechercheLower)) {
        return false;
      }
    }
    return true;
  });

  // Check if there are any pending requests in the filtered list
  const hasAnyPendingRequests = demandesFiltrees.some(demande => demande.statut === 'en attente');

  // Classes pour les badges de statut
  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'approuvée':
        return 'bg-green-100 text-green-800 border-green-300 shadow-sm shadow-green-100';
      case 'rejetée':
        return 'bg-red-100 text-red-800 border-red-300 shadow-sm shadow-red-100';
      case 'en attente':
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  // Icônes pour les statuts
  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'approuvée':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'rejetée':
        return <XCircle size={16} className="text-red-600" />;
      case 'en attente':
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

  // Obtenir la classe de ligne spéciale pour les demandes approuvées/rejetées récemment
  const getRowClass = (statut) => {
    switch (statut) {
      case 'approuvée':
        return 'hover:bg-green-50 bg-green-50/30';
      case 'rejetée':
        return 'hover:bg-red-50 bg-red-50/30';
      default:
        return 'hover:bg-gray-50';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Demandes de Formation</h1>
          <p className="text-gray-600 mt-1">Gérez les demandes d'inscription aux formations</p>
        </div>
        <button
          onClick={() => navigate('/admin/formation')}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
          <span>Retour aux formations</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md shadow-sm flex items-center gap-3 animate-pulse">
          <div className="p-1 bg-green-100 rounded-full">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm flex items-center gap-3">
          <div className="p-1 bg-red-100 rounded-full">
            <XCircle size={18} className="text-red-600" />
          </div>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <div className="relative">
              <input
                type="text"
                value={filtreRecherche}
                onChange={(e) => setFiltreRecherche(e.target.value)}
                placeholder="Rechercher par nom d'employé ou titre de formation..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
          
          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par statut</label>
            <div className="relative">
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="tous">Tous les statuts</option>
                <option value="en attente">En attente</option>
                <option value="approuvée">Approuvées</option>
                <option value="rejetée">Rejetées</option>
              </select>
              <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement des demandes...</p>
          </div>
        </div>
      ) : demandesFiltrees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="max-w-sm mx-auto">
            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune demande trouvée</h3>
            <p className="text-gray-500">
              Aucune demande de formation ne correspond à vos critères.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date demande</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  {/* Only show the Actions column header if there's at least one pending request */}
                  {hasAnyPendingRequests && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {demandesFiltrees.map((demande) => (
                  <tr key={demande.id} className={`transition-colors ${getRowClass(demande.statut)}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-1">
                          <div className="text-sm font-medium text-gray-900">{demande.formation?.titre}</div>
                          <div className="text-xs text-gray-500">
                            {demande.formation?.date_debut && demande.formation?.date_fin && (
                              <div className="flex items-center gap-1 mt-1">
                                <Calendar size={12} className="text-gray-400" />
                                <span>
                                  {formatDate(demande.formation?.date_debut)} - {formatDate(demande.formation?.date_fin)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-1">
                          <div className="text-sm font-medium text-gray-900">
                            {demande.employe?.prenom} {demande.employe?.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {demande.employe?.email && (
                              <div className="flex items-center gap-1 mt-1">
                                <User size={12} className="text-gray-400" />
                                <span>{demande.employe?.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(demande.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatutBadgeClass(demande.statut)}`}>
                        {getStatutIcon(demande.statut)}
                        {demande.statut.charAt(0).toUpperCase() + demande.statut.slice(1)}
                      </span>
                    </td>
                    {/* Only render the Actions cell if the status is "en attente" */}
                    {demande.statut === 'en attente' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => updateDemandeStatus(demande.id, 'approuvée')}
                            disabled={updatingStatus} // Disable if any update is in progress
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                          >
                            <Check size={14} className="mr-1" />
                            Approuver
                          </button>
                          <button
                            onClick={() => updateDemandeStatus(demande.id, 'rejetée')}
                            disabled={updatingStatus} // Disable if any update is in progress
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                          >
                            <X size={14} className="mr-1" />
                            Rejeter
                          </button>
                        </div>
                      </td>
                    )}
                    {/* Add an empty cell for non-pending requests if there are still pending requests in the table */}
                    {demande.statut !== 'en attente' && hasAnyPendingRequests && (
                      <td className="px-6 py-4 whitespace-nowrap"></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}