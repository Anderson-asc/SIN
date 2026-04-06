import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MASTER_USER = { id: "master", name: "ASC Informática", email: "admin@ascinformatica.com.br", password: "asc@2025", role: "master", company: null };

const INITIAL_COMPANIES = [
  { id: "c1", razaoSocial: "Tech Solutions Ltda", nomeFantasia: "TechSol", cnpj: "12.345.678/0001-90", endereco: "Av. Paulista, 1000", cidade: "São Paulo", estado: "SP", cep: "01310-100", telefone: "(11) 3000-1000", email: "contato@techsol.com.br", responsavel: "Carlos Mendes", createdAt: "2024-01-15" },
  { id: "c2", razaoSocial: "Inovação Digital S.A.", nomeFantasia: "InovaDigital", cnpj: "98.765.432/0001-10", endereco: "Rua das Flores, 500", cidade: "Campinas", estado: "SP", cep: "13010-050", telefone: "(19) 3100-2000", email: "ti@inovadigital.com.br", responsavel: "Ana Lima", createdAt: "2024-02-20" },
];

const INITIAL_USERS = [
  { id: "u1", name: "Carlos Mendes", email: "carlos@techsol.com.br", password: "carlos123", role: "admin", companyId: "c1" },
  { id: "u2", name: "Fernanda Costa", email: "fernanda@techsol.com.br", password: "fer123", role: "user", companyId: "c1" },
  { id: "u3", name: "Ana Lima", email: "ana@inovadigital.com.br", password: "ana123", role: "admin", companyId: "c2" },
];

const CATEGORIES = ["Notebook", "Headset", "Monitor", "Headset", "Servidor", "Switch", "Roteador", "Impressora", "Teclado/Mouse", "Nobreak", "E-mail Pessoal", "E-mail Projeto", "Licença Software", "Outro"];
const STATUS_LIST = ["Ativo", "Estoque", "Manutenção", "Inativo"];
const STATUS_COLORS = { "Ativo": "#22c55e", "Estoque": "#3b82f6", "Manutenção": "#f59e0b", "Inativo": "#ef4444" };
const STATUS_BG = { "Ativo": "#dcfce7", "Estoque": "#dbeafe", "Manutenção": "#fef3c7", "Inativo": "#fee2e2" };

const INITIAL_ASSETS = [
  { id: "a1", companyId: "c1", tipo: "Notebook", nome: "Notebook Dell Latitude", fabricante: "Dell", modelo: "Latitude 5520", patrimonio: "NB-001", localizacao: "Sala TI", responsavel: "Carlos Mendes", status: "Ativo", dataCompra: "2023-03-10", garantiaAte: "2026-03-10", observacoes: "Uso do gerente de TI" },
  { id: "a2", companyId: "c1", tipo: "Monitor", nome: "Monitor LG 27\"", fabricante: "LG", modelo: "27BL650C", patrimonio: "MN-001", localizacao: "Sala TI", responsavel: "Carlos Mendes", status: "Ativo", dataCompra: "2023-03-10", garantiaAte: "2025-03-10", observacoes: "" },
  { id: "a3", companyId: "c1", tipo: "Servidor", nome: "Servidor HP ProLiant", fabricante: "HP", modelo: "ProLiant DL380 Gen10", patrimonio: "SV-001", localizacao: "Sala Servidores", responsavel: "Fernanda Costa", status: "Ativo", dataCompra: "2022-01-20", garantiaAte: "2025-01-20", observacoes: "Servidor principal" },
  { id: "a4", companyId: "c1", tipo: "Notebook", nome: "Notebook Lenovo ThinkPad", fabricante: "Lenovo", modelo: "ThinkPad E15", patrimonio: "NB-002", localizacao: "Estoque", responsavel: "", status: "Estoque", dataCompra: "2024-01-05", garantiaAte: "2027-01-05", observacoes: "Aguardando alocação" },
  { id: "a5", companyId: "c1", tipo: "Switch", nome: "Switch Cisco 24P", fabricante: "Cisco", modelo: "Catalyst 2960", patrimonio: "SW-001", localizacao: "Rack Principal", responsavel: "Fernanda Costa", status: "Manutenção", dataCompra: "2021-06-15", garantiaAte: "2024-06-15", observacoes: "Em manutenção preventiva" },
  { id: "a6", companyId: "c2", tipo: "Notebook", nome: "MacBook Pro 14\"", fabricante: "Apple", modelo: "MacBook Pro M3", patrimonio: "NB-C2-001", localizacao: "Sala Design", responsavel: "Ana Lima", status: "Ativo", dataCompra: "2024-02-01", garantiaAte: "2027-02-01", observacoes: "Designer principal" },
  { id: "a7", companyId: "c2", tipo: "Headset", nome: "PC Gamer Dev", fabricante: "Pichau", modelo: "Custom Build", patrimonio: "PC-C2-001", localizacao: "Dev Room", responsavel: "João Pedro", status: "Ativo", dataCompra: "2023-08-10", garantiaAte: "2026-08-10", observacoes: "" },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 10); }
