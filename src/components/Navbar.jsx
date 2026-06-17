import ThemeToggle from './ThemeToggle';

export default function Navbar({ user, theme, setTheme, onLogout, isAdmin }) {
  return (
    <nav className="navbar glass-card">
      <a href="#dashboard" className="nav-logo">⚡ Geeks Community</a>
      <div className="nav-links">
        <a href="#dashboard">Dashboard</a>
        <a href="#groups">Groups</a>
        <a href="#posts">Posts</a>
        <a href="#ideas">Ideas</a>
        <a href="#featured">Featured Students</a>
        <a href="#streak">Streak</a>
        {isAdmin && <a href="#admin">Admin Panel</a>}
      </div>
      <div className="nav-actions">
        <span className="user-pill">{user.role}</span>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
