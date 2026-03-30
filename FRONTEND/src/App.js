import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "";

export default function App() {
  const [items,   setItems]   = useState([]);
  const [name,    setName]    = useState("");
  const [desc,    setDesc]    = useState("");
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(false);

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
      setStatus({ ok: true, message: "Item created" });
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
    } catch {
      setStatus({ ok: false, message: "Delete failed" });
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>DevOps Demo App</h1>
        <span style={styles.badge}>React · Node.js · PostgreSQL · K8s</span>
      </header>
      <main style={styles.main}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Add Item</h2>
          <form onSubmit={createItem} style={styles.form}>
            <input style={styles.input} placeholder="Name *"
              value={name} onChange={e => setName(e.target.value)} required />
            <input style={styles.input} placeholder="Description"
              value={desc} onChange={e => setDesc(e.target.value)} />
            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add Item"}
            </button>
          </form>
          {status && (
            <p style={{...styles.status, color: status.ok ? "#16a34a" : "#dc2626"}}>
              {status.message}
            </p>
          )}
        </section>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Items ({items.length})</h2>
          {items.length === 0
            ? <p style={styles.empty}>No items yet — add one above.</p>
            : <ul style={styles.list}>
                {items.map(item => (
                  <li key={item.id} style={styles.listItem}>
                    <div>
                      <strong>{item.name}</strong>
                      {item.description && <span style={styles.desc}> — {item.description}</span>}
                      <span style={styles.timestamp}>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <button style={styles.deleteBtn} onClick={() => deleteItem(item.id)}>✕</button>
                  </li>
                ))}
              </ul>
          }
        </section>
      </main>
    </div>
  );
}

const styles = {
  page:        { fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#f8fafc", color:"#1e293b" },
  header:      { background:"#0f172a", color:"#fff", padding:"1.5rem 2rem", display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" },
  title:       { margin:0, fontSize:"1.5rem", fontWeight:700 },
  badge:       { background:"#1e293b", color:"#94a3b8", padding:"0.25rem 0.75rem", borderRadius:"999px", fontSize:"0.75rem" },
  main:        { maxWidth:720, margin:"2rem auto", padding:"0 1rem", display:"flex", flexDirection:"column", gap:"1.5rem" },
  card:        { background:"#fff", borderRadius:12, padding:"1.5rem", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" },
  sectionTitle:{ margin:"0 0 1rem", fontSize:"1rem", fontWeight:600, color:"#475569" },
  form:        { display:"flex", gap:"0.75rem", flexWrap:"wrap" },
  input:       { flex:1, minWidth:180, padding:"0.6rem 0.85rem", border:"1px solid #e2e8f0", borderRadius:8, fontSize:"0.95rem" },
  btn:         { padding:"0.6rem 1.25rem", background:"#2563eb", color:"#fff", border:"none", borderRadius:8, fontWeight:600, cursor:"pointer" },
  status:      { marginTop:"0.75rem", fontSize:"0.875rem" },
  list:        { listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"0.5rem" },
  listItem:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.75rem 1rem", background:"#f8fafc", borderRadius:8, fontSize:"0.9rem" },
  desc:        { color:"#64748b" },
  timestamp:   { display:"block", fontSize:"0.75rem", color:"#94a3b8", marginTop:"0.2rem" },
  deleteBtn:   { background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:"1rem", padding:"0.25rem 0.5rem", borderRadius:4 },
  empty:       { color:"#94a3b8", fontSize:"0.9rem" },
};
