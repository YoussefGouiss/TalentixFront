import React, { useState } from 'react';

const FichePaieAdmin = () => {
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState('');
  const [employeId, setEmployeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const body = JSON.stringify({ mois, annee });

    try {
      let response;

      if (employeId.trim() !== '') {
        // Envoi à un seul employé
        response = await fetch(`http://127.0.0.1:8000/api/fiche-paie/send-one/${employeId}`, {
          method: 'POST',
           headers: {
          'Content-Type': 'application/json',
        },
          body
        });
      } else {
        // Envoi à tous les employés
        response = await fetch('http://127.0.0.1:8000/api/fiche-paie/send-all', {
          method: 'POST',
           headers: {
          'Content-Type': 'application/json',
        },
          body
        });
      }

      const data = await response.json();

      if (response.status === 401) {
        // Si 401, cela signifie que le token est invalide ou expiré
        setMessage("Token invalide ou expiré. Veuillez vous reconnecter.");
        // Optionnel : rediriger vers la page de connexion
        // window.location.href = '/login';
      } else if (!response.ok) {
        // Gestion d'autres erreurs
        throw new Error(data.message || "Erreur lors de l'envoi");
      }

      setMessage(data.message || "Fiches de paie envoyées avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Une erreur s'est produite lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Générer les fiches de paie</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Mois (format 01-12)</label>
          <input
            type="text"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
            placeholder="Ex: 05"
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Année</label>
          <input
            type="text"
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            placeholder="Ex: 2025"
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">ID de l'employé (laisser vide pour tous)</label>
          <input
            type="text"
            value={employeId}
            onChange={(e) => setEmployeId(e.target.value)}
            placeholder="Ex: 3"
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer les fiches de paie'}
        </button>
      </form>

      {message && <p className="mt-4 text-green-600 font-semibold">{message}</p>}
    </div>
  );
};

export default FichePaieAdmin;
