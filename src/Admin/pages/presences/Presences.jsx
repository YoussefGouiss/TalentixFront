import { useState, useEffect } from 'react';
import { Plus, Check, X, Filter, Calendar, RefreshCcw, Search, ChevronDown, UserPlus, HelpCircle } from 'lucide-react';

// Mock data for testing (similar structure to EmployeeManagement's mock for consistency)
const mockEmployeesData = [
  { id: 1, nom: 'Jean Dupont', email: 'jean@example.com' },
  { id: 2, nom: 'Sophie Martin', email: 'sophie@example.com' },
  { id: 3, nom: 'Thomas Bernard', email: 'thomas@example.com' },
  { id: 4, nom: 'Marie Leroy', email: 'marie@example.com' }
];

const mockAbsencesData = [
  { id: 1, employe_id: 1, date_debut: '2025-05-01', date_fin: '2025-05-03', motif: 'Maladie', justifiee: true, impact_salaire: false },
  { id: 2, employe_id: 2, date_debut: '2025-05-02', date_fin: '2025-05-04', motif: 'Congé personnel', justifiee: false, impact_salaire: true },
  { id: 3, employe_id: 3, date_debut: '2025-05-05', date_fin: '2025-05-06', motif: 'Rendez-vous médical', justifiee: null, impact_salaire: null },
  { id: 4, employe_id: 1, date_debut: '2025-06-10', date_fin: '2025-06-10', motif: 'Formation', justifiee: true, impact_salaire: false },
  { id: 5, employe_id: 4, date_debut: '2025-06-15', date_fin: '2025-06-17', motif: 'Vacances', justifiee: true, impact_salaire: false },
];

