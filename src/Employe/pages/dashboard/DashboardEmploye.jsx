import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
// Admin-theme icons
import { 
    FaUserCircle, FaCalendarCheck, FaBookReader, FaFileSignature, FaBoxOpen, 
    FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaArrowRight, FaSpinner,
    FaQuestionCircle
} from 'react-icons/fa';

// --- Mock/Helper API URL (not for new endpoints, but for consistency) ---
const API_BASE_URL = 'http://localhost:8000/api/employe'; 
const EMPLOYE_TOKEN_KEY = 'employe_token';

// --- Re-usable Themed Components (Simplified for Dashboard Context) ---
const StatCard = ({ title, value, icon, color, unit = '', loading = false, linkTo }) => (
  <Link 
    to={linkTo || '#'} 
    className={`bg-white p-5 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 flex flex-col justify-between min-h-[130px] ${linkTo ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between">
      <h3 className={`text-sm font-semibold ${color ? `text-${color}-600` : 'text-[#567C8D]'}`}>{title}</h3>
      <div className={`p-2 rounded-full ${color ? `bg-${color}-100 text-${color}-600` : 'bg-slate-100 text-slate-600'}`}>
        {loading ? <FaSpinner className="animate-spin" size={18} /> : icon}
      </div>
    </div>
    <div className="mt-2">
      {loading ? (
        <div className="h-8 bg-slate-200 rounded animate-pulse w-3/4"></div>
      ) : (
        <p className={`text-3xl font-bold ${color ? `text-${color}-700` : 'text-[#2F4156]'}`}>
          {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
        </p>
      )}
    </div>
  </Link>
);

const QuickLinkCard = ({ title, description, icon, linkTo, bgColorClass = 'bg-[#567C8D]' }) => (
  <Link to={linkTo} className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white flex flex-col items-start ${bgColorClass}`}>
    <div className="mb-3 p-3 bg-white/20 rounded-full">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className="text-xs opacity-80 mb-4 flex-grow">{description}</p>
    <div className="mt-auto text-sm font-medium flex items-center group">
      Accéder <FaArrowRight size={12} className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
    </div>
  </Link>
);


