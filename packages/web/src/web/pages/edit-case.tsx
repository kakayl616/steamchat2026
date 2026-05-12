import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/auth";
import { Shield, Plus, X, ChevronLeft, Loader2, ExternalLink, Check } from "lucide-react";

export default function EditCasePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [tidioKey, setTidioKey] = useState("");
  const [reports, setReports] = useState<string[]>([""]);
  const [violations, setViolations] = useState<string[]>([""]);
  const [appealSteps, setAppealSteps] = useState<string[]>([""]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) setLocation("/");
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const res = await api.cases[":id"].$get({ param: { id } });
      return (await res.json()) as { case: any };
    },
  });

  useEffect(() => {
    if (data?.case) {
      const c = data.case;
      setTidioKey(c.tidioKey ?? "");
      setReports(c.reports?.length ? c.reports : [""]);
      setViolations(c.violations?.length ? c.violations : [""]);
      setAppealSteps(c.appealSteps?.length ? c.appealSteps : [""]);
    }
  }, [data]);

  const updateCase = useMutation({
    mutationFn: async () => {
      const res = await api.cases[":id"].$patch({
        param: { id },
        json: {
          tidioKey,
          reports: reports.filter(r => r.trim()),
          violations: violations.filter(v => v.trim()),
          appealSteps: appealSteps.filter(s => s.trim()),
        },
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", id] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await api.cases[":id"].$patch({ param: { id }, json: { status } });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", id] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });

  function addItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter(prev => [...prev, ""]);
  }
  function updateItem(setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, val: string) {
    setter(prev => prev.map((v, i) => i === idx ? val : v));
  }
  function removeItem(setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) {
    setter(prev => prev.filter((_, i) => i !== idx));
  }

  const c = data?.case;

  return (
    <div style={{ minHeight: "100vh", background: "#1b2838" }}>
      <div style={{ background: "#171a21", borderBottom: "1px solid #3d5a73", padding: "0 24px", height: 52, display: "flex", alignItems: "center", gap: 12 }}>
        <Shield size={18} color="#66c0f4" />
        <span style={{ color: "#c6d4df", fontSize: 14, fontWeight: "bold", letterSpacing: "0.05em" }}>STEAMPANEL</span>
        <span style={{ color: "#3d5a73", fontSize: 12 }}>/ Edit Case</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <Link to="/dashboard">
          <button style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ChevronLeft size={15} /> Back to Dashboard
          </button>
        </Link>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#8f98a0" }}>Loading case...</div>
        ) : !c ? (
          <div style={{ textAlign: "center", padding: 60, color: "#c94040" }}>Case not found</div>
        ) : (
          <>
            {/* Profile summary */}
            <div className="steam-card" style={{ padding: 20, marginBottom: 20, display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <img src={c.avatar} alt="" style={{ width: 52, height: 52, borderRadius: 3, border: "2px solid #3d5a73" }} />
                <div>
                  <div style={{ color: "#c6d4df", fontWeight: "bold", fontSize: 16 }}>{c.displayName}</div>
                  <div style={{ color: "#8f98a0", fontSize: 12 }}>Level {c.level} · {c.gamesCount} games · {c.steamId}</div>
                  <div style={{ marginTop: 6 }}>
                    {c.status === "open" ? <span className="badge-open">Open</span> : <span className="badge-closed">Closed</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`/case/${c.id}`} target="_blank" rel="noreferrer">
                  <button className="btn-steam" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <ExternalLink size={13} /> View Page
                  </button>
                </a>
                <button
                  onClick={() => toggleStatus.mutate(c.status === "open" ? "closed" : "open")}
                  className={c.status === "open" ? "btn-danger" : "btn-green"}
                  style={{ fontSize: 12 }}
                  disabled={toggleStatus.isPending}
                >
                  {c.status === "open" ? "Close Page" : "Reopen Page"}
                </button>
              </div>
            </div>

            {/* Tidio Key */}
            <div className="steam-card" style={{ padding: 20, marginBottom: 20 }}>
              <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                Tidio Chat Key
              </h2>
              <input value={tidioKey} onChange={e => setTidioKey(e.target.value)} placeholder="Tidio Public Key" className="w-full" />
            </div>

            {/* Reports */}
            <div className="steam-card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Reports Submitted</h2>
                <button onClick={() => addItem(setReports)} style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Plus size={13} /> Add
                </button>
              </div>
              {reports.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input value={r} onChange={e => updateItem(setReports, i, e.target.value)} placeholder={`Report #${i + 1}`} style={{ flex: 1 }} />
                  {reports.length > 1 && <button onClick={() => removeItem(setReports, i)} style={{ background: "none", border: "none", color: "#c94040", cursor: "pointer" }}><X size={14} /></button>}
                </div>
              ))}
            </div>

            {/* Violations */}
            <div className="steam-card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Violations / Bans</h2>
                <button onClick={() => addItem(setViolations)} style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Plus size={13} /> Add
                </button>
              </div>
              {violations.map((v, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input value={v} onChange={e => updateItem(setViolations, i, e.target.value)} placeholder={`Violation #${i + 1}`} style={{ flex: 1 }} />
                  {violations.length > 1 && <button onClick={() => removeItem(setViolations, i)} style={{ background: "none", border: "none", color: "#c94040", cursor: "pointer" }}><X size={14} /></button>}
                </div>
              ))}
            </div>

            {/* Appeal Steps */}
            <div className="steam-card" style={{ padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Appeal / Recovery Steps</h2>
                <button onClick={() => addItem(setAppealSteps)} style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Plus size={13} /> Add Step
                </button>
              </div>
              {appealSteps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 22, height: 22, background: "#2a475e", border: "1px solid #3d5a73", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#66c0f4", fontSize: 11, fontWeight: "bold", flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </div>
                  <textarea value={s} onChange={e => updateItem(setAppealSteps, i, e.target.value)} placeholder={`Step ${i + 1}`} rows={2} style={{ flex: 1, resize: "vertical" }} />
                  {appealSteps.length > 1 && <button onClick={() => removeItem(setAppealSteps, i)} style={{ background: "none", border: "none", color: "#c94040", cursor: "pointer", marginTop: 4 }}><X size={14} /></button>}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
              {saved && (
                <span style={{ color: "#a4d007", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={14} /> Saved
                </span>
              )}
              <button className="btn-green" onClick={() => updateCase.mutate()} disabled={updateCase.isPending} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {updateCase.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
