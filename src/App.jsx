import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

// ╔══════════════════════════════════════════════════════════╗
// ║  MOT DE PASSE ADMINISTRATEUR — À MODIFIER AVANT DEPLOY  ║
const ADMIN_PWD = "college2025";
// ╚══════════════════════════════════════════════════════════╝

const C = {
  navy:    "#1a3258",
  accent:  "#e8521e",
  green:   "#15803d",
  red:     "#dc2626",
  bg:      "#eef2f8",
  surface: "#ffffff",
  border:  "#d8e2f0",
  text:    "#1e2d42",
  muted:   "#6b7c93",
  light:   "#f3f6fb",
  ms:      "#0078d4",   // couleur Microsoft 365
};
const FF = "'Segoe UI', system-ui, -apple-system, sans-serif";

// ─── Encodage URL-safe UTF-8 ──────────────────────────────
const encode = (data) => {
  const json = JSON.stringify(data);
  const bytes = encodeURIComponent(json).replace(
    /%([0-9A-F]{2})/gi,
    (_, p) => String.fromCharCode(parseInt(p, 16))
  );
  return btoa(bytes);
};
const decode = (str) => {
  try {
    const json = decodeURIComponent(
      Array.from(atob(str), (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
};

const getMode = () => {
  const h = window.location.hash;
  if (h === "#admin") return "admin";
  if (h.startsWith("#data=")) return "student";
  return "landing";
};

const toIso = (d) => {
  if (!d) return "";
  if (d.includes("/")) { const [dd, mm, yy] = d.split("/"); return `${yy}-${mm}-${dd}`; }
  return d;
};
const fmtDate = (d) => {
  const dt = new Date(toIso(d) + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
};
const sortDates = (arr) => [...arr].sort((a, b) => toIso(a).localeCompare(toIso(b)));

// ─── Composants partagés ─────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:800, color:C.navy,
        textTransform:"uppercase", letterSpacing:0.8, marginBottom:4, fontFamily:FF }}>
        {label}
      </label>
      {hint && <p style={{ fontSize:11, color:C.muted, margin:"0 0 6px", fontFamily:FF }}>{hint}</p>}
      {children}
    </div>
  );
}
function TInput({ style:x={}, ...p }) {
  return <input style={{ display:"block", width:"100%", padding:"10px 14px",
    border:`1.5px solid ${C.border}`, borderRadius:9, fontSize:14, fontFamily:FF,
    color:C.text, background:C.light, boxSizing:"border-box", outline:"none", ...x }} {...p} />;
}
function PBtn({ children, onClick, disabled, color=C.navy, type="button" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display:"block", width:"100%", padding:"13px",
      background:disabled?"#b6c6dc":color, color:"#fff",
      border:"none", borderRadius:11, fontSize:15, fontWeight:800,
      cursor:disabled?"not-allowed":"pointer", fontFamily:FF,
      marginTop:16, letterSpacing:0.1, transition:"opacity 0.15s",
    }}>{children}</button>
  );
}
function SBtn({ children, onClick }) {
  return <button onClick={onClick} style={{ display:"block", width:"100%", padding:"11px",
    background:"transparent", color:C.muted, border:`1.5px solid ${C.border}`,
    borderRadius:11, fontSize:14, cursor:"pointer", fontFamily:FF, marginTop:8 }}>{children}</button>;
}

