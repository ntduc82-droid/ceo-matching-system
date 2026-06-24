import React, { useEffect, useState } from "react";
import { User, Event } from "../types";
import { Calendar, MapPin, Building, Clock, Users, Plus, Star, Sparkles, Send, CheckCircle, AlertTriangle, Trash2, Share2, Check, Home, QrCode } from "lucide-react";
import QRCodeModal from "./QRCodeModal";

interface EventSectionProps {
  currentUser: User | null;
  onNavigateToAuth: () => void;
}

export default function EventSection({ currentUser, onNavigateToAuth }: EventSectionProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  
  // Registration form states
  const [showRegForm, setShowRegForm] = useState(false);
  const [companyRepresenting, setCompanyRepresenting] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [registrationNote, setRegistrationNote] = useState("");

  // Creation form states
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [organizerUnit, setOrganizerUnit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSystemOfficial, setIsSystemOfficial] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // QR share states
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrTitle, setQrTitle] = useState("");
  const [qrSubtitle, setQrSubtitle] = useState("");

  const handleOpenQR = (ev: Event) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=events&id=${ev.id}`;
    setQrUrl(shareUrl);
    setQrTitle(`Mã QR Sự Kiện - ${ev.title}`);
    setQrSubtitle(`Đơn vị tổ chức: ${ev.organizerUnit || "Ban điều hành"}`);
    setQrOpen(true);
  };

  const handleShare = (id: number) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=events&id=${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(String(id));
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      const res = await fetch("/api/events", { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        
        // Tự động mở xem sự kiện nếu có ID từ link chia sẻ
        const params = new URLSearchParams(window.location.search);
        const eventIdParam = params.get("id");
        if (eventIdParam) {
          const matched = data.find((e: any) => e.id === Number(eventIdParam));
          if (matched) {
            setSelectedEvent(matched);
          }
        }
      } else {
        setError("Không thể tải danh sách sự kiện");
      }
    } catch (err) {
      console.error(err);
      setError("Không kết nối được API sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (eventId: number) => {
    setLoadingRegistrations(true);
    try {
      const headers: any = {};
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      const res = await fetch(`/api/events/${eventId}/registrations`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error("Error fetching event registrations:", err);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchRegistrations(selectedEvent.id);
    } else {
      setRegistrations([]);
    }
  }, [selectedEvent, currentUser]);

  useEffect(() => {
    fetchEvents();
  }, [currentUser]);

  // Đồng bộ hóa thanh địa chỉ khi thay đổi sự kiện đang xem
  useEffect(() => {
    if (loading && events.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    if (selectedEvent) {
      params.set("view", "events");
      params.set("id", String(selectedEvent.id));
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else {
      if (!loading) {
        params.set("view", "events");
        params.delete("id");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    }
  }, [selectedEvent, loading, events]);

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sự kiện này không? Việc xóa sẽ đồng thời hủy toàn bộ lượt đăng ký tham gia liên quan.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser?.id || ""}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Xóa sự kiện thành công!");
        setSelectedEvent(null);
        fetchEvents();
      } else {
        setError(data.error || "Gặp lỗi khi xóa sự kiện");
      }
    } catch (err: any) {
      setError("Không thể kết nối đến máy chủ để xóa sự kiện");
    }
  };

  const handleToggleHome = async (eventId: number, currentStatus: boolean | undefined) => {
    try {
      const headers: any = {
        "Content-Type": "application/json"
      };
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      const res = await fetch(`/api/admin/events/${eventId}/toggle-home`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ showOnHome: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật hiển thị trang chủ");
      
      setSuccess(data.message);
      // Update local state event list
      setEvents(events.map(ev => ev.id === eventId ? { ...ev, showOnHome: !currentStatus } : ev));
      // Update selectedEvent if any
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({ ...selectedEvent, showOnHome: !currentStatus });
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleRegisterEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onNavigateToAuth();
    if (!selectedEvent) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          companyRepresenting: companyRepresenting || currentUser.companyName,
          guestsCount,
          registrationNote
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi đăng ký sự kiện");

      alert("Bạn đã gửi thành công!");
      setSuccess("Bạn đã gửi thành công!");
      setShowRegForm(false);
      setRegistrationNote("");
      setGuestsCount(1);
      fetchRegistrations(selectedEvent.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onNavigateToAuth();

    setError("");
    setSuccess("");

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title,
          description,
          dateTime,
          location,
          organizerUnit,
          imageUrl,
          isSystemOfficial: currentUser.role === "Admin" ? isSystemOfficial : false
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi xử lý sự kiện");

      setSuccess(data.message);
      setTitle("");
      setDescription("");
      setDateTime("");
      setLocation("");
      setOrganizerUnit("");
      setImageUrl("");
      setIsSystemOfficial(false);
      setEditingEvent(null);
      setShowCreate(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-amber-500" />
            SỰ KIỆN NETWORKING & DIỄN ĐÀN CEO
          </h2>
          <p className="text-slate-400 mt-1 max-w-2xl text-sm">
            Kết nối giao thương thực tế, Business Tour tham quan doanh nghiệp và các diễn đàn kinh tế vĩ mô định kỳ.
          </p>
        </div>

        {currentUser && currentUser.status === "Active" && (
          <button
            onClick={() => {
              if (showCreate) {
                // Hủy soạn/sửa
                setEditingEvent(null);
                setTitle("");
                setDescription("");
                setDateTime("");
                setLocation("");
                setOrganizerUnit("");
                setImageUrl("");
                setIsSystemOfficial(false);
              }
              setShowCreate(!showCreate);
              setSelectedEvent(null);
              setShowRegForm(false);
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded-lg text-sm flex items-center gap-2 transform active:scale-95 transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? "XEM SỰ KIỆN" : "TỔ CHỨC SỰ KIỆN MỚI"}
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/25 rounded-lg text-red-200 text-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/25 rounded-lg text-emerald-200 text-sm">
          🏆 {success}
        </div>
      )}

      {/* 1. SỰ KIỆN CHI TIẾT KÈM FORM ĐĂNG KÝ */}
      {selectedEvent && !showCreate && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Header Section: Navigation, Actions and Event Title */}
          <div className="p-6 md:p-8 bg-slate-950/40 border-b border-slate-800/60 space-y-6 text-left">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                onClick={() => { setSelectedEvent(null); setShowRegForm(false); }}
                className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-850 hover:text-amber-400 border border-slate-800/80 text-amber-500 font-mono text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                ← QUAY LẠI DANH SÁCH SỰ KIỆN
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenQR(selectedEvent)}
                  className="px-3 py-1.5 bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/30 text-amber-500 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" /> MÃ QR SỰ KIỆN
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(selectedEvent.id)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer border-0"
                >
                  {copiedId === String(selectedEvent.id) ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> ĐÃ SAO CHÉP LINK!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" /> CHIA SẺ SỰ KIỆN
                    </>
                  )}
                </button>

                {currentUser && (["Admin", "Mod"].includes(currentUser.role) || currentUser.id === selectedEvent.creatorId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(selectedEvent);
                      setTitle(selectedEvent.title);
                      setDescription(selectedEvent.description);
                      const localDate = selectedEvent.dateTime ? selectedEvent.dateTime.slice(0, 16) : "";
                      setDateTime(localDate);
                      setLocation(selectedEvent.location);
                      setOrganizerUnit(selectedEvent.organizerUnit || "");
                      setImageUrl(selectedEvent.imageUrl || "");
                      setIsSystemOfficial(!selectedEvent.creatorId);
                      setShowCreate(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 border border-amber-500/30 text-amber-500 hover:text-amber-400 hover:border-amber-500/60 text-xs font-mono font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    SỬA SỰ KIỆN
                  </button>
                )}

                {currentUser && ["Admin", "Mod"].includes(currentUser.role) && (
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="px-3 py-1.5 bg-red-950/90 hover:bg-red-900 border border-red-500/30 text-red-500 hover:text-red-400 hover:border-red-500/60 text-xs font-mono font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> XÓA SỰ KIỆN
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-xl md:text-3xl font-serif font-bold text-slate-100 mt-4 leading-tight">
              {selectedEvent.title}
            </h3>
          </div>

          {/* Event Image Banner (Now completely separate, full width container, no overlayered text) */}
          <div className="w-full bg-slate-950 flex items-center justify-center p-2 border-b border-slate-800">
            <div className="w-full max-h-[550px] overflow-hidden rounded-xl flex items-center justify-center relative group">
              <img
                src={selectedEvent.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop"}
                alt={selectedEvent.title}
                className="max-w-full max-h-[550px] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
              {selectedEvent.isHot && (
                <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 shadow-lg font-mono text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 select-none animate-pulse z-10">
                  <Star className="h-3 w-3 fill-slate-950 text-slate-950" />
                  <span>SỰ KIỆN HOT</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h4 className="text-amber-500 text-xs font-mono uppercase tracking-wider mb-2">Mô tả chương trình</h4>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line font-sans">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 text-sm text-slate-300 font-sans">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs font-mono">THỜI GIAN TỔ CHỨC</p>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {new Date(selectedEvent.dateTime).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs font-mono">ĐỊA ĐIỂM TỔ CHỨC</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-200 hover:text-amber-400 hover:underline transition-colors mt-0.5 inline-flex items-center gap-2 group cursor-pointer"
                      title="Xem bản đồ Google Maps"
                    >
                      <span className="break-all sm:break-normal">{selectedEvent.location}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1 py-0.5 rounded leading-none border border-amber-500/20 group-hover:bg-amber-500/20 select-none flex-shrink-0 inline-flex items-center gap-0.5 whitespace-nowrap">
                        Bản đồ ↗
                      </span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs font-mono">ĐƠN VỊ TỔ CHỨC CHỦ TRÌ</p>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedEvent.organizerUnit}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Users className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 text-xs font-mono">NGƯỜI ĐĂNG TẢI</p>
                    <p className="font-semibold text-slate-200 mt-0.5">{selectedEvent.creatorName || "Ban Tổ Chức"}</p>
                  </div>
                </div>
              </div>

              {/* Danh sách CEO đã đăng ký tham gia */}
              <div className="border-t border-slate-800/80 pt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-amber-500 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> 
                    Danh sách CEO đăng ký giao thương ({registrations.length})
                  </h4>
                  {currentUser && (currentUser.id === selectedEvent.creatorId || ["Admin", "Mod", "Manager"].includes(currentUser.role)) && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                      Quyền xem danh sách chi tiết
                    </span>
                  )}
                </div>

                {loadingRegistrations ? (
                  <p className="text-slate-500 text-xs font-mono animate-pulse">Đang tải danh sách thành viên...</p>
                ) : registrations.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">Chưa có CEO nào gửi form đăng ký tham gia sự kiện này. Hãy là người đầu tiên đăng ký!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                    {registrations.map((reg, index) => {
                      const isCreatorOrAdmin = currentUser && (currentUser.id === selectedEvent.creatorId || ["Admin", "Mod", "Manager"].includes(currentUser.role));
                      
                      return (
                        <div 
                          key={reg.id || index}
                          className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-all flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            {reg.userAvatar ? (
                              <img
                                src={reg.userAvatar}
                                alt={reg.userName}
                                className="h-10 w-10 rounded-full object-cover border-2 shadow-md flex-shrink-0"
                                style={{ borderColor: reg.userProfileColor || "#F59E0B" }}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div 
                                className="h-10 w-10 rounded-full border-2 flex items-center justify-center font-serif text-sm font-bold shadow-md bg-slate-900 flex-shrink-0 select-none cursor-default"
                                style={{ borderColor: reg.userProfileColor || "#F59E0B", color: reg.userProfileColor || "#F59E0B" }}
                              >
                                {reg.userName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <h5 className="text-slate-200 text-sm font-semibold truncate leading-tight">
                                {reg.userName}
                              </h5>
                              <p className="text-slate-400 text-xs truncate mt-0.5 font-sans">
                                {reg.companyRepresenting || "Tự do"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-500 font-mono">
                                  {reg.guestsCount > 1 ? `+${reg.guestsCount - 1} khách đi cùng` : "1 CEO tham dự"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Thông tin liên lạc nhạy cảm chỉ hiển thị cho Ban Tổ Chức / Người khởi lập / Admin */}
                          {isCreatorOrAdmin && (
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/40 space-y-1 text-[11px] font-sans">
                              <p className="font-mono text-[9px] text-amber-500/80 uppercase tracking-widest border-b border-slate-800/20 pb-1 mb-1">
                                Thông tin liên hệ đón tiếp
                              </p>
                              {reg.userEmail && (
                                <p className="text-slate-300 truncate font-mono">
                                  <span className="text-slate-500">Email:</span> {reg.userEmail}
                                </p>
                              )}
                              {reg.userPhone && (
                                <p className="text-slate-300 truncate font-mono">
                                  <span className="text-slate-500">SĐT:</span> {reg.userPhone}
                                </p>
                              )}
                              {reg.registrationNote && (
                                <p className="text-amber-400/85 italic bg-slate-900 p-1.5 rounded mt-1 overflow-y-auto break-words leading-tight max-h-[80px]">
                                  <span className="text-slate-500 font-mono not-italic block uppercase text-[8px] tracking-wide">Mong muốn liên kết:</span>
                                  {reg.registrationNote}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Event Registry / Form đăng ký */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 h-fit space-y-4">
              <h4 className="text-amber-500 font-serif font-bold text-lg text-center tracking-wide">
                ĐĂNG KÝ THAM GIA
              </h4>
              <p className="text-slate-400 text-xs text-center">
                Vui lòng cung cấp thông tin để Ban Tổ Chức đón tiếp chu đáo nhất.
              </p>

              {!currentUser ? (
                <div className="text-center pt-3 space-y-3">
                  <p className="text-slate-400 text-xs">Bạn cần có tài khoản CEO Matching được kích hoạt để tham gia.</p>
                  <button
                    onClick={onNavigateToAuth}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded transition-colors"
                  >
                    ĐĂNG NHẬP / ĐĂNG KÝ NGAY
                  </button>
                </div>
              ) : currentUser.status === "Pending" ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-center rounded text-amber-400 text-xs">
                  ⚠️ Tài khoản của quý thành viên ở trạng thái Đợi Phê Duyệt. Cần liên hệ Admin để duyệt trước khi thực hiện đăng ký tham gia sự kiện.
                </div>
              ) : registrations.some((r: any) => r.userId === currentUser.id) ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Check className="h-5 w-5" />
                  </div>
                  <p className="text-emerald-400 text-sm font-semibold">Bạn đã gửi đăng ký thành công!</p>
                  <p className="text-slate-400 text-xs leading-relaxed font-sans">
                    Hệ thống đã tiếp nhận thông tin đón tiếp. Tên và doanh nghiệp của quý thành viên hiện đã hiển thị công khai trong danh sách tham gia sự kiện.
                  </p>
                </div>
              ) : !showRegForm ? (
                <button
                  onClick={() => {
                    setShowRegForm(true);
                    setCompanyRepresenting(currentUser.companyName || "");
                  }}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 text-sm font-semibold rounded font-sans transition-all active:scale-[0.98] cursor-pointer"
                >
                  MỞ ĐƠN ĐĂNG KÝ GIAO THƯƠNG
                </button>
              ) : (
                <form onSubmit={handleRegisterEvent} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-[10px] font-mono mb-1">CÔNG TY ĐẠI DIỆN</label>
                    <input
                      type="text"
                      required
                      value={companyRepresenting}
                      onChange={(e) => setCompanyRepresenting(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    <label className="block text-slate-300 text-[10px] font-mono">SỐ LƯỢNG CEO / KHÁCH ĐI CÙNG</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      required
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10px] font-mono mb-1">GHI CHÚ / MONG MUỐN KẾT NỐI SỰ KIỆN</label>
                    <textarea
                      value={registrationNote}
                      onChange={(e) => setRegistrationNote(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none"
                      placeholder="Ví dụ: Mong muốn bàn giao hợp tác sản phẩm tự động hoá..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded font-mono flex items-center justify-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> GỬI FORM THAM GIA
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. KHỞI TẠO SỰ KIỆN MỚI */}
      {showCreate && (
        <form onSubmit={handleCreateEvent} className="bg-slate-900 border border-slate-800 max-w-3xl mx-auto rounded-xl p-6 md:p-8 space-y-6">
          <h3 className="text-xl font-serif font-bold text-amber-500 flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> {editingEvent ? "CẬP NHẬT THÔNG TIN SỰ KIỆN" : "KHỞI TẠO SỰ KIỆN DIỄN ĐÀN CEO"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-mono mb-1">TIÊU ĐỀ SỰ KIỆN *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none font-sans"
                placeholder="Nhập tên sự kiện VIP..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">THỜI GIAN TỔ CHỨC *</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">ĐƠN VỊ TỔ CHỨC CHỦ TRÌ</label>
                <input
                  type="text"
                  value={organizerUnit}
                  onChange={(e) => setOrganizerUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2 text-slate-200 text-sm outline-none font-sans"
                  placeholder="Ví dụ: Hội đồng Doanh Nhân TechVina"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">ĐỊA ĐIỂM TỔ CHỨC SỰ KIỆN *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2 text-slate-200 text-sm outline-none font-sans"
                  placeholder="Khách sạn de L'Opera, Hà Nội..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-300 text-xs font-mono">LINK ẢNH COVER SỰ KIỆN</label>
                  <label className="cursor-pointer text-[10px] text-amber-500 font-mono flex items-center gap-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded px-2.5 py-1 hover:border-amber-500/40 select-none transition-all active:scale-95">
                    <Plus className="h-2.5 w-2.5" /> TẢI LÊN FILE ẢNH
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert("⚠️ Dung lượng ảnh vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn để tối ưu hóa hiệu suất.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            setImageUrl(reader.result);
                            setSuccess("Đã tải lên ảnh sự kiện thành công!");
                            setTimeout(() => setSuccess(""), 4000);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2 text-slate-200 text-sm outline-none font-sans"
                    placeholder="Nhập/dán link url ảnh hoặc nhấn nút tải ảnh bên trên..."
                  />
                  {imageUrl && (
                    <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg relative group">
                      <img src={imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {currentUser?.role === "Admin" && (
              <div className="flex items-center gap-2 p-3 bg-slate-950/50 rounded-lg border border-amber-500/20">
                <input
                  type="checkbox"
                  id="systemOfficialEvent"
                  checked={isSystemOfficial}
                  onChange={(e) => setIsSystemOfficial(e.target.checked)}
                  className="rounded border-slate-800 text-amber-500 bg-slate-950"
                />
                <label htmlFor="systemOfficialEvent" className="text-amber-500 text-xs font-mono cursor-pointer select-none">
                  🌟 ĐĂNG NỔI BẬT DƯỚI DẠNG SỰ KIỆN TRỌNG ĐIỂM HỆ THỐNG
                </label>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-xs font-mono mb-1">MÔ TẢ CHI TIẾT CHƯƠNG TRÌNH & NỘI DUNG NGHỊ SỰ *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-4 text-slate-200 text-sm outline-none font-sans leading-relaxed"
                placeholder="Nghị trình chi tiết: Đón khách, Diễn thuyết, Thảo luận bàn tròn CEO, Tiệc Buffet kết nối..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 font-mono">
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditingEvent(null);
                setTitle("");
                setDescription("");
                setDateTime("");
                setLocation("");
                setOrganizerUnit("");
                setImageUrl("");
                setIsSystemOfficial(false);
              }}
              className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-lg text-slate-300 text-xs transition-colors cursor-pointer"
            >
              HỦY THAO TÁC
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              {editingEvent ? "CẬP NHẬT LƯU THAY ĐỔI" : "GỬI HỘI ĐỒNG BAN QUẢN TRỊ DUYỆT SỰ KIỆN"}
            </button>
          </div>
        </form>
      )}

      {/* 3. EVENT GRID LISTING */}
      {!selectedEvent && !showCreate && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-400 font-mono text-xs mt-3">Đồng bộ lịch các sự kiện...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-serif text-lg">Chưa lên lịch sự kiện nào mới</p>
              <p className="text-slate-500 text-xs mt-1 font-sans">Bạn có kiến nghị hội thảo riêng? Hãy bổ sung bằng nút Đăng ký.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-xl overflow-hidden flex flex-col transition-all group hover:-translate-y-1 shadow-lg shadow-black/20"
                >
                  <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                    <img
                      src={event.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop"}
                      alt={event.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Status badge view only for creator or managers */}
                    {currentUser && (currentUser.id === event.creatorId || ["Admin", "Mod", "Manager"].includes(currentUser.role)) && (
                      <div className="absolute top-3 right-3 z-10 flex gap-2">
                        {event.showOnHome && (
                          <span className="px-2 py-1 bg-amber-500/25 text-amber-400 border border-amber-500/40 text-[10px] rounded flex items-center gap-1 font-mono font-semibold uppercase">
                            <Home className="h-3 w-3" /> TRANG CHỦ
                          </span>
                        )}
                        {event.status === "Approved" ? (
                          <span className="px-2 py-1 bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 text-[10px] rounded flex items-center gap-1 font-mono">
                            <CheckCircle className="h-3 w-3" /> Đã duyệt đăng
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-950/90 text-amber-400 border border-amber-500/30 text-[10px] rounded flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" /> Đợi duyệt
                          </span>
                        )}
                      </div>
                    )}
                    {(!currentUser || !["Admin", "Mod", "Manager"].includes(currentUser.role)) && event.showOnHome && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2 py-1 bg-amber-500/25 text-amber-400 border border-amber-500/40 text-[10px] rounded flex items-center gap-1 font-mono font-semibold uppercase">
                          <Home className="h-3 w-3" /> TRANG CHỦ
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 bg-slate-950/90 text-amber-500 border border-amber-500/10 rounded px-2.5 py-1 text-center font-mono text-[10px] sm:text-xs">
                      {new Date(event.dateTime).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 font-sans">
                    <div className="space-y-2">
                      <h4
                        onClick={() => setSelectedEvent(event)}
                        className="text-lg font-serif font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {event.title}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <MapPin className="h-4 w-4 text-amber-500/80 flex-shrink-0" />
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-amber-400 hover:underline transition-colors truncate"
                          title="Xem trên Google Maps"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.location}
                        </a>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="truncate max-w-[100px] sm:max-w-[130px]">Đơn vị: {event.organizerUnit}</span>
                        <div className="flex items-center gap-2">
                          {currentUser && ["Admin", "Mod", "Manager"].includes(currentUser.role) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleHome(event.id, event.showOnHome);
                              }}
                              className={`px-2 py-1.5 border rounded text-[10px] font-bold tracking-wider transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                                event.showOnHome
                                  ? "bg-amber-500 hover:bg-amber-400 border-amber-500 text-slate-950"
                                  : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                              title={event.showOnHome ? "Ẩn khỏi trang chủ" : "Hiện lên trang chủ"}
                            >
                              <Home className="h-3.5 w-3.5" />
                            </button>
                          )}
                          
                          {currentUser && ["Admin", "Mod"].includes(currentUser.role) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-500 hover:text-red-400 rounded text-[10px] font-bold tracking-wider transition-colors cursor-pointer flex items-center justify-center shrink-0"
                              title="Xóa sự kiện này"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(event.id);
                            }}
                            className="px-2 py-1.5 bg-slate-950/90 border border-slate-800 hover:border-amber-500/30 text-amber-500 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                            title="Sao chép link chia sẻ"
                          >
                            {copiedId === String(event.id) ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenQR(event);
                            }}
                            className="px-2 py-1.5 bg-slate-950/90 border border-slate-800 hover:border-amber-500/30 text-amber-500 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                            title="Hiện mã QR sự kiện"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-[10px] text-slate-950 font-bold tracking-wider transition-colors cursor-pointer border-0 shrink-0"
                          >
                            XEM CHI TIẾT
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QRCode Modal container */}
      <QRCodeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        url={qrUrl}
        title={qrTitle}
        subtitle={qrSubtitle}
      />
    </div>
  );
}