function formatDate(d) { if (!d) return "—"; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; }
function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const diff = (new Date(dateStr) - new Date()) / 86400000;
  return diff >= 0 && diff <= 90;
}
function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ─── ICONS (inline SVG) ──────────────────────────────────────────────────────
const icons = {
  logo: <svg viewBox="0 0 40 40" fill="none" style={{width:36,height:36}}><rect width="40" height="40" rx="10" fill="#0ea5e9"/><path d="M8 28V16l12-8 12 8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="15" y="20" width="10" height="8" rx="1" fill="white"/></svg>,
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  inventory: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>,
  companies: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-4h6v4"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:18,height:18}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  laptop: "💻", server: "🖥️", headset: "🎧", monitor: "🖥", switch: "🔌", printer: "🖨️", keyboard: "⌨️", ups: "🔋", email: "📧", license: "📄", Headset "🖥️", router: "📡", other: "📦"
};

const catIcon = c => ({
  "Notebook":"💻","Headset":"🖥️","Monitor":"🖥","Headset":"🎧","Servidor":"🗄️",
  "Switch":"🔀","Roteador":"📡","Impressora":"🖨️","Teclado/Mouse":"⌨️",
  "Nobreak":"🔋","E-mail Pessoal":"📧","E-mail Projeto":"📨","Licença Software":"📄","Outro":"📦"
}[c] || "📦");

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = {
  bg: "#0f1623", sidebar: "#111827", card: "#1a2235", border: "#1e2d45",
  accent: "#0ea5e9", accentDark: "#0284c7", text: "#e2e8f0", muted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#3b82f6",
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [catFilter, setCatFilter] = useState("Todos");
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!session) return <LoginPage onLogin={u => { setSession(u); setPage("dashboard"); }} companies={companies} users={users} />;

  const isMaster = session.role === "master";
  const myAssets = isMaster ? assets : assets.filter(a => a.companyId === session.companyId);
  const myCompany = isMaster ? null : companies.find(c => c.id === session.companyId);

  return (
    <div style={{ display: "flex", height: "100vh", background: G.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: G.text, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111827; } ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px; }
        input, select, textarea { background: #0f1623; border: 1px solid #1e2d45; color: #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-family: inherit; outline: none; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,0.15); }
        button { cursor: pointer; font-family: inherit; transition: all 0.2s; }
        label { font-size: 12px; font-weight: 500; color: #94a3b8; display: block; margin-bottom: 5px; }
        .hovrow:hover { background: rgba(14,165,233,0.06) !important; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        .slide-in { animation: slideIn 0.3s ease; }
        @keyframes notif { 0%{transform:translateY(-20px);opacity:0} 10%{transform:translateY(0);opacity:1} 90%{transform:translateY(0);opacity:1} 100%{transform:translateY(-20px);opacity:0} }
        .notif { animation: notif 3s ease forwards; }
      `}</style>

      {/* SIDEBAR */}
      <Sidebar session={session} page={page} setPage={setPage} sidebarOpen={sidebarOpen} isMaster={isMaster} catFilter={catFilter} setCatFilter={setCatFilter} />

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOPBAR */}
        <div style={{ background: G.sidebar, borderBottom: `1px solid ${G.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{ background: "none", border: "none", color: G.muted, padding: 4 }}>{icons.menu}</button>
            <span style={{ fontFamily: "'Space Grotesk'", fontSize: 16, fontWeight: 600, color: G.text }}>
              {isMaster ? "ASC Informática — Master" : myCompany?.nomeFantasia}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{session.name}</div>
              <div style={{ fontSize: 11, color: G.muted }}>{session.role === "master" ? "Master Admin" : session.role === "admin" ? "Admin Empresa" : "Usuário"}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${G.accent},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
              {session.name[0]}
            </div>
            <button onClick={() => setSession(null)} style={{ background: "none", border: `1px solid ${G.border}`, color: G.muted, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              {icons.logout} Sair
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }} className="fade-in" key={page}>
          {page === "dashboard" && <Dashboard assets={myAssets} companies={isMaster ? companies : [myCompany]} isMaster={isMaster} />}
          {page === "inventory" && <Inventory assets={myAssets} setAssets={setAssets} companies={companies} users={users} session={session} isMaster={isMaster} catFilter={catFilter} notify={notify} />}
          {page === "companies" && isMaster && <Companies companies={companies} setCompanies={setCompanies} users={users} assets={assets} notify={notify} />}
          {page === "users" && <Users users={isMaster ? users : users.filter(u => u.companyId === session.companyId)} setUsers={setUsers} companies={companies} session={session} isMaster={isMaster} notify={notify} />}
        </div>
      </div>

      {/* NOTIFICATION */}
      {notification && (
        <div className="notif" style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: notification.type === "success" ? G.success : notification.type === "error" ? G.danger : G.warning, color: "white", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, companies, users }) {
  const [email, setEmail] = useState("admin@ascinformatica.com.br");
  const [password, setPassword] = useState("asc@2025");
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recEmail, setRecEmail] = useState("");
  const [recMsg, setRecMsg] = useState("");

  const handleLogin = () => {
    setError("");
    if (email === MASTER_USER.email && password === MASTER_USER.password) { onLogin(MASTER_USER); return; }
    const u = users.find(u => u.email === email && u.password === password);
    if (u) { const c = companies.find(c => c.id === u.companyId); onLogin({ ...u, companyName: c?.nomeFantasia }); return; }
    setError("E-mail ou senha incorretos.");
  };

  const handleRecover = () => {
    if (!recEmail) return;
    setRecMsg(`✅ Instruções enviadas para ${recEmail}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input { background:#1a2235; border:1px solid #1e2d45; color:#e2e8f0; border-radius:10px; padding:12px 16px; font-size:15px; font-family:inherit; outline:none; width:100%; } input:focus { border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,0.15); } @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');`}</style>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 30%, rgba(14,165,233,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 60%)" }} />
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, padding: 48, width: 420, position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>{icons.logo}</div>
          <div style={{ fontFamily:"'Space Grotesk'", fontSize:24, fontWeight:700, color:"white", marginBottom:4 }}>ASC Informática</div>
          <div style={{ fontSize:13, color:G.muted }}>Sistema de Inventário Multi-Empresa</div>
        </div>

        {!recovering ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com.br" />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            {error && <div style={{ color: G.danger, fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>{error}</div>}
            <button style={{ textAlign:"right", display:"block", marginLeft:"auto", background:"none", border:"none", color:G.accent, fontSize:13, marginBottom:20, padding:0 }} onClick={() => setRecovering(true)}>
              Esqueci minha senha
            </button>
            <button onClick={handleLogin} style={{ width:"100%", background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, letterSpacing:.3 }}>
              Entrar no Sistema
            </button>
            <div style={{ marginTop:20, padding:"12px 16px", background:"rgba(14,165,233,0.07)", borderRadius:10, fontSize:12, color:G.muted }}>
              <strong style={{color:G.accent}}>Demo Master:</strong> admin@ascinformatica.com.br / asc@2025<br/>
              <strong style={{color:G.accent}}>Demo Empresa:</strong> carlos@techsol.com.br / carlos123
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom:16 }}>
              <label>E-mail cadastrado</label>
              <input type="email" value={recEmail} onChange={e => setRecEmail(e.target.value)} placeholder="seu@email.com.br" />
            </div>
            {recMsg && <div style={{ color:G.success, fontSize:13, marginBottom:12, padding:"8px 12px", background:"rgba(34,197,94,0.1)", borderRadius:8 }}>{recMsg}</div>}
            <button onClick={handleRecover} style={{ width:"100%", background:G.accent, border:"none", color:"white", borderRadius:12, padding:14, fontSize:15, fontWeight:700 }}>
              Enviar instruções
            </button>
            <button onClick={() => { setRecovering(false); setRecMsg(""); }} style={{ width:"100%", background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:12, padding:12, fontSize:14, marginTop:10 }}>
              Voltar ao login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ session, page, setPage, sidebarOpen, isMaster, catFilter, setCatFilter }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { id: "inventory", label: "Inventário", icon: icons.inventory },
    ...(isMaster ? [{ id: "companies", label: "Empresas", icon: icons.companies }] : []),
    { id: "users", label: "Usuários", icon: icons.users },
  ];

  if (!sidebarOpen) return (
    <div style={{ width: 60, background: G.sidebar, borderRight: `1px solid ${G.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:16, gap:8 }}>
      <div style={{ marginBottom:8 }}>{icons.logo}</div>
      {navItems.map(n => (
        <button key={n.id} onClick={() => setPage(n.id)} title={n.label} style={{ background: page===n.id ? "rgba(14,165,233,0.15)" : "none", border:"none", color: page===n.id ? G.accent : G.muted, padding:"10px", borderRadius:10 }}>
          {n.icon}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ width: 240, background: G.sidebar, borderRight: `1px solid ${G.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"auto" }}>
      <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 }}>
        {icons.logo}
        <div>
          <div style={{ fontFamily:"'Space Grotesk'", fontSize:14, fontWeight:700, color:"white" }}>ASC Inventário</div>
          <div style={{ fontSize:10, color:G.muted }}>v2.0 Multi-Tenant</div>
        </div>
      </div>

      <nav style={{ padding:"12px 10px" }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, marginBottom:2, background: page===n.id ? "rgba(14,165,233,0.15)" : "none", border: page===n.id ? `1px solid rgba(14,165,233,0.3)` : "1px solid transparent", color: page===n.id ? G.accent : G.muted, fontSize:14, fontWeight: page===n.id ? 600 : 400, textAlign:"left" }}>
            {n.icon} {n.label}
          </button>
        ))}
      </nav>

      {page === "inventory" && (
        <div style={{ padding:"0 10px", marginTop:4 }}>
          <div style={{ fontSize:10, fontWeight:600, color:G.muted, padding:"8px 12px", textTransform:"uppercase", letterSpacing:1 }}>Categorias</div>
          {["Todos", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:8, marginBottom:1, background: catFilter===c ? "rgba(14,165,233,0.1)" : "none", border:"none", color: catFilter===c ? G.accent : G.muted, fontSize:13, textAlign:"left" }}>
              <span>{c==="Todos" ? "📋" : catIcon(c)}</span> {c}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop:"auto", padding:"12px 10px", borderTop:`1px solid ${G.border}` }}>
        <div style={{ padding:"10px 12px", borderRadius:10, background:"rgba(14,165,233,0.07)", fontSize:12 }}>
          <div style={{ color:G.accent, fontWeight:600, marginBottom:2 }}>{session.name}</div>
          <div style={{ color:G.muted }}>{isMaster ? "Master Admin" : session.role === "admin" ? "Admin Empresa" : "Usuário Padrão"}</div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ assets, companies, isMaster }) {
  const counts = STATUS_LIST.reduce((acc, s) => ({ ...acc, [s]: assets.filter(a => a.status === s).length }), {});
  const byType = CATEGORIES.map(c => ({ cat: c, count: assets.filter(a => a.tipo === c).length })).filter(x => x.count > 0);
  const expiring = assets.filter(a => isExpiringSoon(a.garantiaAte));
  const expired = assets.filter(a => isExpired(a.garantiaAte));

  const statCards = [
    { label: "Total de Ativos", value: assets.length, color: G.accent, bg: "rgba(14,165,233,0.1)" },
    { label: "Em Uso (Ativo)", value: counts["Ativo"] || 0, color: G.success, bg: "rgba(34,197,94,0.1)" },
    { label: "Em Estoque", value: counts["Estoque"] || 0, color: G.info, bg: "rgba(59,130,246,0.1)" },
    { label: "Manutenção", value: counts["Manutenção"] || 0, color: G.warning, bg: "rgba(245,158,11,0.1)" },
    { label: "Inativos", value: counts["Inativo"] || 0, color: G.danger, bg: "rgba(239,68,68,0.1)" },
  ];
  if (isMaster) statCards.push({ label: "Empresas", value: companies?.length || 0, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" });

  const maxCount = Math.max(...byType.map(x => x.count), 1);

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Space Grotesk'", fontSize:26, fontWeight:700, color:"white", marginBottom:4 }}>Dashboard</h1>
        <p style={{ color:G.muted, fontSize:14 }}>Visão geral do inventário {isMaster ? "— todas as empresas" : ""}</p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:16, marginBottom:28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:"20px 20px 16px", borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:32, fontWeight:700, color:s.color, fontFamily:"'Space Grotesk'" }}>{s.value}</div>
            <div style={{ fontSize:13, color:G.muted, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* DIST BY TYPE */}
        <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontFamily:"'Space Grotesk'", fontWeight:600, marginBottom:20, fontSize:15 }}>Distribuição por Categoria</div>
          {byType.length === 0 ? <div style={{ color:G.muted, fontSize:13 }}>Sem dados</div> : byType.map(x => (
            <div key={x.cat} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                <span>{catIcon(x.cat)} {x.cat}</span>
                <span style={{ fontWeight:600, color:G.accent }}>{x.count}</span>
              </div>
              <div style={{ background:"#1e2d45", borderRadius:99, height:6, overflow:"hidden" }}>
                <div style={{ width:`${(x.count/maxCount)*100}%`, height:"100%", background:`linear-gradient(90deg,${G.accent},#6366f1)`, borderRadius:99, transition:"width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* ALERTS */}
        <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:24 }}>
          <div style={{ fontFamily:"'Space Grotesk'", fontWeight:600, marginBottom:20, fontSize:15 }}>⚠️ Alertas de Garantia</div>
          {expired.length === 0 && expiring.length === 0 ? (
            <div style={{ color:G.success, fontSize:14, padding:"12px 16px", background:"rgba(34,197,94,0.1)", borderRadius:10 }}>✅ Nenhum alerta de garantia</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {expired.slice(0,5).map(a => (
                <div key={a.id} style={{ padding:"10px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, fontSize:13 }}>
                  <div style={{ fontWeight:600, color:G.danger }}>{a.nome}</div>
                  <div style={{ color:G.muted, fontSize:12 }}>Garantia expirou em {formatDate(a.garantiaAte)}</div>
                </div>
              ))}
              {expiring.slice(0,5).map(a => (
                <div key={a.id} style={{ padding:"10px 14px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, fontSize:13 }}>
                  <div style={{ fontWeight:600, color:G.warning }}>{a.nome}</div>
                  <div style={{ color:G.muted, fontSize:12 }}>Garantia vence em {formatDate(a.garantiaAte)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATUS PIE-like summary */}
      <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:24 }}>
        <div style={{ fontFamily:"'Space Grotesk'", fontWeight:600, marginBottom:20, fontSize:15 }}>Status do Inventário</div>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {STATUS_LIST.map(s => {
            const pct = assets.length ? Math.round((counts[s]||0)/assets.length*100) : 0;
            return (
              <div key={s} style={{ flex:1, minWidth:140, padding:"16px 20px", background:STATUS_BG[s]+"33", border:`1px solid ${STATUS_COLORS[s]}44`, borderRadius:14 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:STATUS_COLORS[s], marginBottom:8 }}>{s}</div>
                <div style={{ fontSize:30, fontWeight:700, color:"white", fontFamily:"'Space Grotesk'" }}>{counts[s]||0}</div>
                <div style={{ fontSize:12, color:G.muted, marginTop:2 }}>{pct}% do total</div>
                <div style={{ marginTop:10, background:"#1e2d45", borderRadius:99, height:4 }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:STATUS_COLORS[s], borderRadius:99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
function Inventory({ assets, setAssets, companies, users, session, isMaster, catFilter, notify }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [viewAsset, setViewAsset] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = assets.filter(a => {
    if (catFilter !== "Todos" && a.tipo !== catFilter) return false;
    if (statusFilter !== "Todos" && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [a.nome, a.fabricante, a.modelo, a.patrimonio, a.localizacao, a.responsavel, a.tipo].some(f => f?.toLowerCase().includes(q));
    }
    return true;
  });

  const handleSave = (data) => {
    if (editAsset) {
      setAssets(prev => prev.map(a => a.id === editAsset.id ? { ...editAsset, ...data } : a));
      notify("Ativo atualizado com sucesso!");
    } else {
      setAssets(prev => [...prev, { ...data, id: genId(), companyId: isMaster ? (data.companyId || companies[0]?.id) : session.companyId }]);
      notify("Ativo cadastrado com sucesso!");
    }
    setShowForm(false); setEditAsset(null);
  };

  const handleDelete = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null); setViewAsset(null);
    notify("Ativo removido.", "warning");
  };

  const exportCSV = () => {
    const header = ["ID","Tipo","Nome","Fabricante","Modelo","Patrimônio","Localização","Responsável","Status","Data Compra","Garantia Até","Observações"];
    const rows = filtered.map(a => [a.id,a.tipo,a.nome,a.fabricante,a.modelo,a.patrimonio,a.localizacao,a.responsavel,a.status,a.dataCompra,a.garantiaAte,a.observacoes]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c||""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventario.csv"; a.click();
    notify("CSV exportado!");
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Space Grotesk'", fontSize:26, fontWeight:700, color:"white", marginBottom:4 }}>Inventário</h1>
          <p style={{ color:G.muted, fontSize:14 }}>{filtered.length} ativo(s) encontrado(s)</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={exportCSV} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:10, padding:"9px 14px", fontSize:13 }}>
            {icons.download} Exportar CSV
          </button>
          <button onClick={() => { setEditAsset(null); setShowForm(true); }} style={{ display:"flex", alignItems:"center", gap:6, background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:10, padding:"9px 16px", fontSize:13, fontWeight:600 }}>
            {icons.plus} Novo Ativo
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:G.muted }}>{icons.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, modelo, patrimônio..." style={{ paddingLeft:36 }} />
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["Todos", ...STATUS_LIST].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${statusFilter===s ? STATUS_COLORS[s]||G.accent : G.border}`, background: statusFilter===s ? (STATUS_COLORS[s]||G.accent)+"22" : "none", color: statusFilter===s ? STATUS_COLORS[s]||G.accent : G.muted, fontSize:13, fontWeight: statusFilter===s ? 600 : 400 }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#1e2d45", borderBottom:`1px solid ${G.border}` }}>
                {["Tipo","Nome / Modelo","Patrimônio","Localização","Responsável","Status","Garantia","Ações"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:.8, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:40, textAlign:"center", color:G.muted, fontSize:14 }}>Nenhum ativo encontrado.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hovrow" style={{ borderBottom:`1px solid ${G.border}11` }}>
                  <td style={{ padding:"12px 16px", fontSize:13, whiteSpace:"nowrap" }}><span style={{ marginRight:6 }}>{catIcon(a.tipo)}</span>{a.tipo}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontWeight:600, fontSize:14, color:"white" }}>{a.nome}</div>
                    <div style={{ fontSize:12, color:G.muted }}>{a.fabricante} {a.modelo}</div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13, fontFamily:"monospace", color:G.accent }}>{a.patrimonio||"—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:13 }}>{a.localizacao||"—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:13 }}>{a.responsavel||"—"}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ padding:"4px 10px", borderRadius:99, fontSize:12, fontWeight:600, background:STATUS_BG[a.status]+"44", color:STATUS_COLORS[a.status], border:`1px solid ${STATUS_COLORS[a.status]}44` }}>{a.status}</span>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12 }}>
                    {a.garantiaAte ? (
                      <span style={{ color: isExpired(a.garantiaAte) ? G.danger : isExpiringSoon(a.garantiaAte) ? G.warning : G.muted }}>
                        {isExpired(a.garantiaAte) ? "⛔ " : isExpiringSoon(a.garantiaAte) ? "⚠️ " : "✅ "}{formatDate(a.garantiaAte)}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => setViewAsset(a)} style={{ padding:"5px 10px", borderRadius:7, background:"rgba(14,165,233,0.1)", border:`1px solid ${G.accent}44`, color:G.accent, fontSize:12, display:"flex", alignItems:"center", gap:4 }}>{icons.eye} Ver</button>
                      <button onClick={() => { setEditAsset(a); setShowForm(true); }} style={{ padding:"5px 8px", borderRadius:7, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:G.warning }}>{icons.edit}</button>
                      <button onClick={() => setDeleteConfirm(a)} style={{ padding:"5px 8px", borderRadius:7, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:G.danger }}>{icons.trash}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {showForm && <AssetForm asset={editAsset} onSave={handleSave} onClose={() => { setShowForm(false); setEditAsset(null); }} companies={companies} isMaster={isMaster} session={session} />}

      {/* VIEW PANEL */}
      {viewAsset && (
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:420, background:G.sidebar, borderLeft:`1px solid ${G.border}`, zIndex:200, overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.5)" }} className="slide-in">
          <div style={{ padding:"20px 24px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontFamily:"'Space Grotesk'", fontWeight:700, fontSize:16 }}>Detalhes do Ativo</div>
            <button onClick={() => setViewAsset(null)} style={{ background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:8, padding:6 }}>{icons.close}</button>
          </div>
          <div style={{ padding:24 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>{catIcon(viewAsset.tipo)}</div>
            <div style={{ fontFamily:"'Space Grotesk'", fontSize:20, fontWeight:700, color:"white", marginBottom:4 }}>{viewAsset.nome}</div>
            <div style={{ marginBottom:20 }}>
              <span style={{ padding:"4px 12px", borderRadius:99, fontSize:13, fontWeight:600, background:STATUS_BG[viewAsset.status]+"44", color:STATUS_COLORS[viewAsset.status], border:`1px solid ${STATUS_COLORS[viewAsset.status]}44` }}>{viewAsset.status}</span>
            </div>
            {[
              ["Tipo", viewAsset.tipo], ["Fabricante", viewAsset.fabricante], ["Modelo", viewAsset.modelo],
              ["Patrimônio", viewAsset.patrimonio], ["Localização", viewAsset.localizacao], ["Responsável", viewAsset.responsavel],
              ["Data de Compra", formatDate(viewAsset.dataCompra)], ["Garantia Até", formatDate(viewAsset.garantiaAte)],
            ].map(([k, v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${G.border}` }}>
                <span style={{ color:G.muted, fontSize:13 }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:500, color:"white", textAlign:"right" }}>{v||"—"}</span>
              </div>
            ))}
            {viewAsset.observacoes && (
              <div style={{ marginTop:16, padding:14, background:"rgba(14,165,233,0.07)", borderRadius:10, fontSize:13, color:G.text }}>
                <div style={{ color:G.muted, fontSize:11, marginBottom:6, textTransform:"uppercase", letterSpacing:.8 }}>Observações</div>
                {viewAsset.observacoes}
              </div>
            )}
            <div style={{ display:"flex", gap:10, marginTop:24 }}>
              <button onClick={() => { setEditAsset(viewAsset); setViewAsset(null); setShowForm(true); }} style={{ flex:1, padding:"10px", background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:10, fontWeight:600, fontSize:14 }}>
                Editar
              </button>
              <button onClick={() => setDeleteConfirm(viewAsset)} style={{ padding:"10px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:G.danger, borderRadius:10 }}>{icons.trash}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:32, width:380, textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🗑️</div>
            <div style={{ fontFamily:"'Space Grotesk'", fontSize:18, fontWeight:700, marginBottom:8 }}>Confirmar exclusão</div>
            <div style={{ color:G.muted, fontSize:14, marginBottom:24 }}>Deseja remover <strong style={{color:"white"}}>{deleteConfirm.nome}</strong>? Esta ação não pode ser desfeita.</div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex:1, padding:12, background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:10, fontSize:14 }}>Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} style={{ flex:1, padding:12, background:G.danger, border:"none", color:"white", borderRadius:10, fontSize:14, fontWeight:600 }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ASSET FORM ───────────────────────────────────────────────────────────────
function AssetForm({ asset, onSave, onClose, companies, isMaster, session }) {
  const [form, setForm] = useState(asset || { tipo:"Notebook", nome:"", fabricante:"", modelo:"", patrimonio:"", localizacao:"", responsavel:"", status:"Ativo", dataCompra:"", garantiaAte:"", observacoes:"", companyId: isMaster ? companies[0]?.id : session.companyId });
  const set = k => v => setForm(p => ({ ...p, [k]: v.target ? v.target.value : v });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:20, width:620, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 80px rgba(0,0,0,0.6)" }} className="fade-in">
        <div style={{ padding:"20px 28px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"'Space Grotesk'", fontWeight:700, fontSize:18 }}>{asset ? "Editar Ativo" : "Novo Ativo"}</div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:8, padding:6 }}>{icons.close}</button>
        </div>
        <div style={{ padding:28 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {isMaster && (
              <div style={{ gridColumn:"1/-1" }}>
                <label>Empresa</label>
                <select value={form.companyId} onChange={set("companyId")}>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
                </select>
              </div>
            )}
            <div>
              <label>Tipo / Categoria *</label>
              <select value={form.tipo} onChange={set("tipo")}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <label>Status *</label>
              <select value={form.status} onChange={set("status")}>{STATUS_LIST.map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label>Nome do Ativo *</label>
              <input value={form.nome} onChange={set("nome")} placeholder="Ex: Notebook Dell Latitude 5520" />
            </div>
            <div>
              <label>Fabricante</label>
              <input value={form.fabricante} onChange={set("fabricante")} placeholder="Dell, HP, Lenovo..." />
            </div>
            <div>
              <label>Modelo</label>
              <input value={form.modelo} onChange={set("modelo")} placeholder="Modelo específico" />
            </div>
            <div>
              <label>Nº Patrimônio</label>
              <input value={form.patrimonio} onChange={set("patrimonio")} placeholder="NB-001" />
            </div>
            <div>
              <label>Localização</label>
              <input value={form.localizacao} onChange={set("localizacao")} placeholder="Sala, andar, setor..." />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label>Responsável</label>
              <input value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do responsável" />
            </div>
            <div>
              <label>Data de Compra</label>
              <input type="date" value={form.dataCompra} onChange={set("dataCompra")} />
            </div>
            <div>
              <label>Garantia Até</label>
              <input type="date" value={form.garantiaAte} onChange={set("garantiaAte")} />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label>Observações</label>
              <textarea value={form.observacoes} onChange={set("observacoes")} rows={3} placeholder="Informações adicionais..." style={{ resize:"vertical" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:24 }}>
            <button onClick={onClose} style={{ flex:1, padding:12, background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:10, fontSize:14 }}>Cancelar</button>
            <button onClick={() => { if (!form.nome) return; onSave(form); }} style={{ flex:2, padding:12, background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:10, fontSize:14, fontWeight:700 }}>
              {asset ? "Salvar Alterações" : "Cadastrar Ativo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPANIES ────────────────────────────────────────────────────────────────
function Companies({ companies, setCompanies, users, assets, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [editComp, setEditComp] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSave = (data) => {
    if (editComp) { setCompanies(p => p.map(c => c.id === editComp.id ? { ...editComp, ...data } : c)); notify("Empresa atualizada!"); }
    else { setCompanies(p => [...p, { ...data, id: genId(), createdAt: new Date().toISOString().slice(0,10) }]); notify("Empresa cadastrada!"); }
    setShowForm(false); setEditComp(null);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Space Grotesk'", fontSize:26, fontWeight:700, color:"white", marginBottom:4 }}>Empresas</h1>
          <p style={{ color:G.muted, fontSize:14 }}>{companies.length} empresa(s) cadastrada(s)</p>
        </div>
        <button onClick={() => { setEditComp(null); setShowForm(true); }} style={{ display:"flex", alignItems:"center", gap:6, background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:10, padding:"9px 16px", fontSize:13, fontWeight:600 }}>
          {icons.plus} Nova Empresa
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
        {companies.map(c => {
          const cUsers = users.filter(u => u.companyId === c.id);
          const cAssets = assets.filter(a => a.companyId === c.id);
          return (
            <div key={c.id} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:24, borderTop:`3px solid ${G.accent}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:"'Space Grotesk'", fontSize:17, fontWeight:700, color:"white" }}>{c.nomeFantasia}</div>
                  <div style={{ fontSize:13, color:G.muted }}>{c.razaoSocial}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => { setEditComp(c); setShowForm(true); }} style={{ padding:"6px 8px", borderRadius:8, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:G.warning }}>{icons.edit}</button>
                  <button onClick={() => setDeleteConfirm(c)} style={{ padding:"6px 8px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:G.danger }}>{icons.trash}</button>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[["CNPJ", c.cnpj],["Tel", c.telefone],["E-mail", c.email],["Responsável", c.responsavel]].map(([k,v]) => (
                  <div key={k} style={{ fontSize:12 }}>
                    <div style={{ color:G.muted }}>{k}</div>
                    <div style={{ color:G.text, fontWeight:500, wordBreak:"break-all" }}>{v||"—"}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1, padding:"10px 12px", background:"rgba(14,165,233,0.08)", borderRadius:10, textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:700, color:G.accent, fontFamily:"'Space Grotesk'" }}>{cAssets.length}</div>
                  <div style={{ fontSize:11, color:G.muted }}>Ativos</div>
                </div>
                <div style={{ flex:1, padding:"10px 12px", background:"rgba(167,139,250,0.08)", borderRadius:10, textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:700, color:"#a78bfa", fontFamily:"'Space Grotesk'" }}>{cUsers.length}</div>
                  <div style={{ fontSize:11, color:G.muted }}>Usuários</div>
                </div>
                <div style={{ flex:1, padding:"10px 12px", background:"rgba(34,197,94,0.08)", borderRadius:10, textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:700, color:G.success, fontFamily:"'Space Grotesk'" }}>{cAssets.filter(a=>a.status==="Ativo").length}</div>
                  <div style={{ fontSize:11, color:G.muted }}>Em Uso</div>
                </div>
              </div>
              <div style={{ marginTop:12, fontSize:11, color:G.muted }}>Cadastrada em {formatDate(c.createdAt)}</div>
            </div>
          );
        })}
      </div>

      {showForm && <CompanyForm company={editComp} onSave={handleSave} onClose={() => { setShowForm(false); setEditComp(null); }} />}
      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:32, width:380, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏢</div>
            <div style={{ fontFamily:"'Space Grotesk'", fontSize:18, fontWeight:700, marginBottom:8 }}>Excluir empresa?</div>
            <div style={{ color:G.muted, fontSize:14, marginBottom:24 }}>Remover <strong style={{color:"white"}}>{deleteConfirm.nomeFantasia}</strong>?</div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex:1, padding:12, background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:10 }}>Cancelar</button>
              <button onClick={() => { setCompanies(p => p.filter(c => c.id !== deleteConfirm.id)); setDeleteConfirm(null); notify("Empresa removida.", "warning"); }} style={{ flex:1, padding:12, background:G.danger, border:"none", color:"white", borderRadius:10, fontWeight:600 }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPANY FORM ─────────────────────────────────────────────────────────────
function CompanyForm({ company, onSave, onClose }) {
  const [form, setForm] = useState(company || { razaoSocial:"", nomeFantasia:"", cnpj:"", endereco:"", cidade:"", estado:"", cep:"", telefone:"", email:"", responsavel:"" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const fields = [
    ["razaoSocial","Razão Social *","text","1/-1"],["nomeFantasia","Nome Fantasia *","text",""],
    ["cnpj","CNPJ *","text",""],["responsavel","Responsável","text",""],
    ["telefone","Telefone","text",""],["email","E-mail","email",""],
    ["endereco","Endereço","text","1/-1"],
    ["cidade","Cidade","text",""],["estado","Estado","text",""],["cep","CEP","text",""],
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:20, width:580, maxHeight:"90vh", overflowY:"auto" }} className="fade-in">
        <div style={{ padding:"20px 28px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"'Space Grotesk'", fontWeight:700, fontSize:18 }}>{company ? "Editar Empresa" : "Nova Empresa"}</div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:8, padding:6 }}>{icons.close}</button>
        </div>
        <div style={{ padding:28 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {fields.map(([k, label, type, col]) => (
              <div key={k} style={{ gridColumn: col || "auto" }}>
                <label>{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:12, marginTop:24 }}>
            <button onClick={onClose} style={{ flex:1, padding:12, background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:10 }}>Cancelar</button>
            <button onClick={() => { if (!form.razaoSocial || !form.nomeFantasia || !form.cnpj) return; onSave(form); }} style={{ flex:2, padding:12, background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:10, fontWeight:700 }}>
              {company ? "Salvar Alterações" : "Cadastrar Empresa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function Users({ users, setUsers, companies, session, isMaster, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSave = (data) => {
    if (editUser) { setUsers(p => p.map(u => u.id === editUser.id ? { ...editUser, ...data } : u)); notify("Usuário atualizado!"); }
    else { setUsers(p => [...p, { ...data, id: genId() }]); notify("Usuário cadastrado!"); }
    setShowForm(false); setEditUser(null);
  };

  const ROLE_COLOR = { admin: "#a78bfa", user: G.muted, master: G.accent };
  const ROLE_LABEL = { admin: "Admin", user: "Usuário", master: "Master" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Space Grotesk'", fontSize:26, fontWeight:700, color:"white", marginBottom:4 }}>Usuários</h1>
          <p style={{ color:G.muted, fontSize:14 }}>{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} style={{ display:"flex", alignItems:"center", gap:6, background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:10, padding:"9px 16px", fontSize:13, fontWeight:600 }}>
          {icons.plus} Novo Usuário
        </button>
      </div>

      <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#1e2d45", borderBottom:`1px solid ${G.border}` }}>
              {["Usuário","E-mail","Perfil","Empresa","Ações"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const co = companies.find(c => c.id === u.companyId);
              return (
                <tr key={u.id} className="hovrow" style={{ borderBottom:`1px solid ${G.border}22` }}>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${G.accent},#6366f1)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, flexShrink:0 }}>{u.name[0]}</div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13, color:G.muted }}>{u.email}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:ROLE_COLOR[u.role]||G.muted }}>
                      {icons.shield} {ROLE_LABEL[u.role]||u.role}
                    </span>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13 }}>{co?.nomeFantasia||"—"}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => { setEditUser(u); setShowForm(true); }} style={{ padding:"5px 8px", borderRadius:7, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:G.warning }}>{icons.edit}</button>
                      <button onClick={() => setDeleteConfirm(u)} disabled={u.id === session.id} style={{ padding:"5px 8px", borderRadius:7, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:u.id===session.id?"#333":G.danger, opacity:u.id===session.id?0.4:1 }}>{icons.trash}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && <UserForm user={editUser} onSave={handleSave} onClose={() => { setShowForm(false); setEditUser(null); }} companies={companies} isMaster={isMaster} session={session} />}
      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, padding:32, width:360, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
            <div style={{ fontFamily:"'Space Grotesk'", fontSize:18, fontWeight:700, marginBottom:8 }}>Excluir usuário?</div>
            <div style={{ color:G.muted, fontSize:14, marginBottom:24 }}>Remover <strong style={{color:"white"}}>{deleteConfirm.name}</strong>?</div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex:1, padding:12, background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:10 }}>Cancelar</button>
              <button onClick={() => { setUsers(p => p.filter(u => u.id !== deleteConfirm.id)); setDeleteConfirm(null); notify("Usuário removido.", "warning"); }} style={{ flex:1, padding:12, background:G.danger, border:"none", color:"white", borderRadius:10, fontWeight:600 }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── USER FORM ────────────────────────────────────────────────────────────────
function UserForm({ user, onSave, onClose, companies, isMaster, session }) {
  const [form, setForm] = useState(user || { name:"", email:"", password:"", role:"user", companyId: isMaster ? companies[0]?.id : session.companyId });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const roles = isMaster ? [["user","Usuário Padrão"],["admin","Admin da Empresa"]] : [["user","Usuário Padrão"],["admin","Admin da Empresa"]];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:20, width:460, maxHeight:"90vh", overflowY:"auto" }} className="fade-in">
        <div style={{ padding:"20px 28px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"'Space Grotesk'", fontWeight:700, fontSize:18 }}>{user ? "Editar Usuário" : "Novo Usuário"}</div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:8, padding:6 }}>{icons.close}</button>
        </div>
        <div style={{ padding:28 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div><label>Nome completo *</label><input value={form.name} onChange={set("name")} placeholder="Nome do usuário" /></div>
            <div><label>E-mail *</label><input type="email" value={form.email} onChange={set("email")} placeholder="usuario@empresa.com.br" /></div>
            <div><label>{user ? "Nova senha (deixe em branco p/ manter)" : "Senha *"}</label><input type="password" value={form.password} onChange={set("password")} /></div>
            <div>
              <label>Perfil de Acesso</label>
              <select value={form.role} onChange={set("role")}>
                {roles.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {isMaster && (
              <div>
                <label>Empresa</label>
                <select value={form.companyId} onChange={set("companyId")}>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:12, marginTop:24 }}>
            <button onClick={onClose} style={{ flex:1, padding:12, background:"none", border:`1px solid ${G.border}`, color:G.muted, borderRadius:10 }}>Cancelar</button>
            <button onClick={() => { if (!form.name || !form.email) return; onSave(form); }} style={{ flex:2, padding:12, background:`linear-gradient(135deg,${G.accent},#6366f1)`, border:"none", color:"white", borderRadius:10, fontWeight:700 }}>
              {user ? "Salvar Alterações" : "Criar Usuário"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
