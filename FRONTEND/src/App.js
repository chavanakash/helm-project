import { useState, useEffect, useCallback, useRef } from "react";

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

function Weather({ onClose }) {
  const [city,    setCity]    = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function fetchWeather(e) {
    e?.preventDefault();
    const q = city.trim();
    if (!q) return;
    setLoading(true); setError(null); setWeather(null);
    try {
      const res  = await fetch(`https://wttr.in/${encodeURIComponent(q)}?format=j1`);
      if (!res.ok) throw new Error("City not found");
      const data = await res.json();
      const cur  = data.current_condition[0];
      const area = data.nearest_area[0];
      setWeather({
        city:      area.areaName[0].value,
        country:   area.country[0].value,
        temp:      cur.temp_C,
        feelsLike: cur.FeelsLikeC,
        humidity:  cur.humidity,
        wind:      cur.windspeedKmph,
        desc:      cur.weatherDesc[0].value,
        code:      parseInt(cur.weatherCode, 10),
        visibility:cur.visibility,
        pressure:  cur.pressure,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }
  

  function weatherEmoji(code) {
    if (code === 113) return "☀️";
    if (code === 116) return "⛅";
    if (code === 119 || code === 122) return "☁️";
    if ([143,248,260].includes(code)) return "🌫️";
    if ([176,263,266,293,296].includes(code)) return "🌦️";
    if ([299,302,305,308].includes(code)) return "🌧️";
    if ([311,314,317,350,377].includes(code)) return "🌨️";
    if ([320,323,326,329,332,335,338,368,371,374].includes(code)) return "❄️";
    if ([356,359,362,365].includes(code)) return "⛈️";
    if ([200,386,389,392,395].includes(code)) return "⛈️";
    return "🌡️";
  }

  return (
    <div style={calcStyles.overlay} onClick={onClose}>
      <div style={wxStyles.panel} onClick={e => e.stopPropagation()}>
        <div style={wxStyles.header}>
          <span style={wxStyles.title}>🌤️ Weather</span>
          <button style={calcStyles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={fetchWeather} style={wxStyles.searchRow}>
          <input ref={inputRef} style={wxStyles.input} placeholder="Enter city name…"
            value={city} onChange={e => setCity(e.target.value)} />
          <button style={wxStyles.searchBtn} type="submit" disabled={loading}>
            {loading ? "…" : "Search"}
          </button>
        </form>

        {error && <div style={wxStyles.error}>⚠️ {error}</div>}

        {weather && (
          <div style={wxStyles.body}>
            <div style={wxStyles.locationRow}>
              <span style={wxStyles.locationText}>{weather.city}, {weather.country}</span>
            </div>
            <div style={wxStyles.heroRow}>
              <span style={wxStyles.heroEmoji}>{weatherEmoji(weather.code)}</span>
              <span style={wxStyles.heroTemp}>{weather.temp}°C</span>
            </div>
            <div style={wxStyles.descText}>{weather.desc}</div>
            <div style={wxStyles.statsGrid}>
              {[
                ["🌡️ Feels like",  `${weather.feelsLike}°C`],
                ["💧 Humidity",    `${weather.humidity}%`],
                ["💨 Wind",        `${weather.wind} km/h`],
                ["👁️ Visibility",  `${weather.visibility} km`],
                ["🔵 Pressure",    `${weather.pressure} hPa`],
              ].map(([label, val]) => (
                <div key={label} style={wxStyles.statCard}>
                  <span style={wxStyles.statLabel}>{label}</span>
                  <span style={wxStyles.statVal}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!weather && !error && !loading && (
          <div style={wxStyles.placeholder}>
            <span style={{fontSize:"3rem"}}>🌍</span>
            <p style={{color:"#94a3b8", margin:"0.5rem 0 0", fontSize:"0.85rem"}}>Search a city to see weather</p>
          </div>
        )}
      </div>
    </div>
  );
}

const IPL_KEY_STORAGE = "cricapi_key";

function IPLScore({ onClose }) {
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem(IPL_KEY_STORAGE) || "");
  const [keyInput, setKeyInput] = useState("");
  const [matches,  setMatches]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const fetchMatches = useCallback(async (key) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`);
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.reason || "API error");
      const ipl = (data.data || []).filter(m =>
        /ipl|indian premier league/i.test(m.name + " " + (m.series_id || ""))
      );
      setMatches(ipl);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) fetchMatches(apiKey);
  }, [apiKey, fetchMatches]);

  function saveKey(e) {
    e.preventDefault();
    const k = keyInput.trim();
    if (!k) return;
    localStorage.setItem(IPL_KEY_STORAGE, k);
    setApiKey(k);
    setKeyInput("");
  }

  function clearKey() {
    localStorage.removeItem(IPL_KEY_STORAGE);
    setApiKey(""); setMatches([]); setError(null);
  }

  function statusColor(s = "") {
    if (/live|progress/i.test(s)) return "#22c55e";
    if (/complete|won/i.test(s))  return "#94a3b8";
    return "#f59e0b";
  }

  function statusLabel(s = "") {
    if (/live|progress/i.test(s)) return "🔴 LIVE";
    if (/complete|won/i.test(s))  return "✅ Completed";
    return "🕐 Upcoming";
  }

  return (
    <div style={calcStyles.overlay} onClick={onClose}>
      <div style={iplStyles.panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={iplStyles.header}>
          <div style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
            <span style={{fontSize:"1.1rem"}}>🏏</span>
            <span style={iplStyles.title}>IPL Live Scores</span>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
            {lastSync && <span style={iplStyles.syncText}>Updated {lastSync}</span>}
            {apiKey && (
              <button style={iplStyles.refreshBtn} onClick={() => fetchMatches(apiKey)} disabled={loading}>
                {loading ? "…" : "↻"}
              </button>
            )}
            <button style={calcStyles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* API key setup */}
        {!apiKey ? (
          <div style={iplStyles.setupBox}>
            <div style={{fontSize:"2.5rem", marginBottom:"0.75rem"}}>🔑</div>
            <p style={iplStyles.setupInfo}>
              Requires a free <strong>CricAPI</strong> key.<br/>
              Get one at <span style={{color:"#38bdf8"}}>cricapi.com</span> (100 calls/day free).
            </p>
            <form onSubmit={saveKey} style={{width:"100%", display:"flex", flexDirection:"column", gap:"0.5rem"}}>
              <input style={iplStyles.keyInput} placeholder="Paste your API key…"
                value={keyInput} onChange={e => setKeyInput(e.target.value)} autoFocus />
              <button style={iplStyles.saveBtn} type="submit">Save & Load Scores</button>
            </form>
          </div>
        ) : (
          <div style={iplStyles.body}>
            {error && (
              <div style={iplStyles.error}>
                ⚠️ {error}
                <button style={iplStyles.clearKeyBtn} onClick={clearKey}>Reset key</button>
              </div>
            )}

            {!loading && !error && matches.length === 0 && (
              <div style={iplStyles.empty}>
                <span style={{fontSize:"2.5rem"}}>😴</span>
                <p style={{color:"#94a3b8", marginTop:"0.5rem", fontSize:"0.85rem"}}>
                  No IPL matches found right now.
                </p>
                <button style={iplStyles.clearKeyBtn} onClick={clearKey}>Change key</button>
              </div>
            )}

            {matches.map(m => (
              <div key={m.id} style={iplStyles.matchCard}>
                <div style={iplStyles.matchTop}>
                  <span style={{...iplStyles.statusBadge, color: statusColor(m.status)}}>
                    {statusLabel(m.status)}
                  </span>
                  <span style={iplStyles.matchName}>{m.name}</span>
                </div>

                {(m.score || []).map((s, i) => (
                  <div key={i} style={iplStyles.scoreRow}>
                    <span style={iplStyles.teamName}>{s.inning?.replace(" Inning 1","").replace(" Inning 2"," (2nd)") || "—"}</span>
                    <span style={iplStyles.scoreVal}>
                      {s.r !== undefined ? `${s.r}/${s.w}` : "—"}
                      {s.o ? <span style={iplStyles.overs}> ({s.o} ov)</span> : null}
                    </span>
                  </div>
                ))}

                {m.status && (
                  <div style={iplStyles.matchStatus}>{m.status}</div>
                )}
              </div>
            ))}
          </div>
        )}
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
  const [showWeather,setShowWeather] = useState(false);
  const [showIPL,    setShowIPL]     = useState(false);

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
            <button style={styles.calcIconBtn} onClick={() => setShowIPL(true)} title="IPL Scores">
              🏏
            </button>
            <button style={styles.calcIconBtn} onClick={() => setShowWeather(true)} title="Open Weather">
              🌤️
            </button>
            <button style={styles.calcIconBtn} onClick={() => setShowCalc(true)} title="Open Calculator">
              🧮
            </button>
          </div>
        </div>
      </header>

      {showIPL     && <IPLScore onClose={() => setShowIPL(false)} />}
      {showWeather && <Weather onClose={() => setShowWeather(false)} />}
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

const wxStyles = {
  panel:       { background:"#0f172a", borderRadius:20, overflow:"hidden", width:340, boxShadow:"0 24px 60px rgba(0,0,0,0.5)", color:"#fff" },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.85rem 1rem 0.5rem", borderBottom:"1px solid rgba(255,255,255,0.08)" },
  title:       { color:"#fff", fontSize:"0.85rem", fontWeight:600 },
  searchRow:   { display:"flex", gap:"0.5rem", padding:"0.85rem 1rem" },
  input:       { flex:1, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:9, padding:"0.55rem 0.85rem", color:"#fff", fontSize:"0.88rem", outline:"none" },
  searchBtn:   { background:"#2563eb", border:"none", borderRadius:9, color:"#fff", padding:"0.55rem 1rem", cursor:"pointer", fontWeight:600, fontSize:"0.85rem" },
  error:       { padding:"0.6rem 1rem", color:"#fca5a5", fontSize:"0.82rem" },
  body:        { padding:"0.5rem 1rem 1.25rem" },
  locationRow: { marginBottom:"0.25rem" },
  locationText:{ fontSize:"0.82rem", color:"#94a3b8" },
  heroRow:     { display:"flex", alignItems:"center", gap:"0.75rem", margin:"0.5rem 0 0.25rem" },
  heroEmoji:   { fontSize:"3rem", lineHeight:1 },
  heroTemp:    { fontSize:"3rem", fontWeight:200, letterSpacing:"-2px" },
  descText:    { color:"#cbd5e1", fontSize:"0.88rem", marginBottom:"1rem" },
  statsGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" },
  statCard:    { background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"0.65rem 0.85rem", display:"flex", flexDirection:"column", gap:"0.2rem" },
  statLabel:   { fontSize:"0.72rem", color:"#64748b" },
  statVal:     { fontSize:"0.95rem", fontWeight:600 },
  placeholder: { display:"flex", flexDirection:"column", alignItems:"center", padding:"2rem 1rem" },
};

const iplStyles = {
  panel:        { background:"#0d1117", borderRadius:20, overflow:"hidden", width:380, maxHeight:"80vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 60px rgba(0,0,0,0.6)", color:"#fff" },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.85rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 },
  title:        { color:"#fff", fontSize:"0.9rem", fontWeight:700 },
  syncText:     { fontSize:"0.65rem", color:"#64748b" },
  refreshBtn:   { background:"rgba(255,255,255,0.08)", border:"none", color:"#94a3b8", borderRadius:6, padding:"0.2rem 0.5rem", cursor:"pointer", fontSize:"1rem" },
  body:         { overflowY:"auto", padding:"0.75rem", display:"flex", flexDirection:"column", gap:"0.6rem" },
  matchCard:    { background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"0.85rem 1rem", border:"1px solid rgba(255,255,255,0.07)" },
  matchTop:     { display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.6rem", flexWrap:"wrap" },
  statusBadge:  { fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.3px" },
  matchName:    { fontSize:"0.72rem", color:"#64748b", flex:1 },
  scoreRow:     { display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"0.25rem 0", borderTop:"1px solid rgba(255,255,255,0.05)" },
  teamName:     { fontSize:"0.82rem", color:"#cbd5e1", fontWeight:500, flex:1 },
  scoreVal:     { fontSize:"1rem", fontWeight:700, color:"#f1f5f9" },
  overs:        { fontSize:"0.72rem", color:"#64748b", fontWeight:400 },
  matchStatus:  { fontSize:"0.72rem", color:"#94a3b8", marginTop:"0.5rem", paddingTop:"0.4rem", borderTop:"1px solid rgba(255,255,255,0.05)" },
  setupBox:     { display:"flex", flexDirection:"column", alignItems:"center", padding:"1.75rem 1.25rem", gap:"0.5rem" },
  setupInfo:    { textAlign:"center", color:"#94a3b8", fontSize:"0.82rem", lineHeight:1.6, margin:0 },
  keyInput:     { background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:9, padding:"0.6rem 0.85rem", color:"#fff", fontSize:"0.85rem", outline:"none", width:"100%", boxSizing:"border-box" },
  saveBtn:      { background:"linear-gradient(135deg,#2563eb,#1d4ed8)", border:"none", borderRadius:9, color:"#fff", padding:"0.65rem", cursor:"pointer", fontWeight:600, fontSize:"0.88rem" },
  error:        { color:"#fca5a5", fontSize:"0.82rem", padding:"0.5rem 0", display:"flex", alignItems:"center", justifyContent:"space-between" },
  clearKeyBtn:  { background:"rgba(255,255,255,0.08)", border:"none", color:"#94a3b8", borderRadius:6, padding:"0.2rem 0.6rem", cursor:"pointer", fontSize:"0.75rem" },
  empty:        { display:"flex", flexDirection:"column", alignItems:"center", padding:"2rem 1rem" },
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
