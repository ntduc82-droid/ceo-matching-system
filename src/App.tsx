import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomeSection from "./components/HomeSection";
import MemberSection from "./components/MemberSection";
import EventSection from "./components/EventSection";
import CmsSection from "./components/CmsSection";
import MatchingSection from "./components/MatchingSection";
import ProfileSection from "./components/ProfileSection";
import AdminSection from "./components/AdminSection";
import AuthModal from "./components/AuthModal";
import TradeSection from "./components/TradeSection";
import { User } from "./types";
import { ShieldCheck, Sparkles, AlertCircle, Facebook } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") || "home";
  });

  // Kiểm tra đăng nhập sẵn có từ Store
  const fetchCurrentUser = async () => {
    try {
      const storedUserId = localStorage.getItem("ceo_user_id");
      if (storedUserId) {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${storedUserId}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.loggedIn && data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem("ceo_user_id");
          }
        }
      }
    } catch (err) {
      console.error("Lỗi đồng bộ login:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    // Đồng bộ view khi có thay đổi từ popstate (nút Back/Forward của trình duyệt)
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view") || "home";
      setCurrentView(view);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("ceo_user_id");
    onNavigate("home");
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("ceo_user_id", String(user.id));
    onNavigate("home");
  };

  const onNavigate = (view: string, extraParams?: Record<string, string | number>) => {
    setCurrentView(view);
    // Lưu trạng thái mà không reload trang
    const params = new URLSearchParams(window.location.search);
    params.set("view", view);
    // Xóa id cũ khi chuyển đổi phân hệ chính
    params.delete("id");
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, val]) => {
        params.set(key, String(val));
      });
    }
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  const handleRefreshUser = () => {
    fetchCurrentUser();
  };

  const renderActiveSection = () => {
    switch (currentView) {
      case "home":
        return <HomeSection currentUser={currentUser} onNavigate={onNavigate} />;
      case "members":
        return (
          <MemberSection
            currentUser={currentUser}
            onNavigateToAuth={() => setCurrentView("auth")}
            onNavigateToMatching={() => setCurrentView("matching")}
          />
        );
      case "events":
        return <EventSection currentUser={currentUser} onNavigateToAuth={() => setCurrentView("auth")} />;
      case "posts":
        return <CmsSection currentUser={currentUser} onNavigateToAuth={() => setCurrentView("auth")} />;
      case "matching":
        return <MatchingSection currentUser={currentUser} onNavigateToAuth={() => setCurrentView("auth")} />;
      case "trades":
        return <TradeSection currentUser={currentUser} onNavigateToAuth={() => setCurrentView("auth")} />;
      case "profile":
        return (
          <ProfileSection
            currentUser={currentUser}
            onRefreshUser={handleRefreshUser}
            onNavigateToAuth={() => setCurrentView("auth")}
          />
        );
      case "admin":
        return <AdminSection currentUser={currentUser} onNavigateToAuth={() => setCurrentView("auth")} />;
      case "auth":
        return (
          <div className="max-w-md mx-auto py-12">
            <AuthModal
              onClose={() => setCurrentView("home")}
              onSuccess={handleLoginSuccess}
            />
          </div>
        );
      default:
        return <HomeSection currentUser={currentUser} onNavigate={onNavigate} />;
    }
  };

  const canAccessAdmin = currentUser && ["Admin", "Mod", "Manager"].includes(currentUser.role);

  return (
    <div id="ceo_app_wrapper" className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Warning Banner for system privilege */}
      {currentUser && currentUser.status === "Pending" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs text-amber-500 flex items-center justify-center gap-2 font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>HỒ SƠ CEO CỦA BẠN ĐANG ĐỢI PHÊ DUYỆT TỪ BAN QUẢN TRỊ. MỘT SỐ TÍNH NĂNG MẠNG MATCHING ĐANG TẠM ẨN.</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={onNavigate}
        currentView={currentView}
      />

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10">
        {renderActiveSection()}
      </main>

      {/* Footer System */}
      <footer className="bg-slate-950 border-t border-slate-900/80 py-10 font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-xs text-slate-500 leading-relaxed">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.jpg" 
                alt="CEO Matching Logo" 
                className="h-9 w-9 rounded object-cover border border-amber-400/20 shadow-md" 
                referrerPolicy="no-referrer"
              />
              <span className="text-slate-300 font-serif font-bold text-sm tracking-widest uppercase">CEO MATCHING</span>
            </div>
            <p>
              Kết nối và giao thương
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-slate-400 font-serif font-bold text-xs uppercase tracking-wider">HỖ TRỢ & KẾT NỐI</h5>
            <a
              href="https://www.facebook.com/groups/ceomatching"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap"
            >
              <Facebook className="h-4 w-4" />
              <span>Tham gia nhóm Facebook</span>
            </a>
          </div>

          <div className="space-y-3 font-mono">
            <h5 className="text-slate-400 font-serif font-bold text-xs uppercase tracking-wider font-sans">PHIÊN BẢN BẢO MẬT</h5>
            <p>© 2026 CEO Matching Corporation. All rights reserved.</p>
            <p className="text-[10px] text-amber-500/60 leading-none">SECURITY LEVEL: HIGH-CONFIDENTIAL-5</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
