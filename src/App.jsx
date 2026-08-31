import React, { useState, useEffect } from 'react';
import './App.css';

// --- FONCTION SÉCURISÉE POUR LE STOCKAGE ---
const safeJSONParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const EnveloppeCard = ({ enveloppe, depenses, onAddDepense, onDelete }) => {
  const [nomItem, setNomItem] = useState('');
  const [montantItem, setMontantItem] = useState('');

  const totalDepense = depenses.reduce((acc, d) => acc + d.montant, 0);
  const reste = enveloppe.alloue - totalDepense;
  const pourcentage = enveloppe.alloue > 0 ? (totalDepense / enveloppe.alloue) * 100 : 0;
  const isDanger = reste < 0 || pourcentage >= 100;

  const handleAdd = () => {
    const m = parseFloat(montantItem);
    if (nomItem && !isNaN(m) && m > 0) {
      onAddDepense(enveloppe.id, nomItem, m);
      setNomItem(''); setMontantItem('');
    }
  };

  return (
    <div className={`enveloppe-card animate-fade-in ${isDanger ? 'danger-env' : ''}`}>
      <div className="env-header">
        <h3>{enveloppe.nom}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="env-budget">{enveloppe.alloue.toLocaleString('fr-FR')} Ar</span>
          {enveloppe.id !== 'imprevus' && (
            <button className="delete-env-btn" onClick={() => onDelete(enveloppe.id)}>✕</button>
          )}
        </div>
      </div>
      <div className="env-reste">
        <span className="label">Restant</span>
        <div className="amount-reste">{reste.toLocaleString('fr-FR')} Ar</div>
      </div>
      {enveloppe.id !== 'imprevus' && (
        <div className="env-form">
          <input type="text" placeholder="Description" value={nomItem} onChange={e => setNomItem(e.target.value)} className="mini-input" />
          <input type="number" placeholder="Montant" value={montantItem} onChange={e => setMontantItem(e.target.value)} className="mini-input" />
          <button className="mini-button" onClick={handleAdd}>Ajouter</button>
        </div>
      )}
      <div className="env-liste">
        {depenses.map(d => (
          <div key={d.id} className="env-item animate-slide-down">
            <div className="item-info">
              <span className="item-name">{d.nom}</span>
              <span className="item-date">{d.date}</span>
            </div>
            <span className="item-price">- {d.montant.toLocaleString('fr-FR')} Ar</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  // GESTION DU THEME SOMBRE
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('mikajy_theme');
      if (saved) return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mikajy_theme', theme);
  }, [theme]);

  // VÉRIFICATION DES NOTIFICATIONS
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && "Notification" in window) {
        const today = new Date();
        if (today.getDate() >= 28 && Notification.permission === "granted") {
          const lastNotif = localStorage.getItem('last_notif_date');
          if (lastNotif !== today.toDateString()) {
            new Notification("MiKajy - Fin de mois", {
              body: "N'oublie pas d'enregistrer tes dernières dépenses et de clôturer ton mois !",
              icon: "/mikajy-logo.svg"
            });
            localStorage.setItem('last_notif_date', today.toDateString());
          }
        }
      }
    } catch (e) {
      console.error("Notifications bloquées.");
    }
  }, []);

  const demanderPermissionNotif = () => {
    try {
      if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    } catch (e) {
      console.error("Impossible de demander les notifications.");
    }
  };

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeSplash(true), 2000);
    const timer2 = setTimeout(() => setShowSplash(false), 2500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  // ÉTATS
  const [etape, setEtape] = useState(() => parseInt(localStorage.getItem('mon_etape')) || 1);
  const [profil, setProfil] = useState(() => safeJSONParse('mon_profil', { prenom: '', nom: '', profession: '', salaire: '', autres: '' }));
  const [enveloppes, setEnveloppes] = useState(() => safeJSONParse('mes_enveloppes', []));
  const [depenses, setDepenses] = useState(() => safeJSONParse('mes_depenses', []));
  const [epargnePrecedente, setEpargnePrecedente] = useState(() => parseFloat(localStorage.getItem('mon_epargne_prec')) || 0);
  const [archives, setArchives] = useState(() => safeJSONParse('mes_archives', []));
  const [moisEnregistre, setMoisEnregistre] = useState(() => {
    const saved = localStorage.getItem('mon_mois');
    return saved !== null ? parseInt(saved) : new Date().getMonth();
  });

  // --- NOUVEAU : CONNEXION AU BOUTON RETOUR DU TÉLÉPHONE ---
  useEffect(() => {
    // Initialise l'historique du téléphone avec l'étape actuelle
    window.history.replaceState({ etape: etape }, '');

    const handleBackButton = (event) => {
      // Si l'utilisateur appuie sur "Retour", on regarde à quelle étape on doit revenir
      if (event.state && event.state.etape) {
        setEtape(event.state.etape);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, []); // Se lance une seule fois au démarrage

  // Fonction pour changer d'étape et dire au téléphone de le mémoriser
  const allerAEtape = (nouvelleEtape) => {
    setEtape(nouvelleEtape);
    window.history.pushState({ etape: nouvelleEtape }, '');
  };
  // ---------------------------------------------------------

  const [showAddForm, setShowAddForm] = useState(false);
  const [showRapport, setShowRapport] = useState(false);
  const [showDetailsRapport, setShowDetailsRapport] = useState(false);
  const [vueTendances, setVueTendances] = useState(false); 

  const [nvNomEnv, setNvNomEnv] = useState('');
  const [nvMontantEnv, setNvMontantEnv] = useState('');

  useEffect(() => {
    if (etape === 3 && new Date().getMonth() !== moisEnregistre) setShowRapport(true);
  }, [etape, moisEnregistre]);

  useEffect(() => {
    localStorage.setItem('mon_etape', etape.toString());
    localStorage.setItem('mon_profil', JSON.stringify(profil));
    localStorage.setItem('mes_enveloppes', JSON.stringify(enveloppes));
    localStorage.setItem('mes_depenses', JSON.stringify(depenses));
    localStorage.setItem('mon_mois', moisEnregistre.toString());
    localStorage.setItem('mon_epargne_prec', epargnePrecedente.toString());
    localStorage.setItem('mes_archives', JSON.stringify(archives));
  }, [etape, profil, enveloppes, depenses, moisEnregistre, epargnePrecedente, archives]);

  const revenuTotal = (parseFloat(profil.salaire) || 0) + (parseFloat(profil.autres) || 0) + epargnePrecedente;
  const totalAlloue = enveloppes.reduce((acc, env) => acc + env.alloue, 0);
  const resteAAllouer = revenuTotal - totalAlloue; 
  const totalDepensesGlobal = depenses.reduce((acc, d) => acc + d.montant, 0);
  const epargneRestante = revenuTotal - totalDepensesGlobal;
  const pourcentageGlobal = revenuTotal > 0 ? (totalDepensesGlobal / revenuTotal) * 100 : 0;
  const toutesEnveloppes = [...enveloppes, { id: 'imprevus', nom: 'Imprévus', alloue: resteAAllouer }];

  const validerProfil = () => { 
    if (profil.prenom && profil.salaire) allerAEtape(2); // Utilise l'historique
    else alert("Prénom et salaire requis."); 
  };
  
  const validerBudget = () => {
    demanderPermissionNotif();
    allerAEtape(3); // Utilise l'historique
  };

  const ajouterEnveloppe = () => {
    const montant = parseFloat(nvMontantEnv);
    if (nvNomEnv && montant > 0 && montant <= resteAAllouer) {
      setEnveloppes([{ id: Date.now().toString(), nom: nvNomEnv, alloue: montant }, ...enveloppes]);
      setNvNomEnv(''); setNvMontantEnv(''); setShowAddForm(false);
    }
  };

  const supprimerEnveloppeDashboard = (id) => {
    if (window.confirm("Supprimer ? L'argent retourne aux Imprévus.")) {
      setEnveloppes(enveloppes.filter(e => e.id !== id));
      setDepenses(depenses.filter(d => d.idEnv !== id));
    }
  };

  const ajouterDepense = (idEnv, nom, montant) => {
    const dateJour = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    setDepenses([{ id: Date.now().toString(), idEnv, nom, montant, date: dateJour }, ...depenses]);
  };

  const cloturerMois = () => {
    const nomMois = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    setArchives([...archives, { id: Date.now().toString(), mois: nomMois, revenus: revenuTotal, depenses: totalDepensesGlobal, epargne: epargneRestante }]);
    setEpargnePrecedente(epargneRestante > 0 ? epargneRestante : 0); 
    setEnveloppes([]); setDepenses([]);
    setProfil({ ...profil, salaire: '', autres: '' }); 
    setMoisEnregistre(new Date().getMonth());
    setShowRapport(false); setShowDetailsRapport(false);
    allerAEtape(1); // Utilise l'historique
  };

  const exporterCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Description,Montant (Ar)\n";
    depenses.forEach(d => {
      csvContent += `"${d.date}","${d.nom}",${d.montant}\n`;
    });
    csvContent += `\nRevenus du mois,,,${revenuTotal}\n`;
    csvContent += `Total Depense,,,${totalDepensesGlobal}\n`;
    csvContent += `Epargne restante,,,${epargneRestante}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MiKajy_Bilan_${new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showSplash) {
    return (
      <div className={`splash-screen ${fadeSplash ? 'splash-fade-out' : ''}`}>
        <img src="/mikajy-logo.svg" alt="Logo MiKajy" className="splash-logo" />
        <h2 className="splash-title">MiKajy.</h2>
      </div>
    );
  }

  if (etape === 1) {
    return (
      <div className="app-container onboarding animate-page-transition">
        <h1 className="title-luxe">Nouveau mois.</h1>
        <p className="subtitle">Entrons tes revenus pour cette nouvelle période.</p>
        {epargnePrecedente > 0 && (
          <div className="rollover-badge">✨ Solde du mois dernier reporté : <strong>+ {epargnePrecedente.toLocaleString('fr-FR')} Ar</strong></div>
        )}
        <div className="form-group">
          <input type="text" placeholder="Prénom" value={profil.prenom} onChange={e => setProfil({...profil, prenom: e.target.value})} className="luxury-input" />
          <input type="text" placeholder="Profession" value={profil.profession} onChange={e => setProfil({...profil, profession: e.target.value})} className="luxury-input" />
          <h3 className="section-title">Revenus du mois (Ar)</h3>
          <input type="number" placeholder="Revenu principal" value={profil.salaire} onChange={e => setProfil({...profil, salaire: e.target.value})} className="luxury-input" />
          <input type="number" placeholder="Revenus additionnels" value={profil.autres} onChange={e => setProfil({...profil, autres: e.target.value})} className="luxury-input" />
        </div>
        <button className="luxury-button" onClick={validerProfil}>Continuer</button>
      </div>
    );
  }

  if (etape === 2) {
    return (
      <div className="app-container onboarding animate-page-transition">
        <h1 className="title-luxe">Allocation.</h1>
        <p className="subtitle">Tu disposes de {revenuTotal.toLocaleString('fr-FR')} Ar.</p>
        <div className="allocation-header">
          <span className="label">Fonds non alloués (Imprévus)</span>
          <div className="amount-reste allocation-total">{resteAAllouer.toLocaleString('fr-FR')} Ar</div>
        </div>
        <div className="action-area">
          <input type="text" placeholder="Intitulé (ex: Loyer)" value={nvNomEnv} onChange={e => setNvNomEnv(e.target.value)} className="luxury-input" />
          <input type="number" placeholder="Montant alloué" value={nvMontantEnv} onChange={e => setNvMontantEnv(e.target.value)} className="luxury-input" />
          <button className="luxury-button secondary" onClick={ajouterEnveloppe}>Créer la section</button>
        </div>
        <div className="history-section">
          {enveloppes.map(env => (
            <div key={env.id} className="history-item animate-slide-down">
              <span className="item-name">{env.nom}</span>
              <div><span className="item-value">{env.alloue.toLocaleString('fr-FR')} Ar</span><span className="delete-btn" onClick={() => supprimerEnveloppeDashboard(env.id)}>✕</span></div>
            </div>
          ))}
        </div>
        <button className="luxury-button" onClick={validerBudget} style={{marginTop: '30px'}}>Accéder au tableau de bord</button>
      </div>
    );
  }

  return (
    <div className="app-container animate-page-transition">
      {showRapport && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content rapport-modal">
            <h2 className="title-luxe">Rapport Mensuel</h2>
            <p style={{marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px'}}>
              Bilan du mois pour <strong>{profil.prenom}</strong>.
            </p>
            <div className="report-stats">
              <div className="stat-row"><span className="label">Revenus totaux</span><span className="stat-value">{revenuTotal.toLocaleString('fr-FR')} Ar</span></div>
              <div className="stat-row"><span className="label">Total Dépensé</span><span className="stat-value" style={{color: 'var(--danger-color)'}}>- {totalDepensesGlobal.toLocaleString('fr-FR')} Ar</span></div>
              <div className="stat-row highlight"><span className="label">Argent Épargné</span><span className="stat-value" style={{color: '#10B981'}}>{epargneRestante.toLocaleString('fr-FR')} Ar</span></div>
            </div>

            <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
              <button className="text-button" onClick={() => setShowDetailsRapport(!showDetailsRapport)} style={{flex: 1, backgroundColor: 'var(--bg-color)'}}>
                {showDetailsRapport ? "▲ Masquer" : "▼ Détails"}
              </button>
              <button className="text-button" onClick={exporterCSV} style={{flex: 1, backgroundColor: 'var(--bg-color)', color: '#10B981'}}>
                  Exporter (CSV)
              </button>
            </div>

            {showDetailsRapport && (
              <div className="rapport-details animate-slide-down">
                {depenses.length === 0 ? <p style={{fontSize: '13px', textAlign: 'center'}}>Aucune dépense enregistrée.</p> : 
                  depenses.map(d => (
                    <div key={d.id} className="rapport-detail-item">
                      <span>{d.nom} <span style={{fontSize: '10px', color: '#9CA3AF'}}>{d.date}</span></span>
                      <span style={{fontWeight: '500'}}>{d.montant.toLocaleString('fr-FR')} Ar</span>
                    </div>
                  ))
                }
              </div>
            )}
            
            <button className="luxury-button" onClick={cloturerMois} style={{marginTop: '10px'}}>Clôturer & Préparer le mois suivant</button>
          </div>
        </div>
      )}

      <header className="luxury-header">
        <div className="header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '5px' }}>
            <img src="/mikajy-logo.svg" alt="Logo MiKajy" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <h1 className="title-luxe" style={{ margin: 0 }}>MiKajy.</h1>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="theme-toggle" title="Changer le thème">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <span className="profile-badge" style={{ marginLeft: '44px' }}>
            {vueTendances ? "Tendances" : "Aperçu"} — {profil.prenom}
          </span>
        </div>
        <div className="header-actions">
          <button className="text-button" onClick={() => setVueTendances(!vueTendances)} style={{color: 'var(--text-main)', fontWeight: '600'}}>
            {vueTendances ? "⬅ Budget" : " Tendances"}
          </button>
          <button className="text-button" onClick={() => setShowRapport(true)} style={{color: '#3498db', fontWeight: '600'}}>Fin Mois</button>
        </div>
      </header>
      
      <main>
        {vueTendances ? (
          <div className="tendances-view animate-fade-in">
            <h3 className="section-title">Historique des derniers mois</h3>
            {archives.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', marginTop: '40px'}}>Pas encore assez de données. Termine ce mois pour générer ton premier graphique !</p>
            ) : (
              <div className="chart-container">
                {archives.map(arch => {
                  const pctDepense = (arch.depenses / arch.revenus) * 100;
                  const pctEpargne = 100 - pctDepense;
                  return (
                    <div key={arch.id} className="chart-column">
                      <div className="bars-wrapper">
                        <div className="bar-epargne" style={{height: `${pctEpargne}%`}} title={`Épargne: ${arch.epargne} Ar`}></div>
                        <div className="bar-depense" style={{height: `${pctDepense}%`}} title={`Dépenses: ${arch.depenses} Ar`}></div>
                      </div>
                      <span className="chart-label">{arch.mois.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="chart-legend">
              <span className="legend-item"><div className="legend-color" style={{backgroundColor: 'var(--text-main)'}}></div> Dépenses</span>
              <span className="legend-item"><div className="legend-color" style={{backgroundColor: '#10B981'}}></div> Épargne</span>
            </div>
          </div>
        ) : (
          <>
            <div className="coach-card"><div className="coach-message">« {pourcentageGlobal >= 100 ? "Budget global dépassé." : "Gestion optimale. Tes ratios sont bons."} »</div></div>
            <div className="enveloppes-grid">
              {toutesEnveloppes.map(env => (
                <EnveloppeCard key={env.id} enveloppe={env} depenses={depenses.filter(d => d.idEnv === env.id)} onAddDepense={ajouterDepense} onDelete={supprimerEnveloppeDashboard}/>
              ))}
              <div className="add-section-wrapper">
                {!showAddForm ? (
                  <button className="text-button dashed-button" onClick={() => setShowAddForm(true)}>+ Ajouter une nouvelle section</button>
                ) : (
                  <div className="enveloppe-card animate-fade-in" style={{ borderLeftColor: 'var(--text-main)' }}>
                    <div className="env-header"><h3>Nouvelle section</h3><span className="env-budget">Max: {resteAAllouer.toLocaleString('fr-FR')} Ar</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                      <input type="text" placeholder="Intitulé" value={nvNomEnv} onChange={e => setNvNomEnv(e.target.value)} className="luxury-input" style={{ padding: '12px' }} />
                      <input type="number" placeholder="Montant" value={nvMontantEnv} onChange={e => setNvMontantEnv(e.target.value)} className="luxury-input" style={{ padding: '12px' }} />
                      <div style={{ display: 'flex', gap: '10px' }}><button className="luxury-button" onClick={ajouterEnveloppe} style={{ padding: '12px' }}>Valider</button><button className="luxury-button secondary" onClick={() => setShowAddForm(false)} style={{ padding: '12px' }}>Annuler</button></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;