export default function DashboardEmploye() {
  // For simplicity, we'll fetch minimal summary data here.
  // In a real app, this might come from a context or dedicated dashboard API.
  const [summaryData, setSummaryData] = useState({
    congesEnAttente: 0,
    soldeConges: null, // Placeholder
    formationsEnAttente: 0,
    formationsApprouvees: 0,
    attestationsEnAttente: 0,
    materielEnAttente: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);
  
  // Dummy user name - replace with actual data if available
  const [employeeName, setEmployeeName] = useState("Employé"); 

  const getToken = () => localStorage.getItem(EMPLOYE_TOKEN_KEY);

  // --- Data Fetching Logic (Simplified & Aggregated) ---
  const fetchDashboardData = useCallback(async () => {
    setLoadingSummary(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError("Utilisateur non authentifié.");
      setLoadingSummary(false);
      return;
    }

    try {
      // Simulate fetching from multiple sources.
      // In a real app, prefer a single dashboard endpoint if possible.

      // 1. Conges Summary
      let congesEnAttente = 0;
      let soldeCongesCalculated = null; // Default to null
      try {
        const congesRes = await fetch(`${API_BASE_URL}/conges`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
        if (congesRes.ok) {
          const congesData = await congesRes.json();
          const congesArray = Array.isArray(congesData.conges) ? congesData.conges : (Array.isArray(congesData) ? congesData : []);
          congesEnAttente = congesArray.filter(c => c.statut === 'en_attente').length;
          
          // Try to get saldo from conges endpoint if it provides it (like in refactored Conge.js)
          if (congesData.leave_balance && congesData.leave_balance.solde_restant_total !== undefined) {
            soldeCongesCalculated = congesData.leave_balance.solde_restant_total;
          } else { // Fallback: very basic client-side calculation (less accurate)
            const annee = new Date().getFullYear();
            const joursDejaPris = congesArray
              .filter(c => c.statut === 'approuve' && new Date(c.date_debut).getFullYear() === annee)
              .reduce((total, c) => {
                  const start = new Date(c.date_debut);
                  const end = new Date(c.date_fin);
                  if (isNaN(start.getTime()) || isNaN(end.getTime())) return total;
                  const diffTime = Math.abs(end - start);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  return total + diffDays;
              }, 0);
            soldeCongesCalculated = 30 - joursDejaPris; // Assuming 30 days base
          }
        }
      } catch (e) { console.error("Erreur chargement résumé congés:", e); }

      // 2. Formations Summary
      let formationsEnAttente = 0;
      let formationsApprouvees = 0;
      try {
        const formationsRes = await fetch(`${API_BASE_URL}/demandes-formations`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
        if (formationsRes.ok) {
          const formationsData = await formationsRes.json();
          const formationsArray = Array.isArray(formationsData) ? formationsData : [];
          formationsEnAttente = formationsArray.filter(f => f.statut === 'en attente').length;
          formationsApprouvees = formationsArray.filter(f => f.statut === 'approuvée' || f.statut === 'approuve').length;
        }
      } catch (e) { console.error("Erreur chargement résumé formations:", e); }

      // 3. Attestations Summary
      let attestationsEnAttente = 0;
      try {
        const attestationsRes = await fetch(`${API_BASE_URL}/mes-demandes`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
        if (attestationsRes.ok) {
          const attestationsData = await attestationsRes.json();
          const attestationsArray = Array.isArray(attestationsData) ? attestationsData : (Array.isArray(attestationsData.data) ? attestationsData.data : []);
          attestationsEnAttente = attestationsArray.filter(a => a.statut === 'en attente').length;
        }
      } catch (e) { console.error("Erreur chargement résumé attestations:", e); }

      // 4. Matériel Summary
      let materielEnAttente = 0;
      try {
        const materielRes = await fetch(`http://localhost:8000/api/material`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
        if (materielRes.ok) {
          const materielData = await materielRes.json();
          const materielArray = Array.isArray(materielData) ? materielData : [];
          materielEnAttente = materielArray.filter(m => m.statut === 'en_attente').length;
        }
      } catch (e) { console.error("Erreur chargement résumé matériel:", e); }


      setSummaryData({
        congesEnAttente,
        soldeConges: soldeCongesCalculated,
        formationsEnAttente,
        formationsApprouvees,
        attestationsEnAttente,
        materielEnAttente,
      });

    } catch (mainError) {
      setError("Impossible de charger les données du tableau de bord.");
      console.error("Erreur principale dashboard:", mainError);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Fetch employee name if you have an endpoint for it, e.g., /employe/profile
    // For now, using a static name.
  }, [fetchDashboardData]);
  

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  if (error && !loadingSummary) {
    return (
      <div className="min-h-screen bg-[#F5EFEB] p-4 md:p-6 flex items-center justify-center">
        <div className="p-10 text-center bg-white rounded-xl shadow-lg">
            <FaExclamationTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-xl font-semibold text-[#2F4156] mb-2">Erreur de chargement</p>
            <p className="text-[#567C8D]">{error}</p>
            <button 
                onClick={fetchDashboardData}
                className="mt-6 px-4 py-2 bg-[#567C8D] text-white rounded-lg hover:bg-[#4A6582] transition-colors text-sm font-medium"
            >
                Réessayer
            </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F5EFEB] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2F4156]">{greeting()}, {employeeName}!</h1>
          <p className="text-[#567C8D] mt-1">Voici un aperçu de votre espace employé.</p>
        </div>

        {/* Quick Stats Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[#2F4156] mb-4">Vos Statistiques Clés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard 
              title="Solde de Congés Restant" 
              value={summaryData.soldeConges !== null ? summaryData.soldeConges : '--'} 
              unit="jours" 
              icon={<FaCalendarCheck size={20} />} 
              color="blue"
              loading={loadingSummary && summaryData.soldeConges === null}
              linkTo="/employe/conges"
            />
            <StatCard 
              title="Congés en Attente" 
              value={summaryData.congesEnAttente} 
              icon={<FaHourglassHalf size={20} />} 
              color="yellow"
              loading={loadingSummary}
              linkTo="/employe/conges"
            />
            <StatCard 
              title="Formations Approuvées" 
              value={summaryData.formationsApprouvees} 
              icon={<FaCheckCircle size={20} />} 
              color="green"
              loading={loadingSummary}
              linkTo="/employe/formations" // Assuming tab switch handled there
            />
             <StatCard 
              title="Formations en Attente" 
              value={summaryData.formationsEnAttente} 
              icon={<FaHourglassHalf size={20} />} 
              color="yellow"
              loading={loadingSummary}
              linkTo="/employe/formations"
            />
            <StatCard 
              title="Attestations en Attente" 
              value={summaryData.attestationsEnAttente} 
              icon={<FaFileSignature size={20} />} 
              color="purple"
              loading={loadingSummary}
              linkTo="/employe/attestations"
            />
            <StatCard 
              title="Matériel en Attente" 
              value={summaryData.materielEnAttente} 
              icon={<FaBoxOpen size={20} />} 
              color="indigo"
              loading={loadingSummary}
              linkTo="/employe/material"
            />
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#2F4156] mb-4">Accès Rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <QuickLinkCard 
              title="Mes Congés" 
              description="Consultez votre solde et faites une demande." 
              icon={<FaCalendarCheck size={24} />} 
              linkTo="/employe/conges"
              bgColorClass="bg-blue-500 hover:bg-blue-600"
            />
            <QuickLinkCard 
              title="Mes Formations" 
              description="Inscrivez-vous et suivez vos formations." 
              icon={<FaBookReader size={24} />} 
              linkTo="/employe/formations"
              bgColorClass="bg-teal-500 hover:bg-teal-600"
            />
            <QuickLinkCard 
              title="Mes Attestations" 
              description="Demandez vos attestations de travail ou de salaire." 
              icon={<FaFileSignature size={24} />} 
              linkTo="/employe/attestations"
              bgColorClass="bg-purple-500 hover:bg-purple-600"
            />
            <QuickLinkCard 
              title="Mes Matériels" 
              description="Faites une demande pour le matériel nécessaire." 
              icon={<FaBoxOpen size={24} />} 
              linkTo="/employe/material"
              bgColorClass="bg-indigo-500 hover:bg-indigo-600"
            />
          </div>
        </section>
        
        {/* Placeholder for Recent Activity or Announcements */}
        {/* This section would ideally be powered by specific backend data */}
      </div>
    </div>
  );
}