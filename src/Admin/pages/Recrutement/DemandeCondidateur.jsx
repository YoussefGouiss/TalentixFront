import React, { useState, useEffect } from 'react';
import {
  FaExclamationCircle, FaCheck, FaTimes, FaFileAlt, FaEnvelope, FaPhone, FaUser, FaCalendarAlt,
  FaSpinner, FaCheckCircle, FaTimesCircle, FaEye, FaArrowLeft, FaUserTie
} from 'react-icons/fa';

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

// Themed Modal for Rejection
const RejectionModal = ({ isOpen, onClose, title, children, onSubmit, justification, setJustification, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg w-full max-w-md p-6 transform transition-all">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#C8D9E6]">
          <h3 className="text-xl font-semibold text-[#2F4156]">{title}</h3>
          <button onClick={onClose} className="text-[#567C8D] hover:text-[#2F4156]">
            <FaTimesCircle size={24} />
          </button>
        </div>
        <div className="space-y-4">
          {children}
          <textarea
            className="w-full p-2.5 border border-[#C8D9E6] rounded-md shadow-sm h-28
                       focus:ring-1 focus:ring-red-500 focus:border-red-500 
                       transition-colors outline-none text-[#2F4156] bg-white"
            placeholder="Veuillez fournir une justification pour le rejet..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#C8D9E6]">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md 
                         transition-colors duration-200 flex items-center font-medium text-sm disabled:opacity-70"
            > <FaTimes size={16} className="mr-2" /> Annuler </button>
            <button
              onClick={onSubmit}
              disabled={!justification.trim() || isSubmitting}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-md 
                         transition-all duration-200 flex items-center font-semibold text-sm disabled:opacity-60"
            >
              {isSubmitting ? <FaSpinner size={18} className="animate-spin mr-2" /> : <FaCheckCircle size={18} className="mr-2" />}
              Confirmer Rejet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function DemandeCondidateur() { // <<< Make sure this line is correct
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [justification, setJustification] = useState("");
  const [actionStatus, setActionStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const API_URL = "http://localhost:8000/api/admin/condidateurs";

  useEffect(() => {
    fetchCandidates();
  }, []);   

  useEffect(() => {
    let timer;
    if (actionStatus.message) {
      timer = setTimeout(() => setActionStatus({ type: '', message: '' }), 3000);
    }
    return () => clearTimeout(timer);
  }, [actionStatus]);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method : 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Impossible de récupérer les candidatures.");
      }
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) { // Corrected: was missing opening brace {
      setError(err.message);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

    const updateCandidateStatus = async (id, status) => {
    setIsSubmitting(true);
    setActionStatus({ type: '', message: '' }); 

    try {
      const payload = { statut: status };
      if (status === "rejete") {
        if (!justification.trim()) {
          setActionStatus({ type: "error", message: "La justification est requise pour le rejet." });
          setIsSubmitting(false);
          return;
        }
        payload.justification = justification;
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({ message: "Réponse invalide du serveur." }));
      
      // It's still good to keep this log for future debugging if needed
      // console.log(`API Update Response for ID ${id} (Status: ${response.status}):`, responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Échec de la mise à jour du statut (HTTP ${response.status}).`);
      }

      // --- State Update Logic ---
      setCandidates(prevCandidates =>
        prevCandidates.map(candidate => {
          if (candidate.id === id) {
            // Merge existing candidate data with the (potentially partial) response data
            return { ...candidate, ...responseData }; // <<< MODIFIED HERE
          }
          return candidate;
        })
      );

      // Update selectedCandidate if it's the one being updated and currently selected
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate(prevSelected => {
          if (prevSelected && prevSelected.id === id) {
            // Merge existing selected candidate data with the (potentially partial) response data
            return { ...prevSelected, ...responseData }; // <<< MODIFIED HERE
          }
          return prevSelected; 
        });
      }

      setActionStatus({ type: "success", message: `Candidat ${status === 'accepte' ? 'accepté(e)' : 'rejeté(e)'} avec succès` });
      
      if (showRejectionModal && status === "rejete") {
        setShowRejectionModal(false);
      }
      if (status === "rejete") { 
        setJustification("");
      }

    } catch (err) {
      console.error("Error updating candidate status:", err);
      setActionStatus({ type: "error", message: err.message || "Une erreur est survenue lors de la mise à jour." });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleStatusChange = (candidate, status) => {
    setSelectedCandidate(candidate);
    if (status === "rejete") {
      setJustification(candidate.justification || ""); 
      setShowRejectionModal(true);
    } else {
      updateCandidateStatus(candidate.id, status);
    }
  };

  const handleSubmitRejection = () => {
    if (selectedCandidate) {
      updateCandidateStatus(selectedCandidate.id, "rejete");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "accepte":
        return "text-green-700 bg-green-100 border-green-300";
      case "rejete":
        return "text-red-700 bg-red-100 border-red-300";
      default: 
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
    }
  };

  const formatStatusText = (status) => {
    if (typeof status === 'string' && status.length > 0) {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
    return 'Non défini'; 
  };

  const viewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setViewMode("detail");
    window.scrollTo(0,0);
  };

  const MainContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <FaSpinner size={32} className="animate-spin text-[#567C8D] mx-auto mb-3" />
            <p className="text-[#567C8D]">Chargement des candidatures...</p>
          </div>
        </div>
      );
    }

    if (error && !loading) {
      return (
        <div className="p-10 text-center flex flex-col items-center">
          <FaExclamationCircle size={40} className="mx-auto text-red-500 mb-4" />
          <p className="text-xl font-medium text-[#2F4156]">{error}</p>
          <p className="text-[#567C8D] mt-2">Impossible de charger les données. Veuillez réessayer.</p>
          <button
              onClick={fetchCandidates}
              className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
          > Réessayer </button>
        </div>
      );
    }

    if (viewMode === "detail" && selectedCandidate) {
      return (
        <div className="p-6">
          <button 
            onClick={() => setViewMode("list")}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md shadow-sm transition-colors text-sm font-medium"
          > <FaArrowLeft size={16} /> Retour à la liste </button>
          
          <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg p-6 md:p-8">
            <div className="border-b border-[#C8D9E6]/70 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#2F4156]">{selectedCandidate.nom} {selectedCandidate.prenom}</h2>
                <p className="text-sm text-[#567C8D]">{selectedCandidate.poste_candidate || 'Poste non spécifié'}</p>
              </div>
              <span className={`mt-2 sm:mt-0 inline-block px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(selectedCandidate.statut)}`}>
                {formatStatusText(selectedCandidate.statut)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
              <div className="space-y-3">
                <div className="flex items-center text-[#2F4156]">
                  <FaEnvelope className="text-[#567C8D] mr-3" size={15}/>
                  <a href={`mailto:${selectedCandidate.email}`} className="hover:underline">{selectedCandidate.email}</a>
                </div>
                <div className="flex items-center text-[#2F4156]">
                  <FaPhone className="text-[#567C8D] mr-3" size={15}/>
                  <span>{selectedCandidate.telephone}</span>
                </div>
                <div className="flex items-center text-[#2F4156]">
                  <FaCalendarAlt className="text-[#567C8D] mr-3" size={15}/>
                  <span>Postulé le: {formatDate(selectedCandidate.created_at)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-[#2F4156] mb-1">Documents:</h3>
                {selectedCandidate.cv && (
                  <a 
                    href={`http://localhost:8000/storage/${selectedCandidate.cv}`} 
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center text-[#567C8D] hover:text-[#2F4156] hover:underline py-1"
                  > <FaFileAlt className="mr-2 text-blue-500" size={16} /> CV </a>
                )}
                {selectedCandidate.lettre_motivation && (
                  <a 
                    href={`http://localhost:8000/storage/${selectedCandidate.lettre_motivation}`} 
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center text-[#567C8D] hover:text-[#2F4156] hover:underline py-1"
                  > <FaFileAlt className="mr-2 text-blue-500" size={16} /> Lettre de motivation </a>
                )}
                 {!selectedCandidate.cv && !selectedCandidate.lettre_motivation && (
                    <p className="text-xs text-[#567C8D] italic">Aucun document fourni.</p>
                )}
              </div>
            </div>
            
            {selectedCandidate.statut === 'rejete' && selectedCandidate.justification && (
              <div className="mt-6 p-3 bg-red-100 rounded-md border border-red-200">
                <h4 className="font-semibold text-red-700 text-sm mb-1">Justification du rejet:</h4>
                <p className="text-sm text-red-600">{selectedCandidate.justification}</p>
              </div>
            )}
            
           {selectedCandidate.statut === "en attente" && (
            <div className="mt-8 border-t border-[#C8D9E6]/70 pt-6">
              <h3 className="font-semibold text-[#2F4156] mb-3">Changer le statut:</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  className="flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => handleStatusChange(selectedCandidate, "accepte")}
                  disabled={isSubmitting}
                >
                  {isSubmitting && selectedCandidate.statut === 'en attente' ? <FaSpinner size={16} className="animate-spin mr-2" /> : <FaCheck size={16} className="mr-2" />} Accepter
                </button>
                <button
                  className="flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-md shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => handleStatusChange(selectedCandidate, "rejete")}
                  disabled={isSubmitting}
                >
                  <FaTimes size={16} className="mr-2" /> Rejeter
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      );
    }

    // List View
    return (
      <div className="p-6">
        <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#C8D9E6]/30">
                <tr>
                  {['Candidat', 'Contact', 'Date Postulation', 'Statut', 'Actions'].map(header => (
                    <th key={header} className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C8D9E6]/70">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaUserTie size={36} className="text-[#C8D9E6] mb-3" />
                        <p className="text-lg font-medium text-[#2F4156]">Aucune candidature</p>
                        <p className="text-sm text-[#567C8D]">Il n'y a pas de candidatures à afficher.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 bg-[#C8D9E6]/50 rounded-full flex items-center justify-center">
                            <FaUserTie className="h-4 w-4 text-[#567C8D]" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-[#2F4156]">{candidate.nom} {candidate.prenom}</div>
                            <div className="text-xs text-[#567C8D]">{candidate.poste_candidate || 'Non spécifié'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm text-[#2F4156]">{candidate.email}</div>
                        <div className="text-xs text-[#567C8D]">{candidate.telephone}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">
                        {formatDate(candidate.created_at)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(candidate.statut)}`}>
                          {formatStatusText(candidate.statut)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCandidate(candidate)}
                            className="p-1.5 text-[#567C8D] rounded-md hover:bg-[#567C8D]/20 hover:text-[#2F4156] transition-colors"
                            title="Voir détails"
                          > <FaEye size={16} /> </button>
                          
                          {candidate.statut === "en attente" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(candidate, "accepte")}
                                disabled={isSubmitting && selectedCandidate?.id === candidate.id}
                                className="p-1.5 text-green-600 rounded-md hover:bg-green-500/20 hover:text-green-700 transition-colors disabled:opacity-50"
                                title="Accepter"
                              > <FaCheck size={16} /> </button>
                              <button
                                onClick={() => handleStatusChange(candidate, "rejete")}
                                disabled={isSubmitting && selectedCandidate?.id === candidate.id}
                                className="p-1.5 text-red-600 rounded-md hover:bg-red-500/20 hover:text-red-700 transition-colors disabled:opacity-50"
                                title="Rejeter"
                              > <FaTimes size={16} /> </button>
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
        </div>
      </div>
    );
  };

  return (
    <>
      <ThemedNotification 
        message={actionStatus.message} 
        type={actionStatus.type || 'info'}
        show={!!actionStatus.message} 
        onDismiss={() => setActionStatus({ type: '', message: '' })}
      />
      
      <div className="max-w-6xl mx-auto my-4 md:my-6 bg-white rounded-xl shadow-lg overflow-hidden border border-[#C8D9E6]">
        <header className="bg-[#F5EFEB]/80 text-[#2F4156] px-6 py-4 border-b border-[#C8D9E6]">
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Candidatures</h1>
          <p className="text-sm text-[#567C8D] mt-0.5">Consultez et gérez les candidatures reçues.</p>
        </header>
        
        <MainContent />

        <footer className="text-center py-3 border-t border-[#C8D9E6] bg-[#F5EFEB]/80 text-xs text-[#567C8D]">
            Gestion des Candidatures © {new Date().getFullYear()}
        </footer>
      </div>

      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setJustification("");
          setSelectedCandidate(null);
        }}
        title="Justification du Rejet"
        onSubmit={handleSubmitRejection}
        justification={justification}
        setJustification={setJustification}
        isSubmitting={isSubmitting}
      >
        <p className="text-sm text-[#567C8D]">
          Pour la candidature de <span className="font-semibold text-[#2F4156]">{selectedCandidate?.nom} {selectedCandidate?.prenom}</span>.
        </p>
      </RejectionModal>
    </>
  );
}