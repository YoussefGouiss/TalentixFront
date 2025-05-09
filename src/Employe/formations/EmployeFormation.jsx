import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, User, Search, Clock, CheckCircle, XCircle, Filter, Loader2 } from 'lucide-react';

export default function EmployeFormations() {
  const [formations, setFormations] = useState([]);
  const [mesFormations, setMesFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInscription, setLoadingInscription] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [activeTab, setActiveTab] = useState('disponibles');

  // Récupérer les formations disponibles
  const fetchFormations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("employe_token");
      const response = await fetch("http://localhost:8000/api/employe/formations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Erreur lors de la récupération des formations");
      
      const data = await response.json();
      setFormations(data);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer mes demandes de formations
  const fetchMesFormations = async () => {
    try {
      const token = localStorage.getItem("employe_token");
      const response = await fetch("http://localhost:8000/api/employe/demandes-formations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Erreur lors de la récupération de vos formations");
      
      const data = await response.json();
      setMesFormations(data);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchFormations();
    fetchMesFormations();
  }, []);

  // S'inscrire à une formation
  const handleInscription = async (formationId) => {
    setLoadingInscription(true);
    try {
      const token = localStorage.getItem("employe_token");
      const response = await fetch(`http://localhost:8000/api/employe/formations/${formationId}/demande`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          formation_id: formationId 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'inscription à la formation");
      }
      
      const data = await response.json();
      
      // Mettre à jour les listes
      await fetchMesFormations();
      
      setSuccessMessage("Demande d'inscription envoyée avec succès");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingInscription(false);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Vérifier si l'employé est déjà inscrit à une formation
  const isDejaInscrit = (formationId) => {
    return mesFormations.some(demande => 
      demande.formation?.id === formationId
    );
  };

  // Obtenir le statut d'une demande de formation
  const getDemandeStatut = (formationId) => {
    const demande = mesFormations.find(d => d.formation?.id === formationId);
    return demande ? demande.statut : null;
  };

  // Classes pour les badges de statut
  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'approuvée':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejetée':
        return 'bg-red-50 text-red-700 border-red-200';
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

  // Filtrer les formations
  const formationsFiltrees = activeTab === 'disponibles' 
    ? formations.filter(formation => {
        // Filtrer par recherche
        if (filtreRecherche) {
          const rechercheLower = filtreRecherche.toLowerCase();
          if (!formation.titre.toLowerCase().includes(rechercheLower)) {
            return false;
          }
        }
        
        return true;
      })
    : mesFormations.filter(demande => {
        // Filtrer par statut
        if (filtreStatut !== 'tous' && demande.statut !== filtreStatut) {
          return false;
        }
        
        // Filtrer par recherche
        if (filtreRecherche) {
          const rechercheLower = filtreRecherche.toLowerCase();
          if (!demande.formation?.titre.toLowerCase().includes(rechercheLower)) {
            return false;
          }
        }
        
        return true;
      });

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Formations</h1>
        <p className="text-gray-600 mt-1">Découvrez et inscrivez-vous aux formations disponibles</p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md shadow-sm flex items-center gap-3">
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

      {/* Onglets */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'disponibles'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('disponibles')}
        >
          Formations disponibles
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'mes-formations'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('mes-formations')}
        >
          Mes formations
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <div className="relative">
              <input
                type="text"
                value={filtreRecherche}
                onChange={(e) => setFiltreRecherche(e.target.value)}
                placeholder="Rechercher par titre de formation..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
          
          {activeTab === 'mes-formations' && (
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
          )}
        </div>
      </div>

      {/* Liste des formations */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement des formations...</p>
          </div>
        </div>
      ) : formationsFiltrees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="max-w-sm mx-auto">
            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune formation trouvée</h3>
            <p className="text-gray-500">
              {activeTab === 'disponibles'
                ? "Aucune formation disponible pour le moment."
                : "Vous n'avez pas encore de demandes de formation."}
            </p>
          </div>
        </div>
      ) : activeTab === 'disponibles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formationsFiltrees.map((formation) => {
            const inscriptionStatut = getDemandeStatut(formation.id);
            const dejaInscrit = isDejaInscrit(formation.id);
            
            return (
              <div 
                key={formation.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex-1">{formation.titre}</h3>
                  </div>
                  
                  {/* Détails de la formation */}
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Calendar size={18} className="mr-2 text-blue-500" />
                      <span>Du {formatDate(formation.date_debut)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar size={18} className="mr-2 text-blue-500" />
                      <span>Au {formatDate(formation.date_fin)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 line-clamp-3">
                      {formation.description || "Aucune description disponible pour cette formation."}
                    </p>
                  </div>
                  
                  {/* Bouton d'inscription ou statut */}
                  <div className="mt-auto">
                    {dejaInscrit ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatutBadgeClass(inscriptionStatut)}`}>
                          {getStatutIcon(inscriptionStatut)}
                          {inscriptionStatut === 'en attente' ? 'Demande en attente' : 
                           inscriptionStatut === 'approuvée' ? 'Demande approuvée' : 'Demande rejetée'}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInscription(formation.id)}
                        disabled={loadingInscription}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                      >
                        {loadingInscription ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Inscription...</span>
                          </>
                        ) : (
                          <>
                            <User size={18} />
                            <span>S'inscrire</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formationsFiltrees.map((demande) => (
                  <tr key={demande.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{demande.formation?.titre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        Du {formatDate(demande.formation?.date_debut)}
                        <br />
                        Au {formatDate(demande.formation?.date_fin)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatutBadgeClass(demande.statut)}`}>
                        {getStatutIcon(demande.statut)}
                        {demande.statut.charAt(0).toUpperCase() + demande.statut.slice(1)}
                      </span>
                    </td>
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