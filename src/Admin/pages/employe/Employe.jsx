import { useState, useEffect } from 'react';
import { Trash2, Edit, UserPlus, X, Check, Search, ChevronDown, HelpCircle, Loader } from 'lucide-react';

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

// Skeleton loader component
const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-3 border-b">
          {[...Array(7)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
          <div className="h-8 bg-gray-200 rounded w-16"></div>
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
  const [sortField, setSortField] = useState('nom');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formAnimation, setFormAnimation] = useState(false);
  
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

  // Base API URL
  const API_URL = 'http://localhost:8000/api';

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/employes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      
      const data = await response.json();
      setEmployees(data.message || []);
      console.log(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les données');
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with API data
  useEffect(() => {
    fetchEmployees();
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

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        // Update API call
        const response = await fetch(`${API_URL}/employes/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }
        
        await fetchEmployees();
        showNotification('Employé mis à jour avec succès');
      } else {
        // Create API call
        const response = await fetch(`${API_URL}/employes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la création');
        }
        
        await fetchEmployees();
        showNotification('Employé ajouté avec succès');
      }
      
      resetForm();
    } catch (err) {
      showNotification(err.message || 'Une erreur est survenue', 'error');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé?')) return;
    
    try {
      const response = await fetch(`${API_URL}/employes/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }
      
      await fetchEmployees();
      showNotification('Employé supprimé avec succès');
    } catch (err) {
      showNotification(err.message || 'Échec de la suppression', 'error');
      console.error('Error deleting employee:', err);
    }
  };

  // Edit employee
  const handleEdit = (employee) => {
    setFormData({
      nom: employee.nom,
      prenom: employee.prenom,
      email: employee.email,
      telephone: employee.telephone,
      poste: employee.poste,
      salaire: employee.salaire,
      date_entree: employee.date_entree,
      password: ''
    });
    setEditingId(employee.id);
    setShowForm(true);
    setTimeout(() => setFormAnimation(true), 50);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form
  const resetForm = () => {
    setFormAnimation(false);
    setTimeout(() => {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        poste: '',
        salaire: '',
        date_entree: '',
        password: ''
      });
      setEditingId(null);
      setShowForm(false);
    }, 300);
  };

  // Toggle form visibility with loading state
  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setIsAddButtonLoading(true);
      setTimeout(() => {
        setShowForm(true);
        setTimeout(() => {
          setFormAnimation(true);
          setIsAddButtonLoading(false);
        }, 50);
      }, 500); // Simulate loading for 500ms
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort employees
  const sortedAndFilteredEmployees = [...employees]
    .filter(employee => 
      employee.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.poste?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortDirection === 'asc') {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-white text-black px-6 py-4">
          <h1 className="text-2xl font-bold">Gestion des Employés</h1>
        </div>
        
        <Notification 
          show={notification.show} 
          message={notification.message} 
          type={notification.type} 
        />
        
        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Rechercher un employé..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <button 
              onClick={toggleForm}
              disabled={isAddButtonLoading}
              className={`flex items-center px-4 py-2 rounded-lg shadow transition-all duration-200 w-full md:w-auto justify-center ${
                showForm 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } ${isAddButtonLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isAddButtonLoading ? (
                <>
                <Loader className="mr-2 animate-spin" size={18} />
                <span>Chargement...</span>
                </>
              ) : showForm ? (
                <>
                <X className="mr-2" size={18} />
                <span>Annuler</span>
                </>
              ) : (
                <>
                <UserPlus className="mr-2" size={18} />
                <span>Ajouter un employé</span>
                </>
              )}
            </button>
          </div>
          
          {/* Employee Form */}
          <SlideDown isVisible={showForm}>
            <div className={`bg-gray-50 rounded-lg shadow-inner p-6 mb-8 transition-all duration-500 ${formAnimation ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-xl font-semibold mb-6 text-indigo-700 border-b pb-2">
                {editingId ? 'Modifier un employé' : 'Ajouter un employé'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    type="text"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Poste</label>
                  <input
                    type="text"
                    name="poste"
                    value={formData.poste}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Salaire</label>
                  <input
                    type="number"
                    name="salaire"
                    value={formData.salaire}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date d'entrée</label>
                  <input
                    type="date"
                    name="date_entree"
                    value={formData.date_entree}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200 flex items-center"
                  disabled={isSubmitting}
                >
                  <X size={16} className="mr-2" />
                  Annuler
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      <span>Traitement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" />
                      <span>{editingId ? 'Mettre à jour' : 'Enregistrer'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </SlideDown>
          
          {/* Employee Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-100 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-indigo-800">Total des employés</h3>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-green-800">Salaire moyen</h3>
              <p className="text-2xl font-bold">
                {employees.length > 0 
                  ? `${Math.round(employees.reduce((acc, emp) => acc + Number(emp.salaire), 0) / employees.length)} €`
                  : '0 €'}
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-blue-800">Résultats de recherche</h3>
              <p className="text-2xl font-bold">{sortedAndFilteredEmployees.length}</p>
            </div>
          </div>
          
          {/* Employees Table */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="font-medium text-gray-700">Liste des employés</h2>
            </div>
            
            {isLoading ? (
              <div className="p-4">
                <SkeletonLoader />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                  <HelpCircle size={24} />
                </div>
                <p className="text-lg font-medium text-gray-900">{error}</p>
                <p className="text-gray-500 mt-2">Veuillez réessayer plus tard</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th 
                        className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('nom')}
                      >
                        <div className="flex items-center">
                          Nom
                          {sortField === 'nom' && (
                            <ChevronDown 
                              className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                sortDirection === 'desc' ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('prenom')}
                      >
                        <div className="flex items-center">
                          Prénom
                          {sortField === 'prenom' && (
                            <ChevronDown 
                              className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                sortDirection === 'desc' ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Email
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Téléphone
                      </th>
                      <th 
                        className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden md:table-cell"
                        onClick={() => handleSort('poste')}
                      >
                        <div className="flex items-center">
                          Poste
                          {sortField === 'poste' && (
                            <ChevronDown 
                              className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                sortDirection === 'desc' ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </th>
                      <th 
                        className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell"
                        onClick={() => handleSort('salaire')}
                      >
                        <div className="flex items-center">
                          Salaire
                          {sortField === 'salaire' && (
                            <ChevronDown 
                              className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                sortDirection === 'desc' ? 'transform rotate-180' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedAndFilteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-lg font-medium">Aucun employé trouvé</p>
                            <p className="text-sm text-gray-500">Essayez avec un autre terme de recherche</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredEmployees.map((employee) => (
                        <tr 
                          key={employee.id} 
                          className="hover:bg-blue-50 transition-colors duration-150"
                        >
                          <td className="py-3 px-4">{employee.nom}</td>
                          <td className="py-3 px-4">{employee.prenom}</td>
                          <td className="py-3 px-4 hidden md:table-cell truncate max-w-xs">{employee.email}</td>
                          <td className="py-3 px-4 hidden lg:table-cell">{employee.telephone}</td>
                          <td className="py-3 px-4 hidden md:table-cell">{employee.poste}</td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="font-medium">{Number(employee.salaire).toLocaleString()}€</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(employee)}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors duration-200"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(employee.id)}
                                className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-200"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
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
        </div>
      </div>
    </div>
  );
}