import { useState, useEffect } from "react";

// ╔══════════════════════════════════════════════════════════╗
// ║  CONFIGURATION — À REMPLIR APRÈS CRÉATION DES FLUX PA   ║
const PA_READ_URL  = "https://default3c3626d769d140598e12da7006365f.1d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/66480347dfe54257a8c6b5b07209c788/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XMBFAPz8bpuXq74lh9veSOx6rSTxGtSL7qgWHLxZUWU"; // URL flux Power Automate — Lecture
const PA_WRITE_URL = "https://default3c3626d769d140598e12da7006365f.1d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8ec1465606d842a1846f132096df98cc/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=web33JIUi4JN-d-aGC_gENeqkMYGN6O9CmpjRh9BG5Y"; // URL flux Power Automate — Écriture
const CSV_ADMIN_PWD = "college2025";
// ╚══════════════════════════════════════════════════════════╝

// ─── Données démo (actives si PA_READ_URL vide) ───────────
const DEMO = [
  { id:1, nom:"Atelier Peinture",    date:"14/06/2025", heureDebut:"09:00", heureFin:"10:00", salle:"A01",          description:"Aquarelle et couleurs",   intervenant:"Mme Martin",    statut:"Validé"  },
  { id:2, nom:"Atelier Robotique",   date:"14/06/2025", heureDebut:"09:00", heureFin:"10:00", salle:"Labo Info",     description:"Arduino et capteurs",     intervenant:"M. Fabre",      statut:"Proposé" },
  { id:3, nom:"Atelier Percussions", date:"14/06/2025", heureDebut:"10:15", heureFin:"11:15", salle:"Salle Musique", description:"Rythmes du monde",        intervenant:"M. Koné",       statut:"Proposé" },
  { id:4, nom:"Atelier BD",          date:"15/06/2025", heureDebut:"09:00", heureFin:"10:00", salle:"A02",          description:"Dessin de BD",            intervenant:"M. Chevallier", statut:"Refusé"  },
  { id:5, nom:"Atelier Yoga",        date:"15/06/2025", heureDebut:"09:00", heureFin:"10:00", salle:"Gymnase",      description:"Relaxation et postures",  intervenant:"Mme Fontaine",  statut:"Validé"  },
];
const DEMO_MODE = !PA_READ_URL;