// ─── Carte atelier ────────────────────────────────────────
function WCard({ w, selected, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      background:selected?C.navy:C.surface,
      border:`2px solid ${selected?C.navy:C.border}`,
      borderRadius:13, padding:"14px 14px 12px",
      cursor:"pointer", textAlign:"left", width:"100%",
      position:"relative", fontFamily:FF,
      boxShadow:selected?"0 3px 16px rgba(26,50,88,0.2)":"0 1px 4px rgba(0,0,0,0.06)",
      transition:"all 0.15s",
    }}>
      {selected && (
        <span style={{ position:"absolute", top:10, right:10,
          background:C.accent, color:"#fff", borderRadius:"50%",
          width:22, height:22, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:12, fontWeight:900 }}>✓</span>
      )}
      <div style={{ fontWeight:800, fontSize:13.5,
        color:selected?"#fff":C.text, marginBottom:5,
        paddingRight:selected?28:0, lineHeight:1.3 }}>{w.nom}</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {w.salle       && <Chip dark={selected}>📍 {w.salle}</Chip>}
        {w.intervenant && <Chip dark={selected}>👤 {w.intervenant}</Chip>}
      </div>
      {w.description && (
        <div style={{ fontSize:11, marginTop:7, lineHeight:1.5,
          color:selected?"rgba(255,255,255,0.65)":C.muted }}>{w.description}</div>
      )}
    </button>
  );
}
function Chip({ children, dark }) {
  return <span style={{ background:dark?"rgba(255,255,255,0.13)":C.light,
    color:dark?"rgba(255,255,255,0.8)":C.muted,
    borderRadius:6, padding:"2px 8px", fontSize:10.5 }}>{children}</span>;
}

// ════════════════════════════════════════════════════════════
//  LANDING
// ════════════════════════════════════════════════════════════
function Landing() {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FF,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, borderRadius:18, padding:"48px 36px",
        maxWidth:420, textAlign:"center", boxShadow:"0 4px 32px rgba(0,0,0,0.09)" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>◈</div>
        <h1 style={{ fontSize:22, fontWeight:900, color:C.navy, margin:"0 0 12px" }}>
          Plateforme Ateliers
        </h1>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:32 }}>
          Pour vous inscrire aux ateliers, utilisez <strong>le lien fourni par votre établissement</strong>.
        </p>
        <a href="#admin" style={{ fontSize:12, color:C.muted, textDecoration:"none",
          borderBottom:`1px dashed ${C.border}`, paddingBottom:2 }}>
          → Accès administration
        </a>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ADMINISTRATION
