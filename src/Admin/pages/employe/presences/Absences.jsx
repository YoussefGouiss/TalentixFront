// src/Absences.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Check, X, Filter, Calendar, RefreshCcw, Search, ChevronDown, UserPlus, HelpCircle, Loader } from 'lucide-react'; // Using Lucide icons

// Mock data (assuming it's still needed for this example)
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
];

// Animated form transition component
const SlideDown = ({ isVisible, children }) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible ? 'max-h-[1000px] opacity-100 py-2' : 'max-h-0 opacity-0 py-0'
      }`}
    >
      {isVisible && children}
    </div>
  );
};

// Animated notification component - Themed
const Notification = ({ show, message, type }) => {
  return (
    <div
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out ${
        show
        ? 'translate-y-0 opacity-100'
        : '-translate-y-16 opacity-0 pointer-events-none'
      } ${
        type === 'success' // Teal for success (can be adjusted)
        ? 'bg-[#567C8D] text-white border-l-4 border-[#2F4156]' // Teal bg, Navy border
        : 'bg-red-500 text-white border-l-4 border-red-700'    // Keeping red for error
      }`}
    >
      <div className="flex items-center">
        {type === 'success' ? (
          <Check className="h-5 w-5 mr-3 flex-shrink-0" />
        ) : (
          <X className="h-5 w-5 mr-3 flex-shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};


// Skeleton loader component - Themed
const SkeletonLoader = () => {
  return (
    <div className="animate-pulse p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-3.5 border-b border-[#C8D9E6]/40">
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/4"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/4"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/6 hidden sm:block"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/4"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/6"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/6 hidden md:block"></div>
          <div className="h-8 bg-[#C8D9E6]/80 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};


export default function Absences() {
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState(mockEmployeesData); // Initialize with mock for dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextId, setNextId] = useState(mockAbsencesData.length + 1);
  const [sortField, setSortField] = useState('date_debut');
  const [sortDirection, setSortDirection] = useState('desc');
  const [formAnimation, setFormAnimation] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    employe_id: '', date_debut: '', date_fin: '', motif: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const mockApiCall = async (data, delay = 500) => new Promise(resolve => setTimeout(() => resolve({ success: true, data }), delay));

  const fetchData = async () => {
    setIsLoading(true); setError(null);
    try {
      await mockApiCall(null, 1000);
      const absencesWithEmployeeDetails = mockAbsencesData.map(absence => {
        const employee = mockEmployeesData.find(emp => emp.id === absence.employe_id);
        return { ...absence, employeeName: employee ? employee.nom : 'Inconnu', employeeEmail: employee ? employee.email : '' };
      });
      setAbsences(absencesWithEmployeeDetails);
    } catch (err) {
      setError("Erreur: Impossible de charger les absences.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const showAppNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.employe_id || !formData.date_debut || !formData.motif) {
      showAppNotification('Veuillez remplir tous les champs requis.', 'error'); return;
    }
    try {
      const newAbsenceData = { ...formData, id: nextId, justifiee: null, impact_salaire: null, employe_id: parseInt(formData.employe_id) };
      await mockApiCall(newAbsenceData);
      const employee = employees.find(emp => emp.id === newAbsenceData.employe_id);
      setAbsences(prev => [...prev, { ...newAbsenceData, employeeName: employee?.nom, employeeEmail: employee?.email }]);
      setNextId(prev => prev + 1);
      showAppNotification('Absence ajoutée avec succès');
      resetFormAndHide();
    } catch (err) { showAppNotification(`Erreur: ${err.message}`, 'error'); }
  };

  const handleJustificationChange = async (absenceId, isJustified) => {
    try {
      await mockApiCall({ absenceId, isJustified });
      setAbsences(prev => prev.map(abs => abs.id === absenceId ? { ...abs, justifiee: isJustified, impact_salaire: !isJustified } : abs));
      showAppNotification('Statut mis à jour.');
    } catch (err) { showAppNotification(`Erreur: ${err.message}`, 'error'); }
  };

  const resetFormAndHide = () => {
    setFormAnimation(false);
    setTimeout(() => {
      setShowForm(false);
      setFormData({ employe_id: '', date_debut: '', date_fin: '', motif: '' });
    }, 300);
  };

  const toggleFormVisibility = () => {
    if (showForm) {
      resetFormAndHide();
    } else {
      setFormData({ employe_id: '', date_debut: '', date_fin: '', motif: '' });
      setShowForm(true);
      setTimeout(() => setFormAnimation(true), 50);
    }
  };

  const handleSort = (field) => {
    const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field); setSortDirection(newDirection);
  };

  const sortedAndFilteredAbsences = [...absences]
    .filter(absence => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (
        absence.employeeName?.toLowerCase().includes(searchTermLower) ||
        absence.employeeEmail?.toLowerCase().includes(searchTermLower) ||
        absence.motif.toLowerCase().includes(searchTermLower)
      );
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'justified') return matchesSearch && absence.justifiee === true;
      if (filterStatus === 'unjustified') return matchesSearch && absence.justifiee === false;
      if (filterStatus === 'pending') return matchesSearch && absence.justifiee === null;
      return true; // Should not happen if filterStatus is one of the above
    })
    .sort((a, b) => {
      let valA = a[sortField]; let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 'N/A';
    const start = new Date(startDate); const end = endDate ? new Date(endDate) : start;
    if (end < start) return 1;
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  };
  const stats = {
    total: absences.length,
    justified: absences.filter(a => a.justifiee === true).length,
    pending: absences.filter(a => a.justifiee === null).length,
  };

  return (
    <> {/* Assuming this is rendered inside MainLayoute's Outlet */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2F4156]">Gestion des Absences</h1>
        <p className="text-sm text-[#567C8D] mt-1">Suivez et gérez les absences des employés.</p>
      </div>

      <Notification show={notification.show} message={notification.message} type={notification.type} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2.5 border border-[#C8D9E6] rounded-lg w-full sm:w-64
                         focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] transition-all
                         duration-200 outline-none text-[#2F4156] placeholder-[#567C8D]/70 bg-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#567C8D]/80" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              className="bg-white border border-[#C8D9E6] text-[#2F4156] text-sm rounded-lg
                         focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] block w-full p-2.5 pr-10 
                         appearance-none outline-none placeholder-[#567C8D]/70"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="justified">Justifiées</option>
              <option value="unjustified">Non justifiées</option>
              <option value="pending">En attente</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#567C8D]/80 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={toggleFormVisibility}
          className={`flex items-center px-5 py-2.5 rounded-lg shadow-md transition-all duration-200
                     w-full md:w-auto justify-center transform hover:scale-[1.02] active:scale-95
                     text-white font-medium text-sm
                     ${showForm
                       ? 'bg-red-500 hover:bg-red-600' // Keeping red for cancel
                       : 'bg-[#567C8D] hover:bg-[#4A6582]' // Teal base
                     }`}
        >
          {showForm ? (<><X className="mr-2" size={18} />Annuler</>)
          : (<><Plus className="mr-2" size={18} />Ajouter Absence</>)}
        </button>
      </div>

      <SlideDown isVisible={showForm}>
        <div className={`bg-white border border-[#C8D9E6] rounded-xl shadow-lg p-6 mb-8
                       transition-opacity duration-300 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-xl font-semibold mb-6 text-[#2F4156] border-b border-[#C8D9E6] pb-3">
            Ajouter une absence
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {[
                { label: 'Employé', name: 'employe_id', type: 'select', options: employees, required: true },
                { label: 'Motif', name: 'motif', type: 'text', placeholder: "Motif de l'absence", required: true },
                { label: 'Date de début', name: 'date_debut', type: 'date', required: true },
                { label: 'Date de fin (optionnel)', name: 'date_fin', type: 'date', min: formData.date_debut },
              ].map(field => (
                <div className="space-y-1.5" key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-[#2F4156]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <div className="relative">
                        <select
                        id={field.name}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required={field.required}
                        className="w-full p-2.5 border border-[#C8D9E6] rounded-md 
                                    focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] 
                                    transition-all duration-200 outline-none text-[#2F4156] bg-white appearance-none pr-8"
                        >
                        <option value="">Sélectionner...</option>
                        {field.options?.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.nom}</option>
                        ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#567C8D]/80 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="relative">
                        <input
                        id={field.name}
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required={field.required}
                        min={field.min}
                        placeholder={field.placeholder || ''}
                        className="w-full p-2.5 border border-[#C8D9E6] rounded-md 
                                    focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D] 
                                    transition-all duration-200 outline-none text-[#2F4156] bg-white"
                        />
                        {field.type === 'date' && <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#567C8D]/80 pointer-events-none" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#C8D9E6]">
              <button type="button" onClick={resetFormAndHide}
                className="px-4 py-2 bg-[#C8D9E6]/50 hover:bg-[#C8D9E6]/80 text-[#2F4156] rounded-md 
                           transition-colors duration-200 flex items-center font-medium text-sm">
                <X size={16} className="mr-2" /> Annuler
              </button>
              <button type="submit"
                className="px-5 py-2 bg-[#2F4156] hover:bg-[#3b5068] text-white rounded-md shadow-md 
                           hover:shadow-lg transition-all duration-200 flex items-center font-medium text-sm">
                <Check size={16} className="mr-2" /> Enregistrer
              </button>
            </div>
          </form>
        </div>
      </SlideDown>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Total des absences</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">En attente</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Justifiées</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{stats.justified}</p>
        </div>
      </div>

      <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-5 py-3.5">
          <h2 className="font-semibold text-[#2F4156]">Liste des absences</h2>
        </div>

        {isLoading ? ( <div className="p-4"><SkeletonLoader /></div> )
        : error ? (
          <div className="p-12 text-center flex flex-col items-center">
            <HelpCircle size={40} className="text-red-500 mb-4" />
            <p className="text-xl font-medium text-[#2F4156]">{error}</p>
            <p className="text-[#567C8D] mt-2">Veuillez vérifier votre connexion ou réessayer plus tard.</p>
            <button onClick={fetchData} className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium">
              <RefreshCcw className="w-4 h-4 mr-2 inline-block" /> Réessayer
            </button>
          </div>
        )
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#C8D9E6]/30">
                  {/* Table Headers */}
                  {['Employé', 'Dates', 'Durée', 'Motif', 'Statut', 'Impact Salaire'].map(headerText => {
                    const fieldKey = {
                        'Employé': 'employeeName', 'Dates': 'date_debut', 'Durée': 'duration', // duration isn't directly sortable on backend
                        'Motif': 'motif', 'Statut': 'justifiee', 'Impact Salaire': 'impact_salaire'
                    }[headerText];
                    const isSortable = ['employeeName', 'date_debut', 'motif'].includes(fieldKey); // Define which are sortable
                    const hiddenSm = ['Durée', 'Impact Salaire'].includes(headerText);
                    const hiddenMd = ['Impact Salaire'].includes(headerText);

                    return (
                        <th
                        key={headerText}
                        className={`py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase 
                                    tracking-wider ${isSortable ? 'cursor-pointer hover:bg-[#C8D9E6]/60' : ''} transition-colors
                                    ${hiddenMd ? 'hidden md:table-cell' : (hiddenSm ? 'hidden sm:table-cell' : '')}
                                    `}
                        onClick={() => isSortable && handleSort(fieldKey)}
                        >
                        <div className="flex items-center">
                            {headerText}
                            {isSortable && sortField === fieldKey && (
                            <ChevronDown className={`ml-1.5 w-3.5 h-3.5 transition-transform duration-200 text-[#567C8D] ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                            )}
                        </div>
                        </th>
                    );
                  })}
                  <th className="py-3 px-4 text-center text-xs font-semibold text-[#2F4156] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C8D9E6]/70">
                {sortedAndFilteredAbsences.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-12 w-12 text-[#C8D9E6] mb-3" />
                        <p className="text-lg font-medium text-[#2F4156]">Aucune absence trouvée</p>
                        <p className="text-sm text-[#567C8D]">Vérifiez vos filtres ou ajoutez de nouvelles absences.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredAbsences.map((absence, index) => (
                    <tr key={absence.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150 text-sm">
                      <td className="py-3 px-4 text-[#2F4156] font-medium">
                        {absence.employeeName || 'N/A'}
                        <div className="text-xs text-[#567C8D]">{absence.employeeEmail || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-[#567C8D]">
                        {formatDate(absence.date_debut)}
                        {absence.date_fin && absence.date_fin !== absence.date_debut && (<> - {formatDate(absence.date_fin)}</>)}
                      </td>
                      <td className="py-3 px-4 text-[#567C8D] hidden sm:table-cell">
                        {calculateDuration(absence.date_debut, absence.date_fin)}j
                      </td>
                      <td className="py-3 px-4 text-[#2F4156] truncate max-w-xs">{absence.motif || <span className="text-[#C8D9E6]">N/A</span>}</td>
                      <td className="py-3 px-4">
                        {absence.justifiee === true && (<span className="bg-[#567C8D]/20 text-[#2F4156] text-xs font-semibold px-2.5 py-1 rounded-full">Justifiée</span>)}
                        {absence.justifiee === false && (<span className="bg-red-500/10 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Non justifiée</span>)}
                        {absence.justifiee === null && (<span className="bg-yellow-500/10 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">En attente</span>)}
                      </td>
                      <td className="py-3 px-4 text-[#567C8D] hidden md:table-cell">
                        {absence.impact_salaire === true ? (<span className="text-red-600 font-medium">Oui</span>)
                         : absence.impact_salaire === false ? (<span className="text-green-600 font-medium">Non</span>)
                         : (<span className="text-[#C8D9E6]">-</span>)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleJustificationChange(absence.id, true)}
                            disabled={absence.justifiee === true}
                            className={`p-1.5 rounded-md transition-colors duration-150 ${
                              absence.justifiee === true ? 'text-green-400 cursor-not-allowed opacity-60' : 'text-green-600 hover:bg-green-500/20 hover:text-green-700'}`}
                            title="Marquer comme justifiée"
                          > <Check size={16} /> </button>
                          <button
                            onClick={() => handleJustificationChange(absence.id, false)}
                            disabled={absence.justifiee === false}
                            className={`p-1.5 rounded-md transition-colors duration-150 ${
                              absence.justifiee === false ? 'text-red-400 cursor-not-allowed opacity-60' : 'text-red-600 hover:bg-red-500/20 hover:text-red-700'}`}
                            title="Marquer comme non justifiée"
                          > <X size={16} /> </button>
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

      {!isLoading && sortedAndFilteredAbsences.length > 0 && (
        <div className="flex items-center justify-between mt-6 bg-white border border-[#C8D9E6] p-4 rounded-xl shadow-sm">
          <div className="text-sm text-[#567C8D]">
            Affichage de <span className="font-semibold text-[#2F4156]">{sortedAndFilteredAbsences.length}</span> sur <span className="font-semibold text-[#2F4156]">{absences.length}</span> absences
          </div>
          <div className="flex space-x-1">
            <button className="px-3 py-1.5 bg-white border border-[#C8D9E6] rounded-md text-xs font-medium text-[#567C8D] hover:bg-[#C8D9E6]/30 disabled:opacity-50" disabled>Précédent</button>
            <button className="px-3 py-1.5 bg-[#567C8D] border border-[#567C8D] rounded-md text-xs font-medium text-white">1</button>
            <button className="px-3 py-1.5 bg-white border border-[#C8D9E6] rounded-md text-xs font-medium text-[#567C8D] hover:bg-[#C8D9E6]/30 disabled:opacity-50" disabled>Suivant</button>
          </div>
        </div>
      )}

      {/* Global style for fade-in animation for table rows */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Consider adding specific keyframes for table row animations if needed, 
           but Tailwind's transition classes are often sufficient.
           The style tag approach is more for one-off complex animations. */
      `}</style>
    </>
  );
}