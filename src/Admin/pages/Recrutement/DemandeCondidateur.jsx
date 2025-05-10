import { useState, useEffect } from "react";
import { AlertCircle, Check, X, FileText, Mail, Phone, User, Calendar } from "lucide-react";

export default function DemandeCondidateur() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [justification, setJustification] = useState("");
  const [actionStatus, setActionStatus] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "detail"

  useEffect(() => {
    fetchCandidates();
  }, []);   

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/condidateurs",{
        method : 'GET',
          headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json',
                }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch candidates");
      }
      const data = await response.json();
      setCandidates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (id, status) => {
    try {
      const payload = { statut: status };
      if (status === "rejete") {
        payload.justification = justification;
      }

      const response = await fetch(`http://localhost:8000/api/admin/condidateurs/${id}`, {
        method: "PUT",
         headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                    'Content-Type': 'application/json',
                },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update candidate status");
      }

      // Update local state to reflect the change
      setCandidates(
        candidates.map((candidate) =>
          candidate.id === id
            ? { 
                ...candidate, 
                statut: status, 
                justification: status === "rejete" ? justification : null 
              }
            : candidate
        )
      );

      setActionStatus({ type: "success", message: `Candidat ${status} avec succès` });
      setShowModal(false);
      setJustification("");
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err) {
      setActionStatus({ type: "error", message: err.message });
      setTimeout(() => setActionStatus(null), 3000);
    }
  };

  const handleStatusChange = (candidate, status) => {
    setSelectedCandidate(candidate);
    if (status === "rejete") {
      setShowModal(true);
    } else {
      updateCandidateStatus(candidate.id, status);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "accepte":
        return "bg-green-100 text-green-800";
      case "rejete":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const viewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setViewMode("detail");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Chargement des candidats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg max-w-lg mx-auto">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <span>Erreur: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "detail" && selectedCandidate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => setViewMode("list")}
          className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          ← Retour à la liste
        </button>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold mb-2">{selectedCandidate.nom} {selectedCandidate.prenom}</h1>
            <div className="inline-block px-3 py-1 text-sm rounded-full mb-4 font-semibold mr-2 mt-2 
              ${getStatusBadgeClass(selectedCandidate.statut)}">
              {selectedCandidate.statut}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-4">
                <Mail className="text-gray-500 mr-2" />
                <span>{selectedCandidate.email}</span>
              </div>
              <div className="flex items-center mb-4">
                <Phone className="text-gray-500 mr-2" />
                <span>{selectedCandidate.telephone}</span>
              </div>
              <div className="flex items-center mb-4">
                <Calendar className="text-gray-500 mr-2" />
                <span>Postulé le: {formatDate(selectedCandidate.created_at)}</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Documents</h3>
              <div className="flex flex-col space-y-2">
                <a 
                  href={`http://localhost:8000/storage/${selectedCandidate.cv}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <FileText className="mr-2" size={16} />
                  CV
                </a>
                <a 
                  href={`http://localhost:8000/storage/${selectedCandidate.lettre_motivation}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <FileText className="mr-2" size={16} />
                  Lettre de motivation
                </a>
              </div>
            </div>
          </div>
          
          {selectedCandidate.justification && (
            <div className="mt-6 p-4 bg-red-50 rounded">
              <h3 className="font-semibold text-red-800 mb-2">Justification du rejet:</h3>
              <p>{selectedCandidate.justification}</p>
            </div>
          )}
          
          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold mb-4">Changer le statut:</h3>
            <div className="flex space-x-4">
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
                onClick={() => handleStatusChange(selectedCandidate, "accepte")}
                disabled={selectedCandidate.statut === "accepte"}
              >
                <Check size={16} className="mr-1" /> Accepter
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
                onClick={() => handleStatusChange(selectedCandidate, "rejete")}
                disabled={selectedCandidate.statut === "rejete"}
              >
                <X size={16} className="mr-1" /> Rejeter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Candidatures</h1>
      
      {actionStatus && (
        <div className={`mb-4 p-4 rounded ${
          actionStatus.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {actionStatus.message}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidat
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun candidat trouvé
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.nom} {candidate.prenom}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{candidate.email}</div>
                    <div className="text-sm text-gray-500">{candidate.telephone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(candidate.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(candidate.statut)}`}>
                      {candidate.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewCandidate(candidate)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Voir détails
                      </button>
                      {candidate.statut === "en attente" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(candidate, "accepte")}
                            className="text-green-600 hover:text-green-900"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleStatusChange(candidate, "rejete")}
                            className="text-red-600 hover:text-red-900"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rejection Justification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Justification du rejet</h3>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mb-4 h-32"
              placeholder="Veuillez fournir une justification pour le rejet de cette candidature..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowModal(false);
                  setJustification("");
                }}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                disabled={!justification.trim()}
                onClick={() => updateCandidateStatus(selectedCandidate.id, "rejete")}
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}