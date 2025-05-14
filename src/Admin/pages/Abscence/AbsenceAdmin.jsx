import React, { useState, useEffect } from 'react';

const AbsencesAdmin = () => {
  const [absences, setAbsences] = useState([]);
  const [employeId, setEmployeId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [motif, setMotif] = useState('');
  const [justifiee, setJustifiee] = useState(false);
  const [message, setMessage] = useState('');
  const [absenceIdToValidate, setAbsenceIdToValidate] = useState(null);
  const [justificatifFile, setJustificatifFile] = useState(null);

  // Récupération des absences
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/admin/absences')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAbsences(data);
        } else if (Array.isArray(data.data)) {
          setAbsences(data.data);
        } else {
          setAbsences([]);
          setMessage('Format inattendu des données absences');
        }
      })
      .catch((error) => {
        setAbsences([]);
        setMessage('Erreur lors de la récupération des absences');
        console.error('Erreur lors de la récupération des absences:', error);
      });
  }, []);

  // Ajout d'une absence
  const handleAddAbsenceSubmit = async (e) => {
    e.preventDefault();

    if (!employeId || !dateDebut || !motif) {
      setMessage('Tous les champs sont obligatoires');
      return;
    }

    const response = await fetch('http://127.0.0.1:8000/api/admin/absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employe_id: employeId,
        date_debut: dateDebut,
        date_fin: dateFin,
        motif: motif,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(data.message || 'Absence ajoutée avec succès');
      setAbsences((prev) => [...prev, data.data]); // Ajout de la nouvelle absence à la liste
    } else {
      setMessage(data.message || "Erreur lors de l'ajout de l'absence");
    }
  };

  // Validation de la justification avec ajout d'un fichier justificatif
  
  const handleValidateJustificationSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('_method', 'PUT'); // important pour simuler PUT
  formData.append('justifiee', justifiee ? '1' : '0');

  if (justificatifFile) {
    formData.append('justificatif', justificatifFile);
  }

  const response = await fetch(`http://127.0.0.1:8000/api/admin/absences/${absenceIdToValidate}/justification`, {
    method: 'POST', // POST ici pour simuler PUT
    headers: {
      'Accept': 'application/json'
    },
    body: formData,
  });

  const data = await response.json();
  if (response.ok) {
    setMessage(data.message || 'Justification mise à jour');
    setAbsences((prevAbsences) =>
      prevAbsences.map((absence) =>
        absence.id === parseInt(absenceIdToValidate)
          ? { ...absence, justifiee: justifiee }
          : absence
      )
    );
  } else {
    setMessage(data.message || "Erreur lors de la mise à jour de la justification");
    console.error('Erreur back:', data);
  }
};


  // Réinitialisation du message après un délai
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000); // Réinitialisation du message après 3 secondes
      return () => clearTimeout(timer); // Nettoyage du timer à la déconstruction
    }
  }, [message]);

  return (
    <div className="p-8 bg-white text-blue-900 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center">Gestion des absences</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulaire ajout */}
        <div className="bg-blue-50 p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">Ajouter une absence</h3>
          <form onSubmit={handleAddAbsenceSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">ID Employé</label>
              <input
                type="text"
                value={employeId}
                onChange={(e) => setEmployeId(e.target.value)}
                required
                className="w-full border border-blue-300 p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Date de début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
                className="w-full border border-blue-300 p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Date de fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Motif</label>
              <input
                type="text"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                required
                className="w-full border border-blue-300 p-2 rounded"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Ajouter Absence
            </button>
          </form>
        </div>

        {/* Formulaire justification */}
        <div className="bg-blue-50 p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">Valider une justification</h3>
          <form onSubmit={handleValidateJustificationSubmit} className="space-y-4" encType="multipart/form-data">
            <div>
              <label className="block mb-1">ID de l'absence</label>
              <input
                type="number"
                value={absenceIdToValidate || ''}
                onChange={(e) => setAbsenceIdToValidate(e.target.value)}
                required
                className="w-full border border-blue-300 p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Justification</label>
              <select
                value={justifiee ? 'true' : 'false'}
                onChange={(e) => setJustifiee(e.target.value === 'true')}
                className="w-full border border-blue-300 p-2 rounded"
              >
                <option value="true">Justifiée</option>
                <option value="false">Non justifiée</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Ajouter un justificatif (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setJustificatifFile(e.target.files[0])}
                className="w-full border border-blue-300 p-2 rounded"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Valider
            </button>
          </form>
        </div>
      </div>

      {/* Message */}
      {message && <p className="mt-6 text-center text-green-700 font-semibold">{message}</p>}

      {/* Tableau */}
      <div className="mt-10">
        <h3 className="text-2xl font-semibold mb-4">Liste des absences</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-blue-300 bg-white rounded">
            <thead className="bg-blue-100 text-blue-900">
              <tr>
                <th className="p-3 border">Nom de l'employé</th>
                <th className="p-3 border">Date de début</th>
                <th className="p-3 border">Date de fin</th>
                <th className="p-3 border">Motif</th>
                <th className="p-3 border">Justification</th>
                <th className="p-3 border">Justificatif</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(absences) && absences.length > 0 ? (
                absences.map((absence) => (
                  <tr key={absence.id} className="text-center hover:bg-blue-50">
                    <td className="p-3 border">{absence.employe?.nom}</td>
                    <td className="p-3 border">{absence.date_debut}</td>
                    <td className="p-3 border">{absence.date_fin}</td>
                    <td className="p-3 border">{absence.motif}</td>
                    <td className="p-3 border">{absence.justifiee ? 'Oui' : 'Non'}</td>
                    <td className="p-3 border">
                      {absence.justificatif ? (
                        <a href={absence.justificatif} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      ) : (
                        'Aucun justificatif'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-3 text-center">Aucune absence enregistrée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AbsencesAdmin;
