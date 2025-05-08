import { 
    Home, 
    Calendar, 
    BookOpen, 
    FileText, 
    FileCheck, 
    Clock,
    CheckCircle,
    AlertCircle,
    MoreHorizontal,
    Briefcase,
    Laptop
  } from 'lucide-react';
  
  // Recent updates data
  const recentUpdates = [
    {
      id: 1,
      title: "Demande de congé approuvée",
      description: "Votre demande de congé pour le 15-20 juin 2025 a été approuvée",
      date: "Il y a 2 heures",
      icon: <CheckCircle size={20} className="text-green-500" />,
      type: "success"
    },
    {
      id: 2,
      title: "Nouvelle fiche de paie disponible",
      description: "Votre fiche de paie pour le mois d'avril 2025 est maintenant disponible",
      date: "Il y a 1 jour",
      icon: <FileText size={20} className="text-blue-500" />,
      type: "info"
    },
    {
      id: 3,
      title: "Rappel: Formation obligatoire",
      description: "Formation sur la sécurité des données prévue pour le 12 mai 2025",
      date: "Il y a 3 jours",
      icon: <AlertCircle size={20} className="text-amber-500" />,
      type: "warning"
    },
    {
      id: 4,
      title: "Nouveau matériel attribué",
      description: "Un nouveau laptop Dell XPS 15 a été attribué à votre compte",
      date: "Il y a 4 jours",
      icon: <Laptop size={20} className="text-purple-500" />,
      type: "info"
    }
  ];
  
  // Stats data
  const statsData = [
    {
      title: "Jours de congé restants",
      value: "14",
      icon: <Calendar size={20} className="text-blue-500" />,
      change: "+2 depuis le mois dernier",
      positive: true
    },
    {
      title: "Demandes en attente",
      value: "2",
      icon: <Clock size={20} className="text-amber-500" />,
      change: "Aucun changement",
      positive: null
    },
    {
      title: "Formations complétées",
      value: "3",
      icon: <CheckCircle size={20} className="text-green-500" />,
      change: "+1 depuis le mois dernier",
      positive: true
    },
    {
      title: "Équipements attribués",
      value: "5",
      icon: <Briefcase size={20} className="text-purple-500" />,
      change: "+1 depuis le mois dernier",
      positive: true
    }
  ];
  
  // Tasks data
  const tasksData = [
    {
      id: 1,
      title: "Soumettre note de frais",
      dueDate: "15 mai 2025",
      status: "pending",
      priority: "high"
    },
    {
      id: 2,
      title: "Compléter évaluation annuelle",
      dueDate: "20 mai 2025",
      status: "pending",
      priority: "medium"
    },
    {
      id: 3,
      title: "Mise à jour du profil",
      dueDate: "10 mai 2025",
      status: "completed",
      priority: "low"
    }
  ];
  
  // Upcoming events data
  const upcomingEvents = [
    {
      id: 1,
      title: "Réunion d'équipe",
      date: "10 mai 2025",
      time: "10:00 - 11:30",
      location: "Salle A3"
    },
    {
      id: 2,
      title: "Formation sécurité",
      date: "12 mai 2025",
      time: "14:00 - 16:00",
      location: "Salle de conférence"
    },
    {
      id: 3,
      title: "Entretien annuel",
      date: "25 mai 2025",
      time: "15:00 - 16:00",
      location: "Bureau RH"
    }
  ];
  
  // Dashboard component
  const DashboardEmploye = () => {
    return (
      <div className="bg-gray-100 min-h-screen p-4 md:p-6">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Bonjour, Jean</h1>
          <p className="text-gray-600">Bienvenue dans votre espace personnel</p>
        </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statsData.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-500">{stat.title}</div>
                    <div className="p-2 rounded-full bg-gray-100">{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                  <div className={`text-xs ${
                    stat.positive === true ? 'text-green-500' : 
                    stat.positive === false ? 'text-red-500' : 
                    'text-gray-500'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent updates */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-800">Dernières mises à jour</h2>
                      <button className="text-sm text-blue-600 hover:text-blue-700">Voir tout</button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-4">
                      {recentUpdates.map((update) => (
                        <div key={update.id} className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`p-2 rounded-full ${
                              update.type === 'success' ? 'bg-green-100' :
                              update.type === 'warning' ? 'bg-amber-100' :
                              'bg-blue-100'
                            }`}>
                              {update.icon}
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-800">{update.title}</h3>
                              <span className="text-xs text-gray-500">{update.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                          </div>
                          <button className="ml-2 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Tasks */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-800">Tâches à faire</h2>
                      <button className="text-sm text-blue-600 hover:text-blue-700">Voir tout</button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-3">
                      {tasksData.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={task.status === 'completed'}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              readOnly
                            />
                            <div className="ml-3">
                              <p className={`text-sm font-medium ${
                                task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'
                              }`}>{task.title}</p>
                              <p className="text-xs text-gray-500">Échéance: {task.dueDate}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority === 'high' ? 'Haute' :
                             task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Upcoming events */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-800">Événements à venir</h2>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="border-l-4 border-blue-500 pl-3 py-2">
                          <h3 className="text-sm font-medium text-gray-800">{event.title}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar size={14} className="mr-1" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock size={14} className="mr-1" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Home size={14} className="mr-1" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Quick access */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-800">Accès rapide</h2>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                          <Calendar size={20} />
                        </div>
                        <span className="text-xs font-medium mt-2 text-gray-700">Demande de congé</span>
                      </button>
                      
                      <button className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                          <FileText size={20} />
                        </div>
                        <span className="text-xs font-medium mt-2 text-gray-700">Fiche de paie</span>
                      </button>
                      
                      <button className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 rounded-full bg-green-100 text-green-600">
                          <FileCheck size={20} />
                        </div>
                        <span className="text-xs font-medium mt-2 text-gray-700">Attestations</span>
                      </button>
                      
                      <button className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                          <BookOpen size={20} />
                        </div>
                        <span className="text-xs font-medium mt-2 text-gray-700">Formations</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </div>
    );
  };
  
  export default DashboardEmploye;