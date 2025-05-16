import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHome, FaUsers, FaUserClock, FaCalendarAlt, FaBookOpen, FaFileInvoiceDollar,
  FaBriefcase, FaFileContract, FaBoxOpen, FaTasks, FaUserPlus,
  FaExclamationTriangle, FaArrowRight, FaBell, FaSpinner, FaUserTie, FaBuilding,
  FaClipboardList, FaChalkboardTeacher, FaFileSignature, FaMoneyCheckAlt
} from 'react-icons/fa';

// --- Reusable Themed Components (DashboardCard, RecentActivityItem from previous example) ---
const DashboardCard = ({ title, icon, count, linkTo, color = "blue", description, cta = "Gérer" }) => {
  const navigate = useNavigate();
  const baseColorClasses = {
    blue: { main: "text-blue-700", bg: "bg-blue-50", border: "border-blue-500", hoverBg: "hover:bg-blue-100" },
    green: { main: "text-green-700", bg: "bg-green-50", border: "border-green-500", hoverBg: "hover:bg-green-100" },
    indigo: { main: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-500", hoverBg: "hover:bg-indigo-100" },
    teal: { main: "text-teal-700", bg: "bg-teal-50", border: "border-teal-500", hoverBg: "hover:bg-teal-100" },
    purple: { main: "text-purple-700", bg: "bg-purple-50", border: "border-purple-500", hoverBg: "hover:bg-purple-100" },
    pink: { main: "text-pink-700", bg: "bg-pink-50", border: "border-pink-500", hoverBg: "hover:bg-pink-100" },
    orange: { main: "text-orange-700", bg: "bg-orange-50", border: "border-orange-500", hoverBg: "hover:bg-orange-100" },
  };
  const theme = baseColorClasses[color] || baseColorClasses.blue;

  return (
    <div
      className={`p-5 rounded-xl shadow-lg border-l-4 ${theme.border} ${theme.bg} ${theme.hoverBg} transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between min-h-[160px]`}
      onClick={() => navigate(linkTo)}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-full bg-opacity-20 ${theme.main.replace('text-', 'bg-')}`}>
            {React.cloneElement(icon, { size: 20, className: `opacity-90 ${theme.main}` })}
          </div>
          {count !== undefined && count !== null && (
            <span className={`text-3xl font-bold ${theme.main}`}>{count}</span>
          )}
        </div>
        <h3 className={`text-md font-semibold mb-1 ${theme.main}`}>{title}</h3>
        {description && <p className={`text-xs ${theme.main} opacity-70`}>{description}</p>}
      </div>
      <Link to={linkTo} className={`text-xs font-medium mt-3 inline-flex items-center ${theme.main} hover:underline opacity-90`}>
        {cta} <FaArrowRight className="ml-1.5" size={10} />
      </Link>
    </div>
  );
};

const RecentActivityItem = ({ icon, text, detail, time, linkTo }) => {
  const navigate = useNavigate();
  return (
    <li 
      className="py-3 px-2 flex items-center justify-between hover:bg-[#E2E8F0]/40 rounded-md transition-colors cursor-pointer group"
      onClick={() => linkTo && navigate(linkTo)}
    >
      <div className="flex items-center min-w-0">
        <div className="p-2 bg-[#C8D9E6]/40 rounded-full mr-3 group-hover:bg-[#A0B9CD]/50 transition-colors">
          {React.cloneElement(icon, { size: 16, className: "text-[#567C8D] group-hover:text-[#2F4156] transition-colors" })}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#2F4156] truncate group-hover:text-blue-600 transition-colors">{text}</p>
          {detail && <p className="text-xs text-[#567C8D] truncate">{detail}</p>}
        </div>
      </div>
      {time && <span className="text-xs text-[#567C8D] ml-2 flex-shrink-0">{time}</span>}
    </li>
  );
};
// --- End Reusable Themed Components ---


export default function DashboardAdmin() {
  const [dashboardData, setDashboardData] = useState({
    counts: {
      totalEmployees: 0,
      pendingConges: 0,
      activeRecruitments: 0,
      pendingCandidatures: 0,
      totalFormations: 0,
      pendingFormationDemandes: 0,
      pendingAttestationDemandes: 0,
      pendingMateriel: 0,
    },
    recent: {
      newEmployees: [],
      pendingConges: [],
      newCandidatures: [],
      pendingMateriel: [],
    },
    isLoading: true,
    error: null,
  });

  const API_BASE_PATH = 'http://localhost:8000/api'; // General API path
  const ADMIN_API_BASE_PATH = `${API_BASE_PATH}/admin`; // Admin specific path

  const getToken = () => localStorage.getItem('admin_token');

  const fetchDataForDashboard = useCallback(async (endpoint, isAdminPath = true) => {
    const baseUrl = isAdminPath ? ADMIN_API_BASE_PATH : API_BASE_PATH;
    const url = `${baseUrl}/${endpoint}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Erreur ${response.status} pour ${endpoint}` }));
            console.warn(`Failed to fetch ${endpoint}: ${errorData.message}`);
            return []; // Return empty array on error
        }
        const data = await response.json();
        return Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.message) ? data.message : [] ) ); // Handle various API response structures
    } catch (error) {
        console.warn(`Exception fetching ${endpoint}: ${error.message}`);
        return []; // Return empty array on exception
    }
  }, []);


  useEffect(() => {
    const fetchAllData = async () => {
      setDashboardData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const results = await Promise.allSettled([
        fetchDataForDashboard('employes', false), // Employee.jsx uses /api/employes
        fetchDataForDashboard('conges'),
        fetchDataForDashboard('recrutements'),
        fetchDataForDashboard('condidateurs'),
        fetchDataForDashboard('formations'),
        fetchDataForDashboard('demandes-formations'),
        fetchDataForDashboard('attestation-demandes'),
        fetchDataForDashboard('material'),
      ]);

      const [
        employeesData, congesData, recrutementsData, candidaturesData,
        formationsData, formationDemandesData, attestationDemandesData, materialData
      ] = results.map(res => res.status === 'fulfilled' ? res.value : []);
      
      // Process data for counts and recent items
      const pendingConges = congesData.filter(c => c.statut === 'en_attente');
      const activeRecruitments = recrutementsData.filter(r => r.statut === 'en cours');
      const pendingCandidatures = candidaturesData.filter(c => c.statut === 'en attente'); // As per DemandeCondidateur.jsx
      const pendingFormationDemandes = formationDemandesData.filter(d => d.statut === 'en attente');
      const pendingAttestationDemandes = attestationDemandesData.filter(d => d.statut === 'en attente');
      const pendingMateriel = materialData.filter(m => m.statut === 'en_attente');

      const sortDescByCreatedAt = (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0);
      const sortDescByDateEntree = (a, b) => new Date(b.date_entree || 0) - new Date(a.date_entree || 0);

      setDashboardData({
        counts: {
          totalEmployees: employeesData.length,
          pendingConges: pendingConges.length,
          activeRecruitments: activeRecruitments.length,
          pendingCandidatures: pendingCandidatures.length,
          totalFormations: formationsData.length,
          pendingFormationDemandes: pendingFormationDemandes.length,
          pendingAttestationDemandes: pendingAttestationDemandes.length,
          pendingMateriel: pendingMateriel.length,
        },
        recent: {
          newEmployees: [...employeesData].sort(sortDescByDateEntree).slice(0, 3),
          pendingConges: [...pendingConges].sort(sortDescByCreatedAt).slice(0, 3),
          newCandidatures: [...pendingCandidatures].sort(sortDescByCreatedAt).slice(0, 3),
          pendingMateriel: [...pendingMateriel].sort(sortDescByCreatedAt).slice(0, 3),
          // Add more recent items if needed, e.g., recent formation/attestation demands
        },
        isLoading: false,
        error: results.some(res => res.status === 'rejected') ? "Certaines données n'ont pas pu être chargées." : null,
      });
    };

    fetchAllData();
  }, [fetchDataForDashboard]);

  const adminName = localStorage.getItem('admin_name') || "Admin";

  const formatTimeAgo = (dateString) => {
    if (!dateString) return ''; const date = new Date(dateString); const now = new Date();
    const diffSeconds = Math.round((now - date) / 1000);
    if (diffSeconds < 2) return `à l'instant`; if (diffSeconds < 60) return `il y a ${diffSeconds} s`;
    const diffMinutes = Math.round(diffSeconds / 60); if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
    const diffHours = Math.round(diffMinutes / 60); if (diffHours < 24) return `il y a ${diffHours} h`;
    const diffDays = Math.round(diffHours / 24); return `il y a ${diffDays} j`;
  };

   const formatDateForDisplay = (dateString) => { 
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };


  const quickAccessItems = [
    { title: "Employés", icon: <FaUsers />, count: dashboardData.counts.totalEmployees, linkTo: "/admin/employes", color: "blue", description: "Gérer les profils." },
    { title: "Congés en Attente", icon: <FaUserClock />, count: dashboardData.counts.pendingConges, linkTo: "/admin/conges", color: "teal", description: "Valider les demandes." },
    { title: "Recrutements Actifs", icon: <FaBuilding />, count: dashboardData.counts.activeRecruitments, linkTo: "/admin/recrutements", color: "indigo", description: "Gérer les offres." },
    { title: "Candidatures", icon: <FaUserTie />, count: dashboardData.counts.pendingCandidatures, linkTo: "/admin/candidateur", color: "purple", description: "Traiter les postulants." },
    { title: "Demandes Formation", icon: <FaTasks />, count: dashboardData.counts.pendingFormationDemandes, linkTo: "/admin/demandes-formations", color: "pink", description: "Valider inscriptions." },
    { title: "Demandes Attestation", icon: <FaClipboardList />, count: dashboardData.counts.pendingAttestationDemandes, linkTo: "/admin/demandeAttestation", color: "green", description: "Traiter demandes." },
    { title: "Demandes Matériel", icon: <FaBoxOpen />, count: dashboardData.counts.pendingMateriel, linkTo: "/admin/material", color: "orange", description: "Gérer le matériel." },
  ];
  // Sidebar links from TestSidebar.jsx
  const otherManagementLinks = [
    // { id: "Absences", icon: <FaClock />, text: "Absences", route: "/admin/absences" }, // No page provided
    { title: "Formations", icon: <FaBookOpen />, linkTo: "/admin/formation", description: "Catalogue des formations.", color: "green" },
    { title: "Fiches de paie", icon: <FaFileInvoiceDollar />, linkTo: "/admin/FichePaie", description: "Générer & envoyer.", color: "purple" },
    { title: "Types d'Attestation", icon: <FaFileContract />, linkTo: "/admin/attestations", description: "Configurer les types.", color: "blue" },
    // { id: "Calendrier", icon: <FaCalendarAlt />, text: "Calendrier", route: "/admin/calendrier" }, // No page provided
  ];

  if (dashboardData.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EFEB]/50 to-[#C8D9E6]/30 p-8 flex flex-col justify-center items-center">
        <FaSpinner className="text-4xl text-[#2F4156] animate-spin" />
        <p className="mt-4 text-lg text-[#2F4156]">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EFEB]/40 via-white to-[#C8D9E6]/20 p-4 md:p-8">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2F4156]">Tableau de Bord</h1>
        <p className="text-md text-[#567C8D] mt-1">Bienvenue, {adminName} ! Voici les dernières activités.</p>
      </header>

      {dashboardData.error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 border-l-4 border-red-500 rounded-md shadow flex items-center">
          <FaExclamationTriangle className="mr-3" size={20}/>
          <p>Erreur de chargement: {dashboardData.error}</p>
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#2F4156] mb-5 border-b border-[#C8D9E6]/70 pb-2">Accès Prioritaires</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {quickAccessItems.map((item) => (
            <DashboardCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 mb-10">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl border border-[#C8D9E6]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-[#2F4156]">Activité Récente</h2>
            <FaBell className="text-[#567C8D]" size={20}/>
          </div>
          <ul className="space-y-1 divide-y divide-[#E2E8F0]/70 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.values(dashboardData.recent).every(arr => arr.length === 0) ? (
                <li className="py-6 text-sm text-center text-[#567C8D]">Aucune activité récente à afficher.</li>
            ) : (
                <>
                    {dashboardData.recent.newEmployees.map(emp => (
                        <RecentActivityItem key={`emp-${emp.id}`} icon={<FaUserPlus />}
                            text={`${emp.prenom} ${emp.nom} a rejoint`}
                            detail={`Entrée: ${formatDateForDisplay(emp.date_entree)}`}
                            time={formatTimeAgo(emp.created_at || emp.date_entree)} // Use created_at if date_entree is future
                            linkTo={`/admin/employes`} />
                    ))}
                    {dashboardData.recent.pendingConges.map(conge => (
                        <RecentActivityItem key={`conge-${conge.id}`} icon={<FaUserClock />}
                            text={`Congé: ${conge.employe?.prenom} ${conge.employe?.nom}`}
                            detail={`${conge.type_conge || 'Congé'} du ${formatDateForDisplay(conge.date_debut)}`}
                            time={formatTimeAgo(conge.created_at)}
                            linkTo={`/admin/conges`} />
                    ))}
                    {dashboardData.recent.newCandidatures.map(cand => (
                        <RecentActivityItem key={`cand-${cand.id}`} icon={<FaUserTie />}
                            text={`Candidature: ${cand.prenom} ${cand.nom}`}
                            detail={`Poste: ${cand.poste_candidate || 'N/A'}`}
                            time={formatTimeAgo(cand.created_at)}
                            linkTo={`/admin/candidateur`} />
                    ))}
                    {dashboardData.recent.pendingMateriel.map(mat => (
                        <RecentActivityItem key={`mat-${mat.id}`} icon={<FaBoxOpen />}
                            text={`Matériel: ${mat.nom} (par ${mat.employe?.nom || 'N/A'})`}
                            detail={`Qté: ${mat.quantite}, Motif: ${mat.motif?.substring(0,25)}...`}
                            time={formatTimeAgo(mat.created_at)}
                            linkTo={`/admin/material`} />
                    ))}
                </>
            )}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xl border border-[#C8D9E6]">
          <h2 className="text-xl font-semibold text-[#2F4156] mb-5">Autres Sections</h2>
          <div className="space-y-3">
            {otherManagementLinks.map(item => (
               <Link key={item.title} to={item.linkTo}
                     className="flex items-center p-3.5 bg-[#F5EFEB]/70 hover:bg-[#E2E8F0] rounded-lg transition-colors group">
                {React.cloneElement(item.icon, { size: 18, className: "text-[#2F4156] mr-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" })}
                <div>
                    <h4 className="font-medium text-[#2F4156] group-hover:text-blue-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-[#567C8D]">{item.description}</p>
                </div>
               </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center mt-12 py-4 border-t border-[#C8D9E6]/60 text-xs text-[#567C8D]">
          Tableau de Bord Administrateur © {new Date().getFullYear()}
      </footer>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #C8D9E6; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #A0B9CD; }
      `}</style>
    </div>
  );
}