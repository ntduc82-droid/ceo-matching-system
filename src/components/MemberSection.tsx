import React, { useEffect, useState } from "react";
import { User, Post, Event } from "../types";
import { Users2, Contact, ShieldCheck, Mail, Phone, Lock, Building, Briefcase, Award, Globe, Facebook, Linkedin, Video, HelpCircle, ArrowLeft, ChevronRight, Activity, Calendar, Share2, Check, QrCode } from "lucide-react";
import QRCodeModal from "./QRCodeModal";

interface MemberSectionProps {
  currentUser: User | null;
  onNavigateToAuth: () => void;
  onNavigateToMatching: () => void;
}

export default function MemberSection({ currentUser, onNavigateToAuth, onNavigateToMatching }: MemberSectionProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [memberPosts, setMemberPosts] = useState<Post[]>([]);
  const [memberEvents, setMemberEvents] = useState<Event[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // QR share states
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrTitle, setQrTitle] = useState("");
  const [qrSubtitle, setQrSubtitle] = useState("");

  const handleOpenQR = (m: User) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=members&id=${m.id}`;
    setQrUrl(shareUrl);
    setQrTitle(`Hồ sơ Doanh nhân CEO ${m.fullName}`);
    setQrSubtitle(`${m.jobTitle || "Nhà điều hành"} @ ${m.companyName || "Doanh nghiệp tự do"}`);
    setQrOpen(true);
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      const res = await fetch("/api/members", { headers });
      if (res.ok) {
        const data = await res.json();
        // Trộn ngẫu nhiên danh sách thành viên để hiển thị ngẫu nhiên chứ không theo thứ tự cố định
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setMembers(shuffled);
      } else {
        setError("Không thể tải danh sách CEO thành viên");
      }
    } catch (err) {
      console.error(err);
      setError("Mục mạng có sự cố kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (id: number) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=members&id=${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(String(id));
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  };

  useEffect(() => {
    fetchMembers();
  }, [currentUser]);

  // Tự động mở xem thành viên dạng deep link khi danh sách được tải xong
  useEffect(() => {
    if (members.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const memberIdParam = params.get("id");
      if (memberIdParam) {
        const matched = members.find((m) => m.id === Number(memberIdParam));
        if (matched && (!selectedMember || selectedMember.id !== matched.id)) {
          handleViewDetails(matched);
        }
      }
    }
  }, [members]);

  // Đồng bộ hóa địa chỉ URL khi thay đổi thành viên
  useEffect(() => {
    if (loading && members.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    if (selectedMember) {
      params.set("view", "members");
      params.set("id", String(selectedMember.id));
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else {
      if (!loading) {
        params.set("view", "members");
        params.delete("id");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    }
  }, [selectedMember, loading, members]);

  const handleViewDetails = async (member: User) => {
    setSelectedMember(member);
    setDetailLoading(true);
    try {
      const headers: any = {};
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      const res = await fetch(`/api/members/${member.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        // Cập nhật thông tin chi tiết và danh dách posts, events liên đới
        setMemberPosts(data.posts || []);
        setMemberEvents(data.events || []);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết thành viên:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (m.companyName && m.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (m.matchingNeeds && m.matchingNeeds.toLowerCase().includes(search.toLowerCase()));
    
    const matchesIndustry = industryFilter === "All" || m.industry === industryFilter;
    
    return matchesSearch && matchesIndustry;
  });

  const isPrivilegedWatcher = currentUser && ["Admin", "Mod"].includes(currentUser.role);

  const accentColor = selectedMember?.profileColor || "#F59E0B";
  const compImages = (selectedMember?.companyImages || []).filter(Boolean);
  const prodImages = (selectedMember?.productImages || []).filter(Boolean);

  return (
    <div className="space-y-8 font-sans">
      {/* 1. MEMBER DETAIL SCREEN */}
      {selectedMember ? (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                onClick={() => setSelectedMember(null)}
                className="text-xs font-mono transition-colors underline flex items-center gap-1.5 cursor-pointer bg-transparent border-0 hover:brightness-125 font-bold"
                style={{ color: accentColor }}
              >
                ← QUAY LẠI DANH SÁCH THÀNH VIÊN
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenQR(selectedMember)}
                  className="px-3 py-1.5 bg-slate-950/80 border border-slate-850 hover:border-amber-500/30 text-amber-500 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" /> MÃ QR HỒ SƠ
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(selectedMember.id)}
                  className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 hover:border-amber-500/30 text-amber-500 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === String(selectedMember.id) ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> ĐÃ SAO CHÉP LINK!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" /> CHIA SẺ HỒ SƠ CEO
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              {/* Cover Banner (Facebook style) */}
              <div className="h-48 md:h-64 bg-slate-950 border-b border-slate-800 relative">
                {selectedMember.profileImageUrl ? (
                  <img
                    src={selectedMember.profileImageUrl}
                    alt="Ảnh bìa Doanh nhân"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div 
                    className="w-full h-full bg-gradient-to-r from-slate-900 to-slate-900"
                    style={{ backgroundImage: `linear-gradient(to right, #0f172a, ${accentColor}1A, #0f172a)` }}
                  />
                )}
                {/* Overlay for legibility & premium touch */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                {/* Overlapping Avatar */}
                <div className="absolute -bottom-12 left-8 md:left-12 z-10">
                  {selectedMember.avatarUrl ? (
                    <img
                      src={selectedMember.avatarUrl}
                      alt={selectedMember.fullName}
                      className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover bg-slate-950 border-4 shadow-xl select-none"
                      style={{ borderColor: accentColor }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div 
                      className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-slate-950 border-4 flex items-center justify-center font-serif text-3xl font-bold shadow-xl select-none"
                      style={{ borderColor: accentColor, color: accentColor }}
                    >
                      {selectedMember.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isPrivilegedWatcher && (
                  <div className="absolute right-6 top-6 text-slate-950 font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded border border-white/15 flex items-center gap-1 z-10" style={{ backgroundColor: accentColor }}>
                    <ShieldCheck className="h-3 w-3" /> CHẾ ĐỘ XEM ADMIN
                  </div>
                )}
              </div>

              {/* Profile body */}
              <div className="pt-16 pb-8 px-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-100 flex items-center gap-2.5">
                      {selectedMember.fullName}
                    </h3>
                    <p className="font-mono text-xs mt-1 uppercase tracking-wider" style={{ color: accentColor }}>
                      {selectedMember.jobTitle} @ <span className="font-sans font-bold text-slate-300">{selectedMember.companyName || "Tự do"}</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Lĩnh vực hoạt động: <span className="text-slate-300 font-medium">{selectedMember.industry}</span></p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={onNavigateToMatching}
                      className="px-4 py-2 text-slate-950 text-xs font-bold font-mono tracking-wide rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer border-0"
                      style={{ backgroundImage: `linear-gradient(to right, ${accentColor}, ${accentColor}DD)` }}
                    >
                      🚀 KHOA KẾT NỐI AI MATCHING
                    </button>
                  </div>
                </div>

              {/* Bio & Details container */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-slate-800/80 pt-6">
                
                {/* Left col: Contact & Socials */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider border-b border-slate-800 pb-2" style={{ color: accentColor }}>Thông tin liên lạc bảo mật</h4>
                  
                  <div className="space-y-3 text-slate-300 text-sm">
                    {/* Số điện thoại */}
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />
                      <div className="text-xs">
                        <p className="text-slate-500 text-[10px] font-mono leading-none">SỐ ĐIỆN THOẠI</p>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedMember.phone_number}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />
                      <div className="text-xs">
                        <p className="text-slate-500 text-[10px] font-mono leading-none">EMAIL DOANH NHÂN</p>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedMember.email}</p>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="pt-2">
                      <p className="text-slate-500 text-[10px] font-mono mb-2">LIÊN KẾT GIAO THƯƠNG</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.website ? (
                          <a href={selectedMember.website} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-950 border border-slate-800 hover:border-amber-500/30 rounded text-slate-300 text-xs flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" style={{ color: accentColor }} /> Web
                          </a>
                        ) : null}
                        {selectedMember.facebookLink ? (
                          <a href={selectedMember.facebookLink} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-950 border border-slate-800 hover:border-amber-500/30 rounded text-slate-300 text-xs flex items-center gap-1">
                            <Facebook className="h-3.5 w-3.5" style={{ color: accentColor }} /> Facebook
                          </a>
                        ) : null}
                        {selectedMember.linkedinLink ? (
                          <a href={selectedMember.linkedinLink} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-950 border border-slate-800 hover:border-amber-500/30 rounded text-slate-300 text-xs flex items-center gap-1">
                            <Linkedin className="h-3.5 w-3.5" style={{ color: accentColor }} /> LinkedIn
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {!isPrivilegedWatcher && currentUser && currentUser.id !== selectedMember.id && (
                    <div className="p-3 rounded-lg border text-[10px] leading-relaxed text-slate-400 font-mono uppercase tracking-tight" style={{ backgroundColor: `${accentColor}0D`, borderColor: `${accentColor}1A` }}>
                      🔒 THÔNG TIN ĐÃ ĐƯỢC CHE GIẢU MỘT PHẦN HOẶC TOÀN BỘ ĐỂ ĐẢM BẢO QUY CHẾ AN TOÀN CEO. HỆ THỐNG SẼ TỰ ĐỘNG THÔNG BÁO VÀ CHIA SẺ THÔNG TIN KHI CẢ 2 BÊN KẾT NỐI MATCHING THÀNH CÔNG!
                    </div>
                  )}
                </div>

                {/* Mid & Right cols: Deep Descriptions */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider border-b border-slate-800 pb-2" style={{ color: accentColor }}>Tiểu sử điều hành & Doanh nghiệp</h4>
                    <p className="text-slate-300 text-sm mt-3 leading-relaxed whitespace-pre-line font-sans">
                      {selectedMember.bio || "Chưa thiết lập hồ sơ giới thiệu cá nhân."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h5 className="text-slate-400 font-mono text-[10px] uppercase">Giới thiệu Công ty</h5>
                      <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        <p>{selectedMember.companyDescription || "Chưa thiết lập."}</p>
                        
                        {/* Album Ảnh Công ty */}
                        {compImages.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-800/60">
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Ảnh thực tế công ty ({compImages.length}/5):</p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {compImages.map((imgUrl, idx) => (
                                <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="h-10 rounded bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 group block cursor-zoom-in">
                                  <img src={imgUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" alt={`Company Image ${idx + 1}`} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-slate-400 font-mono text-[10px] uppercase">Sản phẩm, Dịch vụ cốt lõi</h5>
                      <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        <p>{selectedMember.productDescription || "Chưa thiết lập."}</p>

                        {/* Album Ảnh Sản phẩm */}
                        {prodImages.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-800/60">
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">Hình ảnh sản phẩm ({prodImages.length}/5):</p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {prodImages.map((imgUrl, idx) => (
                                <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="h-10 rounded bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 group block cursor-zoom-in">
                                  <img src={imgUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" alt={`Product Image ${idx + 1}`} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <h5 className="text-slate-400 font-mono text-[10px] uppercase">Các cộng đồng đã tham gia</h5>
                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        {selectedMember.visionMission || "Chưa thiết lập."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-mono text-[10px] uppercase tracking-wider" style={{ color: accentColor }}>🎯 MONG MUỐN KẾT NỐI GIAO THƯƠNG</h5>
                      <p className="text-slate-200 text-xs font-semibold leading-relaxed whitespace-pre-line p-3 rounded-lg border" style={{ backgroundColor: `${accentColor}0D`, borderColor: `${accentColor}1A` }}>
                        {selectedMember.matchingNeeds || "Chưa thiết lập mục tiêu kết nối."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>


              {/* DANH SÁCH BÀI VIẾT & SỰ KIỆN CỦA RIÊNG THÀNH VIÊN ĐẤY */}
              <div className="border-t border-slate-800/80 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Posts of member */}
                <div className="space-y-4">
                  <h4 className="text-amber-500 font-serif font-bold text-lg border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-amber-500" />
                    Chia sẻ & Cơ hội của {selectedMember.fullName}
                  </h4>
                  {detailLoading ? (
                    <p className="text-slate-500 text-xs font-mono">Đang nạp bài biết...</p>
                  ) : memberPosts.length === 0 ? (
                    <p className="text-slate-500 text-xs font-sans">Thành viên chưa đăng chia sẻ nào trên sàn.</p>
                  ) : (
                    <div className="space-y-3">
                      {memberPosts.map((post) => (
                        <div key={post.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                          <h5 className="text-slate-200 font-serif font-bold text-sm line-clamp-1">{post.title}</h5>
                          <p className="text-slate-400 text-xs font-sans line-clamp-2 mt-1">{post.content}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-2">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Events of member */}
                <div className="space-y-4">
                  <h4 className="text-amber-500 font-serif font-bold text-lg border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    Hội thảo do {selectedMember.fullName} đề cử
                  </h4>
                  {detailLoading ? (
                    <p className="text-slate-500 text-xs font-mono">Đang nạp sự kiện...</p>
                  ) : memberEvents.length === 0 ? (
                    <p className="text-slate-500 text-xs font-sans">Thành viên chưa khởi xướng sự kiện nào mới.</p>
                  ) : (
                    <div className="space-y-3">
                      {memberEvents.map((ev) => (
                        <div key={ev.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex justify-between items-start">
                          <div>
                            <h5 className="text-slate-200 font-serif font-bold text-sm line-clamp-1">{ev.title}</h5>
                            <p className="text-slate-400 text-xs font-sans line-clamp-1 mt-1">📍 {ev.location}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-amber-500 text-[9px] font-mono rounded">
                            {new Date(ev.dateTime).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        // 2. MAIN LISTING SCREEN
        <div className="space-y-6">
          {/* Top filter banner */}
          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800/80 space-y-4 shadow-lg">
            <h3 className="text-amber-500 text-xs font-mono uppercase tracking-widest leading-none">BỘ LỌC ĐA NĂNG CEO</h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2 text-slate-200 text-sm outline-none font-sans"
                placeholder="Tìm kiếm CEO (Họ tên, công ty, mặt hàng cần tìm...)"
              />

              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none font-sans md:w-64"
              >
                <option value="All">Tất cả ngành nghề</option>
                <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                <option value="Nông nghiệp & Thực phẩm">Nông nghiệp & Thực phẩm</option>
                <option value="Truyền thông & Sự kiện">Truyền thông & Sự kiện</option>
                <option value="Vận tải & Logistics">Vận tải & Logistics</option>
                <option value="Đầu tư tài chính">Đầu tư tài chính</option>
                <option value="Bất động sản">Bất động sản</option>
              </select>
            </div>
          </div>

          {/* Members grid list */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-400 font-mono text-xs mt-3">Thẩm định danh sách CEO hội viên...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <Users2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-serif text-lg">Chưa tìm thấy CEO phù hợp</p>
              <p className="text-slate-550 text-xs mt-1 font-sans">Quý hội viên thử thay đổi từ khóa lọc tìm kiếm kinh tế.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => {
                const isMyOwn = currentUser && currentUser.id === member.id;
                const isMaskedEmail = member.email && member.email.includes("****");
                const isMaskedPhone = member.phone_number && member.phone_number.includes("****");

                return (
                  <div
                    key={member.id}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-xl overflow-hidden shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
                  >
                    {/* Header body */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <img 
                            src={member.avatarUrl} 
                            alt={member.fullName} 
                            className="h-12 w-12 rounded-xl object-cover bg-slate-950 border transition-transform group-hover:scale-105"
                            style={{ borderColor: member.profileColor || "rgba(245, 158, 11, 0.3)" }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div 
                            className="h-12 w-12 rounded-xl bg-slate-950 border flex items-center justify-center text-slate-100 font-serif font-bold text-xl select-none group-hover:scale-105 transition-transform"
                            style={{ borderColor: member.profileColor || "rgba(245, 158, 11, 0.3)", color: member.profileColor || "#F59E0B" }}
                          >
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="text-left">
                          <h4 className="text-slate-100 font-serif font-bold text-base tracking-wide flex items-center gap-1.5 leading-snug">
                            {member.fullName}
                          </h4>
                          <p className="font-mono text-[10px] tracking-wider uppercase leading-none mt-1" style={{ color: member.profileColor || "#F59E0B" }}>
                            {member.jobTitle}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-300 font-sans border-t border-slate-800/65 pt-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5 text-amber-500/80 flex-shrink-0" />
                          <span className="font-semibold text-slate-200 truncate">{member.companyName || "Tự do kinh doanh"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-mono text-[9px] uppercase mr-1">Ngành:</span>
                          <span className="px-2 py-0.5 bg-slate-950 rounded text-[10px] border border-slate-800 text-slate-300">{member.industry}</span>
                        </div>
                      </div>

                      {/* Display masked fields inside listing to indicate security rules */}
                      <div className="p-3 bg-slate-950/60 rounded-lg space-y-1.5 border border-slate-850">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500">PHONE:</span>
                          <span className="text-slate-300 flex items-center gap-1">
                            {isMaskedPhone && <Lock className="h-2.5 w-2.5 text-amber-500" />}
                            {member.phone_number || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500">EMAIL:</span>
                          <span className="text-slate-300 flex items-center gap-1">
                            {isMaskedEmail && <Lock className="h-2.5 w-2.5 text-amber-500" />}
                            <span className="truncate max-w-[150px]">{member.email || "—"}</span>
                          </span>
                        </div>
                      </div>
                      
                      {member.profileImageUrl && (
                        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                          <img 
                            src={member.profileImageUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-amber-500/90 font-mono text-[9px] uppercase tracking-wider">🎯 NHU CẦU PHÁT TRIỂN / SỨ MỆNH:</p>
                        <p className="text-slate-400 font-sans text-xs line-clamp-3 leading-relaxed italic bg-amber-500/5 p-2 rounded border border-amber-500/10">
                          "{member.matchingNeeds || "Chưa thiết lập cụ thể."}"
                        </p>
                      </div>
                    </div>

                    {/* Actions bar at bottom */}
                    <div className="bg-slate-950 p-4 border-t border-slate-800/80 flex gap-1.5 font-mono">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(member.id);
                        }}
                        className="px-2.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-amber-500 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        title="Sao chép link chia sẻ"
                      >
                        {copiedId === String(member.id) ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQR(member);
                        }}
                        className="px-2.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-amber-500 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        title="Xem mã QR của hồ sơ này"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleViewDetails(member)}
                        className="flex-1 py-2 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-900 rounded-lg text-slate-200 text-xs font-semibold tracking-wide transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        HỒ SƠ TOÀN DIỆN <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QRCode Modal */}
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
