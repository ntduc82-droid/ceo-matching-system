import React, { useState, useEffect } from "react";
import { Sparkles, Users, Award, ShieldAlert, HeartHandshake, Briefcase, ChevronRight, CheckCircle, Calendar, FileText, MapPin, ArrowRight, MessageSquare, TrendingUp, Handshake, Star } from "lucide-react";
import { User, Event, Post, Trade } from "../types";

interface HomeSectionProps {
  currentUser: User | null;
  onNavigate: (view: string, extraParams?: Record<string, string | number>) => void;
}

export default function HomeSection({ currentUser, onNavigate }: HomeSectionProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [socialMessage, setSocialMessage] = useState("");
  const [socialError, setSocialError] = useState("");
  const [spotlight, setSpotlight] = useState({
    tag: "VŨ ĐÀI NGHỊ SỰ",
    title: "Giao Thương Kết Nối Doanh Nhân Tinh Anh 2026",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop",
    linkUrl: ""
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('ceomatching.com')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const socialUser = event.data.user;
        if (socialUser) {
          setSocialMessage("Xác thực liên kết thành công! Xin chào " + socialUser.fullName + ". Đang đồng bộ hóa dữ liệu...");
          localStorage.setItem("ceo_user_id", String(socialUser.id));
          setTimeout(() => {
            window.location.reload();
          }, 850);
        }
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSocialAuth = (provider: "google" | "zalo") => {
    setSocialError("");
    setSocialMessage("");
    
    const width = 560;
    const height = 630;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popupUrl = `/api/auth/social/authorize?provider=${provider}`;
    
    const popup = window.open(
      popupUrl,
      `social_login_${provider}`,
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
    );
    
    if (!popup) {
      setSocialError("Trình duyệt đã chặn cửa sổ Popup. Vui lòng cho phép quyền mở Popup trên trang web này để đăng nhập qua Google/Zalo.");
    }
  };

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [eventsRes, postsRes, tradesRes, spotlightRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/posts"),
          fetch("/api/trades"),
          fetch("/api/spotlight")
        ]);
        
        if (eventsRes.ok) {
          const eventsData: Event[] = await eventsRes.json();
          // Chỉ sự kiện hot (được gắn sao) mới hiển thị lên Trang chủ
          const homeEvents = eventsData.filter(e => e.isHot && e.status === "Approved");
          setEvents(homeEvents);
        }

        if (postsRes.ok) {
          const postsData: Post[] = await postsRes.json();
          setPosts(postsData.filter(p => p.status === "Approved").slice(0, 3));
        }

        if (tradesRes.ok) {
          const tradesData: Trade[] = await tradesRes.json();
          // Lấy 5 tin giao thương mới nhất
          setTrades(tradesData.slice(0, 5));
        }

        if (spotlightRes.ok) {
          const spotlightData = await spotlightRes.json();
          setSpotlight({
            tag: spotlightData.tag || "VŨ ĐÀI NGHỊ SỰ",
            title: spotlightData.title || "Giao Thương Kết Nối Doanh Nhân Tinh Anh 2026",
            imageUrl: spotlightData.imageUrl || "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop",
            linkUrl: spotlightData.linkUrl || ""
          });
        }
      } catch (err) {
        console.error("Lỗi tải thông tin trang chủ:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div id="home_section_wrapper" className="space-y-10 font-sans text-left">
      
      {/* RE-ORDERED SECTION 1: BÀI GIAO THƯƠNG VIÊN CEO */}
      <div id="home_featured_trades" className="space-y-6 pt-0 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex items-end justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/35 text-amber-400 text-[10.5px] font-mono uppercase tracking-wider mb-2.5 shadow-md shadow-black/30">
              <TrendingUp className="h-3.5 w-3.5" /> CƠ HỘI & HỢP TÁC
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-100 flex items-center gap-2">
              GIAO THƯƠNG
            </h2>
          </div>
          <button
            onClick={() => onNavigate("trades")}
            className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 font-mono uppercase font-bold tracking-wider cursor-pointer bg-transparent border-0"
          >
            Tất cả giao thương <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded-lg w-full"></div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <p className="text-slate-500 text-sm italic">Chưa có tin giao thương nào được đăng tải trên hệ thống.</p>
          </div>
        ) : (
          <div id="trades_unified_block" className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-850">
            {trades.map((trade) => {
              // Custom colors for type badges
              let badgeColor = "bg-slate-950/80 text-slate-400 border-slate-800";
              if (trade.type === "Cần mua") {
                badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/25";
              } else if (trade.type === "Cần bán") {
                badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
              } else if (trade.type === "Tìm đối tác") {
                badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/25";
              }

              return (
                <div
                  key={trade.id}
                  onClick={() => onNavigate("trades", { id: trade.id })}
                  className="p-4 md:px-6 hover:bg-slate-850/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group relative"
                >
                  {/* Left part: badge + title */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span className={`px-2 py-1 font-mono text-[10px] font-bold border rounded shrink-0 uppercase tracking-wider text-center min-w-[85px] ${badgeColor}`}>
                      {trade.type}
                    </span>
                    <h3 className="text-slate-200 text-xs md:text-sm font-semibold truncate group-hover:text-amber-400 transition-colors">
                      {trade.title}
                    </h3>
                  </div>

                  {/* Right part: Author info + date + Chevron arrow */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-slate-400 font-mono text-[11px]">
                    <div className="text-right flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-slate-300 font-sans font-medium text-xs sm:text-[11px]">
                        {trade.authorName || "Hội viên"}
                      </span>
                      {trade.authorCompanyName && (
                        <span className="text-slate-500 text-[10px] max-w-[120px] sm:max-w-xs truncate hidden sm:inline">
                          ({trade.authorCompanyName})
                        </span>
                      )}
                      <span className="text-slate-600 font-mono text-[10px] md:text-[11px]">
                        • {new Date(trade.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RE-ORDERED SECTION 2: SỰ KIỆN NETWORKING / DIỄN ĐÀN */}
      <div id="home_featured_events" className="space-y-6 pt-4">
        <div className="flex items-end justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/35 text-amber-400 text-[10.5px] font-mono uppercase tracking-wider mb-2.5 shadow-md shadow-black/30">
              <Calendar className="h-3.5 w-3.5" /> CHƯƠNG TRÌNH & SỰ KIỆN GIAO THƯƠNG
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-100 flex items-center gap-2">
              SỰ KIỆN NỔI BẬT
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Lịch trình các sự kiện Business Tour, Diễn đàn kinh tế đã được Ban Quản Trị phê duyệt hiển thị.
            </p>
          </div>
          <button
            onClick={() => onNavigate("events")}
            className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 font-mono uppercase font-bold tracking-wider cursor-pointer bg-transparent border-0"
          >
            Tất cả sự kiện <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl h-[380px]"></div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <p className="text-slate-500 text-sm italic">Chưa có sự kiện nổi bật nào được cập nhật trên trang chủ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-slate-900 border border-slate-800/60 hover:border-amber-500/20 rounded-xl overflow-hidden flex flex-col justify-between transition-all group hover:-translate-y-1 shadow-lg shadow-black/30"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                    <img
                      src={event.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop"}
                      alt={event.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 shadow-md font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 z-10 select-none animate-pulse">
                      <Star className="h-3 w-3 fill-slate-950 text-slate-950" />
                      <span>HOT</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-slate-950/95 text-amber-500 border border-amber-500/15 rounded px-2 py-0.5 font-mono text-[10px]">
                      {new Date(event.dateTime).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4
                      onClick={() => onNavigate("events", { id: event.id })}
                      className="text-base font-serif font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                    >
                      {event.title}
                    </h4>
                    <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed font-sans">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-800/40 mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300 pt-3">
                    <MapPin className="h-4 w-4 text-amber-500/80 flex-shrink-0" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-400 hover:underline transition-colors truncate text-[11px]"
                      title="Xem trên Google Maps - Bấm để mở bản đồ"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.location}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="truncate max-w-[120px]">Đơn vị: {event.organizerUnit}</span>
                    <button
                      onClick={() => onNavigate("events", { id: event.id })}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 rounded text-[10px] text-slate-950 font-bold tracking-wider transition-colors cursor-pointer border-0"
                    >
                      XEM CHI TIẾT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RE-ORDERED SECTION 3: TIN TỨC & BÀI VIẾT NGHỊ SỰ */}
      <div id="home_featured_news" className="space-y-6 pt-4">
        <div className="flex items-end justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/35 text-amber-400 text-[10.5px] font-mono uppercase tracking-wider mb-2.5 shadow-md shadow-black/30">
              <FileText className="h-3.5 w-3.5" /> CHIA SẺ & CẬP NHẬT
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-100 flex items-center gap-2">
              CHIA SẺ
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-sans">
              Ghi nhận tin tức thị trường kinh tế vĩ mô, cẩm nang quản trị của Ban Điều hành và các CEO thành viên.
            </p>
          </div>
          <button
            onClick={() => onNavigate("posts")}
            className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 font-mono uppercase font-bold tracking-wider cursor-pointer bg-transparent border-0"
          >
            Tất cả bài viết <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl h-[340px]"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <p className="text-slate-500 text-sm italic">Chưa có bài viết chia sẻ tiêu biểu nào được công bố.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800/60 hover:border-amber-500/10 rounded-xl overflow-hidden flex flex-col justify-between transition-all group shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                    <img
                      src={post.imageUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop"}
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/90 text-amber-500 border border-amber-500/15 rounded-md px-2 py-0.5 text-[9px] font-mono uppercase font-semibold">
                      {post.category || "Tin tức"}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      Đăng ngày {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <h4
                      onClick={() => onNavigate("posts", { id: post.id })}
                      className="text-base font-serif font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                    >
                      {post.title}
                    </h4>
                    <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed font-sans">
                      {post.content.replace(/[#*`_]/g, "")}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 mt-2">
                  <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-slate-300 text-[11px] font-semibold truncate leading-none mb-0.5">
                        {post.authorName}
                      </p>
                      <p className="text-slate-500 text-[9px] font-mono truncate leading-none">
                        {post.authorRole || "Thành viên"}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate("posts", { id: post.id })}
                      className="text-[10px] font-bold text-amber-500 hover:text-amber-400 font-mono tracking-wider transition-colors cursor-pointer flex items-center gap-0.5 uppercase bg-transparent border-0"
                    >
                      Chi tiết →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column top header bento block (Moved here below the news block) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        
        {/* HERO TILE (col-span-8) */}
        <div id="home_hero_tile" className="lg:col-span-8 bg-slate-800 rounded-2xl border border-white/5 p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[350px]">
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-4 relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-amber-500/35 text-amber-400 text-[11px] font-mono uppercase tracking-[0.12em] font-medium shadow-md shadow-black/30">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              NỀN TẢNG KẾT NỐI DOANH NHÂN TINH HOA HÀNG ĐẦU VIỆT NAM
            </div>
            
            <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-[1.1] text-slate-100 uppercase italic">
              CEO KẾT NỐI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">DOANH NGHIỆP THẮNG LỚN</span>
            </h1>
            
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-sans font-light">
              CEO Matching là vũ đài giao thương thượng lưu - tích hợp Thuật toán tương hợp dữ liệu AI tân tiến bậc nhất lý tưởng để tìm kiếm đối tác liên kết lý tưởng, tối ưu hoá chuỗi cung ứng và mở ra các bàn nghị sự hợp tác đổi đời.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-6 relative z-10">
            {!currentUser || currentUser.id === 0 ? (
              <>
                <button
                  id="btn_home_signup"
                  onClick={() => onNavigate("auth")}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs tracking-wider rounded-lg transition-all active:scale-95 shadow-md shadow-amber-900/10 cursor-pointer border-0 uppercase"
                >
                  GIA NHẬP HỘI VIÊN CEO
                </button>
                <button
                  id="btn_home_browse"
                  onClick={() => onNavigate("members")}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  THAM QUAN DANH SÁCH HỘI VIÊN
                </button>
              </>
            ) : (
              <>
                <button
                  id="btn_home_matching"
                  onClick={() => onNavigate("matching")}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs tracking-wider rounded-lg transition-all active:scale-95 shadow-md shadow-amber-900/10 flex items-center gap-2 cursor-pointer border-0 uppercase"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-bounce" />
                  KHỞI CHẠY AI MATCHING ĐỒNG LUỒNG
                </button>
                <button
                  id="btn_home_profile"
                  onClick={() => onNavigate("profile")}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  VĂN PHÒNG HỒ SƠ CỦA BẠN
                </button>
              </>
            )}
          </div>
        </div>

        {/* PRIVACY HIGHLIGHT BENTO BLOCK (col-span-4) */}
        <div id="home_privacy_tile" className="lg:col-span-4 bg-slate-800 rounded-2xl border border-white/5 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-amber-500 font-mono font-medium">QUYỀN RIÊNG TƯ TUYỆT ĐỐI</h3>
            <h2 className="text-2xl font-serif text-slate-100 font-medium leading-snug italic">
              Bảo mật 5 lớp & Chủ động ẩn thông tin nhạy cảm
            </h2>
            <p className="text-slate-400 text-xs font-sans leading-relaxed font-light">
              Doanh nhân được quyền tự định đoạt hiển thị hay che giấu hoàn toàn số điện thoại cá nhân, doanh thu doanh nghiệp, liên kết lịch trình tức thì.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/5 mt-4">
            <div className="flex items-center justify-between text-xs font-sans text-slate-400">
              <span>Đếm số lần bảo vệ</span>
              <span className="font-mono text-amber-500 uppercase font-semibold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">Real-time guard</span>
            </div>
            <div className="flex items-center justify-between text-xs font-sans text-slate-400">
              <span>Mạng lưới phân quyền</span>
              <span className="font-mono text-emerald-500 uppercase font-semibold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">High Security</span>
            </div>
          </div>
        </div>

      </div>

      {/* GOOGLE & ZALO SOCIAL AUTH SECTION */}
      <div id="home_social_auth_section" className="space-y-6 pt-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-amber-500/35 text-amber-400 text-[10.5px] font-mono uppercase tracking-wider mb-2.5 shadow-md shadow-black/30">
            <Sparkles className="h-3.5 w-3.5" /> CỔNG ĐĂNG NHẬP LIÊN KẾT MẠNG XÃ HỘI TRỰC TIẾP
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-100 flex items-center gap-2">
            ĐĂNG NHẬP GOOGLE & ZALO
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-sans">
            Thực hiện đăng nhập nhanh chóng thông qua việc liên kết tài khoản Google hoặc Zalo chính thức của bạn ngay tại đây.
          </p>
        </div>

        {socialError && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200 text-sm font-sans">
            ⚠️ {socialError}
          </div>
        )}

        {socialMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-emerald-200 text-sm font-sans font-medium">
            ✨ {socialMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GOOGLE CARD */}
          <div className="bg-slate-900 border border-slate-800 hover:border-red-500/20 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all group relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.42-2.42C17.047 1.34 14.713 0 12.24 0c-6.077 0-11 4.923-11 11s4.923 11 11 11c5.7 0 11.24-4 11.24-11 0-.75-.087-1.477-.24-1.714H12.24z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-slate-100">KẾT NỐI GOOGLE</h4>
                    <p className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Google Identity Service</p>
                  </div>
                </div>
                {currentUser ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-mono uppercase">Đã đăng nhập</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded font-mono uppercase font-bold">Sẵn sàng kết nối</span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed font-light">
                Xác thực an toàn tuyệt đối với máy chủ Google chính thức. Hệ thống tự động thiết lập và liên kết dữ liệu hồ sơ CEO của bạn một cách bảo mật nhất.
              </p>
            </div>

            <button
              onClick={() => handleSocialAuth("google")}
              className="w-full py-3 bg-slate-950 hover:bg-red-600 hover:text-white border border-slate-800 hover:border-red-500 text-slate-200 font-sans font-semibold rounded-xl text-xs tracking-wider transition-all active:scale-[0.98] uppercase cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.42-2.42C17.047 1.34 14.713 0 12.24 0c-6.077 0-11 4.923-11 11s4.923 11 11 11c5.7 0 11.24-4 11.24-11 0-.75-.087-1.477-.24-1.714H12.24z"/>
              </svg>
              {currentUser ? `Đồng bộ lại (${currentUser.fullName})` : "Xác thực & Đăng nhập Google"}
            </button>
          </div>

          {/* ZALO CARD */}
          <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/20 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all group relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <span className="h-5 w-5 rounded bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs font-sans antialiased shrink-0">Z</span>
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-slate-100">KẾT NỐI ZALO</h4>
                    <p className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Zalo Platform Application</p>
                  </div>
                </div>
                {currentUser ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded font-mono uppercase">Đã đăng nhập</span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded font-mono uppercase font-bold">Sẵn sàng kết nối</span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed font-light">
                Đăng nhập tức thì chỉ qua một phím chạm hoặc quét QR của Zalo. Bảo duyệt hồ sơ và thiết lập liên hệ trong các cuộc bàn đàm giao thương VIP nhanh chóng.
              </p>
            </div>

            <button
              onClick={() => handleSocialAuth("zalo")}
              className="w-full py-3 bg-slate-950 hover:bg-[#0068FF] hover:text-white border border-slate-800 hover:border-blue-500 text-blue-400 hover:text-white font-sans font-semibold rounded-xl text-xs tracking-wider transition-all active:scale-[0.98] uppercase cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="h-3.5 w-3.5 rounded bg-blue-500 scale-90 flex items-center justify-center text-white font-black text-[9px] font-sans antialiased shrink-0">Z</span>
              {currentUser ? `Đồng bộ lại (${currentUser.fullName})` : "Xác thực & Đăng nhập Zalo"}
            </button>
          </div>
        </div>
      </div>

      {/* RE-ORDERED SECTION 4: 4-BENTO COLUMN GRID STATS */}
      <div id="home_stats_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        
        {/* Stat 1 */}
        <div className="bg-slate-800 rounded-2xl border border-white/5 p-6 space-y-3 hover:border-amber-500/15 transition-all group flex flex-col justify-between">
          <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.15em] leading-none">HỘI VIÊN TINH ANH</p>
            <h4 className="text-3xl font-serif font-black text-slate-200 mt-2">2,500+ CEO</h4>
            <p className="text-slate-400 text-[11px] font-sans mt-1">Các tập đoàn, DN quy mô lớn.</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-slate-800 rounded-2xl border border-white/5 p-6 space-y-3 hover:border-amber-500/15 transition-all group flex flex-col justify-between">
          <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.15em] leading-none">DỰ ÁN PHÁT ĐỘNG</p>
            <h4 className="text-3xl font-serif font-black text-slate-200 mt-2">1,800+</h4>
            <p className="text-slate-400 text-[11px] font-sans mt-1">Kết cấu giao thương hoàn thành.</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-slate-800 rounded-2xl border border-white/5 p-6 space-y-3 hover:border-amber-500/15 transition-all group flex flex-col justify-between">
          <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.15em] leading-none">BIỂU LỊCH SỰ KIỆN</p>
            <h4 className="text-3xl font-serif font-black text-slate-200 mt-2">120+ / NĂM</h4>
            <p className="text-slate-400 text-[11px] font-sans mt-1">Hội thảo vĩ mô, Business Tour VIP.</p>
          </div>
        </div>

        {/* Stat 4 - Spotlight Gold highlight style */}
        <div className="bg-amber-500 rounded-2xl border border-white/5 p-6 space-y-3 flex flex-col justify-between text-black relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="h-10 w-10 bg-black/10 rounded-xl flex items-center justify-center text-black border border-black/10">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-black/60 text-[10px] font-mono uppercase tracking-[0.15em] leading-none">AI MATCHING KẾT QUẢ</p>
            <h4 className="text-3xl font-mono font-bold tracking-tight text-slate-950 mt-2">98.4%</h4>
            <p className="text-black/80 text-[11px] font-sans mt-1 leading-none">Hài lòng, mở rộng vòng giao lưu.</p>
          </div>
        </div>

      </div>

      {/* RE-ORDERED SECTION 5: CORE VALUES & IMAGE STAGE BENTO GRID */}
      <div id="home_core_values_grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TEXT CORE VALUES (col-span-7) */}
        <div className="lg:col-span-7 bg-slate-800 rounded-2xl border border-white/5 p-8 md:p-10 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-amber-500 font-mono">THUẬT TOÁN TƯƠNG HỢP MỚI</h3>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-100 leading-snug italic">
              Khai thác lợi thế thuật toán kết nối AI tối giản và thực chất
            </h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-sans font-light pt-2">
              Bản đồ kinh tế hội viên chứa đựng muôn vàn sản phẩm chiến lược. Hệ thống CEO Matching phân tích dữ liệu gắt gao của từng giám đốc: Lĩnh vực cần tìm, Nguồn lực thừa, Mong muốn đổi mới để thiết lập bàn giao thương chuẩn chỉ, tránh lãng phí thời gian và tiền bạc.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/5 mt-6 text-slate-300 text-xs font-sans">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Bảo mật tuyệt mật 5 lớp mã hoá thông tin CEO chiến lược.</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Mạng lưới điều phối đa cấp bậc Admin - Mod - Manager chuyên nghiệp.</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Gemini AI phân tích và thiết kế chiến lược bàn đàm phán tức thì.</span>
            </div>
          </div>
        </div>

        {/* FULL IMAGE GRID TILE (col-span-5) */}
        {spotlight.linkUrl ? (
          <a
            id="spotlight_banner_link"
            href={spotlight.linkUrl}
            target={spotlight.linkUrl.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!spotlight.linkUrl.startsWith("http")) {
                e.preventDefault();
                // If it's a relative view name like /posts or posts, navigate directly
                const cleanView = spotlight.linkUrl.replace(/^\//, "");
                onNavigate(cleanView);
              }
            }}
            className="lg:col-span-5 bg-slate-800 rounded-2xl border border-white/5 overflow-hidden group relative min-h-[300px] cursor-pointer block"
          >
            <img
              src={spotlight.imageUrl || "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop"}
              alt={spotlight.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 absolute inset-0"
              onError={(e: any) => {
                e.target.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop";
              }}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 space-y-1 text-left">
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/15 px-2.5 py-0.5 rounded-md font-extrabold">
                {spotlight.tag}
              </span>
              <h4 className="text-lg font-serif italic text-white font-medium group-hover:text-amber-300 transition-colors">
                {spotlight.title}
              </h4>
            </div>
          </a>
        ) : (
          <div
            id="spotlight_banner_div"
            className="lg:col-span-5 bg-slate-800 rounded-2xl border border-white/5 overflow-hidden group relative min-h-[300px]"
          >
            <img
              src={spotlight.imageUrl || "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop"}
              alt={spotlight.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 absolute inset-0"
              onError={(e: any) => {
                e.target.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop";
              }}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 space-y-1 text-left">
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/15 px-2.5 py-0.5 rounded-md font-extrabold">
                {spotlight.tag}
              </span>
              <h4 className="text-lg font-serif italic text-white font-medium">
                {spotlight.title}
              </h4>
            </div>
          </div>
        )}

      </div>

      {/* RE-ORDERED SECTION 6: Slogan card */}
      <div id="home_slogan_card" className="p-8 md:p-10 bg-slate-900 border border-white/5 rounded-2xl text-center relative overflow-hidden flex flex-col items-center justify-center space-y-2">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/[0.02] rounded-full blur-2xl"></div>
        <h4 className="text-amber-500 font-serif font-extrabold text-base md:text-lg italic tracking-wider leading-relaxed uppercase max-w-3xl">
          "Chúng tôi không chỉ kết nối con người. Chúng tôi kết nối vận mệnh doanh nghiệp."
        </h4>
        <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase">CEO MATCHING - HIGH-CLASS NETWORK ASSOCIATION</p>
      </div>

    </div>
  );
}
