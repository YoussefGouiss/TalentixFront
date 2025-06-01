// src/Employee.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, UserPlus, X, Check, Search, ChevronDown, HelpCircle, Loader } from 'lucide-react';

// Animated form transition component
const SlideDown = ({ isVisible, children }) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible ? 'max-h-[1000px] opacity-100 py-2' : 'max-h-0 opacity-0 py-0' // Adjust max-h as needed, add py for spacing
      }`}
    >
      {isVisible && children} {/* Conditionally render children to help with transition and reflow */}
    </div>
  );
};

// Animated notification component
const Notification = ({ show, message, type }) => {
  return (
    <div
      className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out ${ // Increased z-index
        show
        ? 'translate-y-0 opacity-100'
        : '-translate-y-16 opacity-0 pointer-events-none'
      } ${
        type === 'success'
        ? 'bg-green-500 text-white border-l-4 border-green-700' // Brighter success
        : 'bg-red-500 text-white border-l-4 border-red-700'       // Brighter error
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
      {[...Array(5)].map((_, i) => ( // Increased array for more skeleton rows
        <div key={i} className="flex space-x-4 py-3.5 border-b border-[#C8D9E6]/40"> {/* Sky Blue border */}
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/5"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/5"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-2/5 md:w-1/5"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/5 hidden md:block"></div>
          <div className="h-5 bg-[#C8D9E6]/60 rounded w-1/5 hidden lg:block"></div>
          <div className="flex-grow h-5 bg-[#C8D9E6]/60 rounded "></div>
          <div className="h-8 bg-[#C8D9E6]/80 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};


export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddButtonLoading, setIsAddButtonLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('nom'); // Default sort
  const [sortDirection, setSortDirection] = useState('asc');
  const [formAnimation, setFormAnimation] = useState(false); // To control inner form animation

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
    salaire: '',
    date_entree: '',
    password: ''
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const API_URL = 'http://localhost:8000/api'; // Ensure this is correct

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null); // Reset error before fetching
      const response = await fetch(`${API_URL}/employes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`, // Make sure token is valid
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur non spécifiée du serveur' }));
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      setEmployees(Array.isArray(data.message) ? data.message : (Array.isArray(data) ? data : [])); // Handle various API responses
    } catch (err) {
      setError(err.message || 'Impossible de charger les données des employés.');
      console.error('Error fetching employees:', err);
      setEmployees([]); // Ensure employees is an array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showAppNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const url = editingId ? `${API_URL}/employes/${editingId}` : `${API_URL}/employes`;
    const method = editingId ? 'PUT' : 'POST';

    // Remove password if it's empty during an update, unless it's explicitly being set
    const payload = { ...formData };
    if (editingId && !payload.password) {
      delete payload.password;
    }


    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Erreur lors de ${editingId ? 'la mise à jour' : "l'ajout"}`);
      }

      await fetchEmployees();
      showAppNotification(`Employé ${editingId ? 'mis à jour' : 'ajouté'} avec succès`);
      resetFormAndHide();
    } catch (err) {
      showAppNotification(err.message || 'Une erreur est survenue', 'error');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé?')) return;

    try {
      const response = await fetch(`${API_URL}/employes/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (!response.ok) {
         const errorData = await response.json().catch(()=>({}));
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }
      await fetchEmployees();
      showAppNotification('Employé supprimé avec succès');
    } catch (err) {
      showAppNotification(err.message || 'Échec de la suppression', 'error');
      console.error('Error deleting employee:', err);
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      nom: employee.nom || '',
      prenom: employee.prenom || '',
      email: employee.email || '',
      telephone: employee.telephone || '',
      poste: employee.poste || '',
      salaire: employee.salaire || '',
      date_entree: employee.date_entree || '',
      password: '' // Keep password field empty for edit
    });
    setEditingId(employee.id);
    if (!showForm) { // If form isn't shown, trigger the open animation
        setShowForm(true);
        setTimeout(() => setFormAnimation(true), 50); // Start inner animation after SlideDown starts
    } else { // If form is already shown, just update content
        setFormAnimation(true); // Ensure it's visible if it was closing
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFormAndHide = () => {
    setFormAnimation(false); // Start inner form fade out
    setTimeout(() => {
      setShowForm(false); // Start SlideDown collapse
      setFormData({ nom: '', prenom: '', email: '', telephone: '', poste: '', salaire: '', date_entree: '', password: '' });
      setEditingId(null);
    }, 300); // Duration of SlideDown
  };

  const toggleFormVisibility = () => {
    if (showForm) {
      resetFormAndHide();
    } else {
      setEditingId(null); // Ensure we are in "add" mode
      setFormData({ nom: '', prenom: '', email: '', telephone: '', poste: '', salaire: '', date_entree: '', password: '' });
      setIsAddButtonLoading(true);
      setTimeout(() => { // Simulate a small delay if needed or just open
        setShowForm(true);
        setTimeout(() => {
             setFormAnimation(true); // Trigger inner form animation
             setIsAddButtonLoading(false);
        }, 50); // Small delay for SlideDown to start expanding
      }, 200); // Optional delay for button loading effect
    }
  };

  const handleSort = (field) => {
    const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const sortedAndFilteredEmployees = employees && employees.length > 0 ? [...employees]
    .filter(employee =>
      Object.values(employee).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortField || !a[sortField] || !b[sortField]) return 0;
      const valA = typeof a[sortField] === 'string' ? a[sortField].toLowerCase() : a[sortField];
      const valB = typeof b[sortField] === 'string' ? b[sortField].toLowerCase() : b[sortField];

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }) : [];


  return (
    <> {/* Using Fragment as main container is in App.js */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2F4156]">Gestion des Employés</h1>
        <p className="text-sm text-[#567C8D] mt-1">Gérez les informations et les enregistrements de vos employés.</p>
      </div>

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2.5 border border-[#C8D9E6] rounded-lg w-full md:w-72
                       focus:ring-2 focus:ring-[#567C8D]/50 focus:border-[#567C8D] transition-all
                       duration-200 outline-none text-[#2F4156] placeholder-[#567C8D]/70 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#567C8D]/80" />
        </div>

        <button
          onClick={toggleFormVisibility}
          disabled={isAddButtonLoading}
          className={`flex items-center px-5 py-2.5 rounded-lg shadow-md transition-all duration-200
                     w-full md:w-auto justify-center transform hover:scale-[1.02] active:scale-95
                     text-white font-medium text-sm
                     ${showForm
                       ? 'bg-red-500 hover:bg-red-600'
                       : 'bg-[#567C8D] hover:bg-[#4A6582]'
                     }
                     ${isAddButtonLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isAddButtonLoading ? (<><Loader className="mr-2 animate-spin" size={18} /> Chargement...</>)
          : showForm ? ( <><X className="mr-2" size={18} /> Annuler</> )
          : ( <><UserPlus className="mr-2" size={18} /> Ajouter</> )}
        </button>
      </div>

      <SlideDown isVisible={showForm}>
        <div className={`bg-white border border-[#C8D9E6] rounded-xl shadow-lg p-6 mb-8
                       transition-opacity duration-300 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-xl font-semibold mb-6 text-[#2F4156] border-b border-[#C8D9E6] pb-3">
            {editingId ? 'Modifier un employé' : 'Ajouter un employé'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {[
                { label: 'Nom', name: 'nom', type: 'text', required: true },
                { label: 'Prénom', name: 'prenom', type: 'text', required: true },
                { label: 'Email', name: 'email', type: 'email', required: true },
                { label: 'Téléphone', name: 'telephone', type: 'text' },
                { label: 'Poste', name: 'poste', type: 'text', required: true },
                { label: 'Salaire (€)', name: 'salaire', type: 'number' },
                { label: "Date d'entrée", name: 'date_entree', type: 'date', required: true },
                { label: editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe', name: 'password', type: 'password', required: !editingId },
              ].map(field => (
                <div className="space-y-1.5" key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-[#2F4156]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    className="w-full p-2.5 border border-[#C8D9E6] rounded-md
                               focus:ring-1 focus:ring-[#567C8D] focus:border-[#567C8D]
                               transition-all duration-200 outline-none text-[#2F4156] bg-white disabled:bg-gray-100"
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#C8D9E6]">
              <button
                type="button" // Important for not submitting form
                onClick={resetFormAndHide}
                className="px-4 py-2 bg-[#C8D9E6]/50 hover:bg-[#C8D9E6]/80 text-[#2F4156] rounded-md
                           transition-colors duration-200 flex items-center font-medium text-sm"
                disabled={isSubmitting}
              >
                <X size={16} className="mr-2" />
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 bg-[#2F4156] hover:bg-[#3b5068] text-white rounded-md shadow-md
                           hover:shadow-lg transition-all duration-200 flex items-center font-medium text-sm
                           ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (<><Loader size={16} className="mr-2 animate-spin" />Traitement...</>)
                : ( <><Check size={16} className="mr-2" />{editingId ? 'Mettre à jour' : 'Enregistrer'}</> )}
              </button>
            </div>
          </form>
        </div>
      </SlideDown>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* ... Stats Cards (Same Theming) ... */}
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Total des employés</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{employees.length}</p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Salaire moyen</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">
            {employees.length > 0
              ? `${Math.round(employees.reduce((acc, emp) => acc + Number(emp.salaire || 0), 0) / employees.length).toLocaleString()} €`
              : '0 €'}
          </p>
        </div>
        <div className="bg-white border border-[#C8D9E6] p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-[#567C8D]">Résultats</h3>
          <p className="text-3xl font-bold text-[#2F4156] mt-1">{sortedAndFilteredEmployees.length}</p>
        </div>
      </div>

      <div className="bg-white border border-[#C8D9E6] rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-[#C8D9E6] bg-[#F5EFEB]/80 px-5 py-3.5">
          <h2 className="font-semibold text-[#2F4156]">Liste des employés</h2>
        </div>

        {isLoading ? ( <div className="p-4"><SkeletonLoader /></div> )
        : error ? (
          <div className="p-12 text-center flex flex-col items-center">
            <HelpCircle size={40} className="text-red-500 mb-4" />
            <p className="text-xl font-medium text-[#2F4156]">{error}</p>
            <p className="text-[#567C8D] mt-2">Veuillez vérifier votre connexion ou réessayer plus tard.</p>
            <button 
                onClick={fetchEmployees} 
                className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
            >
                Réessayer
            </button>
          </div>
        )
        : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#C8D9E6]/30">
                  {/* Table Headers */}
                  {['nom', 'prenom', 'email', 'telephone', 'poste', 'date_entree', 'salaire'].map(fieldKey => {
                    const displayHeader = {
                        nom: 'Nom', prenom:'Prenom', email: 'Email', telephone: 'telephone',
                        poste: 'Poste', date_entree: "Date d'entrée", salaire: 'Salaire'
                    }[fieldKey];
                    const isHiddenSm = ['email', 'téléphone', 'salaire', 'date_entree'].includes(fieldKey);
                    const isHiddenLg = ['téléphone', 'salaire'].includes(fieldKey);

                    return (
                        <th
                        key={fieldKey}
                        className={`py-3 px-4 text-left text-xs font-semibold text-[#2F4156] uppercase 
                                    tracking-wider cursor-pointer hover:bg-[#C8D9E6]/60 transition-colors
                                    ${isHiddenLg ? 'hidden lg:table-cell' : (isHiddenSm ? 'hidden md:table-cell' : '')}
                                    `}
                        onClick={() => handleSort(fieldKey)}
                        >
                        <div className="flex items-center">
                            {displayHeader}
                            {sortField === fieldKey && (
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
                {sortedAndFilteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500"> {/* Adjusted colSpan */}
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-12 w-12 text-[#C8D9E6] mb-3" />
                        <p className="text-lg font-medium text-[#2F4156]">Aucun employé trouvé</p>
                        <p className="text-sm text-[#567C8D]">Vérifiez vos filtres ou ajoutez de nouveaux employés.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-[#C8D9E6]/20 transition-colors duration-150 text-sm">
                      <td className="py-3 px-4 text-[#2F4156] font-medium">{employee.nom}</td>
                      <td className="py-3 px-4 text-[#2F4156]">{employee.prenom}</td>
                      <td className="py-3 px-4 text-[#567C8D] hidden md:table-cell truncate max-w-xs">{employee.email}</td>
                      <td className="py-3 px-4 text-[#567C8D] hidden lg:table-cell">{employee.telephone}</td>
                      <td className="py-3 px-4 text-[#2F4156] hidden md:table-cell">{employee.poste}</td>
                      <td className="py-3 px-4 text-[#567C8D] hidden md:table-cell">{employee.date_entree}</td>
                      <td className="py-3 px-4 text-[#2F4156] hidden lg:table-cell font-medium">
                        {Number(employee.salaire || 0).toLocaleString()}€
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="p-1.5 text-[#567C8D] rounded-md hover:bg-[#567C8D]/20 hover:text-[#2F4156] transition-colors"
                            title="Modifier"
                          > <Edit size={16} /> </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="p-1.5 text-red-600 rounded-md hover:bg-red-500/20 hover:text-red-700 transition-colors"
                            title="Supprimer"
                          > <Trash2 size={16} /> </button>
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
    </>
  );
}