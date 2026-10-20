import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight, GraduationCap, LogOut, RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { AuthUser } from "../../lib/auth";
import { getWorkspaceNavigation } from "../../lib/workspaceNavigation";

function Brand() {
  return <div className="workspace-brand"><span className="brand-symbol"><GraduationCap size={23} strokeWidth={1.8} /></span><span>Uni<span className="brand-accent">Serve</span><small>A little closer to campus.</small></span></div>;
}

export function WorkspaceShell({ user, section, onSectionChange, connected, syncing, lastSynced, onRefresh, onLogout, signingOut, children }: {
  user: AuthUser; section: string; onSectionChange: (section: string) => void;
  connected: boolean; syncing: boolean; lastSynced: Date | null; onRefresh: () => void;
  onLogout: () => void; signingOut: boolean; children: ReactNode;
}) {
  const config = getWorkspaceNavigation(user.role);
  const current = config.sections.find((item) => item.id === section) ?? config.sections[0];
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="app-shell">
    <aside className="workspace-sidebar">
      <div className="sidebar-brand"><Brand /></div>
      <span className="sidebar-caption">YOUR WORKSPACE</span>
      <nav className="workspace-navigation" aria-label={config.label}>
        {config.sections.map(({ id, label, icon: Icon }) => <button type="button" key={id} data-section={id} aria-current={section === id ? "page" : undefined} onClick={() => onSectionChange(id)}><Icon size={20} strokeWidth={1.8} /><span>{label}</span>{section === id && <span className="nav-indicator" aria-hidden="true" />}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="campus-note"><span className="campus-note-icon"><GraduationCap size={19} /></span><strong>Made for campus life.</strong><p>Good things happen when your campus comes together.</p><span>Discover. Connect. Deliver.<ArrowUpRight size={14} /></span></div>
        <div className="sidebar-user"><span className="user-avatar">{initials}</span><div><strong>{user.name}</strong><span>{config.label.replace(" workspace", "")}</span></div><button type="button" className="icon-button" aria-label="Sign out" title="Sign out" disabled={signingOut} onClick={onLogout}><LogOut size={18} /></button></div>
      </div>
    </aside>
    <main className="workspace-main">
      <header className="workspace-topbar">
        <div className="desktop-breadcrumb"><span>UniServe</span><ChevronRight size={14} /><strong>{current.label}</strong></div>
        <div className="mobile-brand"><Brand /></div>
        <div className="topbar-actions">
          <span className={`connection-status ${!connected ? "is-offline" : ""}`} title={lastSynced ? `Last synced ${lastSynced.toLocaleTimeString("en-PH")}. Updates every two seconds.` : "Connecting to campus services"}>{connected ? <Wifi size={14} /> : <WifiOff size={14} />}<span>{!connected ? "Reconnecting" : syncing ? "Saving…" : lastSynced ? "Live updates" : "Connecting"}</span></span>
          <button type="button" className="icon-button" aria-label="Refresh workspace" title="Refresh workspace" disabled={syncing} onClick={onRefresh}><RefreshCw size={17} className={syncing ? "is-spinning" : undefined} /></button>
          <span className="topbar-divider" /><span className="user-avatar small" title={user.name}>{initials}</span>
          <button type="button" className="icon-button mobile-logout" aria-label="Sign out" disabled={signingOut} onClick={onLogout}><LogOut size={17} /></button>
        </div>
      </header>
      <div className="workspace-content">
        <header className="page-heading"><div><span className="eyebrow">{config.label}</span><h1 id="workspace-title" tabIndex={-1}>{current.title}</h1><p>{current.description}</p></div><span className="page-date">{new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span></header>
        {children}
        <footer className="workspace-footer"><span>UniServe<span aria-hidden="true"> · </span>Your campus, connected.</span><span>Built around your everyday.</span></footer>
      </div>
    </main>
  </div>;
}
