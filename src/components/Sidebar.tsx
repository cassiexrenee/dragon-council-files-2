import React from "react";
import { 
  Home, LayoutDashboard, UserSquare2, TableProperties, Scroll, 
  Sliders, Compass, Menu, X, ChevronLeft, ChevronRight, Flame 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  profile: any;
  setProfile: (profile: any) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (isOpen: boolean) => void;
  handleLoginWithDiscord: () => void;
  handleLogout: () => void;
  notesCount: number;
}

export default function Sidebar({
  activeTab, setActiveTab,
  currentUser,
  profile, setProfile,
  isMobileSidebarOpen, setIsMobileSidebarOpen,
  isSidebarCollapsed, setIsSidebarCollapsed,
  isProfileOpen, setIsProfileOpen,
  handleLoginWithDiscord, handleLogout,
  notesCount
}: SidebarProps) {
  
  const navItems = [
    { id: "landing", label: "Council Hall", icon: <Home size={18} /> },
    { id: "overview", label: "Leadership Hub", icon: <LayoutDashboard size={18} /> },
    { id: "member", label: "Account Registry", icon: <UserSquare2 size={18} /> },
    { id: "roster", label: "Alliance Registry", icon: <TableProperties size={18} /> },
    { id: "warlogs", label: "Alliance Chronicle", icon: <Scroll size={18} /> },
    { id: "settings", label: "Settings", icon: <Sliders size={18} /> }
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#222831] border-b border-[#4B5563]/30 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <Compass size={20} className="text-[#06B6D4]" />
          <div className="font-display tracking-[0.15em] text-xs uppercase text-[#F2F0E8]">
            <span className="block font-bold">Dragon</span>
            <span className="block text-[10px] text-[#C8CCD2]/60 -mt-1">Council</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded bg-[#16181D] border border-[#4B5563]/40 text-[#F2F0E8] hover:text-white cursor-pointer"
        >
          {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen bg-[#222831] border-r border-[#4B5563]/30 flex flex-col justify-between transition-all duration-300 ${
          isMobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isSidebarCollapsed ? "md:w-20" : "md:w-64"} flex-shrink-0`}
      >
        <div className="p-4 border-b border-[#4B5563]/30 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? "md:justify-center md:w-full" : ""}`}>
            <div className="w-9 h-9 rounded-lg bg-[#2F3743] border border-[#06B6D4]/40 flex items-center justify-center flex-shrink-0 text-[#06B6D4] shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Compass size={20} />
            </div>
            {!isSidebarCollapsed && (
              <div className="font-display tracking-[0.15em] text-xs uppercase text-[#F2F0E8] leading-tight">
                <span className="block font-bold text-sm">Dragon</span>
                <span className="block text-[10px] text-[#C8CCD2]/60">Council Workspace</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg bg-[#16181D] border border-[#4B5563]/40 text-[#C8CCD2] hover:text-white hover:border-[#D4B26A]/50 transition-all cursor-pointer"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {!isSidebarCollapsed && (
            <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#E5C8C7]/40">
              Command Ledger
            </div>
          )}

          {navItems.map((navItem) => {
            const isActive = activeTab === navItem.id;
            return (
              <button
                key={navItem.id}
                onClick={() => {
                  setActiveTab(navItem.id);
                  setIsMobileSidebarOpen(false);
                }}
                title={isSidebarCollapsed ? navItem.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] ${
                  isSidebarCollapsed ? "justify-center px-0" : ""
                } ${
                  isActive
                    ? "text-[#F2F0E8] bg-[#2F3743] border-[#D4B26A] shadow-[0_0_12px_rgba(212,178,106,0.25)] font-bold"
                    : "border-transparent text-[#C8CCD2]/70 hover:text-white hover:bg-[#2F3743]/50 hover:border-[#4B5563]/40"
                }`}
              >
                <div className={`${isActive ? "text-[#D4B26A]" : "text-[#8B96A5]"}`}>
                  {navItem.icon}
                </div>
                {!isSidebarCollapsed && (
                  <span className="truncate">{navItem.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Profile Dropdown */}
        <div className="p-3 border-t border-[#4B5563]/30 bg-[#16181D]/80 relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg bg-[#16181D] border border-[#4B5563]/40 hover:border-[#D4B26A]/60 hover:bg-[#2F3743]/50 transition-all cursor-pointer text-left select-none group ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={profile.ingameName} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-[#D4B26A]/60 shadow-[0_0_8px_rgba(212,178,106,0.3)] object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2F3743] border border-[#D4B26A]/60 flex items-center justify-center text-xs font-display font-bold text-[#D4B26A] shadow-[0_0_8px_rgba(212,178,106,0.2)] flex-shrink-0">
                {profile.ingameName.substring(0, 2).toUpperCase()}
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="overflow-hidden leading-tight flex-1">
                <span className="block text-[9px] uppercase tracking-widest text-[#8B96A5] font-display">
                  {profile.rank} OFFICER
                </span>
                <span className="text-xs font-bold text-[#F2F0E8] truncate block">
                  {profile.ingameName}
                </span>
              </div>
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute left-full bottom-3 ml-3 z-[100] w-80 bg-[#222831] border border-[#4B5563]/50 rounded-lg p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4B26A] via-[#7FA8C9] to-[#B85A5A]" />
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-display text-[#D4B26A] font-bold">Officer Credentials</h4>
                </div>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="text-xs text-[#C8CCD2]/60 hover:text-white cursor-pointer"
                >✕</button>
              </div>

              <div className="space-y-3 bg-[#16181D]/80 border border-[#4B5563]/30 p-3.5 rounded mb-4">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-[#C8CCD2]/60">In-Game Name</label>
                  <input
                    type="text"
                    value={profile.ingameName}
                    onChange={(e) => setProfile({ ...profile, ingameName: e.target.value })}
                    className="w-full bg-[#16181D] border border-[#4B5563]/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4B26A]"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-[#C8CCD2]/60">Council Rank</label>
                  <div className="flex gap-2">
                    {(["R5", "R4"] as const).map((rank) => (
                      <button
                        key={rank}
                        onClick={() => setProfile({ ...profile, rank })}
                        className={`flex-1 py-1 text-xs font-bold rounded border cursor-pointer ${
                          profile.rank === rank ? "bg-[#D4B26A]/20 border-[#D4B26A] text-[#D4B26A]" : "bg-[#16181D] border-[#4B5563]/30 text-[#C8CCD2]/60"
                        }`}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                {!currentUser ? (
                  <button 
                    onClick={handleLoginWithDiscord}
                    className="w-full py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-[10px] font-bold uppercase rounded border border-[#5865F2]/40 cursor-pointer"
                  >
                    Connect Discord
                  </button>
                ) : (
                  <div className="flex justify-between items-center bg-[#5865F2]/10 p-2 rounded border border-[#5865F2]/30">
                     <span className="text-xs text-white font-bold">{currentUser.username}</span>
                     <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-300">Disconnect</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}