// Animated form transition component
const SlideDown = ({ isVisible, children }) => {
  return (
    <div 
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

// Animated notification component
const Notification = ({ show, message, type }) => {
  return (
    <div 
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out ${
        show 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-12 opacity-0 pointer-events-none'
      } ${
        type === 'success' 
          ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
          : 'bg-red-100 text-red-800 border-l-4 border-red-500'
      }`}
    >
      <div className="flex items-center">
        {type === 'success' ? (
          <Check className="h-5 w-5 mr-2" />
        ) : (
          <X className="h-5 w-5 mr-2" />
        )}
        {message}
      </div>
    </div>
  );
};

// Skeleton loader component for Absences table
const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-3 border-b">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div> {/* Employé */}
          <div className="h-4 bg-gray-200 rounded w-1/4"></div> {/* Dates */}
          <div className="h-4 bg-gray-200 rounded w-1/6"></div> {/* Durée */}
          <div className="h-4 bg-gray-200 rounded w-1/4"></div> {/* Motif */}
          <div className="h-4 bg-gray-200 rounded w-1/6"></div> {/* Statut */}
          <div className="h-4 bg-gray-200 rounded w-1/6"></div> {/* Impact */}
          <div className="h-8 bg-gray-200 rounded w-16"></div>  {/* Actions */}
        </div>
      ))}
    </div>
  );
};

export default function PresencesManagement() {
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextId, setNextId] = useState(mockAbsencesData.length + 1); // For generating new IDs
  const [sortField, setSortField] = useState('date_debut'); // Default sort field
  const [sortDirection, setSortDirection] = useState('desc'); // Default sort direction
  const [formAnimation, setFormAnimation] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'justified', 'unjustified', 'pending'
  
  const [formData, setFormData] = useState({
    employe_id: '',
    date_debut: '',
    date_fin: '',
    motif: ''
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Mock API call helper
  const mockApiCall = async (data, delay = 800) => {
    return new Promise((resolve, reject) => { // Added reject for error simulation
      setTimeout(() => {
        // Simulate occasional error
        // if (Math.random() < 0.1) { 
        //   reject(new Error("Simulated API Error"));
        //   return;
        // }
        resolve({ success: true, data });
      }, delay);
    });
  };
  
  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API delay for combined fetching
      await mockApiCall(null, 1200); 
      
      // Populate employees with their names for easy lookup
      const absencesWithEmployeeDetails = mockAbsencesData.map(absence => {
        const employee = mockEmployeesData.find(emp => emp.id === absence.employe_id);
        return { ...absence, employee: employee || { nom: 'Inconnu', email: '' } };
      });

      setAbsences(absencesWithEmployeeDetails);
      setEmployees(mockEmployeesData);
      setIsLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des données. " + err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Handle form submission for adding a new absence
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.employe_id || !formData.date_debut || !formData.motif) {
      showNotification('Veuillez remplir les champs Employé, Date de début et Motif.', 'error');
      return;
    }

    try {
      const newAbsenceData = { 
        ...formData, 
        id: nextId, 
        justifiee: null, // New absences are pending by default
        impact_salaire: null,
        employe_id: parseInt(formData.employe_id)
      };
      await mockApiCall(newAbsenceData);
      
      const employeeDetails = employees.find(emp => emp.id === newAbsenceData.employe_id);
      setAbsences(prev => [...prev, { ...newAbsenceData, employee: employeeDetails }]);
      setNextId(nextId + 1);
      showNotification('Absence ajoutée avec succès');
      resetForm();
    } catch (err) {
      showNotification('Une erreur est survenue lors de l\'ajout: ' + err.message, 'error');
    }
  };
  
  // Handle justification/validation status change
  const handleJustificationChange = async (absenceId, isJustified) => {
    try {
      await mockApiCall({ absenceId, isJustified }); // Mock API call for update
      setAbsences(prevAbsences => 
        prevAbsences.map(absence => 
          absence.id === absenceId 
            ? { ...absence, justifiee: isJustified, impact_salaire: !isJustified } 
            : absence
        )
      );
      showNotification(`Statut de l'absence mis à jour.`);
    } catch (err) {
      showNotification("Erreur lors de la mise à jour du statut: " + err.message, 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormAnimation(false);
    setTimeout(() => {
      setFormData({
        employe_id: '',
        date_debut: '',
        date_fin: '',
        motif: ''
      });
      setShowForm(false);
    }, 300); // Duration of SlideDown animation
  };

  // Toggle form visibility with animation
  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setShowForm(true);
      setTimeout(() => setFormAnimation(true), 50); // Small delay for animation to start
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    let actualField = field;
    if (field === 'employe.nom') actualField = 'employeeName'; // Special handling for nested field

    if (sortField === actualField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(actualField);
      setSortDirection('asc');
    }
  };

  // Filter and sort absences
  const sortedAndFilteredAbsences = [...absences]
    .map(absence => ({
        ...absence,
        // Add a sortable employee name field if it doesn't exist at top level
        employeeName: absence.employee?.nom?.toLowerCase() || '' 
    }))
    .filter(absence => {
      const employee = absence.employee;
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (employee?.nom.toLowerCase().includes(searchTermLower) ||
        employee?.email.toLowerCase().includes(searchTermLower) ||
        absence.motif.toLowerCase().includes(searchTermLower));
      
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'justified') return matchesSearch && absence.justifiee === true;
      if (filterStatus === 'unjustified') return matchesSearch && absence.justifiee === false;
      if (filterStatus === 'pending') return matchesSearch && absence.justifiee === null;
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : (valA < valB ? -1 : 0);
      } else {
        return valA < valB ? 1 : (valA > valB ? -1 : 0);
      }
    });

  // Format date to French format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Calculate duration of absence in days
  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    const start = new Date(startDate);
    // If no end date, or end date is same as start date, it's 1 day
    const end = endDate ? new Date(endDate) : start; 
    if (end < start) return 1; // Handle cases where end date might be before start

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };
  
  const getStats = () => {
    const total = absences.length;
    const justified = absences.filter(a => a.justifiee === true).length;
    const pending = absences.filter(a => a.justifiee === null).length;
    return { total, justified, pending };
  };
  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-white text-black white px-6 py-4">
          <h1 className="text-2xl font-bold ">Gestion des Absences</h1>
        </div>
        
        <Notification 
          show={notification.show} 
          message={notification.message} 
          type={notification.type} 
        />
        
        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Rechercher (nom, email, motif)..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-300 focus:border-indigo-500 block w-full p-2.5 pr-10 appearance-none outline-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="justified">Justifiées</option>
                  <option value="unjustified">Non justifiées</option>
                  <option value="pending">En attente</option>
                </select>
                <Filter className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <button 
              onClick={toggleForm}
              className={`flex items-center px-4 py-2 rounded-lg shadow transition-all duration-200 w-full md:w-auto justify-center ${
                showForm 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {showForm ? (
                <>
                  <X className="mr-2" size={18} />
                  <span>Annuler</span>
                </>
              ) : (
                <>
                  <UserPlus className="mr-2" size={18} /> {/* Changed icon from Plus to UserPlus for consistency */}
                  <span>Ajouter une absence</span>
                </>
              )}
            </button>
          </div>
          
          {/* Absence Form */}
          <SlideDown isVisible={showForm}>
            <div className={`bg-gray-50 rounded-lg shadow-inner p-6 mb-8 transition-all duration-500 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-xl font-semibold mb-6 text-indigo-700 border-b pb-2">
                Ajouter une absence
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Employé *</label>
                    <select
                      name="employe_id"
                      value={formData.employe_id}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    >
                      <option value="">Sélectionner un employé</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.nom} ({employee.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Motif *</label>
                    <input
                      type="text"
                      name="motif"
                      value={formData.motif}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                      placeholder="Motif de l'absence"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Date de début *</label>
                    <div className="relative">
                      <input
                        type="date"
                        name="date_debut"
                        value={formData.date_debut}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Date de fin (optionnel)</label>
                    <div className="relative">
                      <input
                        type="date"
                        name="date_fin"
                        value={formData.date_fin}
                        onChange={handleChange}
                        min={formData.date_debut} // Ensure end date is not before start date
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200 flex items-center"
                  >
                    <X size={16} className="mr-2" />
                    Annuler
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                  >
                    <Check size={16} className="mr-2" />
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>
          
          {/* Absence Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-100 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-indigo-800">Total des absences</h3>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-yellow-800">En attente de justification</h3>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-green-800">Absences justifiées</h3>
              <p className="text-2xl font-bold">{stats.justified}</p>
            </div>
          </div>
          
          {/* Absences Table Card */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="font-medium text-gray-700">Liste des absences</h2>
            </div>
            
            {isLoading ? (
              <div className="p-4">
                <SkeletonLoader />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                  <HelpCircle size={32} />
                </div>
                <p className="text-lg font-medium text-gray-900">{error}</p>
                <p className="text-gray-500 mt-2">Veuillez réessayer.</p>
                <button 
                  onClick={fetchData}
                  className="mt-4 flex items-center mx-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th 
                        className="py-3 px-4 text-left font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('employe.nom')}
                      >
                        <div className="flex items-center">
                          Employé
                          {sortField === 'employeeName' && (
                            <ChevronDown 
                              className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                sortDirection === 'desc' ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="py-3 px-4 text-left font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('date_debut')}
                      >
                        <div className="flex items-center">
                          Dates
                          {sortField === 'date_debut' && (
                            <ChevronDown 
                              className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                sortDirection === 'desc' ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 tracking-wider hidden sm:table-cell">Durée</th>
                      <th 
                        className="py-3 px-4 text-left font-medium text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('motif')}
                      >
                        <div className="flex items-center">
                          Motif
                          {sortField === 'motif' && (
                            <ChevronDown 
                              className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                sortDirection === 'desc' ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 tracking-wider">Statut</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500 tracking-wider hidden md:table-cell">Impact Salaire</th>
                      <th className="py-3 px-4 text-center font-medium text-gray-500 tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                    {sortedAndFilteredAbsences.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-lg font-medium">Aucune absence trouvée</p>
                            <p className="text-sm text-gray-500">Essayez avec d'autres filtres ou termes de recherche</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredAbsences.map((absence, index) => (
                        <tr 
                          key={absence.id} 
                          className="hover:bg-blue-50 transition-colors duration-150"
                          style={{ 
                            animationDelay: `${index * 50}ms`,
                            animation: 'fadeIn 0.5s ease-in-out forwards'
                          }}
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {absence.employee?.nom || 'N/A'}
                            <div className="text-xs text-gray-500">{absence.employee?.email || ''}</div>
                          </td>
                          <td className="py-3 px-4">
                            {formatDate(absence.date_debut)}
                            {absence.date_fin && absence.date_fin !== absence.date_debut && (
                              <> - {formatDate(absence.date_fin)}</>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            {calculateDuration(absence.date_debut, absence.date_fin)} jour(s)
                          </td>
                          <td className="py-3 px-4 truncate max-w-xs">{absence.motif || <span className="text-gray-400">Non spécifié</span>}</td>
                          <td className="py-3 px-4">
                            {absence.justifiee === true && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                Justifiée
                              </span>
                            )}
                            {absence.justifiee === false && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                Non justifiée
                              </span>
                            )}
                            {absence.justifiee === null && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {absence.impact_salaire === true ? (
                              <span className="text-red-600 font-medium">Oui</span>
                            ) : absence.impact_salaire === false ? (
                              <span className="text-green-600 font-medium">Non</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleJustificationChange(absence.id, true)}
                                disabled={absence.justifiee === true}
                                className={`p-1.5 rounded-md transition-colors duration-200 ${
                                  absence.justifiee === true 
                                    ? 'bg-green-200 text-green-700 cursor-not-allowed' 
                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                }`}
                                title="Marquer comme justifiée"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleJustificationChange(absence.id, false)}
                                disabled={absence.justifiee === false}
                                className={`p-1.5 rounded-md transition-colors duration-200 ${
                                  absence.justifiee === false
                                    ? 'bg-red-200 text-red-700 cursor-not-allowed'
                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                }`}
                                title="Marquer comme non justifiée"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination - Static for demonstration */}
          {!isLoading && sortedAndFilteredAbsences.length > 0 && (
            <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">
                Affichage de {sortedAndFilteredAbsences.length} sur {absences.length} absences
              </div>
              {/* Basic pagination example, would need actual logic for multiple pages */}
              <div className="flex space-x-1">
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled> 
                  Précédent
                </button>
                <button className="px-3 py-1 bg-indigo-600 border border-indigo-600 rounded-md text-sm text-white">
                  1
                </button>
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}