// ════════════════════════════════════════════════════════════
function AdminApp() {
  const [step,   setStep]   = useState("login");
  const [cfg,    setCfg]    = useState({
    titre:   "Inscription aux Ateliers",
    webhook: "",       // URL du flux Power Automate
  });
  const [wks,    setWks]    = useState([]);
  const [pwd,    setPwd]    = useState("");
  const [err,    setErr]    = useState("");
  const [csvErr, setCsvErr] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  const generatedUrl = (() => {
    if (!wks.length) return "";
    const base = window.location.href.split("#")[0];
    return `${base}#data=${encode({ ...cfg, workshops:wks })}`;
  })();

  const handleLogin = () => {
    if (pwd === ADMIN_PWD) { setStep("config"); setErr(""); }
    else setErr("Mot de passe incorrect.");
  };

  const loadCSV = (file) => {
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete:({ data }) => {
        const ws = data
          .map((r, i) => ({
            id:i,
            nom:         (r.nom         || r.Nom         || "").trim(),
            date:        (r.date        || r.Date        || "").trim(),
            debut:       (r.heure_debut || r.debut       || "").trim(),
            fin:         (r.heure_fin   || r.fin         || "").trim(),
            salle:       (r.salle       || r.Salle       || "").trim(),
            description: (r.description || r.Description || "").trim(),
            intervenant: (r.intervenant || r.Intervenant || "").trim(),
          }))
          .filter(w => w.nom && w.date)
          .map(w => ({ ...w, slotKey:`${w.date}__${w.debut}` }));
        if (!ws.length) { setCsvErr("Aucun atelier lisible."); return; }
        setWks(ws); setCsvErr(""); setStep("share");
      },
      error: () => setCsvErr("Fichier CSV invalide."),
    });
  };

  const copy = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const byDate = {};
  for (const w of wks) { if (!byDate[w.date]) byDate[w.date] = []; byDate[w.date].push(w); }
  const slotCount = [...new Set(wks.map(w => w.slotKey))].length;

  const card = (children, title) => (
    <div style={{ minHeight:"100vh", background:"#1a2744", fontFamily:FF,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, borderRadius:18, padding:"32px 28px",
        maxWidth:520, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:"#1a2744", borderRadius:8, padding:"5px 14px", marginBottom:14 }}>
            <span style={{ color:C.accent, fontSize:13 }}>◈</span>
            <span style={{ color:"rgba(255,255,255,0.7)", fontSize:11, fontWeight:700,
              letterSpacing:1.5, textTransform:"uppercase" }}>Administration</span>
          </div>
          <h1 style={{ fontSize:18, fontWeight:900, color:C.navy, margin:0 }}>{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );

  // ── Login ──
  if (step === "login") return card(
    <>
      <Field label="Mot de passe">
        <TInput type="password" value={pwd} autoFocus placeholder="••••••••"
          onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handleLogin()} />
      </Field>
      {err && <p style={{ color:C.red, fontSize:12, margin:"4px 0 0" }}>⚠ {err}</p>}
      <PBtn onClick={handleLogin}>Se connecter</PBtn>
      <SBtn onClick={() => window.location.hash=""}>← Retour</SBtn>
    </>,
    "Connexion"
  );

  // ── Config ──
  if (step === "config") return card(
    <>
      <Field label="Titre de l'événement">
        <TInput value={cfg.titre} placeholder="Journée Portes Ouvertes 2025"
          onChange={e => setCfg({...cfg, titre:e.target.value})} />
      </Field>

      <Field
        label="URL du flux Power Automate"
        hint="Copiez l'URL HTTP POST générée par votre flux Power Automate (voir instructions ci-dessous)."
      >
        <TInput
          value={cfg.webhook}
          placeholder="https://prod-xx.westeurope.logic.azure.com/workflows/..."
          onChange={e => setCfg({...cfg, webhook:e.target.value})}
          style={{ fontSize:12 }}
        />
      </Field>

      {/* Encart aide Power Automate */}
      <details style={{ marginBottom:8 }}>
        <summary style={{ fontSize:12, color:C.ms, fontWeight:700, cursor:"pointer",
          padding:"8px 12px", background:"#e8f3fc", borderRadius:8 }}>
          📋 Comment créer le flux Power Automate ?
        </summary>
        <div style={{ background:"#f0f7ff", borderRadius:"0 0 8px 8px",
          padding:"14px 14px", fontSize:11.5, color:C.text, lineHeight:1.8 }}>
          <strong>1.</strong> Dans Power Automate → <em>Créer → Flux de cloud instantané</em><br/>
          <strong>2.</strong> Déclencheur : <strong>"Lors de la réception d'une requête HTTP"</strong><br/>
          <strong>3.</strong> Coller ce schéma JSON dans "Corps JSON de la requête" :<br/>
          <pre style={{ background:"#e1eefa", borderRadius:6, padding:"10px",
            fontSize:10, overflowX:"auto", margin:"8px 0", fontFamily:"monospace" }}>
{`{
  "type": "object",
  "properties": {
    "nom":        { "type": "string" },
    "classe":     { "type": "string" },
    "timestamp":  { "type": "string" },
    "ateliers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "nom":   { "type": "string" },
          "date":  { "type": "string" },
          "heure": { "type": "string" },
          "salle": { "type": "string" }
        }
      }
    }
  }
}`}
          </pre>
          <strong>4.</strong> Ajouter une action : <strong>"SharePoint → Créer un élément"</strong><br/>
          &nbsp;&nbsp;&nbsp;→ Site : votre site SharePoint<br/>
          &nbsp;&nbsp;&nbsp;→ Liste : <em>Inscriptions_Ateliers</em> (à créer)<br/>
          &nbsp;&nbsp;&nbsp;→ Colonnes : Nom, Classe, Ateliers (texte multiligne), Date_Inscription<br/>
          <strong>5.</strong> <em>(Optionnel)</em> Ajouter <strong>"Envoyer un e-mail (V2)"</strong> pour notifier la direction<br/>
          <strong>6.</strong> Enregistrer → copier l'URL HTTP POST → la coller ci-dessus
        </div>
      </details>

      <PBtn
        disabled={!cfg.titre.trim() || !cfg.webhook.startsWith("https://")}
        onClick={() => setStep("import")}>
        Continuer → Importer les ateliers
      </PBtn>
      <SBtn onClick={() => setStep("login")}>← Retour</SBtn>
    </>,
    "Configuration"
  );

  // ── Import CSV ──
  if (step === "import") return card(
    <>
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadCSV(f); }}
        style={{ border:`2px dashed ${csvErr?C.red:C.border}`, borderRadius:13,
          padding:"36px 20px", textAlign:"center", cursor:"pointer", background:C.light }}>
        <div style={{ fontSize:34, marginBottom:6 }}>📥</div>
        <div style={{ fontWeight:800, color:C.navy, fontSize:14 }}>Déposez le fichier CSV</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>ou cliquez pour sélectionner</div>
        {csvErr && <div style={{ color:C.red, fontSize:12, marginTop:10, fontWeight:600 }}>{csvErr}</div>}
      </div>
      <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }}
        onChange={e => { if(e.target.files[0]) loadCSV(e.target.files[0]); }} />
      <SBtn onClick={() => setStep("config")}>← Retour</SBtn>
    </>,
    "Import des ateliers"
  );

  // ── Share ──
  if (step === "share") return card(
    <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
        {[
          { v:wks.length,                       l:"ateliers"  },
          { v:Object.keys(byDate).length,        l:"journées"  },
          { v:slotCount,                         l:"créneaux"  },
        ].map(({ v, l }) => (
          <div key={l} style={{ background:C.light, borderRadius:10,
            padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:900, color:C.navy }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Destination Power Automate */}
      <div style={{ background:"#e8f3fc", borderRadius:10, padding:"10px 14px",
        marginBottom:12, display:"flex", gap:10, alignItems:"center" }}>
        <span style={{ fontSize:20 }}>⚡</span>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.ms }}>Flux Power Automate configuré</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:2, wordBreak:"break-all" }}>
            {cfg.webhook.slice(0, 60)}…
          </div>
        </div>
      </div>

      <button onClick={copy} style={{ display:"block", width:"100%", padding:"13px",
        background:copied?C.green:C.accent, color:"#fff",
        border:"none", borderRadius:11, fontSize:15, fontWeight:800,
        cursor:"pointer", fontFamily:FF, transition:"background 0.3s" }}>
        {copied ? "✓ Lien copié !" : "📋 Copier le lien élèves"}
      </button>

      <div style={{ background:"#fff8f5", border:`1px solid #fddccc`, borderRadius:10,
        padding:"11px 14px", marginTop:12, fontSize:11.5, color:"#7a3a1a", lineHeight:1.7 }}>
        <strong>À faire :</strong> partagez ce lien via votre ENT NEO, Teams ou un QR code.
        Les inscriptions arrivent automatiquement dans votre liste SharePoint.
      </div>

      <a href={generatedUrl} target="_blank" rel="noreferrer"
        style={{ display:"block", textAlign:"center", padding:"11px",
          color:C.muted, fontSize:13, marginTop:8, textDecoration:"none",
          border:`1.5px solid ${C.border}`, borderRadius:11 }}>
        👁 Aperçu — vue élève
      </a>
      <SBtn onClick={() => setStep("import")}>← Changer le fichier CSV</SBtn>
    </>,
    "Lien élèves"
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE ÉLÈVE
// ════════════════════════════════════════════════════════════
// Clé localStorage propre à l'événement (basée sur le webhook, stable pour un même lien)
const eventKey = (webhook) => "submitted_" + btoa(webhook).slice(-24);

