import React, { useState, useEffect } from "react";
import { User } from "../types";
import { ShieldAlert, KeyRound, Building2, UserCircle2, Save, Sparkles, Phone, Mail, Award, Landmark, Link, Check, Eye, Image as ImageIcon, Palette, Plus, Trash2, QrCode } from "lucide-react";
import QRCodeModal from "./QRCodeModal";

interface ProfileSectionProps {
  currentUser: User | null;
  onRefreshUser: () => void;
  onNavigateToAuth: () => void;
}

export default function ProfileSection({ currentUser, onRefreshUser, onNavigateToAuth }: ProfileSectionProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Profile update states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [visionMission, setVisionMission] = useState("");
  const [industry, setIndustry] = useState("");
  const [bio, setBio] = useState("");
  const [matchingNeeds, setMatchingNeeds] = useState("");
  const [website, setWebsite] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [linkedinLink, setLinkedinLink] = useState("");

  // Custom states
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileColor, setProfileColor] = useState("#F59E0B"); // default amber-50
  const [companyImages, setCompanyImages] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // QR share states
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrTitle, setQrTitle] = useState("");
  const [qrSubtitle, setQrSubtitle] = useState("");

  const handleOpenQR = () => {
    if (!currentUser) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=members&id=${currentUser.id}`;
    setQrUrl(shareUrl);
    setQrTitle(`Hồ sơ Doanh nhân CEO ${currentUser.fullName}`);
    setQrSubtitle(`${currentUser.jobTitle || "Nhà điều hành"} @ ${currentUser.companyName || "Doanh nghiệp tự do"}`);
    setQrOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("⚠️ Dung lượng ảnh vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn để đảm bảo bảo mật & hiệu suất.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || "");
      setPhone(currentUser.phone_number || "");
      setEmail(currentUser.email || "");
      setJobTitle(currentUser.jobTitle || "");
      setCompanyName(currentUser.companyName || "");
      setCompanyDescription(currentUser.companyDescription || "");
      setProductDescription(currentUser.productDescription || "");
      setVisionMission(currentUser.visionMission || "");
      setIndustry(currentUser.industry || "Công nghệ thông tin");
      setBio(currentUser.bio || "");
      setMatchingNeeds(currentUser.matchingNeeds || "");
      setWebsite(currentUser.website || "");
      setFacebookLink(currentUser.facebookLink || "");
      setLinkedinLink(currentUser.linkedinLink || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setProfileImageUrl(currentUser.profileImageUrl || "");
      setProfileColor(currentUser.profileColor || "#F59E0B");
      setCompanyImages(currentUser.companyImages || []);
      setProductImages(currentUser.productImages || []);
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onNavigateToAuth();

    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          fullName,
          phone_number: phone,
          email,
          jobTitle,
          companyName,
          companyDescription,
          productDescription,
          visionMission,
          industry,
          bio,
          matchingNeeds,
          website,
          facebookLink,
          linkedinLink,
          avatarUrl,
          profileImageUrl,
          companyImages,
          productImages,
          profileColor
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi cập nhật hồ sơ");

      setSuccess(data.message);
      onRefreshUser();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và mật khẩu nhập lại không đồng điệu khớp nhau.");
      return;
    }

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi thay đổi mật khẩu");

      setPasswordSuccess(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12 max-w-xl mx-auto space-y-4 font-sans">
        <UserCircle2 className="h-12 w-12 text-slate-600 mx-auto" />
        <h4 className="text-slate-200 font-serif text-lg">Hồ Sơ Doanh Nhân Bảo Mật</h4>
        <p className="text-slate-400 text-xs">Vui lòng đăng nhập để bắt đầu chỉnh lý và theo dõi thông tin hồ sơ của bạn.</p>
        <button onClick={onNavigateToAuth} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 rounded text-slate-950 font-mono text-xs font-bold transition-colors">ĐĂNG NHẬP NGAY</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-3xl font-serif font-bold text-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-amber-500" />
            VĂN PHÒNG HỒ SƠ CEO CỦA BẠN
          </span>
          <span className={`px-3 py-1 text-xs font-mono font-bold tracking-widest rounded-full uppercase border ${
            currentUser.status === "Active" ? "bg-emerald-950 text-emerald-400 border-emerald-500/20" : "bg-amber-950 text-amber-500 border-amber-500/20"
          }`}>
            TRẠNG THÁI: {currentUser.status}
          </span>
        </h2>
        <p className="text-slate-400 mt-1 max-w-2xl text-sm leading-relaxed">
          Quản lý cách thông tin doanh nghiệp hiển thị trước hội đồng đối tác, theo dõi mức độ đóng góp bài đăng nghị luận kinh tế và nâng tầm ảnh hưởng.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left col: Password Changer & User brief info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Badge & brief info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="h-20 w-20 rounded-2xl object-cover mx-auto shadow-lg border-2"
                style={{ borderColor: currentUser.profileColor || "#F59E0B" }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="h-20 w-20 rounded-2xl bg-slate-950 border-2 flex items-center justify-center font-serif text-2xl font-bold mx-auto shadow-lg"
                style={{ borderColor: currentUser.profileColor || "#F59E0B", color: currentUser.profileColor || "#F59E0B" }}
               >
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="text-slate-100 font-serif font-bold text-lg">{currentUser.fullName}</h4>
              <p className="text-amber-500 font-mono text-xs uppercase tracking-wider">{currentUser.role} Hệ Thống</p>
              <p className="text-slate-400 text-xs mt-1.5 font-sans italic">"{currentUser.jobTitle || "Nhà sáng lập"} @ {currentUser.companyName || "Chưa định danh"}"</p>
            </div>
            {currentUser.profileImageUrl && (
              <div className="pt-3 border-t border-slate-800/60 mt-2 text-left">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest text-center mb-2">ẢNH BÌA ĐÃ THIẾT LẬP</p>
                <div className="relative aspect-[16/9] w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md">
                  <img src={currentUser.profileImageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Ảnh bìa" />
                </div>
              </div>
            )}

            <div className="pt-3.5 border-t border-slate-800/60 mt-2">
              <button
                type="button"
                onClick={handleOpenQR}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/20 text-amber-500 hover:text-amber-400 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <QrCode className="h-4 w-4" /> TRÌNH DIỄN MÃ QR HỒ SƠ
              </button>
            </div>
          </div>

          {/* Change password area */}
          <form onSubmit={handleChangePassword} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h4 className="text-amber-500 font-serif font-bold text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> THAY ĐỔI MẬT KHẨU
            </h4>
            
            {passwordError && <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-red-200 text-xs font-mono">⚠️ {passwordError}</div>}
            {passwordSuccess && <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-lg text-emerald-200 text-xs font-mono">🥇 {passwordSuccess}</div>}

            <div className="space-y-3 font-mono text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">MẬT KHẨU HIỆN TẠI *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">MẬT KHẨU MỚI *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-1">NHẬP LẠI MẬT KHẨU MỚI *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs rounded transition-all cursor-pointer font-bold tracking-wider"
              >
                CẬP NHẬT MẬT KHẨU AN NINH
              </button>
            </div>
          </form>
        </div>


        {/* Right col: Profile Editor Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
            <h4 className="text-amber-500 font-serif font-bold text-lg border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>HỒ SƠ GIAO THƯƠNG DOANH NGHIỆP</span>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded-lg flex items-center gap-1 transition-colors border-0 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> LƯU THAY ĐỔI
              </button>
            </h4>

            {error && <div className="p-4 bg-red-950/40 border border-red-500/25 rounded-lg text-red-200 text-xs font-mono">⚠️ {error}</div>}
            {success && <div className="p-4 bg-emerald-950/40 border border-emerald-500/25 rounded-lg text-emerald-200 text-xs font-mono">🥇 {success}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">HỌ VÀ TÊN CEO *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">EMAIL DOANH NHÂN</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">SỐ ĐIỆN THOẠI *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">CHỨC VỤ ĐIỀU HÀNH *</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">LĨNH VỰC HOẠT ĐỘNG</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none"
                  >
                    <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                    <option value="Nông nghiệp & Thực phẩm">Nông nghiệp & Thực phẩm</option>
                    <option value="Truyền thông & Sự kiện">Truyền thông & Sự kiện</option>
                    <option value="Vận tải & Logistics">Vận tải & Logistics</option>
                    <option value="Đầu tư tài chính">Đầu tư tài chính</option>
                    <option value="Bất động sản">Bất động sản</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">TÊN DOANH NGHIỆP *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">XÃ HỘI LIÊN KẾT (WEBSITE CHÍNH THỨC)</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">LINK FACEBOOK CÁ NHÂN</label>
                  <input
                    type="text"
                    value={facebookLink}
                    onChange={(e) => setFacebookLink(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">LINK LINKEDIN CHUYÊN NGHIỆP</label>
                  <input
                    type="text"
                    value={linkedinLink}
                    onChange={(e) => setLinkedinLink(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-mono mb-1.5">TIỂU SỬ KINH NGHIỆM ĐIỀU HÀNH *</label>
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm outline-none"
                  placeholder="Kinh nghiệm của quý CEO nâng tầm giá trị kết nối..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">GIỚI THIỆU SẢN PHẨM/DỊCH VỤ CỐT LÕI</label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm outline-none"
                    placeholder="Nhập mặt hàng, sản phẩm có mong muốn bàn giao thương mại..."
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">🎯 NHU CẦU MATCHING / SỨ MỆNH KINH TỂ *</label>
                  <textarea
                    required
                    value={matchingNeeds}
                    onChange={(e) => setMatchingNeeds(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-amber-500/20 focus:border-amber-500 rounded-lg p-3 text-slate-200 text-sm outline-none bg-amber-500/5"
                    placeholder="Nhu cầu: Cầm tìm kiếm CEO ngành giao vận vận tải Bắc Nam hợp tác chuyển giao..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">GIỚI THIỆU CÔNG TY</label>
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm outline-none"
                    placeholder="Giới thiệu quy mô, lịch sử phát triển hoặc hoạt động kinh doanh..."
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-mono mb-1.5">CÁC CỘNG ĐỒNG ĐÃ THAM GIA:</label>
                  <textarea
                    value={visionMission}
                    onChange={(e) => setVisionMission(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm outline-none"
                    placeholder="Các hiệp hội doanh nghiệp, câu lạc bộ, tổ chức hoặc cộng đồng kết nối khác mà bạn đã tham gia..."
                  />
                </div>
              </div>

              {/* THƯƠNG HIỆU CÁ NHÂN & MÀU CHỦ ĐẠO */}
              <div className="border-t border-slate-800 pt-6 mt-6">
                <h5 className="text-amber-500 font-serif font-bold text-base flex items-center gap-2 mb-4">
                  <Palette className="h-4 w-4" /> THƯƠNG HIỆU CÁ NHÂN & MÀU CHỦ ĐẠO
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Màu chủ đạo */}
                  <div>
                    <label className="block text-slate-400 text-xs font-mono mb-2">MÀU CHỦ ĐẠO CỦA TRANG PROFILE</label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {[
                        { name: "Gold", value: "#F59E0B" },
                        { name: "Sapphire", value: "#3B82F6" },
                        { name: "Emerald", value: "#10B981" },
                        { name: "Ruby", value: "#EF4444" },
                        { name: "Purple", value: "#8B5CF6" }
                      ].map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          onClick={() => setProfileColor(theme.value)}
                          className={`h-10 rounded-lg flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                            profileColor === theme.value ? "border-white bg-slate-800 scale-105" : "border-slate-800 bg-slate-950 hover:border-slate-700"
                          }`}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.value }} />
                          <span className="text-[9px] text-slate-400 font-mono mt-1">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                    {/* Custom Hex Choice */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px] font-mono">TỰ CHỌN HEX:</span>
                      <input
                        type="color"
                        value={profileColor}
                        onChange={(e) => setProfileColor(e.target.value)}
                        className="w-8 h-7 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={profileColor}
                        onChange={(e) => setProfileColor(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono outline-none"
                        placeholder="#HEX..."
                      />
                    </div>
                  </div>

                  {/* Ảnh đại diện */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-slate-400 text-xs font-mono">ẢNH ĐẠI DIỆN CEO (LINK URL / TẢI LÊN)</label>
                        <label className="cursor-pointer text-[10px] text-amber-500 font-mono flex items-center gap-1 bg-slate-950 px-2 py-0.5 border border-slate-800 rounded hover:border-amber-500/40">
                          <Plus className="h-2.5 w-2.5" /> TẢI LÊN FILE ẢNH
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setAvatarUrl)}
                          />
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-11 h-11 rounded-lg bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserCircle2 className="w-6 h-6 text-slate-600" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs outline-none"
                          placeholder="Tải từ máy hoặc dán link ảnh chân dung tại đây..."
                        />
                      </div>
                    </div>

                    {/* Ảnh Bìa (Facebook style) */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-slate-400 text-xs font-mono">ẢNH BÌA TRANG TRÍ (MÔ PHỎNG FACEBOOK COVER)</label>
                        <label className="cursor-pointer text-[10px] text-amber-500 font-mono flex items-center gap-1 bg-slate-950 px-2 py-0.5 border border-slate-800 rounded hover:border-amber-500/40">
                          <Plus className="h-2.5 w-2.5" /> TẢI LÊN FILE ẢNH
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, setProfileImageUrl)}
                          />
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-11 h-11 rounded-lg bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {profileImageUrl ? (
                            <img src={profileImageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={profileImageUrl}
                          onChange={(e) => setProfileImageUrl(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs outline-none"
                          placeholder="Tải từ máy hoặc dán link ảnh bìa tại đây..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ALBUM ẢNH DOANH NGHIỆP & SẢN PHẨM KHÁC */}
              <div className="border-t border-slate-800 pt-6 mt-6">
                <h5 className="text-amber-500 font-serif font-bold text-base flex items-center gap-2 mb-4">
                  <ImageIcon className="h-4 w-4" /> HÌNH ẢNH CÔNG TY & SẢN PHẨM PHONG PHÚ (5 ẢNH/KHOẢN)
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Album công ty */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <label className="text-slate-300 text-xs font-semibold font-serif">Hình ảnh công ty của bạn</label>
                      <span className="text-[10px] text-slate-500 font-mono">Tối đa 5 ảnh URL</span>
                    </div>

                    <div className="space-y-2">
                      {[0, 1, 2, 3, 4].map((ndx) => (
                        <div key={ndx} className="flex gap-2 items-center">
                          <span className="text-[10px] text-slate-400 font-mono w-4">#{ndx + 1}</span>
                          <input
                            type="text"
                            value={companyImages[ndx] || ""}
                            onChange={(e) => {
                              const updated = [...companyImages];
                              // Set or update
                              updated[ndx] = e.target.value;
                              // Store arrays reflecting exact indexes, or we filter out empty strings on submit/save
                              // But in react state we can keep them exactly as indexed, filling gaps with empty strings or keeping raw
                              setCompanyImages(updated);
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 text-xs outline-none focus:border-amber-500/40"
                            placeholder="Dán URL hình ảnh công ty..."
                          />
                          {companyImages[ndx] && (
                            <div className="w-7 h-7 rounded bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                              <img src={companyImages[ndx]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Album sản phẩm */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <label className="text-slate-300 text-xs font-semibold font-serif">Hình ảnh sản phẩm nổi bật</label>
                      <span className="text-[10px] text-slate-500 font-mono">Tối đa 5 ảnh URL</span>
                    </div>

                    <div className="space-y-2">
                      {[0, 1, 2, 3, 4].map((ndx) => (
                        <div key={ndx} className="flex gap-2 items-center">
                          <span className="text-[10px] text-slate-400 font-mono w-4">#{ndx + 1}</span>
                          <input
                            type="text"
                            value={productImages[ndx] || ""}
                            onChange={(e) => {
                              const updated = [...productImages];
                              updated[ndx] = e.target.value;
                              setProductImages(updated);
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 text-xs outline-none focus:border-amber-500/40"
                            placeholder="Dán URL hình ảnh sản phẩm..."
                          />
                          {productImages[ndx] && (
                            <div className="w-7 h-7 rounded bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                              <img src={productImages[ndx]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-sm flex items-center gap-1.5 transition-all outline-none border-0 cursor-pointer"
              >
                <Save className="h-4 w-4" /> LƯU THÔNG TIN HỒ SƠ CEO
              </button>
            </div>
          </form>
        </div>

      </div>

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
