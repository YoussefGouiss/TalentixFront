import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner,
  FaPlus, FaEdit, FaTrashAlt, FaDollarSign, FaUserTag, FaCalendarAlt, FaTimes,FaUsers
} from 'react-icons/fa';

// --- Start of Re-usable Components (if not imported) ---
const Notification = ({ show, message, type, onDismiss }) => {
  if (!show && !message) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out
                  ${show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}
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
        <FaTimes size={18} />
      </button>
    </div>
  );
};

const SkeletonLoader = ({ rows = 3, cols = 4 }) => (
  <div className="animate-pulse p-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`grid grid-cols-${cols} gap-4 py-3.5 border-b border-[#C8D9E6]/40 items-center`}>
        {[...Array(cols -1)].map((_, j) => (
            <div key={j} className="h-5 bg-[#C8D9E6]/60 rounded col-span-1"></div>
        ))}
        <div className="h-8 bg-[#C8D9E6]/70 rounded w-full col-span-1 flex gap-2 p-1">
            <div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div>
            <div className="h-full bg-[#A0B9CD]/80 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white border border-[#C8D9E6] rounded-xl shadow-lg w-full ${maxWidth} p-6 transform transition-all max-h-[90vh] overflow-y-auto`}>
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
// --- End of Re-usable Components ---

const API_URL = 'http://localhost:8000/api/admin';

const initialPrimeFormState = {
    id: null,
    nom: '',
    montant: '',
    description: ''
};

const initialAttributionFormState = {
    id: null,
    employe_id: '',
    prime_id: '',
    date_attribution: new Date().toISOString().split('T')[0],
    montant: '', // Sera toujours déterminé par la prime sélectionnée
    remarque: ''
};


export default function PrimesAdmin() {
  const [primes, setPrimes] = useState([]);
  const [isLoadingPrimes, setIsLoadingPrimes] = useState(true);
  const [primeError, setPrimeError] = useState(null);
  const [showPrimeModal, setShowPrimeModal] = useState(false);
  const [currentPrime, setCurrentPrime] = useState(initialPrimeFormState);
  const [isSubmittingPrime, setIsSubmittingPrime] = useState(false);

  const [attributions, setAttributions] = useState([]);
  const [isLoadingAttributions, setIsLoadingAttributions] = useState(true);
  const [attributionError, setAttributionError] = useState(null);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [currentAttribution, setCurrentAttribution] = useState(initialAttributionFormState);
  const [isSubmittingAttribution, setIsSubmittingAttribution] = useState(false);

  const [employeesList, setEmployeesList] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getAdminToken = () => localStorage.getItem('admin_token');

  const showAppNotification = (message, type = 'success', duration = 4000) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false, message: '' }));
    }, duration);
  };

  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    try {
      const token = getAdminToken();
      if (!token) throw new Error('Administrateur non authentifié.');
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Erreur chargement des employés.');
      const data = await response.json();
      setEmployeesList(Array.isArray(data) ? data : []);
    } catch (err) {
      showAppNotification(`Erreur employés: ${err.message}`, 'error');
      setEmployeesList([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);


  const fetchPrimes = useCallback(async () => {
    setIsLoadingPrimes(true);
    setPrimeError(null);
    try {
      const token = getAdminToken();
      if (!token) throw new Error('Administrateur non authentifié.');
      const response = await fetch(`${API_URL}/primes`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Erreur chargement des primes.');
      const data = await response.json();
      setPrimes(Array.isArray(data) ? data : []);
    } catch (err) {
      setPrimeError(err.message);
      showAppNotification(err.message, 'error');
    } finally {
      setIsLoadingPrimes(false);
    }
  }, []);

  const handleOpenPrimeModal = (prime = null) => {
    setCurrentPrime(prime ? { ...prime, montant: prime.montant.toString() } : initialPrimeFormState);
    setShowPrimeModal(true);
  };

  const handlePrimeFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentPrime(prev => ({ ...prev, [name]: value }));
  };

  const handlePrimeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingPrime(true);
    const token = getAdminToken();
    if (!token) {
      showAppNotification('Administrateur non authentifié.', 'error');
      setIsSubmittingPrime(false);
      return;
    }
    const url = currentPrime.id ? `${API_URL}/primes/${currentPrime.id}` : `${API_URL}/primes`;
    const method = currentPrime.id ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
            nom: currentPrime.nom,
            montant: parseFloat(currentPrime.montant),
            description: currentPrime.description
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Erreur ${currentPrime.id ? 'modification' : 'création'} prime.`);
      showAppNotification(data.message || `Prime ${currentPrime.id ? 'modifiée' : 'créée'} avec succès.`, 'success');
      setShowPrimeModal(false);
      fetchPrimes();
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setIsSubmittingPrime(false);
    }
  };

  const handleDeletePrime = async (primeId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette prime ? Cette action est irréversible.")) return;
    setIsSubmittingPrime(true);
    const token = getAdminToken();
    if (!token) {
      showAppNotification('Administrateur non authentifié.', 'error');
      setIsSubmittingPrime(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/primes/${primeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur suppression prime.');
      showAppNotification(data.message || 'Prime supprimée avec succès.', 'success');
      fetchPrimes();
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setIsSubmittingPrime(false);
    }
  };

  const fetchAttributions = useCallback(async () => {
    setIsLoadingAttributions(true);
    setAttributionError(null);
    try {
      const token = getAdminToken();
      if (!token) throw new Error('Administrateur non authentifié.');
      const response = await fetch(`${API_URL}/prime-attributions`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Erreur chargement des attributions.');
      const data = await response.json();
      setAttributions(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
    } catch (err) {
      setAttributionError(err.message);
      console.error("Error fetching attributions:", err.message);
      setAttributions([]);
    } finally {
      setIsLoadingAttributions(false);
    }
  }, []);

  // MODIFIED: handleOpenAttributionModal
  const handleOpenAttributionModal = (attribution = null) => {
    if (!employeesList.length && !isLoadingEmployees) {
        fetchEmployees(); // Fetch if not already loaded
    }
    if (attribution) { // Editing existing attribution
        const primeIdForAttribution = attribution.prime_id?.toString() || attribution.prime?.id?.toString() || '';
        const selectedPrime = primes.find(p => p.id === parseInt(primeIdForAttribution));

        setCurrentAttribution({
            id: attribution.id,
            employe_id: attribution.employe_id?.toString() || attribution.employe?.id?.toString() || '',
            prime_id: primeIdForAttribution,
            date_attribution: attribution.date_attribution ? new Date(attribution.date_attribution).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            // Montant est DÉTERMINÉ par la prime sélectionnée.
            // Si la prime existe, on prend son montant. Sinon, on vide (ou on pourrait garder l'ancien si la prime n'est plus valide mais c'est moins cohérent).
            montant: selectedPrime ? selectedPrime.montant.toString() : '',
            remarque: attribution.remarque || ''
        });
    } else { // Adding new attribution
        setCurrentAttribution({
            ...initialAttributionFormState, // Reset to initial, montant will be empty
            date_attribution: new Date().toISOString().split('T')[0], // Assure une date par défaut
        });
    }
    setShowAttributionModal(true);
  };

  // MODIFIED: handleAttributionFormChange
  const handleAttributionFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentAttribution(prev => {
        const newState = { ...prev, [name]: value };

        // Si prime_id change, mettre à jour automatiquement le montant.
        if (name === 'prime_id') {
            const selectedPrime = primes.find(p => p.id === parseInt(value));
            if (selectedPrime) {
                newState.montant = selectedPrime.montant.toString();
            } else {
                newState.montant = ''; // Si aucune prime n'est sélectionnée ou valide, vider le montant
            }
        }
        // Le champ 'montant' est readOnly, donc il ne déclenchera pas de onChange pour sa propre valeur.
        return newState;
    });
  };

  const handleAttributionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingAttribution(true);
    const token = getAdminToken();
    if (!token) {
      showAppNotification('Administrateur non authentifié.', 'error');
      setIsSubmittingAttribution(false);
      return;
    }

    const selectedEmployee = employeesList.find(emp => emp.id === parseInt(currentAttribution.employe_id));

    // S'assurer qu'un montant est bien défini (via la sélection de prime)
    if (!currentAttribution.montant || parseFloat(currentAttribution.montant) <= 0) {
        showAppNotification("Veuillez sélectionner une prime valide (avec un montant).", 'warning');
        setIsSubmittingAttribution(false);
        return;
    }
    if (!selectedEmployee && !currentAttribution.id) { // Pour une nouvelle attribution, l'employé est requis
        showAppNotification("Veuillez sélectionner un employé.", 'warning');
        setIsSubmittingAttribution(false);
        return;
    }
    
    const payload = {
        // Pour une nouvelle attribution, inclure nom/prenom de l'employé si disponible
        // Pour une édition, le backend pourrait s'attendre à ne pas recevoir nom/prenom si employe_id est juste mis à jour
        // ou pourrait les ignorer si employe_id est présent. Ici, on envoie ce qu'on a.
        employe_id: parseInt(currentAttribution.employe_id), // Assurez-vous que votre backend attend employe_id
        nom: selectedEmployee ? selectedEmployee.nom : null, 
        prenom: selectedEmployee ? selectedEmployee.prenom : null,
        prime_id: parseInt(currentAttribution.prime_id),
        date_attribution: currentAttribution.date_attribution,
        montant: parseFloat(currentAttribution.montant), // Le montant est maintenant fixe
        remarque: currentAttribution.remarque
    };
    
    // Si on modifie et qu'on n'a pas l'objet employé complet (rare si on recharge bien les listes)
    // ou si le backend ne veut pas de nom/prenom en édition, on peut les supprimer.
    // Pour la route /primes/attribuer (POST), le backend Laravel attend nom, prenom, prime_id, ...
    // Pour la route /prime-attributions/{id} (PUT), il attend employe_id, prime_id, ...
    if (currentAttribution.id) { // Si c'est une modification (PUT)
        delete payload.nom;
        delete payload.prenom;
        if (!selectedEmployee) { // Si l'employé n'est pas trouvé pour une raison quelconque lors de l'édition
             // On pourrait vouloir laisser l'employe_id tel quel sans envoyer nom/prenom
        }
    } else if (!selectedEmployee) { // Si c'est une création (POST) et pas d'employé
        // Cette situation est déjà gérée par la validation plus haut
    }


    const url = currentAttribution.id ? `${API_URL}/prime-attributions/${currentAttribution.id}` : `${API_URL}/primes/attribuer`;
    const method = currentAttribution.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        let errorMessage = data.message || `Erreur ${currentAttribution.id ? 'modification' : 'attribution'} prime.`;
        if (data.errors) {
            errorMessage += " " + Object.values(data.errors).flat().join(' ');
        }
        throw new Error(errorMessage);
      }
      
      showAppNotification(data.message || `Attribution ${currentAttribution.id ? 'modifiée' : 'effectuée'} avec succès.`, 'success');
      setShowAttributionModal(false);
      fetchAttributions(); 
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setIsSubmittingAttribution(false);
    }
  };

  const handleDeleteAttribution = async (attributionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette attribution de prime ?")) return;
    setIsSubmittingAttribution(true);
    const token = getAdminToken();
    if (!token) {
      showAppNotification('Administrateur non authentifié.', 'error');
      setIsSubmittingAttribution(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/prime-attributions/${attributionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur suppression attribution.');
      showAppNotification(data.message || 'Attribution supprimée avec succès.', 'success');
      fetchAttributions();
    } catch (err) {
      showAppNotification(err.message, 'error');
    } finally {
      setIsSubmittingAttribution(false);
    }
  };

  useEffect(() => {
    fetchPrimes();
    fetchAttributions();
    fetchEmployees();
  }, [fetchPrimes, fetchAttributions, fetchEmployees]); // Dependencies for re-fetching

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' && typeof amount !== 'string') return 'N/A';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numAmount);
  };

  return (
    <div className="min-h-screen bg-[#F5EFEB]">
      <Notification 
        show={notification.show} 
        message={notification.message} 
        type={notification.type}
        onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} 
      />
      
      <div className="bg-[#F5EFEB]/80 border-b border-[#C8D9E6] shadow-sm">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#2F4156]">Gestion des Primes</h1>
        </header>
      </div>
        
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section: Prime Definitions */}
        <section>
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-[#2F4156]">Définitions des Primes</h2>
                <button
                    onClick={() => handleOpenPrimeModal()}
                    className="px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium flex items-center"
                >
                    <FaPlus className="mr-2" /> Ajouter une Prime
                </button>
            </div>
            <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
                {isLoadingPrimes ? (
                    <SkeletonLoader rows={3} cols={5} />
                ) : primeError && !primes.length ? (
                    <div className="p-6 text-center text-red-500">{primeError}</div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                    <thead className="bg-[#C8D9E6]/30">
                        <tr>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Nom</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Montant Défaut</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider hidden md:table-cell">Description</th>
                        <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C8D9E6]/70">
                        {primes.length === 0 ? (
                        <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500">Aucune prime définie.</td></tr>
                        ) : (
                        primes.map((prime) => (
                            <tr key={prime.id} className="hover:bg-[#C8D9E6]/20 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]">{prime.nom}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatCurrency(prime.montant)}</td>
                            <td className="py-3 px-4 text-sm text-[#567C8D] hidden md:table-cell truncate max-w-md">{prime.description || <span className="italic text-gray-400">N/A</span>}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                                <button onClick={() => handleOpenPrimeModal(prime)} className="text-blue-600 hover:text-blue-800 mr-3" title="Modifier"><FaEdit /></button>
                                <button onClick={() => handleDeletePrime(prime.id)} className="text-red-600 hover:text-red-800" title="Supprimer"><FaTrashAlt /></button>
                            </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                    </table>
                </div>
                )}
            </div>
        </section>

        {/* Section: Prime Attributions */}
        <section>
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-[#2F4156]">Attributions des Primes</h2>
                <button
                    onClick={() => handleOpenAttributionModal()}
                    disabled={primes.length === 0 || employeesList.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title={(primes.length === 0 || employeesList.length === 0) ? "Veuillez d'abord définir une prime et s'assurer que la liste des employés est chargée" : "Attribuer une prime"}
                >
                    <FaUserTag className="mr-2" /> Attribuer une Prime
                </button>
            </div>
            <div className="bg-white border border-[#C8D9E6] rounded-lg shadow-md overflow-hidden">
                {isLoadingAttributions ? (
                    <SkeletonLoader rows={3} cols={7}/>
                ) : attributionError && !attributions.length ? (
                     <div className="p-6 text-center">
                        <p className="text-red-500">{attributionError}</p>
                        <p className="text-sm text-gray-500 mt-1">Assurez-vous que l'endpoint `/api/admin/prime-attributions` est configuré.</p>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                    <thead className="bg-[#C8D9E6]/30">
                        <tr>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Employé</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Prime</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Montant Attribué</th>
                        <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Date</th>
                        <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C8D9E6]/70">
                        {attributions.length === 0 ? (
                        <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">Aucune prime attribuée.</td></tr>
                        ) : (
                        attributions.map((attr) => (
                            <tr key={attr.id} className="hover:bg-[#C8D9E6]/20 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-[#2F4156]">{attr.employe ? `${attr.employe.nom} ${attr.employe.prenom}` : `ID Emp: ${attr.employe_id}`}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{attr.prime ? attr.prime.nom : `ID Prime: ${attr.prime_id}`}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-green-700 font-semibold">{formatCurrency(attr.montant)}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-[#567C8D]">{formatDate(attr.date_attribution)}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                                <button onClick={() => handleOpenAttributionModal(attr)} className="text-blue-600 hover:text-blue-800 mr-3" title="Modifier"><FaEdit /></button>
                                <button onClick={() => handleDeleteAttribution(attr.id)} className="text-red-600 hover:text-red-800" title="Supprimer"><FaTrashAlt /></button>
                            </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                    </table>
                </div>
                )}
            </div>
        </section>

      </main>
      <div className="border-t border-[#C8D9E6] bg-[#F5EFEB]/80">
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-[#567C8D]">
            Interface Administrateur Primes © {new Date().getFullYear()}
        </footer>
      </div>

      {/* Prime Definition Modal (unchanged) */}
      <Modal isOpen={showPrimeModal} onClose={() => setShowPrimeModal(false)} title={currentPrime.id ? "Modifier la Prime" : "Ajouter une Prime"} maxWidth="max-w-lg">
        <form onSubmit={handlePrimeSubmit} className="space-y-4">
            <div>
                <label htmlFor="prime-nom" className="block text-sm font-medium text-[#2F4156] mb-1">Nom de la prime</label>
                <input type="text" name="nom" id="prime-nom" value={currentPrime.nom} onChange={handlePrimeFormChange} required
                       className="w-full p-2.5 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-[#2F4156]"/>
            </div>
            <div>
                <label htmlFor="prime-montant" className="block text-sm font-medium text-[#2F4156] mb-1">Montant (par défaut)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaDollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="number" name="montant" id="prime-montant" value={currentPrime.montant} onChange={handlePrimeFormChange} required min="0" step="0.01"
                        className="w-full p-2.5 pl-10 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-[#2F4156]"/>
                </div>
            </div>
            <div>
                <label htmlFor="prime-description" className="block text-sm font-medium text-[#2F4156] mb-1">Description (optionnel)</label>
                <textarea name="description" id="prime-description" value={currentPrime.description} onChange={handlePrimeFormChange} rows="3"
                          className="w-full p-2.5 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-[#2F4156]"></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#C8D9E6]">
                <button type="button" onClick={() => setShowPrimeModal(false)} disabled={isSubmittingPrime}
                        className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md transition-colors font-medium text-sm disabled:opacity-70">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmittingPrime || !currentPrime.nom || !currentPrime.montant}
                        className="px-4 py-2 bg-[#567C8D] hover:bg-[#4A6582] text-white rounded-md shadow-sm transition-colors font-semibold text-sm flex items-center disabled:opacity-60">
                    {isSubmittingPrime ? <FaSpinner className="animate-spin mr-2" /> : (currentPrime.id ? <FaCheckCircle className="mr-2"/> : <FaPlus className="mr-2"/>)}
                    {currentPrime.id ? "Enregistrer Modifications" : "Créer Prime"}
                </button>
            </div>
        </form>
      </Modal>

      {/* MODIFIED: Prime Attribution Modal - Montant is readOnly and auto-filled */}
      <Modal isOpen={showAttributionModal} onClose={() => setShowAttributionModal(false)} title={currentAttribution.id ? "Modifier l'Attribution" : "Attribuer une Prime"} maxWidth="max-w-xl">
        <form onSubmit={handleAttributionSubmit} className="space-y-4">
            <div>
                <label htmlFor="attr-employe-id" className="block text-sm font-medium text-[#2F4156] mb-1">Employé</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUsers className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        name="employe_id"
                        id="attr-employe-id"
                        value={currentAttribution.employe_id}
                        onChange={handleAttributionFormChange}
                        required
                        disabled={isLoadingEmployees}
                        className="w-full p-2.5 pl-10 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-[#2F4156] bg-white appearance-none"
                    >
                        <option value="" disabled>
                            {isLoadingEmployees ? "Chargement des employés..." : "Sélectionner un employé..."}
                        </option>
                        {!isLoadingEmployees && employeesList.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.nom} {emp.prenom}
                            </option>
                        ))}
                    </select>
                </div>
                {isLoadingEmployees && <FaSpinner className="animate-spin text-sm text-[#567C8D] mt-1" />}
            </div>

            <div>
                <label htmlFor="attr-prime-id" className="block text-sm font-medium text-[#2F4156] mb-1">Type de Prime</label>
                <select
                    name="prime_id"
                    id="attr-prime-id"
                    value={currentAttribution.prime_id}
                    onChange={handleAttributionFormChange} // This updates montant
                    required
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-[#2F4156] bg-white"
                >
                    <option value="" disabled>Sélectionner une prime...</option>
                    {primes.map(p => <option key={p.id} value={p.id}>{p.nom} ({formatCurrency(p.montant)})</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="attr-montant" className="block text-sm font-medium text-[#2F4156] mb-1">Montant Attribué</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaDollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="number"
                            name="montant"
                            id="attr-montant"
                            value={currentAttribution.montant} // Géré par l'état, auto-rempli
                            readOnly // Empêche la modification par l'utilisateur
                            required // Toujours requis pour la soumission
                            min="0"
                            step="0.01"
                            className="w-full p-2.5 pl-10 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-[#2F4156] bg-gray-100 cursor-not-allowed" // Style pour readOnly
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="attr-date" className="block text-sm font-medium text-[#2F4156] mb-1">Date d'Attribution</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="date" name="date_attribution" id="attr-date" value={currentAttribution.date_attribution} onChange={handleAttributionFormChange} required
                            className="w-full p-2.5 pl-10 border border-[#C8D9E6] rounded-md shadow-sm focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] text-[#2F4156]"/>
                    </div>
                </div>
            </div>

        

            <div className="flex justify-end gap-3 pt-4 border-t border-[#C8D9E6]">
                <button type="button" onClick={() => setShowAttributionModal(false)} disabled={isSubmittingAttribution}
                        className="px-4 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#2F4156] rounded-md transition-colors font-medium text-sm disabled:opacity-70">
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={
                        isSubmittingAttribution ||
                        !currentAttribution.employe_id ||
                        !currentAttribution.prime_id ||
                        !currentAttribution.montant || // S'assurer qu'un montant est défini
                        parseFloat(currentAttribution.montant) <= 0 || // S'assurer que le montant est positif
                        !currentAttribution.date_attribution ||
                        isLoadingEmployees
                    }
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-colors font-semibold text-sm flex items-center disabled:opacity-60">
                    {isSubmittingAttribution ? <FaSpinner className="animate-spin mr-2" /> : (currentAttribution.id ? <FaCheckCircle className="mr-2"/> : <FaUserTag className="mr-2"/>)}
                    {currentAttribution.id ? "Enregistrer Modifications" : "Attribuer Prime"}
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
}