// ─── API Power Automate ───────────────────────────────────
const paRead = async () => {
  if (DEMO_MODE) return DEMO.map(x => ({ ...x }));
  try {
    // Le flux PA_READ doit avoir une action "Répondre à une requête HTTP"
    // qui renvoie les éléments SharePoint au format JSON.
    const r = await fetch(PA_READ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const items = Array.isArray(d) ? d : (d.value || []);
    // SharePoint renvoie les colonnes "Choix" comme objet {Value:"..."} — on extrait la valeur
    const str = (v) => (v && typeof v === "object") ? (v.Value || v.value || "") : (v || "");
    return items.map(item => ({
      id:          item.ID          || item.id          || 0,
      nom:         str(item.Title)       || str(item.Nom)         || str(item.nom)         || "",
      date:        str(item.Date)        || str(item.date)        || "",
      heureDebut:  str(item.HeureDebut)  || str(item.heureDebut)  || "",
      heureFin:    str(item.HeureFin)    || str(item.heureFin)    || "",
      salle:       str(item.Salle)       || str(item.salle)       || "",
      description: str(item.Description) || str(item.description) || "",
      intervenant: str(item.Intervenant) || str(item.intervenant) || "",
      statut:      str(item.Statut)      || str(item.statut)      || "Proposé",
    }));
  } catch(e) { console.error("paRead error:", e); return []; }
};

const paWrite = async (payload) => {
  if (DEMO_MODE) return;
  await fetch(PA_WRITE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

// ─── Export CSV ───────────────────────────────────────────
const doExportCSV = (workshops) => {
  const rows = workshops.filter(w => w.statut === "Validé");
  if (!rows.length) { alert("Aucun atelier validé à exporter."); return; }
  const header = "nom,date,heure_debut,heure_fin,salle,description,intervenant";
  const lines = rows.map(w =>
    [w.nom, w.date, w.heureDebut, w.heureFin, w.salle, w.description, w.intervenant]
      .map(v => `"${(v || "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "ateliers_valides.csv"; a.click();
  URL.revokeObjectURL(url);
};

// ─── Helpers date ─────────────────────────────────────────
const toInputDate = (fr) => {
  if (!fr) return "";
  const p = fr.split("/");
  return p.length === 3 ? `${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}` : fr;
};
const toFrDate = (iso) => {
  if (!iso) return "";
  const p = iso.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
};

const emptyForm = (intervenant = "") => ({
  nom:"", date:"", heureDebut:"", heureFin:"",
  salle:"", description:"", intervenant, statut:"Proposé"
});

// ─── Palette ──────────────────────────────────────────────
const C = {
  navy:"#1a3258", accent:"#e8521e", green:"#15803d", red:"#dc2626",
  bg:"#eef2f8", surface:"#ffffff", border:"#d8e2f0",
  text:"#1e2d42", muted:"#6b7c93", light:"#f3f6fb",
};
const FF = "'Segoe UI', system-ui, -apple-system, sans-serif";

// ─── Micro-composants ─────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:800, color:C.navy,
      textTransform:"uppercase", letterSpacing:0.8, marginBottom:5, fontFamily:FF }}>
      {label}
    </label>
    {children}
  </div>
);

const TInput = ({ style:x={}, ...p }) => (
  <input style={{ display:"block", width:"100%", padding:"9px 12px",
    border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:FF,
    color:C.text, background:C.light, boxSizing:"border-box", outline:"none", ...x }} {...p} />
);

const TArea = (p) => (
  <textarea style={{ display:"block", width:"100%", padding:"9px 12px",
    border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:FF,
    color:C.text, background:C.light, boxSizing:"border-box", outline:"none", resize:"vertical" }} {...p} />
);

const TSel = ({ children, ...p }) => (
  <select style={{ display:"block", width:"100%", padding:"9px 12px",
    border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:FF,
    color:C.text, background:C.light, boxSizing:"border-box", outline:"none" }} {...p}>
    {children}
  </select>
);

const PBtn = ({ children, onClick, disabled, color=C.navy, style:x={} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display:"block", width:"100%", padding:"12px",
    background:disabled?"#b6c6dc":color, color:"#fff",
    border:"none", borderRadius:10, fontSize:14, fontWeight:800,
    cursor:disabled?"not-allowed":"pointer", fontFamily:FF, marginTop:12, ...x,
  }}>{children}</button>
);

const SBtn = ({ children, onClick, style:x={} }) => (
  <button onClick={onClick} style={{ padding:"7px 13px", background:"transparent",
    color:C.muted, border:`1.5px solid ${C.border}`, borderRadius:9,
    fontSize:13, cursor:"pointer", fontFamily:FF, ...x }}>
    {children}
  </button>
);

const Badge = ({ s }) => {
  const m = { "Proposé":["#fef9c3","#854d0e"], "Validé":["#dcfce7","#166534"], "Refusé":["#fee2e2","#991b1b"] };
  const [bg,col] = m[s] || m["Proposé"];
  return <span style={{ background:bg, color:col, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:800 }}>{s}</span>;
};

const Toast = ({ msg }) => msg ? (
  <div style={{ background:"#dcfce7", color:"#166534", border:"1px solid #86efac",
    borderRadius:9, padding:"9px 14px", marginBottom:12, fontSize:13, fontFamily:FF }}>
    ✓ {msg}
  </div>
) : null;

const G2 = ({ children }) => (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>{children}</div>
);

// ════════════════════════════════════════════════════════════
// PAGE D'ACCUEIL CSV
// ════════════════════════════════════════════════════════════
function CsvLanding() {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FF,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, borderRadius:18, padding:"40px 32px",
        maxWidth:440, textAlign:"center", boxShadow:"0 4px 32px rgba(0,0,0,0.09)" }}>
        <div style={{ fontSize:36, color:C.accent, marginBottom:12 }}>◈</div>
        <h1 style={{ fontSize:20, fontWeight:900, color:C.navy, margin:"0 0 8px" }}>
          Gestion des Ateliers
        </h1>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.7, marginBottom:28 }}>
          Proposez vos ateliers ou gérez et exportez la liste finale.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { icon:"👨‍🏫", title:"Je suis enseignant", sub:"Proposer un atelier", hash:"#teacher" },
            { icon:"⚙️",  title:"Administration",      sub:"Gérer et exporter",   hash:"#csvadmin" },
          ].map(({ icon, title, sub, hash }) => (
            <a key={hash} href={hash} style={{ textDecoration:"none" }}>
              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                borderRadius:13, padding:"20px 14px", cursor:"pointer",
                boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
                <div style={{ fontWeight:800, fontSize:13, color:C.navy }}>{title}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{sub}</div>
              </div>
            </a>
          ))}
        </div>
        {DEMO_MODE && (
          <p style={{ fontSize:11, color:C.muted, marginTop:20, background:C.light,
            borderRadius:8, padding:"8px 12px", textAlign:"left" }}>
            ⚠️ Mode démo — renseignez PA_READ_URL et PA_WRITE_URL dans CsvGenerator.jsx
          </p>
        )}
        <a href="/" style={{ display:"block", fontSize:12, color:C.muted,
          textDecoration:"none", marginTop:16 }}>
          ← Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PORTAIL ENSEIGNANT
// ════════════════════════════════════════════════════════════
function TeacherPortal() {
  const [name,    setName]    = useState("");
  const [logged,  setLogged]  = useState(false);
  const [tab,     setTab]     = useState("form");
  const [form,    setForm]    = useState(emptyForm());
  const [myWs,    setMyWs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast,   setToast]   = useState("");

  const sf = (k,v) => setForm(f => ({...f,[k]:v}));
  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""),3000); };

  const login = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const all = await paRead();
    setMyWs(all.filter(w => w.intervenant === name.trim()));
    setForm(emptyForm(name.trim()));
    setLogged(true);
    setLoading(false);
  };

  const submit = async () => {
    if (!form.nom || !form.date || !form.heureDebut)
      return alert("Renseignez le nom, la date et l'heure de début.");
    setSending(true);
    await paWrite({ action:"create", ...form });
    const all = await paRead();
    setMyWs(all.filter(w => w.intervenant === name.trim()));
    setForm(emptyForm(name.trim()));
    setTab("list");
    showToast("Votre atelier a été soumis !");
    setSending(false);
  };

  const header = (
    <div style={{ background:C.navy, padding:"13px 20px",
      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <div style={{ color:"#fff", fontWeight:900, fontSize:14 }}>◈ Gestion des Ateliers</div>
        {logged && <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>Enseignant — {name}</div>}
      </div>
      <a href="#csv" style={{ color:"rgba(255,255,255,0.6)", fontSize:12, textDecoration:"none" }}>
        ← Accueil
      </a>
    </div>
  );

  if (!logged) return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FF }}>
      {header}
      <div style={{ maxWidth:480, margin:"32px auto", padding:"0 16px" }}>
        <div style={{ background:C.surface, borderRadius:16, padding:"28px 24px",
          boxShadow:"0 4px 24px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize:18, fontWeight:900, color:C.navy, marginBottom:6 }}>Identification</h2>
          <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>
            Saisissez votre nom tel qu'il apparaîtra dans le programme des ateliers.
          </p>
          <Field label="Votre nom">
            <TInput value={name} placeholder="ex. Mme Martin" autoFocus
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key==="Enter" && login()} />
          </Field>
          {loading
            ? <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:12 }}>Chargement…</p>
            : <PBtn onClick={login} disabled={!name.trim()}>Accéder à mon espace →</PBtn>
          }
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FF }}>
      {header}
      <div style={{ maxWidth:520, margin:"0 auto", padding:"20px 16px" }}>
        <Toast msg={toast} />

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, background:C.surface, borderRadius:10,
          padding:4, border:`1px solid ${C.border}`, marginBottom:16 }}>
          {[["form","➕ Proposer"],["list",`📋 Mes propositions (${myWs.length})`]].map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"9px",
              borderRadius:8, border:"none", fontFamily:FF, fontSize:13, fontWeight:700,
              cursor:"pointer", background:tab===t?C.navy:"transparent",
              color:tab===t?"#fff":C.muted }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "form" ? (
          <div style={{ background:C.surface, borderRadius:16, padding:"22px",
            boxShadow:"0 4px 24px rgba(0,0,0,0.07)" }}>
            <Field label="Nom de l'atelier *">
              <TInput value={form.nom} placeholder="ex. Atelier Peinture"
                onChange={e => sf("nom",e.target.value)} />
            </Field>
            <G2>
              <Field label="Date *">
                <TInput type="date" value={toInputDate(form.date)}
                  onChange={e => sf("date",toFrDate(e.target.value))} />
              </Field>
              <Field label="Salle">
                <TInput value={form.salle} placeholder="ex. A01"
                  onChange={e => sf("salle",e.target.value)} />
              </Field>
            </G2>
            <G2>
              <Field label="Heure début *">
                <TInput type="time" value={form.heureDebut}
                  onChange={e => sf("heureDebut",e.target.value)} />
              </Field>
              <Field label="Heure fin">
                <TInput type="time" value={form.heureFin}
                  onChange={e => sf("heureFin",e.target.value)} />
              </Field>
            </G2>
            <Field label="Description">
              <TArea rows={2} value={form.description}
                placeholder="Courte description de l'atelier"
                onChange={e => sf("description",e.target.value)} />
            </Field>
            <PBtn onClick={submit} disabled={sending} color={C.accent}>
              {sending ? "Envoi en cours…" : "📤 Soumettre ma proposition"}
            </PBtn>
          </div>
        ) : (
          <div>
            {myWs.length === 0 ? (
              <div style={{ background:C.surface, borderRadius:14, padding:"32px 24px",
                textAlign:"center", boxShadow:"0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                <p style={{ color:C.muted, fontSize:13 }}>Aucune proposition pour l'instant</p>
              </div>
            ) : myWs.map(w => (
              <div key={w.id} style={{ background:C.surface, borderRadius:12,
                padding:"14px 16px", marginBottom:10, border:`1.5px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:5 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:C.text }}>{w.nom}</div>
                  <Badge s={w.statut} />
                </div>
                <div style={{ fontSize:12, color:C.muted }}>
                  {w.date} · {w.heureDebut}{w.heureFin?`–${w.heureFin}`:""}{w.salle?` · ${w.salle}`:""}
                </div>
                {w.description && (
                  <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{w.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PORTAIL ADMIN CSV
// ════════════════════════════════════════════════════════════
function CsvAdmin() {
  const [logged,    setLogged]    = useState(false);
  const [pwd,       setPwd]       = useState("");
  const [pwdErr,    setPwdErr]    = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState("list");
  const [filter,    setFilter]    = useState("tous");
  const [editId,    setEditId]    = useState(null);
  const [editForm,  setEditForm]  = useState({});
  const [addForm,   setAddForm]   = useState(emptyForm());
  const [toast,     setToast]     = useState("");
  const [saving,    setSaving]    = useState(false);

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""),3000); };

  const load = async () => {
    setLoading(true);
    setWorkshops(await paRead());
    setLoading(false);
  };

  const login = async () => {
    if (pwd === CSV_ADMIN_PWD) {
      setLogged(true); setPwdErr(false); await load();
    } else { setPwdErr(true); }
  };

  const changeStatut = async (id, s) => {
    const w = workshops.find(x=>x.id===id); if (!w) return;
    await paWrite({ action:"update", ...w, statut:s });
    setWorkshops(ws => ws.map(x => x.id===id ? {...x,statut:s} : x));
    showToast(`"${w.nom}" → ${s}`);
  };

  const saveEdit = async () => {
    setSaving(true);
    await paWrite({ action:"update", ...editForm });
    setWorkshops(ws => ws.map(x => x.id===editId ? {...editForm} : x));
    setEditId(null); setEditForm({});
    showToast("Atelier modifié");
    setSaving(false);
  };

  const deleteWs = async (id) => {
    const w = workshops.find(x=>x.id===id);
    if (!w || !window.confirm(`Supprimer "${w.nom}" ?`)) return;
    await paWrite({ action:"delete", id });
    setWorkshops(ws => ws.filter(x=>x.id!==id));
    showToast("Atelier supprimé");
  };

  const addWorkshop = async () => {
    if (!addForm.nom||!addForm.date||!addForm.heureDebut)
      return alert("Renseignez le nom, la date et l'heure de début.");
    setSaving(true);
    await paWrite({ action:"create", ...addForm, statut:"Validé" });
    await load();
    setAddForm(emptyForm());
    setTab("list");
    showToast("Atelier ajouté et validé");
    setSaving(false);
  };

  const ef = (k,v) => setEditForm(f=>({...f,[k]:v}));
  const af = (k,v) => setAddForm(f=>({...f,[k]:v}));

  const counts = {
    total:   workshops.length,
    propose: workshops.filter(w=>w.statut==="Proposé").length,
    valide:  workshops.filter(w=>w.statut==="Validé").length,
    refuse:  workshops.filter(w=>w.statut==="Refusé").length,
  };
  const filtered = filter==="tous" ? workshops : workshops.filter(w=>w.statut===filter);

  const header = (
    <div style={{ background:"#111d35", padding:"13px 20px",
      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div style={{ color:"#fff", fontWeight:900, fontSize:14 }}>◈ Administration Ateliers</div>
      <a href="#csv" style={{ color:"rgba(255,255,255,0.5)", fontSize:12, textDecoration:"none" }}>← Accueil</a>
    </div>
  );

  if (!logged) return (
    <div style={{ minHeight:"100vh", background:"#1a2744", fontFamily:FF }}>
      {header}
      <div style={{ maxWidth:400, margin:"48px auto", padding:"0 16px" }}>
        <div style={{ background:C.surface, borderRadius:16, padding:"32px 28px",
          boxShadow:"0 8px 40px rgba(0,0,0,0.3)" }}>
          <h2 style={{ fontSize:18, fontWeight:900, color:C.navy, marginBottom:4 }}>Connexion</h2>
          <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>Accès réservé à l'administration</p>
          <Field label="Mot de passe">
            <TInput type="password" value={pwd} placeholder="••••••••" autoFocus
              onChange={e=>{ setPwd(e.target.value); setPwdErr(false); }}
              onKeyDown={e=>e.key==="Enter"&&login()} />
          </Field>
          {pwdErr && <p style={{ color:C.red, fontSize:12, marginTop:4 }}>⚠ Mot de passe incorrect</p>}
          <PBtn onClick={login}>Se connecter</PBtn>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#1a2744", fontFamily:FF }}>
      {header}
      <div style={{ maxWidth:780, margin:"0 auto", padding:"20px 16px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
          {[
            { n:counts.total,   l:"Total",      bg:"#fff" },
            { n:counts.propose, l:"En attente", bg:"#fef9c3" },
            { n:counts.valide,  l:"Validés",    bg:"#dcfce7" },
            { n:counts.refuse,  l:"Refusés",    bg:"#fee2e2" },
          ].map(({ n,l,bg }) => (
            <div key={l} style={{ background:bg, borderRadius:10, padding:"12px 8px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.navy }}>{n}</div>
              <div style={{ fontSize:11, color:C.muted }}>{l}</div>
            </div>
          ))}
        </div>

        <Toast msg={toast} />

        {/* Barre d'outils */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          background:C.surface, borderRadius:12, padding:"8px 12px",
          border:`1px solid ${C.border}`, marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", gap:4 }}>
            {["tous","Proposé","Validé","Refusé"].map(f => (
              <button key={f} onClick={()=>{ setFilter(f); setEditId(null); }} style={{
                padding:"6px 12px", borderRadius:8, border:"none", fontFamily:FF,
                fontSize:12, fontWeight:700, cursor:"pointer",
                background:filter===f?C.navy:"transparent",
                color:filter===f?"#fff":C.muted }}>
                {f==="tous"?"Tous":f}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <SBtn onClick={()=>{ setTab("add"); setEditId(null); }}
              style={{ fontSize:12, padding:"6px 12px" }}>
              ＋ Ajouter
            </SBtn>
            <button onClick={()=>doExportCSV(workshops)} style={{
              padding:"7px 14px", background:C.accent, border:"none", color:"#fff",
              borderRadius:9, fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:FF }}>
              ⬇ CSV ({counts.valide})
            </button>
            <button onClick={load} style={{ padding:"7px 11px", background:C.surface,
              border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:13,
              cursor:"pointer", fontFamily:FF, color:C.muted }}>
              ↻
            </button>
          </div>
        </div>

        {/* Formulaire ajout */}
        {tab === "add" && (
          <div style={{ background:C.surface, borderRadius:14, padding:"20px",
            border:`2px solid ${C.accent}`, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:14 }}>
              <div style={{ fontWeight:800, fontSize:14, color:C.navy }}>Ajouter un atelier</div>
              <SBtn onClick={()=>setTab("list")} style={{ padding:"4px 10px", fontSize:12 }}>✕</SBtn>
            </div>
            <G2>
              <div style={{ gridColumn:"1/-1" }}>
                <Field label="Nom *">
                  <TInput value={addForm.nom} placeholder="ex. Atelier Peinture"
                    onChange={e=>af("nom",e.target.value)} />
                </Field>
              </div>
              <Field label="Date *">
                <TInput type="date" value={toInputDate(addForm.date)}
                  onChange={e=>af("date",toFrDate(e.target.value))} />
              </Field>
              <Field label="Salle">
                <TInput value={addForm.salle} placeholder="A01"
                  onChange={e=>af("salle",e.target.value)} />
              </Field>
              <Field label="Début *">
                <TInput type="time" value={addForm.heureDebut}
                  onChange={e=>af("heureDebut",e.target.value)} />
              </Field>
              <Field label="Fin">
                <TInput type="time" value={addForm.heureFin}
                  onChange={e=>af("heureFin",e.target.value)} />
              </Field>
              <Field label="Intervenant">
                <TInput value={addForm.intervenant} placeholder="Mme Martin"
                  onChange={e=>af("intervenant",e.target.value)} />
              </Field>
              <div style={{ gridColumn:"1/-1" }}>
                <Field label="Description">
                  <TArea rows={2} value={addForm.description}
                    onChange={e=>af("description",e.target.value)} />
                </Field>
              </div>
            </G2>
            <PBtn onClick={addWorkshop} disabled={saving} color={C.accent} style={{ marginTop:8 }}>
              {saving ? "Ajout en cours…" : "✓ Ajouter (validé directement)"}
            </PBtn>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div style={{ background:C.surface, borderRadius:12, padding:"32px", textAlign:"center" }}>
            <p style={{ color:C.muted, fontSize:13 }}>Chargement…</p>
          </div>
        ) : (
          <div>
            {filtered.length === 0 && (
              <div style={{ background:C.surface, borderRadius:12, padding:"32px", textAlign:"center" }}>
                <p style={{ color:C.muted, fontSize:13 }}>Aucun atelier dans cette catégorie</p>
              </div>
            )}
            {filtered.map(w => editId === w.id ? (
              /* ── Ligne édition ── */
              <div key={w.id} style={{ background:C.surface, border:`2px solid ${C.navy}`,
                borderRadius:13, padding:"18px", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:800, color:C.navy, marginBottom:12 }}>
                  ✏️ Modification — {w.nom}
                </div>
                <G2>
                  <div style={{ gridColumn:"1/-1" }}>
                    <Field label="Nom">
                      <TInput value={editForm.nom} onChange={e=>ef("nom",e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Date">
                    <TInput type="date" value={toInputDate(editForm.date)}
                      onChange={e=>ef("date",toFrDate(e.target.value))} />
                  </Field>
                  <Field label="Salle">
                    <TInput value={editForm.salle} onChange={e=>ef("salle",e.target.value)} />
                  </Field>
                  <Field label="Début">
                    <TInput type="time" value={editForm.heureDebut}
                      onChange={e=>ef("heureDebut",e.target.value)} />
                  </Field>
                  <Field label="Fin">
                    <TInput type="time" value={editForm.heureFin}
                      onChange={e=>ef("heureFin",e.target.value)} />
                  </Field>
                  <Field label="Intervenant">
                    <TInput value={editForm.intervenant}
                      onChange={e=>ef("intervenant",e.target.value)} />
                  </Field>
                  <Field label="Statut">
                    <TSel value={editForm.statut} onChange={e=>ef("statut",e.target.value)}>
                      <option>Proposé</option>
                      <option>Validé</option>
                      <option>Refusé</option>
                    </TSel>
                  </Field>
                  <div style={{ gridColumn:"1/-1" }}>
                    <Field label="Description">
                      <TArea rows={2} value={editForm.description}
                        onChange={e=>ef("description",e.target.value)} />
                    </Field>
                  </div>
                </G2>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <PBtn onClick={saveEdit} disabled={saving} style={{ marginTop:0 }}>
                    {saving?"Sauvegarde…":"✓ Enregistrer"}
                  </PBtn>
                  <SBtn onClick={()=>{ setEditId(null); setEditForm({}); }}>Annuler</SBtn>
                </div>
              </div>
            ) : (
              /* ── Ligne normale ── */
              <div key={w.id} style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                borderRadius:12, padding:"13px 16px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:5 }}>
                  <div style={{ fontWeight:800, fontSize:13.5, color:C.text }}>{w.nom}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Badge s={w.statut} />
                    <select value={w.statut} onChange={e=>changeStatut(w.id,e.target.value)}
                      style={{ fontSize:11, padding:"2px 6px", borderRadius:6,
                        border:`1px solid ${C.border}`, background:C.light,
                        color:C.text, fontFamily:FF, cursor:"pointer" }}>
                      <option>Proposé</option>
                      <option>Validé</option>
                      <option>Refusé</option>
                    </select>
                  </div>
                </div>
                <div style={{ fontSize:12, color:C.muted }}>
                  {w.date} · {w.heureDebut}{w.heureFin?`–${w.heureFin}`:""} · {w.intervenant}{w.salle?` · ${w.salle}`:""}
                </div>
                {w.description && (
                  <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{w.description}</div>
                )}
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <SBtn onClick={()=>{ setEditId(w.id); setEditForm({...w}); setTab("list"); }}
                    style={{ fontSize:12, padding:"5px 12px" }}>
                    ✏️ Modifier
                  </SBtn>
                  <SBtn onClick={()=>deleteWs(w.id)}
                    style={{ fontSize:12, padding:"5px 12px", color:C.red, borderColor:"#fca5a5" }}>
                    🗑 Supprimer
                  </SBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — routing par hash
// ════════════════════════════════════════════════════════════
export default function CsvGenerator() {
  const [mode, setMode] = useState(() => {
    const h = window.location.hash;
    if (h === "#teacher")  return "teacher";
    if (h === "#csvadmin") return "csvadmin";
    return "csv";
  });

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h === "#teacher")       setMode("teacher");
      else if (h === "#csvadmin") setMode("csvadmin");
      else if (h === "#csv")      setMode("csv");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (mode === "teacher")  return <TeacherPortal />;
  if (mode === "csvadmin") return <CsvAdmin />;
  return <CsvLanding />;
}
