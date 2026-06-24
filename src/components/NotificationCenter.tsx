import React, { useState, useEffect, useRef } from "react";
import { User, AppNotification } from "../types";
import { Bell, Check, X, UserCheck, HeartHandshake, Sparkles, Megaphone, CheckCheck, Loader2 } from "lucide-react";

interface NotificationCenterProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
}

export default function NotificationCenter({ currentUser, onNavigate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!currentUser || currentUser.id === 0) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id !== 0) {
      fetchNotifications();
      // Tự động kiểm tra thông báo mới sau mỗi 20 giây để hệ thống luôn sống động
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespondConnection = async (matchId: number, action: "accept" | "decline", notifId: number) => {
    if (!currentUser) return;
    setActioningId(notifId);
    try {
      const res = await fetch("/api/matching/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ matchId, action })
      });
      if (res.ok) {
        // Đánh dấu thông báo yêu cầu là đã đọc và cập nhật danh sách
        await handleMarkAsRead(notifId);
        await fetchNotifications();
      } else {
        const data = await res.json();
        alert(data.error || "Gặp lỗi khi ghi nhận ý kiến kết nối.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  // Tính số lượng thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!currentUser || currentUser.id === 0) return null;

  return (
    <div className="relative font-sans" ref={containerRef} id="ceo-notification-center">
      {/* Nút Chuông Thông Báo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-800"
        title="Danh sách thông báo kết nối & cộng đồng"
        id="notification-bell-btn"
      >
        <Bell className="h-5.5 w-5.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-red-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse border border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-80 sm:w-96 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-left bg-opacity-98 backdrop-blur-md">
          {/* Header Panel */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/55 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-500 text-xs">
                <Bell className="h-4 w-4" />
              </span>
              <h4 className="text-slate-200 text-xs font-mono font-bold tracking-widest uppercase">
                Thông báo CEO ({unreadCount})
              </h4>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="flex items-center gap-1 text-[10px] font-mono text-amber-500 hover:text-amber-400 transition-colors uppercase cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Dòng danh sách thông báo */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center space-y-2">
                <Bell className="h-8 w-8 text-slate-700 mx-auto" />
                <p className="text-slate-400 text-xs">Không có thông báo mới nào</p>
                <p className="text-slate-600 text-[10px]">Các yêu cầu kết nối và trạng thái của bạn sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isConnectionRequest = notif.type === "ConnectionRequest";
                const isConnectionAccepted = notif.type === "ConnectionAccepted";
                const isProfileChanged = notif.type === "ProfileStatusChanged";
                
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    className={`p-4 transition-colors relative flex gap-3 cursor-pointer ${
                      notif.isRead ? "bg-transparent opacity-80" : "bg-amber-500/[0.02]"
                    } hover:bg-slate-900/60`}
                    id={`notif-item-${notif.id}`}
                  >
                    {/* Trạng thái chấm xanh dương chưa đọc */}
                    {!notif.isRead && (
                      <span className="absolute top-4 left-2.5 h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                    )}

                    {/* Icon tương ứng với loại thông báo */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isConnectionRequest && (
                        <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                          <HeartHandshake className="h-4 w-4" />
                        </div>
                      )}
                      {isConnectionAccepted && (
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <UserCheck className="h-4 w-4" />
                        </div>
                      )}
                      {isProfileChanged && (
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 animate-pulse" />
                        </div>
                      )}
                      {!isConnectionRequest && !isConnectionAccepted && !isProfileChanged && (
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
                          <Megaphone className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 block font-sans">
                          {notif.title}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        {notif.message}
                      </p>

                      {isConnectionRequest && notif.meta?.senderPhone && (
                        <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 mt-2 space-y-1 text-[10px] font-mono text-slate-300">
                          <p className="text-[8.5px] uppercase tracking-wider text-amber-500 font-bold">
                            🔒 THÔNG TIN LIÊN LẠC ĐÃ NHẬN ĐƯỢC (CHỈ RIÊNG BẠN THẤY):
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <span className="font-sans text-slate-400">SĐT LIÊN HỆ:</span>
                            <span className="text-amber-400 font-bold font-mono">{notif.meta.senderPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-200 truncate">
                            <span className="font-sans text-slate-400">EMAIL CÁ NHÂN:</span>
                            <span className="text-amber-400 font-bold font-mono truncate">{notif.meta.senderEmail}</span>
                          </div>
                        </div>
                      )}

                      {/* Đặc cách hiển thị hành động chấp nhận/từ chối của "ConnectionRequest" */}
                      {isConnectionRequest && !notif.isRead && notif.meta?.matchId && (
                        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-900" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={actioningId === notif.id}
                            onClick={() => handleRespondConnection(notif.meta!.matchId!, "accept", notif.id)}
                            className="flex-1 py-1.5 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-[10px] font-mono rounded-md h-7 transition-all flex items-center justify-center gap-1 cursor-pointer border-0 active:scale-95"
                          >
                            {actioningId === notif.id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-slate-900" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            BẮT TAY KẾT NỐI
                          </button>
                          <button
                            disabled={actioningId === notif.id}
                            onClick={() => handleRespondConnection(notif.meta!.matchId!, "decline", notif.id)}
                            className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-red-400 border border-slate-800 rounded-md text-[10px] font-mono h-7 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            TỪ CHỐI
                          </button>
                        </div>
                      )}

                      {/* Link chuyển nhanh tới view matching history hay profile */}
                      {isConnectionAccepted && (
                        <button
                          onClick={() => {
                            onNavigate("matching");
                            setIsOpen(false);
                          }}
                          className="text-[9.5px] font-mono text-amber-500/95 hover:text-amber-400 underline uppercase mt-2 block transition-all"
                        >
                          Đi xem hồ sơ trao đổi ngay →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hàm format thời gian vừa đơn giản vừa chuyên nghiệp
function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = new Date().getTime() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 30000) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  } catch (err) {
    return "Vừa xong";
  }
}
