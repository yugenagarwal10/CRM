import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, Menu, X, LogOut, Settings as SettingsIcon, ChevronDown, Kanban, Sliders, BarChart3, TextAlignJustify } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(location.pathname.startsWith('/settings'));
  const { user, logout } = useAuth();

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#F4F6FB]">
      {/* ── Mobile Top Header ── */}
      <header className="flex md:hidden items-center justify-between px-4 py-3.5 bg-white border-b border-gray-100 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <Briefcase className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">
              Lead CRM
            </p>
            <p className="text-[9px] text-gray-400">Sales Workspace</p>
          </div>
        </div>
        <button
          onClick={toggleMobileSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Mobile Drawer Sidebar (Overlay) ── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeMobileSidebar}
          />

          {/* Drawer Panel */}
          <aside className="relative flex flex-col w-64 max-w-[80vw] bg-white h-full p-5 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Close Button & Header */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-150 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-gray-800 leading-tight">
                    Lead CRM
                  </p>
                  <p className="text-[12px] font-semibold text-gray-400">Sales Workspace</p>
                </div>
              </div>
              <button
                onClick={closeMobileSidebar}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Menu Label */}
            <div className="px-2 pb-2">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                Menu
              </p>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[16px] font-bold transition-all duration-150 group ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                          isActive
                            ? "bg-white/20"
                            : "bg-gray-100 group-hover:bg-indigo-50"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500 group-hover:text-indigo-500"}`}
                        />
                      </span>
                      {label}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Master Settings Accordion for Mobile */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[16px] font-bold transition-all duration-150 group ${
                    location.pathname.startsWith('/settings')
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-indigo-50">
                      <SettingsIcon className="w-4 h-4 text-gray-500 group-hover:text-indigo-500" />
                    </span>
                    Master Settings
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSettingsOpen && (
                  <div className="pl-6 pt-1 space-y-1">
                    <NavLink
                      to="/settings"
                      end
                      onClick={closeMobileSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] font-extrabold transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`
                      }
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Status
                    </NavLink>
                    <NavLink
                      to="/settings/sources"
                      onClick={closeMobileSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] font-extrabold transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`
                      }
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      Lead Sources
                    </NavLink>
                  </div>
                )}
              </div>
            </nav>

            {/* User Profile & Logout section at bottom of mobile sidebar */}
            <div className="mt-auto pt-5 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-black shadow-md select-none">
                  {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 truncate leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5 text-ellipsis">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  closeMobileSidebar();
                  setShowLogoutModal(true);
                }}
                className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-gray-150 hover:bg-gray-50 text-rose-600 font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-gray-100 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
            flex items-center justify-center shadow-lg shadow-indigo-200"
          >
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[20px] font-extrabold text-gray-800 leading-tight">
              Lead CRM
            </p>
            <p className="text-[15px] font-semibold text-gray-400">Sales Workspace</p>
          </div>
        </div>

        {/* Nav label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
            Menu
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-bold transition-all duration-150 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                      isActive
                        ? "bg-white/20"
                        : "bg-gray-100 group-hover:bg-indigo-50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500 group-hover:text-indigo-500"}`}
                    />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {/* Master Settings Accordion for Desktop */}
          <div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] font-bold transition-all duration-150 group ${
                location.pathname.startsWith('/settings')
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-indigo-50">
                  <SettingsIcon className="w-4 h-4 text-gray-500 group-hover:text-indigo-500" />
                </span>
                Master Settings
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSettingsOpen && (
              <div className="pl-6 pt-1 space-y-1">
                <NavLink
                  to="/settings"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-extrabold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Status
                </NavLink>
                <NavLink
                  to="/settings/sources"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-extrabold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                >
                  <TextAlignJustify className="w-3.5 h-3.5" />
                  Lead Sources
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* User profile section at bottom of desktop sidebar */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-black shadow-md select-none shrink-0">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-800 truncate leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-gray-150 hover:bg-gray-50 text-rose-600 font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />
          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 mx-4 p-6">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-full w-fit mb-4">
              <LogOut className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Logout?</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to log out of your session? You will need to log back in to access the CRM.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition animate-pulse"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
