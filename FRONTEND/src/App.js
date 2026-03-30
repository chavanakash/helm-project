import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "";

function Calculator({ onClose }) {
  const [display, setDisplay] = useState("0");
  const [expr,    setExpr]    = useState("");
  const [fresh,   setFresh]   = useState(true);

  function pressDigit(d) {
    if (fresh) { setDisplay(d); setFresh(false); }
    else setDisplay(prev => prev === "0" ? d : prev + d);
  }

  function pressOp(op) {
    setExpr(display + " " + op + " ");
    setFresh(true);
  }

  function pressDot() {
    if (fresh) { setDisplay("0."); setFresh(false); return; }
    if (!display.includes(".")) setDisplay(prev => prev + ".");
  }

  function calculate() {
    try {
      const full = expr + display;
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + full + ')')();
      setDisplay(String(parseFloat(result.toFixed(10))));
      setExpr("");
      setFresh(true);
    } catch {
      setDisplay("Error");
      setExpr("");
      setFresh(true);
    }
  }

  function clear() { setDisplay("0"); setExpr(""); setFresh(true); }

  function toggleSign() { setDisplay(prev => prev.startsWith("-") ? prev.slice(1) : "-" + prev); }

  function percent() { setDisplay(prev => String(parseFloat(prev) / 100)); }

  const btn = (label, onClick, type = "default") => (
    <button key={label} style={{...calcStyles.btn, ...calcStyles["btn_" + type]}} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <div style={calcStyles.overlay} onClick={onClose}>
      <div style={calcStyles.calc} onClick={e => e.stopPropagation()}>
        <div style={calcStyles.calcHeader}>
          <span style={calcStyles.calcTitle}>🧮 Calculator</span>
          <button style={calcStyles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={calcStyles.screen}>
          <div style={calcStyles.exprLine}>{expr || " "}</div>
          <div style={calcStyles.displayLine}>{display}</div>
        </div>
        <div style={calcStyles.grid}>
          {btn("AC",  clear,       "fn")}
          {btn("+/-", toggleSign,  "fn")}
          {btn("%",   percent,     "fn")}
          {btn("÷",   () => pressOp("/"),  "op")}

          {btn("7", () => pressDigit("7"))}
          {btn("8", () => pressDigit("8"))}
          {btn("9", () => pressDigit("9"))}
          {btn("×", () => pressOp("*"),  "op")}

          {btn("4", () => pressDigit("4"))}
          {btn("5", () => pressDigit("5"))}
          {btn("6", () => pressDigit("6"))}
          {btn("−", () => pressOp("-"),  "op")}

          {btn("1", () => pressDigit("1"))}
          {btn("2", () => pressDigit("2"))}
          {btn("3", () => pressDigit("3"))}
          {btn("+", () => pressOp("+"),  "op")}

          {btn("0", () => pressDigit("0"), "zero")}
          {btn(".", pressDot)}
          {btn("=", calculate, "eq")}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [items,      setItems]      = useState([]);
  const [name,       setName]       = useState("");
  const [desc,       setDesc]       = useState("");
  const [status,     setStatus]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showCalc,   setShowCalc]   = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/items`);
      const data = await res.json();
      setItems(data);
    } catch {
      setStatus({ ok: false, message: "Could not reach backend" });
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    if (status) {
      const t = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  async function createItem(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      setName(""); setDesc("");
      setStatus({ ok: true, message: "Item created successfully!" });
      await fetchItems();
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id) {
    try {
      await fetch(`${API}/api/items/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(i => i.id !== id));
      setStatus({ ok: true, message: "Item deleted" });
    } catch {
      setStatus({ ok: false, message: "Delete failed" });
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoWrap}>
            <span style={styles.logoIcon}>⚙️</span>
            <h1 style={styles.title}>DevOps Demo App</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.badges}>
              {["React", "Node.js", "PostgreSQL", "Kubernetes"].map(b => (
                <span key={b} style={styles.badge}>{b}</span>
              ))}
            </div>
            <button style={styles.calcIconBtn} onClick={() => setShowCalc(true)} title="Open Calculator">
              🧮
            </button>
          </div>
        </div>
      </header>

      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}

      <main style={styles.main}>
        {status && (
          <div style={{...styles.toast, background: status.ok ? "#dcfce7" : "#fee2e2", borderColor: status.ok ? "#16a34a" : "#dc2626", color: status.ok ? "#15803d" : "#b91c1c"}}>
            <span>{status.ok ? "✓" : "✕"}</span> {status.message}
          </div>
        )}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>➕</span> Add New Item
          </h2>
          <form onSubmit={createItem} style={styles.form}>
            <div style={styles.inputWrap}>
              <label style={styles.label}>Name <span style={styles.required}>*</span></label>
              <input style={styles.input} placeholder="Enter item name"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={styles.inputWrap}>
              <label style={styles.label}>Description</label>
              <input style={styles.input} placeholder="Optional description"
                value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <button style={{...styles.btn, ...(loading ? styles.btnDisabled : {})}} type="submit" disabled={loading}>
              {loading ? <span style={styles.spinner}>⟳</span> : "Add Item"}
            </button>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📋</span> Items
            </h2>
            <span style={styles.countBadge}>{items.length}</span>
          </div>
          {items.length === 0
            ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p style={styles.empty}>No items yet — add one above.</p>
              </div>
            )
            : (
              <ul style={styles.list}>
                {items.map((item, idx) => (
                  <li key={item.id} style={styles.listItem}>
                    <div style={styles.itemLeft}>
                      <div style={styles.itemIndex}>{idx + 1}</div>
                      <div>
                        <strong style={styles.itemName}>{item.name}</strong>
                        {item.description && <p style={styles.desc}>{item.description}</p>}
                        <span style={styles.timestamp}>
                          🕐 {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button style={styles.deleteBtn} onClick={() => deleteItem(item.id)} title="Delete item">
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )
          }
        </section>
      </main>

      <footer style={styles.footer}>
        Deployed on Kubernetes · Monitored with Grafana & Prometheus
      </footer>
    </div>
  );
}

const styles = {
  page:         { fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", minHeight:"100vh", background:"linear-gradient(135deg,#f0f4ff 0%,#fafafa 100%)", color:"#1e293b" },

  header:       { background:"linear-gradient(90deg,#0f172a 0%,#1e3a5f 100%)", color:"#fff", padding:"0", boxShadow:"0 2px 12px rgba(0,0,0,0.2)" },
  headerInner:  { maxWidth:800, margin:"0 auto", padding:"1.25rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" },
  logoWrap:     { display:"flex", alignItems:"center", gap:"0.6rem" },
  logoIcon:     { fontSize:"1.6rem" },
  title:        { margin:0, fontSize:"1.4rem", fontWeight:700, letterSpacing:"-0.3px" },
  headerRight:  { display:"flex", alignItems:"center", gap:"0.75rem" },
  badges:       { display:"flex", gap:"0.4rem", flexWrap:"wrap" },
  badge:        { background:"rgba(255,255,255,0.1)", color:"#cbd5e1", padding:"0.2rem 0.65rem", borderRadius:"999px", fontSize:"0.7rem", fontWeight:500, border:"1px solid rgba(255,255,255,0.15)" },
  calcIconBtn:  { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:10, fontSize:"1.3rem", cursor:"pointer", padding:"0.3rem 0.5rem", lineHeight:1, transition:"background 0.2s" },

  main:         { maxWidth:800, margin:"2rem auto", padding:"0 1rem", display:"flex", flexDirection:"column", gap:"1.25rem" },

  toast:        { padding:"0.75rem 1rem", borderRadius:10, border:"1px solid", fontSize:"0.875rem", fontWeight:500, display:"flex", alignItems:"center", gap:"0.5rem", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" },

  card:         { background:"#fff", borderRadius:14, padding:"1.5rem", boxShadow:"0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", border:"1px solid #f1f5f9" },
  sectionTitle: { margin:"0 0 1.25rem", fontSize:"0.95rem", fontWeight:700, color:"#334155", display:"flex", alignItems:"center", gap:"0.4rem" },
  sectionIcon:  { fontSize:"1rem" },

  form:         { display:"flex", gap:"1rem", flexWrap:"wrap", alignItems:"flex-end" },
  inputWrap:    { display:"flex", flexDirection:"column", gap:"0.3rem", flex:1, minWidth:180 },
  label:        { fontSize:"0.78rem", fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.4px" },
  required:     { color:"#ef4444" },
  input:        { padding:"0.65rem 0.9rem", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:"0.92rem", outline:"none", transition:"border-color 0.2s", background:"#f8fafc" },
  btn:          { padding:"0.65rem 1.5rem", background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", border:"none", borderRadius:9, fontWeight:600, cursor:"pointer", fontSize:"0.92rem", boxShadow:"0 2px 8px rgba(37,99,235,0.3)", whiteSpace:"nowrap" },
  btnDisabled:  { opacity:0.6, cursor:"not-allowed" },
  spinner:      { display:"inline-block" },

  listHeader:   { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" },
  countBadge:   { background:"#eff6ff", color:"#2563eb", padding:"0.2rem 0.7rem", borderRadius:"999px", fontSize:"0.78rem", fontWeight:700, border:"1px solid #bfdbfe" },

  list:         { listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"0.6rem" },
  listItem:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.85rem 1rem", background:"#f8fafc", borderRadius:10, fontSize:"0.9rem", border:"1px solid #f1f5f9" },
  itemLeft:     { display:"flex", alignItems:"flex-start", gap:"0.75rem" },
  itemIndex:    { background:"#e0e7ff", color:"#4338ca", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700, flexShrink:0, marginTop:2 },
  itemName:     { fontSize:"0.92rem", fontWeight:600, color:"#1e293b" },
  desc:         { color:"#64748b", fontSize:"0.82rem", margin:"0.2rem 0 0" },
  timestamp:    { display:"block", fontSize:"0.72rem", color:"#94a3b8", marginTop:"0.25rem" },
  deleteBtn:    { background:"none", border:"none", cursor:"pointer", fontSize:"1rem", padding:"0.3rem 0.5rem", borderRadius:6, opacity:0.5 },

  emptyState:   { textAlign:"center", padding:"2.5rem 1rem" },
  emptyIcon:    { fontSize:"2.5rem" },
  empty:        { color:"#94a3b8", fontSize:"0.9rem", marginTop:"0.5rem" },

  footer:       { textAlign:"center", padding:"1.5rem", fontSize:"0.75rem", color:"#94a3b8", marginTop:"1rem" },
};

const calcStyles = {
  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" },
  calc:        { background:"#1c1c1e", borderRadius:20, overflow:"hidden", width:280, boxShadow:"0 24px 60px rgba(0,0,0,0.5)" },
  calcHeader:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.85rem 1rem 0.5rem", background:"#1c1c1e" },
  calcTitle:   { color:"#fff", fontSize:"0.85rem", fontWeight:600 },
  closeBtn:    { background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:"50%", width:24, height:24, cursor:"pointer", fontSize:"0.75rem", display:"flex", alignItems:"center", justifyContent:"center" },
  screen:      { padding:"0.5rem 1.25rem 1rem", textAlign:"right" },
  exprLine:    { color:"#6b7280", fontSize:"0.85rem", minHeight:"1.2rem", marginBottom:"0.2rem" },
  displayLine: { color:"#fff", fontSize:"2.2rem", fontWeight:300, letterSpacing:"-1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  grid:        { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:"#3a3a3c", padding:1 },
  btn:         { padding:"1rem 0", fontSize:"1.1rem", fontWeight:400, border:"none", cursor:"pointer", background:"#2c2c2e", color:"#fff", transition:"filter 0.1s" },
  btn_fn:      { background:"#636366", color:"#fff" },
  btn_op:      { background:"#ff9f0a", color:"#fff", fontWeight:600 },
  btn_eq:      { background:"#ff9f0a", color:"#fff", fontWeight:600 },
  btn_zero:    { gridColumn:"span 2", textAlign:"left", paddingLeft:"1.4rem" },
};
