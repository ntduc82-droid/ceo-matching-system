import React, { useEffect, useState } from "react";
import { User, Trade, TradeComment } from "../types";
import { 
  Plus, 
  Trash2, 
  Lock, 
  AlertCircle, 
  Sparkles, 
  Send, 
  Phone, 
  Mail, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  User as UserIcon, 
  Building2, 
  Share2, 
  Check, 
  X,
  LockKeyhole,
  QrCode
} from "lucide-react";
import QRCodeModal from "./QRCodeModal";

interface TradeSectionProps {
  currentUser: User | null;
  onNavigateToAuth: () => void;
}

export default function TradeSection({ currentUser, onNavigateToAuth }: TradeSectionProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create Post Form States
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Tìm đối tác"); // "Cần mua" | "Cần bán" | "Tìm đối tác" | "Khác"
  const [content, setContent] = useState("");
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Expander & Comments States
  const [expandedTradeId, setExpandedTradeId] = useState<number | null>(null);
  const [comments, setComments] = useState<TradeComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");

  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // QR share states
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrTitle, setQrTitle] = useState("");
  const [qrSubtitle, setQrSubtitle] = useState("");

  const handleOpenQR = (t: Trade, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=trades&id=${t.id}`;
    setQrUrl(shareUrl);
    setQrTitle(`Tin giao thương - ${t.type}`);
    setQrSubtitle(t.title);
    setQrOpen(true);
  };

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trades");
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      } else {
        setError("Không thể tải danh sách giao thương");
      }
    } catch (err) {
      console.error("Lỗi fetch trades:", err);
      setError("Mục mạng có sự cố kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  // Tự động mở rộng xem tin giao thương khi có deep link từ URL
  useEffect(() => {
    if (trades.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const tradeIdParam = params.get("id");
      if (tradeIdParam) {
        const idNum = Number(tradeIdParam);
        const exists = trades.find(t => t.id === idNum);
        if (exists && expandedTradeId !== idNum) {
          setExpandedTradeId(idNum);
          if (currentUser) {
            fetchComments(idNum);
          }
        }
      }
    }
  }, [trades]);

  // Đồng bộ hóa URL khi mở rộng/thu gọn tin giao thương
  useEffect(() => {
    if (loading && trades.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    if (expandedTradeId) {
      params.set("view", "trades");
      params.set("id", String(expandedTradeId));
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else {
      if (!loading) {
        params.set("view", "trades");
        params.delete("id");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    }
  }, [expandedTradeId, loading, trades]);

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onNavigateToAuth();

    setError("");
    setSuccess("");

    if (!title.trim() || !content.trim()) {
      setError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    try {
      const url = editingTrade ? `/api/trades/${editingTrade.id}` : "/api/trades";
      const method = editingTrade ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ title, content, type })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xử lý tin giao thương");
      }

      setSuccess(data.message || "Xử lý tin giao thương thành công!");
      setTitle("");
      setContent("");
      setType("Tìm đối tác");
      setEditingTrade(null);
      setShowCreate(false);
      fetchTrades();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTrade = async (tradeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin giao thương này không? Thao tác này không thể khôi phục.")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser?.id || ""}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Xóa tin giao thương thành công!");
        if (expandedTradeId === tradeId) {
          setExpandedTradeId(null);
        }
        fetchTrades();
      } else {
        setError(data.error || "Gặp lỗi khi xóa tin giao thương.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ để thực hiện xóa.");
    }
  };

  // Fetch comments of a trade
  const fetchComments = async (tradeId: number) => {
    setCommentsLoading(true);
    setCommentError("");
    try {
      const res = await fetch(`/api/trades/${tradeId}/comments`, {
        headers: {
          "Authorization": `Bearer ${currentUser?.id || ""}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Lỗi fetch comments:", err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleExpand = (tradeId: number) => {
    if (expandedTradeId === tradeId) {
      setExpandedTradeId(null);
      setComments([]);
      setCommentContent("");
      setCommentSuccess("");
      setCommentError("");
    } else {
      setExpandedTradeId(tradeId);
      setCommentContent("");
      setCommentSuccess("");
      setCommentError("");
      if (currentUser) {
        fetchComments(tradeId);
      }
    }
  };

  const handleSendComment = async (e: React.FormEvent, tradeId: number) => {
    e.preventDefault();
    if (!currentUser) return onNavigateToAuth();

    setCommentError("");
    setCommentSuccess("");

    if (!commentContent.trim()) {
      setCommentError("Vui lòng điền nội dung.");
      return;
    }

    try {
      const res = await fetch(`/api/trades/${tradeId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ content: commentContent })
      });

      const data = await res.json();
      if (res.ok) {
        setCommentSuccess(data.message || "Đã gửi ý kiến phản hồi kết nối!");
        setCommentContent("");
        // Reload comments if we have the authority (so we see our new comment if we are author/admin)
        const isTradeOwner = trades.find(t => t.id === tradeId)?.authorId === currentUser.id;
        const isStaff = ["Admin", "Mod", "Manager"].includes(currentUser.role);
        if (isTradeOwner || isStaff) {
          fetchComments(tradeId);
        }
      } else {
        setCommentError(data.error || "Gặp lỗi khi gửi liên hệ.");
      }
    } catch (err) {
      setCommentError("Lỗi kết nối máy chủ.");
    }
  };

  const handleDeleteComment = async (tradeId: number, commentId: number) => {
    if (!window.confirm("Bạn có tin chắc muốn xóa bình luận liên hệ này không?")) {
      return;
    }

    setCommentError("");
    setCommentSuccess("");

    try {
      const res = await fetch(`/api/trades/${tradeId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser?.id || ""}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setCommentSuccess(data.message || "Xóa phản hồi thành công.");
        fetchComments(tradeId);
      } else {
        setCommentError(data.error || "Lỗi khi xóa bình luận.");
      }
    } catch (err) {
      setCommentError("Không thể hoàn tất thao tác xóa.");
    }
  };

  const handleShareTrade = (tradeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=trades&id=${tradeId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(tradeId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Lỗi sao chép liên kết:", err);
    });
  };

  // Filter trades based on tabs
  const filteredTrades = trades.filter(t => {
    if (activeFilter === "Tất cả") return true;
    return t.type === activeFilter;
  });

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case "Cần mua":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Cần bán":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Tìm đối tác":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  // Helper properties to check user's quota
  const myTradesCount = currentUser ? trades.filter(t => t.authorId === currentUser.id).length : 0;
  const isAtQuotaLimit = currentUser && myTradesCount >= 3 && !["Admin", "Mod"].includes(currentUser.role);

  return (
    <div className="space-y-8 font-sans">
      {/* Intro Header Block */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 md:p-8 border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Chợ Giao thương B2B
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-slate-100 tracking-tight">
              KẾT NỐI & GIAO THƯƠNG CEO
            </h1>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Kênh truyền thống thúc đẩy liên minh, quảng bá danh mục sản phẩm, ký kết hợp tác thương mại 
              mở rộng thị trường của các hội viên trong mạng lưới CEO Matching.
            </p>
          </div>

          <div className="flex-shrink-0">
            {currentUser ? (
              <div className="flex flex-col items-stretch md:items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (showCreate) {
                      setEditingTrade(null);
                      setTitle("");
                      setContent("");
                      setType("Tìm đối tác");
                    }
                    setShowCreate(!showCreate);
                  }}
                  className={`px-5 py-3 rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 border shadow-lg cursor-pointer ${
                    showCreate
                      ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      : isAtQuotaLimit
                      ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-80"
                      : "bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-400/20"
                  }`}
                  disabled={!!(!showCreate && isAtQuotaLimit)}
                  title={isAtQuotaLimit ? "Bạn đã dùng hết hạn mức 3 bài đăng" : ""}
                >
                  {showCreate ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>Đóng khung đăng bản</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Đăng tin giao thương</span>
                    </>
                  )}
                </button>
                <div className="text-right text-[10px] text-slate-500 font-mono">
                  Đã đăng: <span className="text-amber-500 font-bold">{myTradesCount}</span> / 3 bài viết tối đa
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onNavigateToAuth}
                className="px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 rounded-lg text-xs font-mono font-bold tracking-widest uppercase hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <UserIcon className="h-4 w-4" />
                ĐĂNG NHẬP ĐỂ ĐĂNG BÀI
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2 text-left font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 text-left font-mono">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Đăng Tin Giao Thương */}
      {showCreate && currentUser && (
        <form onSubmit={handleCreateTrade} className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4 text-left">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-mono font-bold text-amber-500 tracking-wider uppercase flex items-center gap-2">
              <Plus className="h-4 w-4" /> {editingTrade ? "CẬP NHẬT TIN GIAO THƯƠNG" : "ĐĂNG TIN THƯƠNG MẠI MỚI"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bài đăng của bạn sẽ ngay lập tức được hiển thị đến các đối tác tiềm năng trên bảng giao thương.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-slate-400 text-xs font-mono">TIÊU ĐỀ TIN ĐĂNG *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tìm đơn vị cung ứng bao bì dệt PP xuất khẩu..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 text-xs font-mono">THỂ LOẠI GIAO DỊCH *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="Tìm đối tác">🤝 Tìm đối tác liên minh</option>
                <option value="Cần mua">🛒 Cần mua hàng hóa / dịch vụ</option>
                <option value="Cần bán">📦 Cần bán / Cung cấp giải pháp</option>
                <option value="Khác">🔍 Phân mục khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-400 text-xs font-mono">NỘI DUNG CHÍNH CHI TIẾT (Nhu cầu, Quy cách, số lượng, phương thức...) *</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hãy trình bày rõ ràng quy cách kỹ thuật, số lượng nhập/xuất, tầm giá mong muốn và thông tin định hình để hội viên dễ đánh giá độ tin cậy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span className="text-[10px] text-slate-500 font-mono">
              (*) Quản trị viên lưu ý các bài viết rác sẽ bị gỡ bỏ không báo trước.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditingTrade(null);
                  setTitle("");
                  setContent("");
                  setType("Tìm đối tác");
                }}
                className="px-4 py-2 text-xs font-mono bg-slate-950 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-mono bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{editingTrade ? "Cập nhật thay đổi" : "Đăng tin ngay"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Categories filter tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        {["Tất cả", "Cần mua", "Cần bán", "Tìm đối tác", "Khác"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeFilter === tab
                ? "bg-slate-950 text-amber-400 border-amber-500/50 shadow-md shadow-black/35"
                : "bg-slate-900 border-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-850 hover:border-slate-700"
            }`}
          >
            {tab === "Tất cả" ? "🌐 Tất cả tin" : tab}
          </button>
        ))}
      </div>

      {/* Trades Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-mono text-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-2"></div>
          <div>Đang kết giao dữ liệu thương mại...</div>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-16 text-center text-slate-500 space-y-2">
          <p className="text-sm font-mono">Chưa có bài viết giao thương nào thuộc mục này.</p>
          <p className="text-xs text-slate-600">Đăng nhập ngay để là người đầu tiên nắm bắt thời cơ kết nối giao dịch!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrades.map((trade) => {
            const isExpanded = expandedTradeId === trade.id;
            const isOwner = currentUser && trade.authorId === currentUser.id;
            const isStaff = currentUser && ["Admin", "Mod", "Manager"].includes(currentUser.role);
            const canDelete = isOwner || isStaff;
            const isAuthorizedToReadComments = isStaff || isOwner;

            return (
              <div 
                key={trade.id} 
                className={`bg-slate-900 border transition-all rounded-xl text-left overflow-hidden shadow-md ${
                  isExpanded ? "border-amber-500/50 ring-1 ring-amber-500/10 shadow-lg" : "border-slate-850 hover:border-slate-700"
                }`}
              >
                {/* Main Card Content */}
                <div 
                  className="p-5 md:p-6 cursor-pointer select-none"
                  onClick={() => handleToggleExpand(trade.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    {/* Author metadata */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-800/80 border border-amber-500/20 font-bold flex items-center justify-center text-sm text-amber-500 flex-shrink-0">
                        {trade.authorAvatarUrl ? (
                          <img 
                            src={trade.authorAvatarUrl} 
                            alt={trade.authorName} 
                            className="w-full h-full rounded-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          trade.authorName ? trade.authorName.charAt(0).toUpperCase() : "M"
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-200 text-xs font-bold font-serif md:text-sm tracking-wide">
                            {trade.authorName}
                          </span>
                          {trade.authorCompanyName && (
                            <span className="text-[10px] md:text-xs text-amber-500 font-mono font-medium max-w-[150px] md:max-w-xs truncate">
                              @{trade.authorCompanyName}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(trade.createdAt).toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Tag badge or Quick stats */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <span className={`px-2.5 py-1 rounded text-2xs uppercase tracking-widest border font-mono font-bold ${getBadgeStyles(trade.type)}`}>
                        {trade.type}
                      </span>
                    </div>
                  </div>

                  {/* Title and Body */}
                  <div className="space-y-2 mb-4">
                    <h2 className="text-base md:text-lg font-serif font-bold text-slate-100 leading-snug hover:text-amber-400 transition-colors">
                      {trade.title}
                    </h2>
                    <p className={`text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line ${isExpanded ? "" : "line-clamp-3"}`}>
                      {trade.content}
                    </p>
                  </div>

                  {/* Card bottom bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-950/80 mt-2 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-amber-500/80">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Mở liên kết / Ý kiến kết nối</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleOpenQR(trade, e)}
                        className="p-1 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1 text-[10px]"
                        title="Hiện mã QR kết nối nhanh"
                      >
                        <QrCode className="h-3 w-3 text-amber-500" />
                        <span>Xem QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleShareTrade(trade.id, e)}
                        className="p-1 px-2.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1 text-[10px]"
                        title="Chia sẻ đường dẫn liên kết"
                      >
                        {copiedId === trade.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Đã chép!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3 w-3" />
                            <span>Chia sẻ</span>
                          </>
                        )}
                      </button>

                      {currentUser && (["Admin", "Mod"].includes(currentUser.role) || trade.authorId === currentUser.id) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrade(trade);
                            setTitle(trade.title);
                            setContent(trade.content);
                            setType(trade.type);
                            setShowCreate(true);
                          }}
                          className="p-1 px-2.5 rounded bg-slate-950 border border-amber-500/30 text-amber-500 hover:text-amber-400 hover:border-amber-500/60 transition-all flex items-center gap-1 text-[10px]"
                          title="Sửa bài viết"
                        >
                          Sửa
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrade(trade.id, e)}
                          className="p-1 px-2.5 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 transition-all flex items-center gap-1 text-[10px]"
                          title="Xóa bài viết"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Xóa</span>
                        </button>
                      )}

                      <span className="p-1 text-slate-400 hover:text-slate-200">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Connection & Comments Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-850 bg-slate-950/40 p-5 md:p-6 space-y-6">
                    {/* Private locked feedback status indicator */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                      <LockKeyhole className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-left space-y-0.5">
                        <p className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                          HÀNH LANG KẾT NỐI BẢO MẬT GIAO THƯƠNG
                        </p>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Nút liên hệ này hoạt động như một bức thư gửi thẳng. Chỉ có <span className="text-slate-200 font-semibold font-serif">Chủ bài đăng</span>, Ban quản trị, Điều hành viên mới có thể thấy và phản hồi liên hệ của bạn. Toàn bộ các comment được ẩn kín tuyệt đối trước các thành viên thông thường khác.
                        </p>
                      </div>
                    </div>

                    {/* Left or Top: Send connection comment form */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-slate-350 uppercase tracking-widest text-left">
                        GỬI LIÊN HỆ GIAO THƯƠNG ĐẾN CHỦ TIN ĐĂNG
                      </h4>

                      {currentUser ? (
                        <form onSubmit={(e) => handleSendComment(e, trade.id)} className="space-y-3 text-left">
                          <div className="relative">
                            <textarea
                              rows={2.5}
                              value={commentContent}
                              onChange={(e) => setCommentContent(e.target.value)}
                              placeholder={`Chào anh/chị, tôi là ${currentUser.fullName} ở công ty ${currentUser.companyName || "doanh nghiệp"}, tôi rất quan tâm đến tin giao dịch này. Hãy kết nối trao đổi thêm qua điện thoại...`}
                              className="w-full bg-slate-950 border border-slate-800/80 focus:border-amber-500 rounded-lg p-3 text-slate-200 text-sm outline-none transition-colors placeholder-slate-650"
                            />
                          </div>

                          {commentError && (
                            <div className="text-[11px] text-red-500 font-mono bg-red-500/10 p-2.5 rounded border border-red-500/20">
                              Lỗi: {commentError}
                            </div>
                          )}
                          {commentSuccess && (
                            <div className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20">
                              {commentSuccess}
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="px-5 py-2 text-xs font-mono bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Gửi yêu cầu Kết nối</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-4 bg-slate-950 border border-slate-850/80 rounded-lg text-center text-slate-500 text-xs">
                          <p className="mb-2">Anh/Chị cần đăng nhập tài khoản thành viên để gửi lời nhắn kết nối đến đối tác này.</p>
                          <button
                            type="button"
                            onClick={onNavigateToAuth}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded font-mono text-2xs uppercase tracking-wider cursor-pointer"
                          >
                            Đăng nhập ngay
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right or Bottom: List of comments (Only visible to Author and Administrators) */}
                    <div className="space-y-3 pt-3 border-t border-slate-900/60">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-slate-350 uppercase tracking-widest">
                          DANH SÁCH KHÁCH KẾT NỐI TRỰC TUYẾN ({isAuthorizedToReadComments ? comments.length : "ĐÃ CHẦM BẢO MẬT"})
                        </h4>
                        {!isAuthorizedToReadComments && (
                          <span className="text-[10px] text-amber-500 font-mono flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20">
                            <Lock className="h-3 w-3" />
                            <span>Bảo mật cao</span>
                          </span>
                        )}
                      </div>

                      {isAuthorizedToReadComments ? (
                        /* Case 1: authorized to read private comments */
                        commentsLoading ? (
                          <div className="py-6 text-center text-slate-500 font-mono text-2xs animate-pulse">
                            Đang mở két khóa bảo mật dữ liệu...
                          </div>
                        ) : comments.length === 0 ? (
                          <div className="p-4 bg-slate-950/80 border border-dashed border-slate-800 rounded-lg text-center text-slate-650 text-xs">
                            <p className="font-mono">Chưa có thành viên nào nhấn nút liên hệ kết nối với bài đăng này.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {comments.map((c) => (
                              <div key={c.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-left">
                                <div className="space-y-2 flex-1">
                                  {/* Commenter metadata header */}
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-xs font-mono">
                                      {c.userAvatarUrl ? (
                                        <img 
                                          src={c.userAvatarUrl} 
                                          alt={c.userName} 
                                          className="w-full h-full rounded-full object-cover" 
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        c.userName ? c.userName.charAt(0).toUpperCase() : "U"
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-200 font-bold flex items-center gap-1.5 flex-wrap">
                                        <span>{c.userName}</span>
                                        {c.userCompanyName && (
                                          <span className="text-[10px] text-amber-500/90 font-mono">
                                            @{c.userCompanyName}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[9px] text-slate-500 font-mono">
                                        {new Date(c.createdAt).toLocaleString("vi-VN")}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Commenter communication credentials */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded border border-slate-800/80 font-mono text-[10px] text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="h-3 w-3 text-amber-500" />
                                      <span>Phái liên hệ: <strong className="text-slate-300">{c.userPhone || "Chưa gửi"}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Mail className="h-3 w-3 text-amber-500 shrink-0" />
                                      <span className="truncate">Thư điện tử: <strong className="text-slate-300">{c.userEmail || "Chưa gửi"}</strong></span>
                                    </div>
                                  </div>

                                  {/* Commenter message content body */}
                                  <p className="text-xs text-slate-300 pl-1 leading-relaxed whitespace-pre-line border-l border-slate-800 bg-slate-900/20 p-2 rounded">
                                    {c.content}
                                  </p>
                                </div>

                                <div className="self-end sm:self-auto flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(trade.id, c.id)}
                                    className="p-1 px-2 hover:bg-red-950/30 text-red-400 rounded hover:text-red-300 border border-transparent hover:border-red-900/30 transition-all font-mono text-[9px] cursor-pointer flex items-center gap-1"
                                    title="Xóa bình luận"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Gỡ bỏ</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        /* Case 2: normal visitors - locked message screen */
                        <div className="p-6 bg-slate-950 border border-slate-850/80 rounded-lg text-center text-slate-500 text-xs">
                          <p className="font-mono">🔒 CÁC BÌNH LUẬN NÀY ĐÃ ĐƯỢC ẨN BẰNG KHÓA MẬT MÃ BẢO VỆ CHỈ SỬ DỤNG CHO CHỦ BẢN ĐĂNG VÀ BAN QUẢN TRỊ.</p>
                          <p className="text-slate-600 text-[11px] mt-1">Anh/Chị có thể gửi lời nhắn kết nối của riêng mình cho chủ tin ở trên, thông tin hoàn toàn kín đáo.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
