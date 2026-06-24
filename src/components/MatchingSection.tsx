import React, { useState, useEffect } from "react";
import { User, Match } from "../types";
import { Sparkles, Users, Award, Percent, Globe, MessageSquare, ShieldCheck, HeartHandshake, Phone, Mail, ChevronRight, Check } from "lucide-react";

interface MatchingSectionProps {
  currentUser: User | null;
  onNavigateToAuth: () => void;
}

export default function MatchingSection({ currentUser, onNavigateToAuth }: MatchingSectionProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [latestMatchResult, setLatestMatchResult] = useState<Match | null>(null);
  const [historyMatches, setHistoryMatches] = useState<Match[]>([]);

  const fetchMembers = async () => {
    try {
      const headers: any = {};
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      const res = await fetch("/api/members", { headers });
      if (res.ok) {
        const data = await res.json();
        // Lọc bỏ chính mình ra khỏi danh sách kết nối
        const others = data.filter((m: User) => m.id !== currentUser?.id);
        setMembers(others);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistoryMatches = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/matching/history", {
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryMatches(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMembers();
      fetchHistoryMatches();
    }
  }, [currentUser]);

  const handleRunMatching = async () => {
    if (!currentUser) return onNavigateToAuth();
    if (!selectedPartnerId) {
      setError("Vui lòng lựa chọn một CEO đối tác để tiến hành phân tích.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setLatestMatchResult(null);

    try {
      const res = await fetch("/api/matching/ai-recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ targetUserId: Number(selectedPartnerId) })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi AI Matching");

      setLatestMatchResult(data);
      setSuccess("Phân tích thành công! Hai chủ doanh nghiệp đã được kết nối gia khương!");
      fetchHistoryMatches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activePartner = members.find(m => m.id === Number(selectedPartnerId));

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
          MẠNG MATCHING AI & ĐỀ XUẤT HỢP TÁC
        </h2>
        <p className="text-slate-400 mt-1 max-w-2xl text-sm font-sans">
          Trải nghiệm tính toán điểm tương thích kinh doanh độc bản và nhận ý kiến chuyên gia tư vấn chiến lược từ Mô hình Ngôn ngữ Lớn Gemini AI.
        </p>
      </div>

      {!currentUser ? (
        <div id="matching_guest_container" className="max-w-2xl mx-auto space-y-4">
          <div id="matching_guest_banner" className="text-center text-amber-400 text-base sm:text-lg font-serif font-bold uppercase tracking-wider py-2.5 px-4 bg-amber-500/10 border border-amber-500/25 rounded-xl">
            Hệ thống Matching bằng AI
          </div>
          <div id="matching_guest_content_box" className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
            <Users className="h-12 w-12 text-slate-600 mx-auto" />
            <h3 className="text-slate-200 font-serif font-semibold text-lg">Chào mừng Quý CEO</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Trang Matching là tính năng bảo mật độc quyền của hội viên. Quý CEO vui lòng đăng nhập hoặc gửi hồ sơ gia nhập để mở khoá.
            </p>
            <button
              id="matching_guest_login_btn"
              onClick={onNavigateToAuth}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded-lg transition-all"
            >
              ĐĂNG NHẬP / GIA NHẬP HỘI VIÊN
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Run Matching form */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit space-y-6">
            <h4 className="text-amber-500 font-serif font-bold text-lg tracking-wide border-b border-slate-800 pb-2 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-amber-500" />
              Khơi chạy kết nối
            </h4>

            {error && <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-200 text-xs rounded-lg">{error}</div>}
            {success && <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 text-xs rounded-lg">{success}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-mono mb-1.5">1. CHỌN CEO ĐỐI TÁC HƯỚNG TỚI *</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => {
                    setSelectedPartnerId(e.target.value === "" ? "" : Number(e.target.value));
                    setLatestMatchResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg p-3 text-slate-200 text-xs outline-none"
                >
                  <option value="">-- Lựa chọn CEO muốn bắt tay --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} - {m.companyName} ({m.industry})
                    </option>
                  ))}
                </select>
              </div>

              {activePartner && (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-850 space-y-2 text-xs text-slate-300">
                  <p className="text-slate-550 text-[10px] font-mono uppercase">Mục tiêu kết nối đối tác:</p>
                  <p className="italic text-slate-200 font-sans leading-relaxed">
                    "{activePartner.matchingNeeds || "Chưa cập nhật cụ thể."}"
                  </p>
                </div>
              )}

              <button
                onClick={handleRunMatching}
                disabled={loading || selectedPartnerId === ""}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-amber-800 disabled:to-amber-900 text-slate-950 font-bold text-sm rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full"></div>
                    <span className="font-mono text-xs">AI GEMINI ĐANG TƯ VY...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 animate-bounce" />
                    <span>LẬP KHUYẾN NGHỊ AI MATCHING</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Matching AI Recommendation Result Card */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Loading state visual indicator */}
            {loading && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-8 text-center space-y-4 shadow-xl">
                <Sparkles className="h-12 w-12 text-amber-500 animate-spin mx-auto" />
                <h4 className="text-xl font-serif font-semibold text-slate-200">Ký Kế Chương Trình AI Matching...</h4>
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-slate-400 text-xs animate-pulse">"Gemini đang bóc tách phân tích năng lực lõi và nhu cầu doanh nghiệp..."</p>
                  <p className="text-slate-500 text-[10px] font-mono uppercase">"Đang hoạch định 2 chủ đề bàn tròn chiến lược..."</p>
                </div>
              </div>
            )}

            {/* Match output results view */}
            {latestMatchResult && !loading && (
              <div className="bg-slate-900 border border-amber-500/15 rounded-xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Background glow circle */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <Percent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-mono leading-none">THƯỚC ĐO TƯƠNG ĐỒNG</p>
                      <h4 className="text-2xl font-serif font-black text-amber-400 mt-1">{latestMatchResult.matchScore}% TRÙNG KHỚP</h4>
                    </div>
                  </div>

                  {latestMatchResult.status === "Connected" ? (
                    <div className="px-3.5 py-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-lg flex items-center gap-1.5 uppercase font-bold self-start md:self-auto">
                      <Check className="h-4 w-4" /> TRẠNG THÁI: ĐÃ KẾT NỐI (CONNECTED)
                    </div>
                  ) : latestMatchResult.status === "Rejected" ? (
                    <div className="px-3.5 py-1.5 bg-red-950/80 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg flex items-center gap-1.5 uppercase font-bold self-start md:self-auto">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> TRẠNG THÁI: TỪ CHỐI
                    </div>
                  ) : (
                    <div className="px-3.5 py-1.5 bg-amber-950/80 border border-amber-500/30 text-amber-400 text-xs font-mono rounded-lg flex items-center gap-1.5 uppercase font-bold self-start md:self-auto">
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-amber-400 border-t-transparent rounded-full"></div> TRẠNG THÁI: CHỜ PHẢN HỒI
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* AI Advice area */}
                  <div className="space-y-2.5">
                    <h5 className="text-amber-500 font-mono text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Khuyến nghị bổ khuyết & phát huy từ Gemini AI:
                    </h5>
                    <div className="text-slate-300 font-sans text-sm md:text-base leading-relaxed bg-slate-950/60 p-5 rounded-xl border border-slate-850 whitespace-pre-line">
                      {latestMatchResult.aiRecommendation}
                    </div>
                  </div>

                  {/* Unlocking secret contact details warning! */}
                  <div className="p-4 bg-slate-950/85 border border-slate-850 rounded-xl space-y-3">
                    <h6 className="text-slate-200 font-mono text-xs uppercase tracking-wide flex items-center gap-1.5 leading-none">
                      🔒 THÔNG TIN LIÊN LẠC THÂN MẬT ĐỐI TÁC:
                    </h6>
                    {latestMatchResult.status === "Connected" ? (
                      <>
                        <p className="text-emerald-400 text-xs font-sans">
                          🎉 Thành công! Hai CEO đã chính thức chấp nhận kết nối và mở khóa thông tin liên lạc thật của nhau:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-500" />
                            <span>SĐT: {activePartner?.phone_number || "Chưa cập nhật"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-emerald-500" />
                            <span className="truncate">EMAIL: {activePartner?.email || "Chưa cập nhật"}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-550 text-xs font-sans">
                          ⚠️ Hệ thống đang chờ CEO {activePartner?.fullName || "đối tác"} duyệt phê chuẩn đồng ý kết nối để hiển thị thông tin thực đầy đủ đến Quý CEO.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-850 border-dashed">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="h-4 w-4 text-slate-600" />
                            <span>SĐT: {activePartner?.phone_number || "Chưa cập nhật"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Mail className="h-4 w-4 text-slate-600" />
                            <span className="truncate">EMAIL: {activePartner?.email || "Chưa cập nhật"}</span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-[10.5px] italic leading-normal">
                          * Lưu ý: Khi đối phương duyệt đồng ý, hệ thống của bạn sẽ tự động hiển thị thông tin gốc mà không cần chạy lại Matching.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Explanatory notes */}
            {!latestMatchResult && !loading && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-8 text-center text-slate-400 space-y-3 font-sans">
                <Users className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="text-slate-300 font-serif font-medium text-lg">Hệ Thống Sẵn Sàng Thiết Kế Bàn Kết Nối</h4>
                <p className="text-xs max-w-md mx-auto leading-relaxed">
                  Quý hội viên vui lòng chọn một CEO ở cột bên trái và bấm nút khởi tạo để bộ máy AI tiến hành trích xuất phân tích cơ cấu cơ hội đầu tư.
                </p>
              </div>
            )}

            {/* History of Matches list */}
            {historyMatches.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <h5 className="text-slate-400 font-mono text-xs uppercase tracking-widest leading-none mb-3">LỊCH SỬ KẾT NỐI DOANH NHÂN CỦA BẠN ({historyMatches.length})</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historyMatches.map(m => {
                    return (
                      <div key={m.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center text-xs text-slate-300 font-sans">
                        <div className="text-left space-y-1">
                          <p className="font-semibold text-slate-200">Cặp ghép mã #{m.id}</p>
                          <p className="text-slate-500 text-[10px] font-mono">ĐỒNG SỞ THÍCH: {m.commonInterests}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 font-mono font-bold text-[10px] rounded border border-amber-500/20">
                          {m.matchScore}% MATCH
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
