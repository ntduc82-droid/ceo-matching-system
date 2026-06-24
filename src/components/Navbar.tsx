import React, { useEffect, useState } from "react";
import { User, SystemMenu } from "../types";
import { LogOut, User as UserIcon, Shield, Menu, X, Sparkles, Building2 } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export default function Navbar({ currentUser, onLogout, onNavigate, currentView }: NavbarProps) {
  const [menus, setMenus] = useState<SystemMenu[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchMenus = async () => {
    try {
      // Vì chúng ta truyền header Bearer userId để xác thực vai trò động,
      // Ta đính kèm userId vào gọi API
      const headers: any = { "Content-Type": "application/json" };
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      
      const res = await fetch("/api/menus", { headers });
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setMenus(data);
      }
    } catch (err) {
      console.error("Không thể load menu động:", err);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [currentUser]);

  const handleMenuClick = (url: string) => {
    setMobileOpen(false);
    // Chuyển đổi url thành view tương ứng
    if (url === "/") onNavigate("home");
    else if (url === "/members") onNavigate("members");
    else if (url === "/events") onNavigate("events");
    else if (url === "/matching") onNavigate("matching");
    else if (url === "/posts") onNavigate("posts");
    else if (url === "/trades") onNavigate("trades");
  };

  // Các vai trò có quyền xem Dashboard Quản Trị
  const canAccessAdmin = currentUser && ["Admin", "Mod", "Manager"].includes(currentUser.role);

  return (
    <nav className="bg-slate-950 border-b border-amber-500/10 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center md:gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <img 
              src="/logo.jpg" 
              alt="CEO Matching Logo" 
              className="h-12 w-12 rounded-lg object-cover border border-amber-400/30 shadow-lg shadow-amber-950/20" 
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="hidden md:block text-amber-500 font-serif font-bold text-lg tracking-wider leading-none">CEO MATCHING</span>
              <span className="hidden md:block text-slate-400 text-[10px] font-mono tracking-widest leading-none">HIGH-CLASS NETWORK</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 font-sans">
            {menus.map((menu) => {
              const viewName = menu.url === "/" ? "home" : menu.url.replace("/", "");
              const isActive = currentView === viewName;
              return (
                <button
                  key={menu.id}
                  onClick={() => handleMenuClick(menu.url)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "text-amber-400 bg-amber-500/10 border-b border-amber-500"
                      : "text-slate-300 hover:text-amber-400 hover:bg-slate-900"
                  }`}
                >
                  {menu.title}
                </button>
              );
            })}
          </div>

          {/* Actions & Profiles */}
          <div className="hidden lg:flex items-center gap-4">
            {currentUser && currentUser.id !== 0 ? (
              <div className="flex items-center gap-3">
                {canAccessAdmin && (
                  <button
                    onClick={() => onNavigate("admin")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                      currentView === "admin"
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                        : "bg-slate-900 hover:bg-slate-800 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    BÀN QUẢN TRỊ
                  </button>
                )}

                <NotificationCenter currentUser={currentUser} onNavigate={onNavigate} />

                <div 
                  onClick={() => onNavigate("profile")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg max-w-xs cursor-pointer hover:border-amber-500/30 transition-all"
                >
                  <div className="h-7 w-7 rounded-full bg-slate-800 border border-amber-500/30 font-bold flex items-center justify-center text-xs text-amber-500">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left font-sans">
                    <div className="text-slate-200 text-xs font-semibold leading-tight max-w-[120px] truncate">{currentUser.fullName}</div>
                    <div className="text-amber-500/90 text-[10px] font-mono leading-none flex items-center gap-1">
                      <span>{currentUser.role}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Đăng xuất khỏi tài khoản"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("auth")}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-sm font-semibold rounded-lg font-sans transition-all active:scale-95 shadow-md shadow-amber-900/10 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                ĐĂNG NHẬP CEO
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-3">
            {currentUser && currentUser.id !== 0 && (
              <>
                <NotificationCenter currentUser={currentUser} onNavigate={onNavigate} />
                <div 
                  className="h-8 w-8 rounded-full bg-slate-800 border border-amber-500/30 font-bold flex items-center justify-center text-xs text-amber-500 cursor-pointer"
                  onClick={() => onNavigate("profile")}
                >
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
              </>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-400 hover:text-amber-400 rounded-lg transition-all"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-3 font-sans">
          <div className="space-y-1">
            {menus.map((menu) => {
              const viewName = menu.url === "/" ? "home" : menu.url.replace("/", "");
              const isActive = currentView === viewName;
              return (
                <button
                  key={menu.id}
                  onClick={() => handleMenuClick(menu.url)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all capitalize block ${
                    isActive
                      ? "text-amber-400 bg-amber-500/5 font-semibold"
                      : "text-slate-300 hover:text-amber-400 hover:bg-slate-900"
                  }`}
                >
                  {menu.title}
                </button>
              );
            })}
          </div>

          {currentUser && currentUser.id !== 0 ? (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {canAccessAdmin && (
                <button
                  onClick={() => { setMobileOpen(false); onNavigate("admin"); }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-900 text-amber-500 border border-amber-500/20 text-xs font-bold tracking-widest"
                >
                  <Shield className="h-4 w-4" />
                  BÀN QUẢN TRỊ
                </button>
              )}
              <button
                onClick={() => { setMobileOpen(false); onNavigate("profile"); }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-900 text-slate-200 text-xs font-bold tracking-widest"
              >
                <UserIcon className="h-4 w-4" />
                HỒ SƠ CÁ NHÂN
              </button>
              <button
                onClick={() => { setMobileOpen(false); onLogout(); }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-950/20 text-red-400 border border-red-900/30 text-xs font-bold tracking-widest"
              >
                <LogOut className="h-4 w-4" />
                ĐĂNG XUẤT
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => { setMobileOpen(false); onNavigate("auth"); }}
                className="w-full py-2.5 bg-amber-600 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                ĐĂNG NHẬP CEO
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
