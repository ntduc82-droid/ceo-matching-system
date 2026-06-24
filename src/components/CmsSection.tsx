import React, { useEffect, useState } from "react";
import { User, Post } from "../types";
import { FileText, Plus, CheckCircle, Clock, AlertTriangle, Eye, Sparkles, Trash2, Share2, Check } from "lucide-react";

interface CmsSectionProps {
  currentUser: User | null;
  onNavigateToAuth: () => void;
}

export default function CmsSection({ currentUser, onNavigateToAuth }: CmsSectionProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Kinh nghiệm thực chiến");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSystemOfficial, setIsSystemOfficial] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleShare = (id: number) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=posts&id=${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(String(id));
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      if (currentUser?.id) {
        headers["Authorization"] = `Bearer ${currentUser.id}`;
      }
      const res = await fetch("/api/posts", { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        
        // Tự động mở xem bài viết nếu có ID trong đường dẫn liên kết
        const params = new URLSearchParams(window.location.search);
        const postIdParam = params.get("id");
        if (postIdParam) {
          const matched = data.find((p: any) => p.id === Number(postIdParam));
          if (matched) {
            setSelectedPost(matched);
          }
        }
      } else {
        setError("Không thể tải tin tức và bài viết");
      }
    } catch (err) {
      console.error(err);
      setError("Mục mạng có sự cố kết nối");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentUser]);

  // Đồng bộ hóa URL khi đổi bài viết được chọn
  useEffect(() => {
    if (loading && posts.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    if (selectedPost) {
      params.set("view", "posts");
      params.set("id", String(selectedPost.id));
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else {
      if (!loading) {
        params.set("view", "posts");
        params.delete("id");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    }
  }, [selectedPost, loading, posts]);

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Thao tác này không thể hoàn tác.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser?.id || ""}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Xóa bài viết thành công!");
        setSelectedPost(null);
        fetchPosts();
      } else {
        setError(data.error || "Lỗi khi xóa bài viết");
      }
    } catch (err: any) {
      setError("Không thể kết nối đến máy chủ để xóa bài viết");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onNavigateToAuth();

    setError("");
    setSuccess("");

    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : "/api/posts";
      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title,
          content,
          imageUrl,
          category,
          isSystemOfficial: currentUser.role === "Admin" ? isSystemOfficial : false
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi xử lý bài viết");

      setSuccess(data.message);
      setTitle("");
      setContent("");
      setImageUrl("");
      setIsSystemOfficial(false);
      setEditingPost(null);
      setShowCreate(false);
      fetchPosts();
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
            <FileText className="h-8 w-8 text-amber-500" />
            DIỄN ĐÀN CEO MATCHING & CMS
          </h2>
          <p className="text-slate-400 mt-1 max-w-2xl text-sm">
            Nơi chia sẻ cơ hội giao thương, kinh nghiệm thực chiến điều hành doanh nghiệp lớn và tin tức chính thống từ Ban quản trị.
          </p>
        </div>

        {currentUser && currentUser.status === "Active" && (
          <button
            onClick={() => {
              if (showCreate) {
                setEditingPost(null);
                setTitle("");
                setContent("");
                setImageUrl("");
                setIsSystemOfficial(false);
              }
              setShowCreate(!showCreate);
              setSelectedPost(null);
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded-lg text-sm flex items-center gap-2 transform active:scale-95 transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? "XEM BÀI ĐĂNG" : "VIẾT BÀI MỚI"}
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

      {/* 1. VIEW DETAIL POST CARD */}
      {selectedPost && !showCreate && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPost(null)}
                className="text-amber-500 hover:text-amber-400 text-xs font-mono transition-colors underline flex items-center gap-1.5 cursor-pointer bg-transparent border-0 font-bold"
              >
                ← QUAY LẠI DANH SÁCH BÀI VIẾT
              </button>
              <button
                type="button"
                onClick={() => handleShare(selectedPost.id)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border-0"
              >
                {copiedId === String(selectedPost.id) ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-900" /> ĐÃ SAO CHÉP LINK!
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" /> CHIA SẺ BÀI VIẾT
                  </>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              {currentUser && (["Admin", "Mod"].includes(currentUser.role) || currentUser.id === selectedPost.authorId) && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(selectedPost);
                    setTitle(selectedPost.title);
                    setContent(selectedPost.content);
                    setImageUrl(selectedPost.imageUrl || "");
                    setCategory(selectedPost.category || "Kinh nghiệm thực chiến");
                    setIsSystemOfficial(!selectedPost.authorId);
                    setShowCreate(true);
                  }}
                  className="px-3 py-1.5 bg-slate-950/90 border border-amber-500/30 text-amber-500 hover:text-amber-400 hover:border-amber-500/60 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  SỬA BÀI VIẾT
                </button>
              )}
              {currentUser && ["Admin", "Mod"].includes(currentUser.role) && (
                <button
                  onClick={() => handleDeletePost(selectedPost.id)}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> XÓA BÀI VIẾT
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-video max-h-[350px] w-full rounded-xl overflow-hidden border border-slate-800">
            <img
              src={selectedPost.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"}
              alt={selectedPost.title}
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500/95 text-slate-950 text-xs font-semibold rounded font-mono uppercase tracking-wider">
              {selectedPost.category}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-100 tracking-tight leading-snug">
              {selectedPost.title}
            </h3>

            <div className="flex items-center gap-3 border-y border-slate-800 py-3.5 text-xs text-slate-400 font-mono">
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500">
                {selectedPost.authorName ? selectedPost.authorName.charAt(0).toUpperCase() : "B"}
              </div>
              <div className="text-left">
                <p className="text-slate-200 font-bold">{selectedPost.authorName}</p>
                <p className="text-[10px] text-amber-500/80">{selectedPost.authorRole}</p>
              </div>
              <div className="ml-auto">
                {new Date(selectedPost.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            </div>

            <div className="text-slate-300 font-sans text-base leading-relaxed whitespace-pre-line pt-2">
              {selectedPost.content}
            </div>
          </div>
        </div>
      )}

      {/* 2. FORM CREATE NEW POST */}
      {showCreate && (
        <form onSubmit={handleCreatePost} className="bg-slate-900 border border-slate-800 max-w-3xl mx-auto rounded-xl p-6 md:p-8 space-y-6">
          <h3 className="text-xl font-serif font-bold text-amber-500">
            {editingPost ? "CẬP NHẬT BÀI VIẾT CHIA SẺ" : "SOẠN BÀI VIẾT CEO CHIA SẺ"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-mono mb-1">TIÊU ĐỀ BÀI ĐĂNG *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none font-sans"
                placeholder="Nhập tiêu đề thu hút quý CEO khác..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">DANH MỤC</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none"
                >
                  <option value="Kinh nghiệm thực chiến">Kinh nghiệm thực chiến</option>
                  <option value="Cơ hội hợp tác">Cơ hội hợp tác</option>
                  <option value="Kinh tế vĩ mô">Kinh tế vĩ mô</option>
                  <option value="Xu hướng thị trường">Xu hướng thị trường</option>
                  <option value="Thông tri từ Ban Quản Trị">Thông tri từ Ban Quản Trị</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-mono mb-1">LINK ẢNH MINH HỌA</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>
            </div>

            {currentUser?.role === "Admin" && (
              <div className="flex items-center gap-2 p-3 bg-slate-950/50 rounded-lg border border-amber-500/20">
                <input
                  type="checkbox"
                  id="systemOfficial"
                  checked={isSystemOfficial}
                  onChange={(e) => setIsSystemOfficial(e.target.checked)}
                  className="rounded border-slate-800 text-amber-500 bg-slate-950"
                />
                <label htmlFor="systemOfficial" className="text-amber-500 text-xs font-mono cursor-pointer select-none">
                  🌟 ĐĂNG NỔI BẬT DƯỚI DANH NGHĨA BAN QUẢN TRỊ TRUNG ƯƠNG
                </label>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-xs font-mono mb-1">NỘI DUNG CHIA SẺ *</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-4 text-slate-200 text-sm outline-none font-sans leading-relaxed"
                placeholder="Viết nội dung bài viết kỹ càng tại đây. Đối với thành viên thường, bài đăng sẽ hiển thị sau khi Admin hoặc Mod phê duyệt..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 font-mono">
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditingPost(null);
                setTitle("");
                setContent("");
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
              <Sparkles className="h-3.5 w-3.5" />
              {editingPost ? "LƯU THAY ĐỔI" : "GỬI DUYỆT / ĐĂNG BÀI"}
            </button>
          </div>
        </form>
      )}

      {/* 3. POSTS GRID LISTING */}
      {!selectedPost && !showCreate && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-400 font-mono text-xs mt-3">Đang đồng bộ dữ liệu CMS...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-serif text-lg">Chưa có bài viết chính thức nào</p>
              <p className="text-slate-500 text-xs mt-1 font-sans">Trở thành người khởi đăng bài đầu tiên bằng cách viết bài.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-xl overflow-hidden flex flex-col transition-all group hover:-translate-y-1 shadow-lg shadow-black/20"
                >
                  <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                    <img
                      src={post.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"}
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2 px-1 text-[10px] sm:text-xs font-mono font-bold uppercase py-1 bg-slate-950/90 text-amber-500 rounded border border-amber-500/20">
                      {post.category}
                    </div>
                    {/* Status badge view only for author or privileged */}
                    {currentUser && (currentUser.id === post.authorId || ["Admin", "Mod", "Manager"].includes(currentUser.role)) && (
                      <div className="absolute top-3 right-3">
                        {post.status === "Approved" ? (
                          <span className="px-2 py-1 bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 text-[10px] rounded flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Đã Duyệt
                          </span>
                        ) : post.status === "Pending" ? (
                          <span className="px-2 py-1 bg-amber-950/90 text-amber-400 border border-amber-500/30 text-[10px] rounded flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Chờ Duyệt
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-950/90 text-red-400 border border-red-500/30 text-[10px] rounded flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Từ Chối
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4
                        onClick={() => setSelectedPost(post)}
                        className="text-lg font-serif font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {post.title}
                      </h4>
                      <p className="text-slate-400 text-xs font-sans line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-slate-800 text-amber-500 rounded-full font-bold flex items-center justify-center text-[10px]">
                          {post.authorName ? post.authorName.charAt(0).toUpperCase() : "B"}
                        </div>
                        <span className="text-slate-300 font-semibold text-xs truncate max-w-[100px] sm:max-w-[140px] block">{post.authorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(post.id);
                          }}
                          className="text-amber-500 hover:text-amber-400 p-1 rounded hover:bg-slate-950 transition-all flex items-center justify-center gap-0.5 text-[10px] font-bold border border-transparent hover:border-amber-500/20 active:scale-95 cursor-pointer"
                          title="Sao chép link chia sẻ"
                        >
                          {copiedId === String(post.id) ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                              COPIED
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5" />
                              SHARE
                            </>
                          )}
                        </button>
                        {currentUser && ["Admin", "Mod"].includes(currentUser.role) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-slate-950 transition-all flex items-center gap-0.5 text-[10px] font-bold border border-transparent hover:border-red-500/20 active:scale-95 cursor-pointer"
                            title="Xóa bài viết này"
                          >
                            <Trash2 className="h-3 w-3" />
                            XÓA
                          </button>
                        )}
                        <span className="text-slate-500 text-[10px]">
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