function StudentApp({ config }) {
  const { titre, webhook, workshops } = config;

  const lsKey = eventKey(webhook);

  const [sel,     setSel]     = useState(new Set());
  const [student, setStudent] = useState({ nom:"", classe:"" });
  // Vérifie si cet élève a déjà soumis depuis ce navigateur
  const [status,  setStatus]  = useState(
    () => localStorage.getItem(lsKey) ? "success" : "idle"
  );
  const [errMsg,  setErrMsg]  = useState("");
  const [prevSub, setPrevSub] = useState(
    () => { try { return JSON.parse(localStorage.getItem(lsKey)); } catch { return null; } }
  );

  const toggle = (w) => setSel(prev => {
    const n = new Set(prev); n.has(w.id) ? n.delete(w.id) : n.add(w.id); return n;
  });

  const blocked = new Set(workshops.filter(w => sel.has(w.id)).map(w => w.slotKey));

  const byDate = {};
  for (const w of workshops) {
    if (!byDate[w.date]) byDate[w.date] = {};
    if (!byDate[w.date][w.slotKey]) byDate[w.date][w.slotKey] = [];
    byDate[w.date][w.slotKey].push(w);
  }
  const dates = sortDates(Object.keys(byDate));
  const picked = workshops.filter(w => sel.has(w.id));

  const canSend = student.nom.trim() && student.classe.trim() && picked.length > 0 && status === "idle";

  const handleSend = async () => {
    if (!canSend) return;
    setStatus("sending");
    const payload = {
      nom:       student.nom.trim(),
      classe:    student.classe.trim(),
      timestamp: new Date().toISOString(),
      ateliers:  picked
        .sort((a,b) => `${toIso(a.date)}${a.debut}`.localeCompare(`${toIso(b.date)}${b.debut}`))
        .map(w => ({
          nom:   w.nom,
          date:  fmtDate(w.date),
          heure: `${w.debut}${w.fin?"–"+w.fin:""}`,
          salle: w.salle || "",
        })),
    };
    try {
      const r = await fetch(webhook, {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body:    JSON.stringify(payload),
      });
      if (r.status === 409) {
        setErrMsg("Une inscription existe déjà pour ce nom et cette classe.");
        setStatus("error");
        return;
      }
      // Sauvegarde locale pour bloquer une re-soumission accidentelle
      localStorage.setItem(lsKey, JSON.stringify({
        nom:    payload.nom,
        classe: payload.classe,
        at:     payload.timestamp,
      }));
      setPrevSub({ nom: payload.nom, classe: payload.classe, at: payload.timestamp });
      setStatus("success");
    } catch (e) {
      setErrMsg("Erreur réseau. Vérifiez votre connexion et réessayez.");
      setStatus("error");
    }
  };

  // ── Écran de confirmation ──────────────────────────────
  if (status === "success") {
    const isReturn = prevSub && !picked.length;
    const displayNom    = isReturn ? prevSub.nom    : student.nom;
    const displayClasse = isReturn ? prevSub.classe : student.classe;
    return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FF,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, borderRadius:18, padding:"48px 32px",
        maxWidth:440, textAlign:"center", boxShadow:"0 4px 32px rgba(0,0,0,0.09)" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>{isReturn ? "🔒" : "✅"}</div>
        <h1 style={{ fontSize:22, fontWeight:900, color:C.green, margin:"0 0 12px" }}>
          {isReturn ? "Déjà inscrit(e)" : "Inscription envoyée !"}
        </h1>
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:24 }}>
          <strong style={{ color:C.text }}>{displayNom}</strong> — {displayClasse}<br/>
          {isReturn
            ? "Vous avez déjà soumis votre inscription depuis cet appareil."
            : <>Vos <strong>{picked.length} atelier{picked.length>1?"s":""}</strong> ont bien été transmis.</>
          }
        </p>
        <div style={{ background:C.light, borderRadius:12, padding:"16px 20px",
          textAlign:"left", marginBottom:24 }}>
          {picked
            .sort((a,b) => `${toIso(a.date)}${a.debut}`.localeCompare(`${toIso(b.date)}${b.debut}`))
            .map(w => (
              <div key={w.id} style={{ display:"flex", gap:10, marginBottom:10,
                paddingBottom:10, borderBottom:`1px solid ${C.border}`,
                ":last-child":{ borderBottom:"none" } }}>
                <span style={{ fontSize:18 }}>◈</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{w.nom}</div>
                  <div style={{ fontSize:11, color:C.muted }}>
                    {fmtDate(w.date)} · {w.debut}{w.fin?"–"+w.fin:""}
                    {w.salle?` · ${w.salle}`:""}
                  </div>
                </div>
              </div>
            ))}
        </div>
        <p style={{ fontSize:12, color:C.muted }}>
          Votre établissement confirmera votre participation.
        </p>
      </div>
    </div>
  );
  }

  // ── Page principale ────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FF, paddingBottom:130 }}>

      {/* Bandeau */}
      <div style={{ background:C.navy, color:"#fff", padding:"14px 20px 12px",
        position:"sticky", top:0, zIndex:20, boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth:760, margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:900, fontSize:15, letterSpacing:-0.2 }}>◈ {titre}</div>
            <div style={{ fontSize:11, opacity:0.6, marginTop:1 }}>
              Sélectionnez vos ateliers et validez en bas de page
            </div>
          </div>
          <div style={{ background:sel.size>0?C.accent:"rgba(255,255,255,0.12)",
            borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:800,
            transition:"background 0.2s" }}>
            {sel.size} choisi{sel.size>1?"s":""}
          </div>
        </div>
      </div>

      {/* Ateliers */}
      <div style={{ maxWidth:760, margin:"0 auto", padding:"22px 14px" }}>
        <div style={{ background:C.surface, borderRadius:10, padding:"11px 16px",
          marginBottom:24, fontSize:12, color:C.muted, borderLeft:`3px solid ${C.accent}`, lineHeight:1.7 }}>
          Cliquez sur un atelier pour le sélectionner.
          Les autres ateliers du <strong style={{ color:C.text }}>même créneau</strong> disparaîtront automatiquement.
        </div>

        {dates.map(date => {
          const slots = byDate[date];
          const slotKeys = Object.keys(slots).sort((a,b) => a.split("__")[1].localeCompare(b.split("__")[1]));
          const visible = slotKeys.filter(sk =>
            !blocked.has(sk) || slots[sk].some(w => sel.has(w.id))
          );
          if (!visible.length) return null;
          return (
            <div key={date} style={{ marginBottom:32 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                <div style={{ flex:1, height:1, background:C.border }} />
                <div style={{ fontSize:13, fontWeight:900, color:C.navy,
                  textTransform:"capitalize", background:C.surface,
                  padding:"5px 16px", borderRadius:20, border:`1.5px solid ${C.border}` }}>
                  {fmtDate(date)}
                </div>
                <div style={{ flex:1, height:1, background:C.border }} />
              </div>
              {visible.map(sk => {
                const slotWs   = slots[sk];
                const isChosen = blocked.has(sk);
                const time     = `${slotWs[0].debut}${slotWs[0].fin?" – "+slotWs[0].fin:""}`;
                const displayWs = slotWs.filter(w => !blocked.has(w.slotKey) || sel.has(w.id));
                return (
                  <div key={sk} style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <span style={{ background:isChosen?C.green:C.accent, color:"#fff",
                        borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:800 }}>
                        ⏱ {time}
                      </span>
                      {isChosen
                        ? <span style={{ fontSize:11, color:C.green, fontWeight:700 }}>✓ Créneau réservé</span>
                        : displayWs.length>1 && <span style={{ fontSize:11, color:C.muted }}>{displayWs.length} ateliers au choix</span>
                      }
                    </div>
                    <div style={{ display:"grid",
                      gridTemplateColumns:displayWs.length===1?"minmax(0,480px)":"repeat(auto-fill, minmax(196px, 1fr))",
                      gap:10 }}>
                      {displayWs.map(w => (
                        <WCard key={w.id} w={w} selected={sel.has(w.id)} onToggle={() => toggle(w)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Barre de validation fixe ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0,
        background:C.surface, borderTop:`1px solid ${C.border}`,
        boxShadow:"0 -3px 16px rgba(0,0,0,0.08)", zIndex:20 }}>
        <div style={{ maxWidth:760, margin:"0 auto", padding:"12px 16px" }}>

          {/* Nom + classe */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            <TInput
              value={student.nom}
              onChange={e => setStudent({...student, nom:e.target.value})}
              placeholder="Nom et prénom"
              style={{ padding:"8px 12px", fontSize:13 }}
            />
            <TInput
              value={student.classe}
              onChange={e => setStudent({...student, classe:e.target.value})}
              placeholder="Classe  (ex. 4ème B)"
              style={{ padding:"8px 12px", fontSize:13 }}
            />
          </div>

          {/* Erreur réseau */}
          {status==="error" && (
            <div style={{ background:"#fef2f2", border:`1px solid #fca5a5`,
              borderRadius:8, padding:"8px 12px", fontSize:12, color:C.red,
              marginBottom:8, display:"flex", gap:8, alignItems:"center" }}>
              ⚠ {errMsg}
              <button onClick={() => setStatus("idle")}
                style={{ marginLeft:"auto", background:"transparent",
                  border:"none", color:C.red, cursor:"pointer", fontWeight:700 }}>
                Réessayer
              </button>
            </div>
          )}

          {/* Bouton envoyer */}
          <button
            onClick={handleSend}
            disabled={!canSend || status==="sending"}
            style={{
              display:"block", width:"100%", padding:"13px",
              background:canSend?C.navy:"#b6c6dc",
              color:"#fff", border:"none", borderRadius:11,
              fontSize:15, fontWeight:800,
              cursor:canSend?"pointer":"not-allowed",
              fontFamily:FF, transition:"background 0.2s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
            {status==="sending"
              ? <><Spinner /> Envoi en cours…</>
              : <>⚡ Envoyer ma sélection {picked.length>0?`(${picked.length} atelier${picked.length>1?"s":""})`:""}</>
            }
          </button>

          {(!student.nom || !student.classe) && (
            <p style={{ fontSize:11, color:C.muted, textAlign:"center", margin:"6px 0 0" }}>
              Renseignez votre nom et votre classe pour valider
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation:"spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
//  ENTRÉE
// ════════════════════════════════════════════════════════════
export default function App() {
  const [mode,   setMode]   = useState(getMode());
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const onHash = () => {
      const m = getMode();
      setMode(m);
      if (m === "student") {
        const enc = window.location.hash.replace("#data=", "");
        setConfig(decode(enc));
      }
    };
    window.addEventListener("hashchange", onHash);
    if (mode === "student") {
      const enc = window.location.hash.replace("#data=", "");
      setConfig(decode(enc));
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (mode === "admin") return <AdminApp />;
  if (mode === "student" && config) return <StudentApp config={config} />;
  if (mode === "student" && !config) return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FF,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, borderRadius:16, padding:"36px 28px",
        maxWidth:380, textAlign:"center", boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <h2 style={{ color:C.navy, marginBottom:8 }}>Lien invalide</h2>
        <p style={{ color:C.muted, fontSize:13 }}>
          Ce lien est invalide ou corrompu.<br/>Demandez un nouveau lien à votre établissement.
        </p>
      </div>
    </div>
  );
  return <Landing />;
}
