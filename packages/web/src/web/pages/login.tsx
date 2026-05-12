import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { setAuth } from "../lib/auth";
import { Shield, Lock } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login.$post({ json: { code } });
      const data = await res.json();
      if (!res.ok) {
        setError((data as any).error ?? "Invalid invite code");
        return;
      }
      setAuth(true);
      setLocation("/dashboard");
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1b2838 0%, #0e1924 100%)" }}>
      {/* Steam-style top bar */}
      <div className="fixed top-0 left-0 right-0 h-12 flex items-center px-6" style={{ background: "#171a21", borderBottom: "1px solid #3d5a73" }}>
        <div className="flex items-center gap-2">
          <Shield size={18} color="#66c0f4" />
          <span style={{ color: "#c6d4df", fontSize: 14, fontWeight: "bold", letterSpacing: "0.05em" }}>STEAMPANEL</span>
          <span style={{ color: "#3d5a73", fontSize: 12, marginLeft: 6 }}>/ Operator Access</span>
        </div>
      </div>

      <div style={{ width: 380 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div style={{ 
              background: "linear-gradient(135deg, #1e3a5a, #2a475e)", 
              borderRadius: "50%", 
              padding: 20, 
              border: "2px solid #3d5a73" 
            }}>
              <Lock size={32} color="#66c0f4" />
            </div>
          </div>
          <h1 style={{ color: "#c6d4df", fontSize: 22, fontWeight: "bold", margin: 0 }}>Operator Login</h1>
          <p style={{ color: "#8f98a0", fontSize: 13, marginTop: 6 }}>Enter your invite code to access the panel</p>
        </div>

        {/* Card */}
        <div className="steam-card p-6">
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label style={{ color: "#8f98a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                Invite Code
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your invite code"
                className="w-full"
                autoFocus
                required
              />
            </div>

            {error && (
              <div style={{ background: "#3a1a1a", border: "1px solid #6b2222", color: "#c94040", fontSize: 12, padding: "8px 12px", borderRadius: 3, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-steam w-full" disabled={loading} style={{ padding: "10px 16px", fontSize: 14 }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ color: "#556672", fontSize: 11, textAlign: "center", marginTop: 16 }}>
          SteamPanel — Support Case Generator
        </p>
      </div>
    </div>
  );
}
