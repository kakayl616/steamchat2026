import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/auth";
import { Shield, Search, Plus, X, ChevronLeft, Loader2 } from "lucide-react";

interface SteamProfile {
  steamId: string;
  displayName: string;
  avatar: string;
  profileUrl: string;
  level: number;
  gamesCount: number;
  accountCreated: number;
}

export default function NewCasePage() {
  const [, setLocation] = useLocation();
  const [steamIdInput, setSteamIdInput] = useState("");
  const [profile, setProfile] = useState<SteamProfile | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);

  const [tidioKey, setTidioKey] = useState("");
  const [reports, setReports] = useState<string[]>([""]);
  const [violations, setViolations] = useState<string[]>([""]);
  const [appealSteps, setAppealSteps] = useState<string[]>([
    "Review your account activity in the last 30 days.",
    "Gather any evidence that supports your case.",
    "Submit an appeal using the form below.",
    "Wait for a response from the support team within 3-5 business days.",
  ]);

  useEffect(() => {
    if (!isAuthenticated()) setLocation("/");
  }, []);

  async function fetchSteamProfile() {
    if (!steamIdInput.trim()) return;
    setFetchError("");
    setFetchLoading(true);
    setProfile(null);
    try {
      const res = await fetch(`/api/steam/profile?steamId=${encodeURIComponent(steamIdInput.trim())}`);
      const data = await res.json() as any;
      if (!res.ok) { setFetchError(data.error ?? "Failed to fetch profile"); return; }
      setProfile(data);
    } catch {
      setFetchError("Network error. Check your connection.");
    } finally {
      setFetchLoading(false);
    }
  }

  const createCase = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      const res = await api.cases.$post({
        json: {
          ...profile,
          tidioKey,
          reports: reports.filter(r => r.trim()),
          violations: violations.filter(v => v.trim()),
          appealSteps: appealSteps.filter(s => s.trim()),
        },
      });
      return (await res.json()) as { case: any };
    },
    onSuccess: (data) => {
      setLocation(`/dashboard/case/${data.case.id}?created=1`);
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

  return (
    <div style={{ minHeight: "100vh", background: "#1b2838" }}>
      {/* Top nav */}
      <div style={{ background: "#171a21", borderBottom: "1px solid #3d5a73", padding: "0 24px", height: 52, display: "flex", alignItems: "center", gap: 12 }}>
        <Shield size={18} color="#66c0f4" />
        <span style={{ color: "#c6d4df", fontSize: 14, fontWeight: "bold", letterSpacing: "0.05em" }}>STEAMPANEL</span>
        <span style={{ color: "#3d5a73", fontSize: 12 }}>/ New Case</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <Link to="/dashboard">
          <button style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ChevronLeft size={15} /> Back to Dashboard
          </button>
        </Link>

        <h1 style={{ color: "#c6d4df", fontSize: 22, fontWeight: "bold", marginBottom: 24 }}>Create New Support Case</h1>

        {/* Step 1: Steam Lookup */}
        <div className="steam-card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
            1. Fetch Steam Profile
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={steamIdInput}
              onChange={e => setSteamIdInput(e.target.value)}
              placeholder="Enter Steam ID (e.g. 76561198000000000)"
              style={{ flex: 1 }}
              onKeyDown={e => e.key === "Enter" && fetchSteamProfile()}
            />
            <button onClick={fetchSteamProfile} className="btn-steam" disabled={fetchLoading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {fetchLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {fetchLoading ? "Fetching..." : "Lookup"}
            </button>
          </div>
          <p style={{ color: "#556672", fontSize: 11, marginTop: 6 }}>
            Supports SteamID64 (17-digit number). Find it at steamidfinder.com
          </p>

          {fetchError && (
            <div style={{ background: "#3a1a1a", border: "1px solid #6b2222", color: "#c94040", fontSize: 12, padding: "8px 12px", borderRadius: 3, marginTop: 10 }}>
              {fetchError}
            </div>
          )}

          {profile && (
            <div style={{ marginTop: 14, padding: "14px", background: "#0e1924", borderRadius: 3, border: "1px solid #3d5a73", display: "flex", gap: 14, alignItems: "center" }}>
              <img src={profile.avatar} alt="" style={{ width: 52, height: 52, borderRadius: 3, border: "2px solid #3d5a73" }} />
              <div>
                <div style={{ color: "#c6d4df", fontWeight: "bold", fontSize: 16 }}>{profile.displayName}</div>
                <div style={{ color: "#8f98a0", fontSize: 12, marginTop: 2 }}>
                  Level {profile.level} · {profile.gamesCount} games · SteamID: {profile.steamId}
                </div>
                <div style={{ color: "#a4d007", fontSize: 11, marginTop: 2 }}>✓ Profile found</div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Tidio Key */}
        <div className="steam-card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
            2. Tidio Chat Key
          </h2>
          <input
            value={tidioKey}
            onChange={e => setTidioKey(e.target.value)}
            placeholder="Paste your Tidio Public Key here"
            className="w-full"
          />
          <p style={{ color: "#556672", fontSize: 11, marginTop: 6 }}>
            Found in Tidio dashboard → Settings → Developer → Public Key. Each case gets its own isolated chat session via visitor identification.
          </p>
        </div>

        {/* Step 3: Reports */}
        <div className="steam-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              3. Reports Submitted
            </h2>
            <button onClick={() => addItem(setReports)} style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <Plus size={13} /> Add
            </button>
          </div>
          {reports.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input value={r} onChange={e => updateItem(setReports, i, e.target.value)} placeholder={`Report #${i + 1}`} style={{ flex: 1 }} />
              {reports.length > 1 && (
                <button onClick={() => removeItem(setReports, i)} style={{ background: "none", border: "none", color: "#c94040", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Step 4: Violations */}
        <div className="steam-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              4. Violations / Bans
            </h2>
            <button onClick={() => addItem(setViolations)} style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <Plus size={13} /> Add
            </button>
          </div>
          {violations.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input value={v} onChange={e => updateItem(setViolations, i, e.target.value)} placeholder={`Violation #${i + 1} (e.g. "VAC Ban — CS2 — 2024-01-15")`} style={{ flex: 1 }} />
              {violations.length > 1 && (
                <button onClick={() => removeItem(setViolations, i)} style={{ background: "none", border: "none", color: "#c94040", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Step 5: Appeal Steps */}
        <div className="steam-card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              5. Appeal / Recovery Steps
            </h2>
            <button onClick={() => addItem(setAppealSteps)} style={{ background: "none", border: "none", color: "#66c0f4", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <Plus size={13} /> Add Step
            </button>
          </div>
          {appealSteps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <div style={{ minWidth: 22, height: 22, background: "#2a475e", border: "1px solid #3d5a73", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#66c0f4", fontSize: 11, fontWeight: "bold", flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <textarea
                value={s}
                onChange={e => updateItem(setAppealSteps, i, e.target.value)}
                placeholder={`Step ${i + 1}`}
                rows={2}
                style={{ flex: 1, resize: "vertical" }}
              />
              {appealSteps.length > 1 && (
                <button onClick={() => removeItem(setAppealSteps, i)} style={{ background: "none", border: "none", color: "#c94040", cursor: "pointer", marginTop: 4 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link to="/dashboard">
            <button className="btn-steam">Cancel</button>
          </Link>
          <button
            className="btn-green"
            disabled={!profile || createCase.isPending}
            onClick={() => createCase.mutate()}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {createCase.isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Generate Support Page"}
          </button>
        </div>

        {createCase.isError && (
          <div style={{ background: "#3a1a1a", border: "1px solid #6b2222", color: "#c94040", fontSize: 12, padding: "8px 12px", borderRadius: 3, marginTop: 12, textAlign: "right" }}>
            Failed to create case. Try again.
          </div>
        )}
      </div>
    </div>
  );
}
