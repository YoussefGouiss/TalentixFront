import { useState } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  BookOpen, 
  FileCheck, 
  Repeat, 
  File, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Activity
} from 'lucide-react';

const DashboardAdmin = () => {
  // Sample data
  const stats = [
    { id: 1, title: "Effectif total", value: "124", icon: <Users size={20} />, change: "+3", color: "bg-blue-500" },
    { id: 2, title: "Taux de présence", value: "94%", icon: <Clock size={20} />, change: "+2%", color: "bg-green-500" },
    { id: 3, title: "Congés en cours", value: "7", icon: <Calendar size={20} />, change: "-1", color: "bg-amber-500" },
    { id: 4, title: "Postes vacants", value: "5", icon: <FileCheck size={20} />, change: "+2", color: "bg-purple-500" },
  ];

  const recentActivities = [
    { id: 1, title: "Entretien d'embauche", date: "Aujourd'hui", status: "En attente", type: "recrutement" },
    { id: 2, title: "Formation Excel avancé", date: "Demain", status: "Programmé", type: "formation" },
    { id: 3, title: "Demande de congé", date: "Il y a 3h", status: "Approuvé", type: "conge" },
    { id: 4, title: "Nouvel employé: Marie Dupont", date: "Il y a 2j", status: "Complété", type: "employe" },
    { id: 5, title: "Mutation: Dept. Marketing", date: "Il y a 3j", status: "En cours", type: "mutation" },
  ];

  const deadlines = [
    { id: 1, title: "Clôture des recrutements", date: "15 mai 2025" },
    { id: 2, title: "Évaluation des performances", date: "25 mai 2025" },
    { id: 3, title: "Date limite déclarations fiscales", date: "31 mai 2025" },
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case "En attente": return <AlertCircle size={16} className="text-amber-500" />;
      case "Programmé": return <Calendar size={16} className="text-blue-500" />;
      case "Approuvé": return <CheckCircle size={16} className="text-green-500" />;
      case "Complété": return <CheckCircle size={16} className="text-green-500" />;
      case "En cours": return <Activity size={16} className="text-purple-500" />;
      default: return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "recrutement": return <FileCheck size={16} className="text-purple-500" />;
      case "formation": return <BookOpen size={16} className="text-blue-500" />;
      case "conge": return <Calendar size={16} className="text-amber-500" />;
      case "employe": return <Users size={16} className="text-green-500" />;
      case "mutation": return <Repeat size={16} className="text-red-500" />;
      default: return <File size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="text-gray-500">Bienvenue sur Talentix, votre solution RH complète</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map(stat => (
          <div key={stat.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <span className="text-sm text-green-500 flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" /> {stat.change}
                </span>
              </div>
              <div className={`${stat.color} p-3 rounded-full text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-4">
            <h2 className="font-semibold text-gray-800">Activités récentes</h2>
          </div>
          <div className="p-4">
            <div className="divide-y divide-gray-200">
              {recentActivities.map(activity => (
                <div key={activity.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3">{getTypeIcon(activity.type)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(activity.status)}
                    <span className="text-xs ml-1 text-gray-600">{activity.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                Voir toutes les activités
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-4">
            <h2 className="font-semibold text-gray-800">Échéances à venir</h2>
          </div>
          <div className="p-4">
            <div className="divide-y divide-gray-200">
              {deadlines.map(deadline => (
                <div key={deadline.id} className="py-3">
                  <div className="flex items-center">
                    <div className="mr-3">
                      <Calendar size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{deadline.title}</p>
                      <p className="text-xs text-gray-500">{deadline.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                Ajouter une échéance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="border-b border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800">Aperçu mensuel</h2>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="w-1/4 text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <Users size={20} className="text-blue-600" />
              </div>
              <p className="mt-2 text-sm font-medium">3 nouveaux employés</p>
            </div>
            <div className="w-1/4 text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <BookOpen size={20} className="text-green-600" />
              </div>
              <p className="mt-2 text-sm font-medium">5 formations terminées</p>
            </div>
            <div className="w-1/4 text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <FileCheck size={20} className="text-purple-600" />
              </div>
              <p className="mt-2 text-sm font-medium">8 entretiens menés</p>
            </div>
            <div className="w-1/4 text-center">
              <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <FileText size={20} className="text-amber-600" />
              </div>
              <p className="mt-2 text-sm font-medium">12 contrats signés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;