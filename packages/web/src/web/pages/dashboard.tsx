import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { isAuthenticated, logout } from "../lib/auth";
import { Shield, Plus, ExternalLink, Trash2, ToggleLeft, ToggleRight, LogOut, Copy, Check } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) setLocation("/");
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await api.cases.$get();
      return (await res.json()) as { cases: any[] };
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.cases[":id"].$patch({ param: { id }, json: { status } });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });

  const deleteCase = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.cases[":id"].$delete({ param: { id } });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });

  function copyUrl(id: string) {
    const url = `${window.location.origin}/case/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleLogout() {
    logout();
    setLocation("/");
  }

  const cases = data?.cases ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#1b2838" }}>
      {/* Top nav */}
      <div style={{ background: "#171a21", borderBottom: "1px solid #3d5a73", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={18} color="#66c0f4" />
          <span style={{ color: "#c6d4df", fontSize: 14, fontWeight: "bold", letterSpacing: "0.05em" }}>STEAMPANEL</span>
          <span style={{ color: "#3d5a73", fontSize: 12, marginLeft: 4 }}>/ Dashboard</span>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#8f98a0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <LogOut size={15} />
          Logout
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <h1 style={{ color: "#c6d4df", fontSize: 22, fontWeight: "bold", margin: 0 }}>Support Cases</h1>
            <p style={{ color: "#8f98a0", fontSize: 13, marginTop: 4 }}>
              {cases.length} case{cases.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link to="/dashboard/new">
            <button className="btn-green" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} />
              New Case
            </button>
          </Link>
        </div>

        {/* Cases table */}
        <div className="steam-card">
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "52px 1fr 120px 100px 180px", padding: "10px 16px", borderBottom: "1px solid #3d5a73", background: "#0e1924" }}>
            <div />
            <div style={{ color: "#8f98a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>User</div>
            <div style={{ color: "#8f98a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</div>
            <div style={{ color: "#8f98a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Created</div>
            <div style={{ color: "#8f98a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>Actions</div>
          </div>

          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8f98a0" }}>Loading cases...</div>
          ) : cases.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ color: "#8f98a0", marginBottom: 8 }}>No cases yet</p>
              <p style={{ color: "#556672", fontSize: 12 }}>Create your first support case to get started</p>
            </div>
          ) : (
            cases.map((c: any, i: number) => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "52px 1fr 120px 100px 180px", padding: "12px 16px", borderBottom: i < cases.length - 1 ? "1px solid #253444" : "none", alignItems: "center" }}>
                {/* Avatar */}
                <img src={c.avatar || "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"} alt="" style={{ width: 36, height: 36, borderRadius: 3, border: "1px solid #3d5a73" }} />

                {/* Name */}
                <div>
                  <div style={{ color: "#c6d4df", fontSize: 14, fontWeight: "bold" }}>{c.displayName}</div>
                  <div style={{ color: "#556672", fontSize: 11, marginTop: 2 }}>Steam ID: {c.steamId}</div>
                </div>

                {/* Status badge */}
                <div>
                  {c.status === "open" ? (
                    <span className="badge-open">Open</span>
                  ) : (
                    <span className="badge-closed">Closed</span>
                  )}
                </div>

                {/* Date */}
                <div style={{ color: "#8f98a0", fontSize: 12 }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {/* Copy URL */}
                  <button
                    onClick={() => copyUrl(c.id)}
                    title="Copy page URL"
                    style={{ background: "#2a475e", border: "1px solid #3d5a73", color: "#66c0f4", borderRadius: 3, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    {copiedId === c.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>

                  {/* Open page */}
                  <a href={`/case/${c.id}`} target="_blank" rel="noreferrer">
                    <button title="Open case page" style={{ background: "#2a475e", border: "1px solid #3d5a73", color: "#66c0f4", borderRadius: 3, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <ExternalLink size={13} />
                    </button>
                  </a>

                  {/* Edit */}
                  <Link to={`/dashboard/case/${c.id}`}>
                    <button title="Edit case" className="btn-steam" style={{ padding: "5px 10px", fontSize: 12 }}>Edit</button>
                  </Link>

                  {/* Toggle status */}
                  <button
                    title={c.status === "open" ? "Close page" : "Reopen page"}
                    onClick={() => toggleStatus.mutate({ id: c.id, status: c.status === "open" ? "closed" : "open" })}
                    style={{ background: c.status === "open" ? "#3a1a1a" : "#1a3a1a", border: `1px solid ${c.status === "open" ? "#6b2222" : "#4c6b22"}`, color: c.status === "open" ? "#c94040" : "#a4d007", borderRadius: 3, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    {c.status === "open" ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                  </button>

                  {/* Delete */}
                  <button
                    title="Delete case"
                    onClick={() => {
                      if (confirm(`Delete case for ${c.displayName}?`)) deleteCase.mutate(c.id);
                    }}
                    style={{ background: "#3a1a1a", border: "1px solid #6b2222", color: "#c94040", borderRadius: 3, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
