import React, { useState } from "react";
import { X, Copy, Check, Download, QrCode, Sparkles, ExternalLink } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
}

export default function QRCodeModal({ isOpen, onClose, url, title, subtitle }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  };

  const handleDownloadQR = async () => {
    setDownloading(true);
    try {
      // Gọi QRserver API với size lớn hơn để người dùng in ấn sắc nét (500x500)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=H&margin=15&data=${encodeURIComponent(url)}`;
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      // Chuẩn hóa tên file cho chuyên nghiệp
      const safeTitle = title
        .toLowerCase()
        .replace(/vn|ceo|vietnam/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .trim();
      link.download = `ceomatching_qr_${safeTitle || "code"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Lỗi tải xuống mã QR:", err);
      alert("Không thể tải trực tiếp file, vui lòng Click chuột phải vào mã QR và chọn 'Lưu hình ảnh dưới dạng...'");
    } finally {
      setDownloading(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&ecc=H&margin=10&data=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div 
        className="relative w-full max-w-sm bg-[#0b0f19] border border-amber-500/20 rounded-2xl p-6 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in-50 zoom-in-95"
        id="qr-modal-container"
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Header Indicator */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-mono uppercase tracking-widest mb-3">
            <Sparkles className="h-3 w-3" />
            <span>Mã QR Chia Sẻ nhanh</span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 tracking-tight leading-snug line-clamp-2 px-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1 italic">
              {subtitle}
            </p>
          )}
        </div>

        {/* QR Code Graphic Frame */}
        <div className="relative flex justify-center items-center my-6 bg-white p-3.5 rounded-2xl max-w-[240px] mx-auto shadow-inner border border-slate-800/20">
          <img
            src={qrImageUrl}
            alt="Mã QR Scan"
            className="w-full h-auto aspect-square object-contain select-none"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>

        {/* Explanatory text under QR */}
        <div className="text-center space-y-1 mb-6 px-1">
          <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
            Quét mã QR bằng Camera điện thoại hoặc Zalo để mở trực tiếp trên di động.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-2">
          {/* Link display inside safe box */}
          <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-between text-left gap-2 mb-1">
            <span className="text-[9.5px] font-mono text-slate-500 truncate select-all flex-1 tracking-tight">
              {url}
            </span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-1 hover:bg-slate-900 text-slate-400 hover:text-amber-500 rounded transition-colors"
              title="Truy cập trực tiếp liên kết"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 rounded-lg text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer active:scale-95`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-400">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Sao chép Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadQR}
              disabled={downloading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-lg text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-95 border-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloading ? "Đang tải..." : "Tải ảnh QR"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
