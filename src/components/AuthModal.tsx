import React, { useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { KeyRound, UserPlus, Lock, Mail, Phone, Building, Briefcase, GraduationCap, Compass, Quote, Globe, Sparkles } from "lucide-react";

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Form states
  const [forgotCredential, setForgotCredential] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("Công nghệ thông tin");
  const [bio, setBio] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [visionMission, setVisionMission] = useState("");
  const [matchingNeeds, setMatchingNeeds] = useState("");
  
  // Links
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Xác minh nguồn gốc an toàn từ môi trường ứng dụng của bạn
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('ceomatching.com')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const socialUser = event.data.user;
        if (socialUser) {
          setMessage("Đăng nhập liên kết mạng xã hội thành công! Xin chào " + socialUser.fullName);
          setTimeout(() => {
            onSuccess(socialUser);
          }, 850);
        }
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  const handleSocialLogin = (provider: "google" | "zalo") => {
    setError("");
    setMessage("");
    
    // Tính toán kích thước cho cửa sổ popup hiển thị chính giữa toàn màn hình
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
      setError("Trình duyệt đã chặn cửa sổ Popup. Vui lòng cho phép quyền mở Popup trên trang web này để đăng nhập qua Google/Zalo.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi đăng nhập");
      }

      setMessage(data.message);
      setTimeout(() => {
        onSuccess(data.user);
      }, 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: forgotCredential,
          phone: forgotPhone,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi khôi phục mật khẩu");
      }

      setMessage(data.message);
      setForgotCredential("");
      setForgotPhone("");
      setForgotNewPassword("");
      setTimeout(() => {
        setIsForgot(false);
        setIsLogin(true);
        setError("");
        setMessage("");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const payload = {
        username,
        password,
        fullName,
        email,
        phone_number: phone,
        companyName,
        jobTitle,
        industry,
        bio,
        companyDescription,
        productDescription,
        visionMission,
        matchingNeeds,
        website,
        facebookLink: facebook,
        linkedinLink: linkedin,
        tiktokLink: tiktok
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi đăng ký");
      }

      setMessage(data.message);
      // Chờ duyệt
      setTimeout(() => {
        setIsLogin(true);
        setUsername(username);
        setPassword(password);
        setMessage("Bạn hiện có thể thử đăng nhập để kiểm chứng chờ duyệt.");
      }, 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-400">
          {isForgot ? "KHÔI PHỤC MẬT KHẨU TÀI KHOẢN" : isLogin ? "CỔNG ĐĂNG NHẬP CEO" : "ĐĂNG KÝ HỘI VIÊN CAO CẤP"}
        </h2>
        <p className="text-slate-400 text-sm mt-1 font-sans">
          {isForgot 
            ? "Xác minh tài khoản bằng email/username và số điện thoại đã đăng ký để đổi mật khẩu mới."
            : isLogin 
              ? "Chào mừng quý lãnh đạo quay lại với hệ sinh thái CEO Matching Network." 
              : "Hoàn thiện thông tin hồ sơ doanh nghiệp để kết nối giao thương."}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200 text-sm font-sans">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-emerald-200 text-sm font-sans font-medium">
          ✨ {message}
        </div>
      )}

      {isForgot ? (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-mono mb-1">TÊN ĐĂNG NHẬP HOẶC EMAIL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={forgotCredential}
                onChange={(e) => setForgotCredential(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm font-sans outline-none transition-colors"
                placeholder="Nhập tên đăng nhập hoặc email đăng ký"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-mono mb-1">SỐ ĐIỆN THOẠI ĐĂNG KÝ *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm font-sans outline-none transition-colors"
                placeholder="Ví dụ: 0912345678"
              />
            </div>
            <p className="text-slate-500 text-[10px] font-sans mt-1">Để tăng tính xác thực, số điện thoại phải trùng khớp với hồ sơ đã đăng ký của bạn.</p>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-mono mb-1">MẬT KHẨU MỚI BẢO MẬT *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm font-sans outline-none transition-colors"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-slate-950 font-sans font-semibold rounded-lg text-sm transition-all shadow-lg shadow-amber-900/10 active:scale-[0.98] uppercase cursor-pointer"
          >
            {loading ? "ĐANG THIẾT LẬP LẠI..." : "ĐẶT LẠI MẬT KHẨU MỚI"}
          </button>
        </form>
      ) : isLogin ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-mono mb-1">TÊN ĐĂNG NHẬP / EMAIL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm font-sans outline-none transition-colors"
                placeholder="Nhập tên đăng nhập hoặc email"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-slate-300 text-xs font-mono">MẬT KHẨU BẢO MẬT</label>
              <button
                type="button"
                onClick={() => {
                  setIsForgot(true);
                  setIsLogin(false);
                  setError("");
                  setMessage("");
                }}
                className="text-amber-500 hover:text-amber-400 text-xs font-sans transition-colors cursor-pointer outline-none border-none bg-transparent"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 text-sm font-sans outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-slate-950 font-sans font-semibold rounded-lg text-sm transition-all shadow-lg shadow-amber-900/10 active:scale-[0.98]"
          >
            {loading ? "ĐANG THẨM ĐỊNH..." : "XÁC NHẬN ĐĂNG NHẬP"}
          </button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative bg-[#0b0f19] px-3.5 text-[10.5px] text-slate-500 font-mono uppercase tracking-widest">Hoặc tiếp tục với</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold font-sans transition-all active:scale-[0.97] duration-150 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.42-2.42C17.047 1.34 14.713 0 12.24 0c-6.077 0-11 4.923-11 11s4.923 11 11 11c5.7 0 11.24-4 11.24-11 0-.75-.087-1.477-.24-1.714H12.24z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("zalo")}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0068FF]/10 hover:bg-[#0068FF]/20 border border-[#0068FF]/30 hover:border-[#0068FF]/40 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-semibold font-sans transition-all active:scale-[0.97] duration-150 cursor-pointer"
            >
              <span className="h-4 w-4 rounded bg-[#0068FF] text-white flex items-center justify-center font-bold text-[10px] font-sans antialiased shrink-0">Z</span>
              Zalo
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
            <h4 className="text-amber-500 text-xs font-mono uppercase tracking-wider mb-3">1. Hồ sơ tài khoản hội viên</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">TÊN ĐĂNG NHẬP *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="Ví dụ: ceonam"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">MẬT KHẨU TRUY CẬP *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
            <h4 className="text-amber-500 text-xs font-mono uppercase tracking-wider mb-3">2. Thông tin thương hiệu & CEO chuyên sâu</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">HỌ VÀ TÊN CEO *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="Nhập họ tên đầy đủ"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">TÊN DOANH NGHIỆP</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="Ví dụ: Công ty Cổ phần TechVina"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">CHỨC VỤ ĐẢM NHIỆM</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="Ví dụ: Chủ tịch HĐQT, Founder"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">SỐ ĐIỆN THOẠI</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="Ví dụ: 0988xxxxxx"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">EMAIL LIÊN HỆ *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="ceo@tencongty.com"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">NGÀNH NGHỀ / LĨNH VỰC</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none"
                >
                  <option value="Công nghệ thông tin">Công nghệ thông tin (IT / AI)</option>
                  <option value="Nông nghiệp & Thực phẩm">Nông nghiệp & Thực phẩm</option>
                  <option value="Truyền thông & Sự kiện">Truyền thông & Sự kiện</option>
                  <option value="Vận tải & Logistics">Vận tải & Logistics</option>
                  <option value="Đầu tư tài chính">Đầu tư tài chính</option>
                  <option value="Bất động sản">Bất động sản</option>
                  <option value="Xây dựng & Kiến trúc">Xây dựng & Kiến trúc</option>
                  <option value="Y tế & Sức khỏe">Y tế & Sức khỏe</option>
                  <option value="Giáo dục & Đào tạo">Giáo dục & Đào tạo</option>
                  <option value="Thương mại & Bán lẻ">Thương mại & Bán lẻ</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">TIỂU SỬ CÁ NHÂN / BIO</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-3 text-slate-200 text-sm outline-none"
                  placeholder="Tóm tắt ngắn gọn năng lực bản thân, số năm kinh nghiệm điều hành..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-mono mb-1">MÔ TẢ DOANH NGHIỆP</label>
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-3 text-slate-200 text-sm outline-none"
                    placeholder="Quy mô hoạt động, phân khúc thị trường..."
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-mono mb-1">SẢN PHẨM / DỊCH VỤ THẾ MẠNH</label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-3 text-slate-200 text-sm outline-none"
                    placeholder="Những sản phẩm chủ lực mong muốn giới thiệu..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
            <h4 className="text-amber-500 text-xs font-mono uppercase tracking-wider mb-3">3. Mạng xã hội & Mong muốn kết nối</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">WEBSITE</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">FACEBOOK LINK</label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="https://fb.com/..."
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">LINKEDIN LINK</label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">TIKTOK LINK</label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none"
                  placeholder="https://tiktok.com/@..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">CÁC CỘNG ĐỒNG ĐÃ THAM GIA</label>
                <textarea
                  value={visionMission}
                  onChange={(e) => setVisionMission(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-3 text-slate-200 text-sm outline-none"
                  placeholder="Các hiệp hội doanh nghiệp, câu lạc bộ, tổ chức hoặc cộng đồng kết nối khác mà bạn đã tham gia..."
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">MONG MUỐN KẾT NỐI (MATCHING GOALS) *</label>
                <textarea
                  required
                  value={matchingNeeds}
                  onChange={(e) => setMatchingNeeds(e.target.value)}
                  rows={2.5}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-3 text-slate-200 text-sm outline-none"
                  placeholder="Mô tả CHI TIẾT đối tác bạn đang tìm kiếm (ví dụ: Tìm quỹ đầu tư tài chính từ 200k USD, Tìm đại lý phân phối nông sản phía Nam...)"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs font-sans">
            <input type="checkbox" required defaultChecked className="rounded border-slate-800 text-amber-500 bg-slate-950" />
            <span>Tôi xin cam kết toàn bộ thông tin CEO và nhãn hàng là chính xác, chịu trách nhiệm pháp lý.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-slate-950 font-sans font-semibold rounded-lg text-sm transition-all shadow-lg shadow-amber-900/10 active:scale-[0.98]"
          >
            {loading ? "HỆ THỐNG ĐANG KIỂM DUYỆT..." : "GỬI HỒ SƠ ĐĂNG KÝ XÉT DUYỆT"}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-sm">
        {isForgot ? (
          <button
            type="button"
            onClick={() => {
              setIsForgot(false);
              setIsLogin(true);
              setError("");
              setMessage("");
            }}
            className="text-amber-500 hover:text-amber-400 transition-colors underline bg-transparent border-0 outline-none cursor-pointer"
          >
            Quay lại cổng Đăng Nhập
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsForgot(false);
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            className="text-amber-500 hover:text-amber-400 transition-colors underline bg-transparent border-0 outline-none cursor-pointer"
          >
            {isLogin 
              ? "Chưa có tài khoản? Gửi đơn đăng ký Gia Nhập" 
              : "Đã đăng ký trước đây? Quay lại Đăng Nhập"}
          </button>
        )}
      </div>
    </div>
  );
}
