import React, { useEffect, useState } from "react";
import { User, FieldPermissions, Post, Event, EventRegistration, SystemMenu, UserRole, UserStatus } from "../types";
import { Shield, Users, FileText, Calendar, ToggleLeft, ToggleRight, Check, X, Trash, Plus, Sparkles, UserCheck, Eye, EyeOff, Layout, Database, RefreshCw, AlertTriangle, Cloud, Download, Upload, Star, Edit } from "lucide-react";

interface AdminSectionProps {
  currentUser: User | null;
  onNavigateToAuth: () => void;
}

export default function AdminSection({ currentUser, onNavigateToAuth }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<"users" | "privacy" | "posts" | "events" | "trades" | "menus" | "database" | "spotlight" | "logs">("users");
  
  // States
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<FieldPermissions[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [menus, setMenus] = useState<SystemMenu[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<any[]>([]);

  // Editing Trade states (for Giao Thương Admin tab)
  const [editingTradeId, setEditingTradeId] = useState<number | null>(null);
  const [editingTradeTitle, setEditingTradeTitle] = useState("");
  const [editingTradeContent, setEditingTradeContent] = useState("");
  const [editingTradeType, setEditingTradeType] = useState("");
  const [editingTradeStatus, setEditingTradeStatus] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  
  // Database synchronization states
  const [dbDiag, setDbDiag] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [syncActionLoading, setSyncActionLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Spotlight Banner states
  const [spotlightTag, setSpotlightTag] = useState("VŨ ĐÀI NGHỊ SỰ");
  const [spotlightTitle, setSpotlightTitle] = useState("Giao Thương Kết Nối Doanh Nhân Tinh Anh 2026");
  const [spotlightImageUrl, setSpotlightImageUrl] = useState("https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop");
  const [spotlightLinkUrl, setSpotlightLinkUrl] = useState("");
  const [spotlightLoading, setSpotlightLoading] = useState(false);
  const [spotlightSuccess, setSpotlightSuccess] = useState("");
  const [spotlightError, setSpotlightError] = useState("");

  // States for dynamic Menu creation
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newMenuOrder, setNewMenuOrder] = useState(1);
  const [newMenuRole, setNewMenuRole] = useState<UserRole>("Guest");

  // Editing dynamic Menu states
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [editingMenuTitle, setEditingMenuTitle] = useState("");
  const [editingMenuUrl, setEditingMenuUrl] = useState("");
  const [editingMenuOrder, setEditingMenuOrder] = useState(1);
  const [editingMenuRole, setEditingMenuRole] = useState<UserRole>("Guest");

  // Editing Event states (for Admin tab)
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editingEventTitle, setEditingEventTitle] = useState("");
  const [editingEventLocation, setEditingEventLocation] = useState("");
  const [editingEventOrganizer, setEditingEventOrganizer] = useState("");
  const [editingEventDateTime, setEditingEventDateTime] = useState("");
  const [editingEventImageUrl, setEditingEventImageUrl] = useState("");
  const [editingEventStatus, setEditingEventStatus] = useState<"Pending" | "Approved">("Pending");

  // Editing Post states (for CMS Admin tab)
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingPostTitle, setEditingPostTitle] = useState("");
  const [editingPostContent, setEditingPostContent] = useState("");
  const [editingPostCategory, setEditingPostCategory] = useState("");
  const [editingPostImageUrl, setEditingPostImageUrl] = useState("");
  const [editingPostStatus, setEditingPostStatus] = useState<"Pending" | "Approved" | "Rejected">("Pending");

  // Editing Registration states
  const [editingRegId, setEditingRegId] = useState<number | null>(null);
  const [editingRegGuestsCount, setEditingRegGuestsCount] = useState(1);
  const [editingRegCompany, setEditingRegCompany] = useState("");
  const [editingRegNote, setEditingRegNote] = useState("");
  const [editingRegStatus, setEditingRegStatus] = useState<"Pending" | "Approved" | "Rejected">("Approved");

  const fetchSpotlight = async () => {
    setSpotlightLoading(true);
    setSpotlightError("");
    setSpotlightSuccess("");
    try {
      const res = await fetch("/api/spotlight");
      if (res.ok) {
        const data = await res.json();
        setSpotlightTag(data.tag || "VŨ ĐÀI NGHỊ SỰ");
        setSpotlightTitle(data.title || "Giao Thương Kết Nối Doanh Nhân Tinh Anh 2026");
        setSpotlightImageUrl(data.imageUrl || "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop");
        setSpotlightLinkUrl(data.linkUrl || "");
      } else {
        setSpotlightError("Không thể tải cấu hình Spotlight Banner");
      }
    } catch (err: any) {
      console.error(err);
      setSpotlightError("Lỗi kết nối khi tải Spotlight Banner: " + err.message);
    } finally {
      setSpotlightLoading(false);
    }
  };

  const handleUpdateSpotlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSpotlightLoading(true);
    setSpotlightError("");
    setSpotlightSuccess("");

    try {
      const res = await fetch("/api/spotlight", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          tag: spotlightTag,
          title: spotlightTitle,
          imageUrl: spotlightImageUrl,
          linkUrl: spotlightLinkUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSpotlightSuccess(data.message || "Đã cập nhật cấu hình Spotlight Banner thành công!");
      } else {
        setSpotlightError(data.error || "Không thể cập nhật Spotlight Banner");
      }
    } catch (err: any) {
      console.error(err);
      setSpotlightError("Lỗi kết nối khi cập nhật Spotlight Banner: " + err.message);
    } finally {
      setSpotlightLoading(false);
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const headers = { "Authorization": `Bearer ${currentUser.id}` };

    try {
      // 1. Fetch Users
      const resUsers = await fetch("/api/members", { headers });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data);
      }

      // 2. Fetch Field Permissions
      const resPerms = await fetch("/api/admin/permissions", { headers });
      if (resPerms.ok) {
        const data = await resPerms.json();
        setPermissions(data.permissions || []);
      }

      // 3. Fetch Posts (CMS)
      const resPosts = await fetch("/api/posts", { headers });
      if (resPosts.ok) {
        const data = await resPosts.json();
        setPosts(data);
      }

      // 4. Fetch Events
      const resEvents = await fetch("/api/events", { headers });
      if (resEvents.ok) {
        const data = await resEvents.json();
        setEvents(data);
      }

      // 5. Fetch Event registrations
      const resRegs = await fetch("/api/admin/events/registrations", { headers });
      if (resRegs.ok) {
        const data = await resRegs.json();
        setRegistrations(data);
      }

      // 6. Fetch System menus
      const resMenus = await fetch("/api/admin/menus", { headers });
      if (resMenus.ok) {
        const data = await resMenus.json();
        setMenus(data);
      }

      // 7. Fetch Trades (Giao thương)
      const resTrades = await fetch("/api/trades", { headers });
      if (resTrades.ok) {
        const data = await resTrades.json();
        setTrades(data);
      }

      // 8. Fetch Approval logs
      const resLogs = await fetch("/api/admin/approval-logs", { headers });
      if (resLogs.ok) {
        const data = await resLogs.json();
        setApprovalLogs(data);
      }

    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin quản trị hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const fetchDbDiagnostics = async () => {
    if (!currentUser || currentUser.role !== "Admin") return;
    setDiagLoading(true);
    setError("");
    const headers = { "Authorization": `Bearer ${currentUser.id}` };
    try {
      const res = await fetch("/api/admin/db/diagnostics", { headers });
      if (res.ok) {
        const data = await res.json();
        setDbDiag(data);
      } else {
        const data = await res.json();
        setError(data.error || "Gặp lỗi khi tải chẩn đoán database");
      }
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải chẩn đoán database: " + err.message);
    } finally {
      setDiagLoading(false);
    }
  };

  const handleDbSyncPull = async () => {
    if (!currentUser || currentUser.role !== "Admin" || syncActionLoading) return;
    const confirmText = 
      "⚠️ CỰC KỲ QUAN TRỌNG: Bạn có chắc chắn muốn cưỡng ép TẢI VỀ và KHÔI PHỤC dữ liệu từ đám mây Supabase?\n\n" +
      "Hành động này sẽ ghi đè (Overwrite) file dữ liệu local hiện tại bằng dữ liệu mới nhất từ đám mây. " +
      "Dữ liệu local hiện tại chưa đồng bộ sẽ bị mất hoàn toàn.\n\n" +
      "Hãy xác nhận nếu bạn hiểu rõ.";
    if (!window.confirm(confirmText)) return;

    setSyncActionLoading(true);
    setError("");
    setSuccess("");
    const headers = { "Authorization": `Bearer ${currentUser.id}` };
    try {
      const res = await fetch("/api/admin/db/sync-pull", {
        method: "POST",
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        await fetchDbDiagnostics();
      } else {
        setError(data.error || "Đồng bộ thất bại");
      }
    } catch (err: any) {
      setError("Lỗi kết nối khi đồng bộ: " + err.message);
    } finally {
      setSyncActionLoading(false);
    }
  };

  const handleDbSyncPush = async () => {
    if (!currentUser || currentUser.role !== "Admin" || syncActionLoading) return;
    const confirmText = 
      "⚠️ CỰC KỲ QUAN TRỌNG: Bạn có chắc chắn muốn cưỡng ép SAO LƯU dữ liệu hiện tại lên đám mây Supabase?\n\n" +
      "Hành động này sẽ ghi đè (Overwrite) toàn bộ bản sao lưu trên đám mây bằng dữ liệu đang chạy tại máy chủ hiện tại.\n\n" +
      "Hãy chắc chắn dữ liệu hiện tại là chính xác.";
    if (!window.confirm(confirmText)) return;

    setSyncActionLoading(true);
    setError("");
    setSuccess("");
    const headers = { "Authorization": `Bearer ${currentUser.id}` };
    try {
      const res = await fetch("/api/admin/db/sync-push", {
        method: "POST",
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        await fetchDbDiagnostics();
      } else {
        setError(data.error || "Sao lưu thất bại");
      }
    } catch (err: any) {
      setError("Lỗi kết nối khi sao lưu: " + err.message);
    } finally {
      setSyncActionLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (activeTab === "database") {
        fetchDbDiagnostics();
      } else if (activeTab === "spotlight") {
        fetchSpotlight();
      } else {
        fetchData();
      }
    }
  }, [currentUser, activeTab]);

  // DUYỆT THÀNH VIÊN VÀ SET PHÂN QUYỀN
  const handleUserUpdate = async (userId: number, status: UserStatus, role: UserRole) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${userId}/status-role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi cập nhật");

      setSuccess(data.message);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // TOGGLE SWITCH FIELD PERMISSIONS (ẨN/HIỆN TRƯỜNG THÔNG TIN TỪNG THÀNH VIÊN)
  const handleTogglePermission = async (userId: number, field: keyof FieldPermissions, currentValue: boolean) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    const updatedValue = !currentValue;
    const payload = { [field]: updatedValue };

    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật Switch");

      setSuccess(`Đã thay đổi hiển thị cấu hình thành công!`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // DUYỆT BÀI VIẾT (CMS)
  const handlePostApproval = async (postId: number, status: "Approved" | "Rejected") => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/posts/${postId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi khi duyệt bài");

      setSuccess(data.message);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // DUYỆT SỰ KIỆN MEMBER TẠO SỬ DỰNG
  const handleEventApproval = async (eventId: number, status: "Approved" | "Pending") => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/events/${eventId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi duyệt sự kiện");

      setSuccess(data.message);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CHUYỂN TRẠNG THÁI SỰ KIỆN HOT (GẮN NGÔI SAO)
  const handleToggleHot = async (eventId: number, currentIsHot: boolean) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/events/${eventId}/toggle-hot`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ isHot: !currentIsHot })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi cập nhật trạng thái Hot");

      setSuccess(data.message);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // XÓA SỰ KIỆN DO MEMBER HOẶC BAN QUẢN TRỊ TẠO
  const handleDeleteEvent = async (eventId: number) => {
    if (!currentUser) return;
    if (!window.confirm("⚠️ Bạn có chắc chắn muốn xóa tận gốc sự kiện này? Thao tác này cũng sẽ xóa toàn bộ danh sách đăng ký tham gia đi kèm.")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi xóa sự kiện");

      setSuccess("Đã xóa sự kiện thành công khỏi hệ thống!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CẬP NHẬT CHI TIẾT BÀI VIẾT (CMS) VÀ TRẠNG THÁI DUYỆT TỪ BÀN QUẢN TRỊ
  const handleUpdatePost = async (postId: number) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      // 1. Cập nhật thông tin chi tiết bài viết
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title: editingPostTitle,
          content: editingPostContent,
          category: editingPostCategory,
          imageUrl: editingPostImageUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật chi tiết bài viết");

      // 2. Cập nhật trạng thái duyệt tuyển của bài viết
      const resStatus = await fetch(`/api/admin/posts/${postId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status: editingPostStatus })
      });
      const dataStatus = await resStatus.json();
      if (!resStatus.ok) throw new Error(dataStatus.error || "Không thể cập nhật trạng thái bài viết");

      setSuccess("Cập nhật thông tin và phê duyệt bài viết thành công!");
      setEditingPostId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // XÓA BÀI VIẾT (CMS)
  const handleDeletePost = async (postId: number) => {
    if (!currentUser) return;
    if (!window.confirm("⚠️ Bạn có chắc chắn muốn xóa tận gốc bài viết này không? Hành động này không thể hoàn tác.")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi bất ngờ khi xóa bài viết");

      setSuccess("Đã xóa bài viết thành công!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // PHÊ DUYỆT BÀI GIAO THƯƠNG (TRADES) TỪ BÀN QUẢN TRỊ
  const handleTradeApproval = async (tradeId: number, status: "Approved" | "Rejected") => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/trades/${tradeId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi khi duyệt tin giao thương");

      setSuccess(data.message || "Đã cập nhật trạng thái duyệt tuyển thành công!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CẬP NHẬT CHI TIẾT BÀI GIAO THƯƠNG TỪ BÀN QUẢN TRỊ
  const handleUpdateTrade = async (tradeId: number) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      // 1. Cập nhật chi tiết
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title: editingTradeTitle,
          content: editingTradeContent,
          type: editingTradeType,
          status: editingTradeStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật bài giao thương");

      // 2. Cập nhật trạng thái duyệt tuyển
      const resStatus = await fetch(`/api/admin/trades/${tradeId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status: editingTradeStatus })
      });
      const dataStatus = await resStatus.json();
      if (!resStatus.ok) throw new Error(dataStatus.error || "Không thể cập nhật trạng thái bài giao thương");

      setSuccess("Cập nhật thông tin bài viết giao thương thành công!");
      setEditingTradeId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // XÓA BÀI GIAO THƯƠNG (TRADES)
  const handleDeleteTrade = async (tradeId: number) => {
    if (!currentUser) return;
    if (!window.confirm("⚠️ Bạn có chắc chắn muốn xóa tận gốc tin này không? Mọi thư phản hồi liên hệ đi kèm cũng sẽ bị xóa.")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể xóa bài giao thương");

      setSuccess("Đã xóa bài giao thương thành công!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CẬP NHẬT CHI TIẾT SỰ KIỆN TỪ BÀN QUẢN TRỊ
  const handleUpdateEvent = async (eventId: number) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      // 1. Cập nhật thông tin chi tiết sự kiện
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title: editingEventTitle,
          location: editingEventLocation,
          organizerUnit: editingEventOrganizer,
          dateTime: editingEventDateTime,
          imageUrl: editingEventImageUrl,
          description: "Sự kiện được chỉnh sửa bởi Ban Quản Trị"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật chi tiết sự kiện");

      // 2. Cập nhật trạng thái duyệt (nếu có thay đổi)
      await fetch(`/api/admin/events/${eventId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status: editingEventStatus })
      });

      setSuccess("Cập nhật thông tin sự kiện xuất bản thành công!");
      setEditingEventId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // XÓA ĐĂNG KÝ THAM GIA / KHÁCH MỜI SỰ KIỆN
  const handleDeleteRegistration = async (regId: number) => {
    if (!currentUser) return;
    if (!window.confirm("⚠️ Bạn có chắc chắn muốn hủy/xóa lượt đăng ký của khách mời này?")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/events/registrations/${regId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi hủy đăng ký khách mời");

      setSuccess("Đã xóa thông tin đăng ký tham gia sự kiện thành công!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // DUYỆT KHÁCH MỜI NHANH (Approved, Rejected, Pending)
  const handleUpdateRegistrationStatus = async (regId: number, status: "Pending" | "Approved" | "Rejected") => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/events/registrations/${regId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi duyệt khách mời");

      setSuccess("Đã cập nhật trạng thái phê duyệt khách mời!");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CẬP NHẬT CHI TIẾT KHÁCH MỜI
  const handleUpdateRegistrationDetails = async (regId: number) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/events/registrations/${regId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          guestsCount: editingRegGuestsCount,
          companyRepresenting: editingRegCompany,
          registrationNote: editingRegNote,
          status: editingRegStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi chỉnh sửa đăng ký");

      setSuccess("Cập nhật thông tin đăng ký thành công!");
      setEditingRegId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // THÊM MENU ĐỘNG HỆ THỐNG (Chỉ dành cho Admin)
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title: newMenuTitle,
          url: newMenuUrl,
          orderIndex: newMenuOrder,
          roleAllowed: newMenuRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi tạo menu mới");

      setSuccess(data.message);
      setNewMenuTitle("");
      setNewMenuUrl("");
      setNewMenuOrder(1);
      setNewMenuRole("Guest");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // XÓA MENU ĐỘNG
  const handleDeleteMenu = async (menuId: number) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/menus/${menuId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi khi xóa");

      setSuccess(data.message);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CẬP NHẬT HOÀN TOÀN MENU ĐỘNG
  const handleUpdateMenu = async (menuId: number) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/menus/${menuId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title: editingMenuTitle,
          url: editingMenuUrl,
          orderIndex: Number(editingMenuOrder) || 0,
          roleAllowed: editingMenuRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi cập nhật thông tin menu");

      setSuccess(data.message);
      setEditingMenuId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CẬP NHẬT NHANH QUYỀN XEM MENU
  const handleUpdateMenuRole = async (menuId: number, roleAllowed: UserRole) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/menus/${menuId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ roleAllowed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi cập nhật quyền xem");

      setSuccess("Cập nhật quyền xem menu thành công!");
      setTimeout(() => setSuccess(""), 4000);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-500" />
            HỘI ĐỒNG BAN QUẢN TRỊ ADMIN PANEL
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Công cụ phê duyệt thành viên mới, cấu hình phân quyền vai trò (RBAC) và kiểm soát từng trường ẩn/hiện thông tin cá nhân.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/25 text-red-200 text-xs rounded-lg font-mono">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/25 text-emerald-200 text-xs rounded-lg font-mono">
          🏆 {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border border-slate-800/80 bg-slate-900/80 p-1.5 rounded-xl gap-1 font-mono text-xs shadow-lg">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === "users" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
          }`}
        >
          👥 PHÊ DUYỆT & PHÂN QUYỀN
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === "privacy" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
          }`}
        >
          🔒 BẬT/TẮT ẨN THÔNG TIN CHI TIẾT
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === "posts" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
          }`}
        >
          📰 DUYỆT BÀI CMS
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === "events" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
          }`}
        >
          🎪 DUYỆT SỰ KIỆN & KHÁCH MỜI
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === "trades" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
          }`}
        >
          🤝 QUẢN TRỊ GIAO THƯƠNG
        </button>
        {currentUser?.role === "Admin" && (
          <button
            onClick={() => setActiveTab("menus")}
            className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === "menus" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
            }`}
          >
            🗺️ QUẢN TRỊ MENU ĐỘNG
          </button>
        )}
        {currentUser?.role === "Admin" && (
          <button
            onClick={() => setActiveTab("database")}
            className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === "database" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
            }`}
          >
            🗄️ ĐỒNG BỘ CLOUD SUPABASE
          </button>
        )}
        {(currentUser?.role === "Admin" || currentUser?.role === "Mod") && (
          <button
            type="button"
            onClick={() => setActiveTab("spotlight")}
            className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === "spotlight" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
            }`}
          >
            📺 SPOTLIGHT BANNER
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 rounded-lg border font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === "logs" ? "border-amber-500/40 text-amber-400 bg-slate-950 shadow-md shadow-black/20" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-950/50"
          }`}
        >
          📜 LỊCH SỬ DUYỆT TÀI KHOẢN
        </button>
      </div>

      {/* Tab contents */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-400 font-mono text-xs mt-3">Đang thống kê dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          
          {/* TAB 1: PHÊ DUYỆT & PHÂN QUYỀN THÀNH VIÊN */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <h3 className="text-lg font-serif font-bold text-amber-500 border-b border-slate-800 pb-2">XÉT DUYỆT HỒ SƠ CEO HỘI VIÊN</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="py-3 px-3">Tên CEO / Doanh Nghiệp</th>
                      <th className="py-3 px-3">Liên Hệ</th>
                      <th className="py-3 px-3">Trạng Thái Hiện Tại</th>
                      <th className="py-3 px-3">Vai Trò Hệ Thống</th>
                      <th className="py-3 px-3 text-right">Hành động phê duyệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      return (
                        <tr key={u.id} className="border-b border-slate-850 hover:bg-slate-950/40 transition-colors">
                          <td className="py-4 px-3 space-y-1">
                            <p className="font-bold text-slate-100">{u.fullName}</p>
                            <p className="text-[11px] text-amber-500/90 font-mono uppercase">{u.jobTitle} @ {u.companyName || "Chưa thiết lập"}</p>
                            <p className="text-[11px] text-slate-400 block max-w-xs truncate">Needs: {u.matchingNeeds}</p>
                          </td>
                          <td className="py-4 px-3 text-xs text-slate-300 font-mono space-y-0.5">
                            <p>📞 {u.phone_number}</p>
                            <p>✉️ {u.email}</p>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold border ${
                              u.status === "Active" ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/25" :
                              u.status === "Pending" ? "bg-amber-950/80 text-amber-400 border-amber-500/25" : "bg-red-950/80 text-red-400 border-red-500/25"
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-xs text-slate-200 font-mono">
                            {u.role}
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-2 text-xs">
                              <select
                                defaultValue={u.status}
                                onChange={(e) => handleUserUpdate(u.id, e.target.value as UserStatus, u.role)}
                                className="bg-slate-950 text-slate-200 border border-slate-800 text-[11px] p-1.5 rounded outline-none"
                              >
                                <option value="Pending">🛡️ Đợi Duyệt (Pending)</option>
                                <option value="Active">✅ Kích Hoạt (Active)</option>
                                <option value="Banned">❌ Khóa (Banned)</option>
                              </select>

                              <select
                                defaultValue={u.role}
                                disabled={currentUser?.role !== "Admin" && u.role === "Admin"}
                                onChange={(e) => handleUserUpdate(u.id, u.status, e.target.value as UserRole)}
                                className="bg-slate-950 text-slate-200 border border-slate-800 text-[11px] p-1.5 rounded outline-none"
                              >
                                <option value="Admin">👑 Admin</option>
                                <option value="Mod">🛡️ Mod</option>
                                <option value="Manager">💼 Manager</option>
                                <option value="Member">👤 Member</option>
                                <option value="Guest">👥 Guest</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ BẬT/TẮT ẨN THÔNG TIN CHI TIẾT TỪNG THÀNH VIÊN */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-lg font-serif font-bold text-amber-500">CẤU HÌNH HIỂN THỊ NỘI BỘ (FIELD PERMISSIONS)</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Trực tiếp điều tiết bật/tắt hiển thị từng cột thực thể nhạy cảm của TỪNG THÀNH VIÊN trên website. Gạt công tắc tắt (nút ĐỎ) để Thông tin sẽ bị che đối với thành viên khác.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="py-3 px-3">Hội viên CEO</th>
                      <th className="py-3 px-3 text-center">Số điện thoại</th>
                      <th className="py-3 px-3 text-center">Email</th>
                      <th className="py-3 px-3 text-center">Facebook</th>
                      <th className="py-3 px-3 text-center">LinkedIn</th>
                      <th className="py-3 px-3 text-center">Mô Tả Sản Phẩm</th>
                      <th className="py-3 px-3 text-center">Nhu Cầu Kết Nối</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const userPerm = permissions.find(p => p.userId === u.id);
                      if (!userPerm) return null;

                      return (
                        <tr key={u.id} className="border-b border-slate-850 hover:bg-slate-950/40 transition-colors">
                          <td className="py-4 px-3">
                            <p className="font-bold text-slate-100">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400">{u.companyName}</p>
                          </td>

                          {/* Toggle sđt */}
                          <td className="py-4 px-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "phoneVisible", userPerm.phoneVisible)}
                              className="focus:outline-none bg-transparent cursor-pointer border-0"
                            >
                              {userPerm.phoneVisible ? (
                                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3" /> Hiển hiện
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-950 text-red-400 border border-red-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <EyeOff className="h-3 w-3" /> Đang ẩn
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Toggle email */}
                          <td className="py-4 px-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "emailVisible", userPerm.emailVisible)}
                              className="focus:outline-none bg-transparent cursor-pointer border-0"
                            >
                              {userPerm.emailVisible ? (
                                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3" /> Hiển hiện
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-950 text-red-400 border border-red-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <EyeOff className="h-3 w-3" /> Đang ẩn
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Toggle FB */}
                          <td className="py-4 px-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "facebookVisible", userPerm.facebookVisible)}
                              className="focus:outline-none bg-transparent cursor-pointer border-0"
                            >
                              {userPerm.facebookVisible ? (
                                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3" /> Hiển hiển
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-950 text-red-400 border border-red-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <EyeOff className="h-3 w-3" /> Đang ẩn
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Toggle LinkedIn */}
                          <td className="py-4 px-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "linkedinVisible", userPerm.linkedinVisible)}
                              className="focus:outline-none bg-transparent cursor-pointer border-0"
                            >
                              {userPerm.linkedinVisible ? (
                                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3" /> Hiển hiện
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-950 text-red-400 border border-red-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <EyeOff className="h-3 w-3" /> Đang ẩn
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Toggle sản phẩm */}
                          <td className="py-4 px-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "productDescriptionVisible", userPerm.productDescriptionVisible)}
                              className="focus:outline-none bg-transparent cursor-pointer border-0"
                            >
                              {userPerm.productDescriptionVisible ? (
                                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3" /> Hiển hiện
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-950 text-red-400 border border-red-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <EyeOff className="h-3 w-3" /> Đang ẩn
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Toggle mong muốn kết nối */}
                          <td className="py-4 px-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(u.id, "matchingNeedsVisible", userPerm.matchingNeedsVisible)}
                              className="focus:outline-none bg-transparent cursor-pointer border-0"
                            >
                              {userPerm.matchingNeedsVisible ? (
                                <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <Eye className="h-3 w-3" /> Hiển hiện
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-950 text-red-400 border border-red-500/20 rounded text-[10px] flex items-center justify-center gap-1">
                                  <EyeOff className="h-3 w-3" /> Đang ẩn
                                </span>
                              )}
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PHÊ DUYỆT BÀI VIẾT (CMS) */}
          {activeTab === "posts" && (
            <div className="space-y-6">
              <h3 className="text-lg font-serif font-bold text-amber-500 border-b border-slate-800 pb-2">DUYỆT BÀI VIẾT THÀNH VIÊN</h3>
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <p className="text-slate-550 text-xs font-mono text-center py-6">Chưa phát triển bài đăng nào trên hệ thống.</p>
                ) : (
                  posts.map((p) => {
                    const isPostEditing = editingPostId === p.id;

                    if (isPostEditing) {
                      return (
                        <div key={p.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4 text-left">
                          <h4 className="text-amber-500 font-bold text-xs font-mono uppercase tracking-widest border-b border-slate-800 pb-1.5">CHỈNH SỬA BÀI VIẾT CMS #{p.id}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">TIÊU ĐỀ BÀI VIẾT</label>
                              <input
                                type="text"
                                value={editingPostTitle}
                                onChange={(evt) => setEditingPostTitle(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 mb-1">DANH MỤC</label>
                                <input
                                  type="text"
                                  value={editingPostCategory}
                                  onChange={(evt) => setEditingPostCategory(evt.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
                                  placeholder="Ví dụ: Tin tức, Chia sẻ..."
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 mb-1">TRẠNG THÁI DUYỆT</label>
                                <select
                                  value={editingPostStatus}
                                  onChange={(evt) => setEditingPostStatus(evt.target.value as any)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-amber-500 font-bold outline-none cursor-pointer"
                                >
                                  <option value="Pending">⏳ Chờ duyệt (Pending)</option>
                                  <option value="Approved">✔️ Công khai (Approved)</option>
                                  <option value="Rejected">❌ Từ chối duyệt (Rejected)</option>
                                </select>
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">LINK ẢNH ĐẠI DIỆN MINH HỌA</label>
                              <input
                                type="text"
                                value={editingPostImageUrl}
                                onChange={(evt) => setEditingPostImageUrl(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
                                placeholder="Nhập đường dẫn URL ảnh hoặc bỏ trống..."
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">NỘI DUNG CHI TIẾT</label>
                              <textarea
                                value={editingPostContent}
                                onChange={(evt) => setEditingPostContent(evt.target.value)}
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans resize-y"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-2 border-t border-slate-800/60 font-sans">
                            <button
                              type="button"
                              onClick={() => handleUpdatePost(p.id)}
                              className="px-4 py-1.5 bg-emerald-650 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs cursor-pointer border-0 flex items-center gap-1 transition-all"
                            >
                              <Check className="h-3.5 w-3.5" /> Lưu Thay Đổi
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPostId(null)}
                              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer border-0 flex items-center gap-1 transition-all"
                            >
                              <X className="h-3.5 w-3.5" /> Hủy Bỏ
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={p.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[9px] uppercase text-amber-500 font-bold">{p.category}</span>
                            {p.status === "Approved" ? (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold font-mono">✔️ CÔNG KHAI</span>
                            ) : p.status === "Rejected" ? (
                              <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[9px] font-bold font-mono">❌ BỊ TỪ CHỐI</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[9px] font-bold font-mono">⏳ CHỜ DUYỆT</span>
                            )}
                          </div>
                          <h4 className="text-slate-200 font-bold text-sm md:text-base leading-tight mt-1">{p.title}</h4>
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{p.content}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">Người gửi: {p.authorName || "Ban Quản Trị"} • Trạng thái: {p.status}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto font-mono text-xs">
                          {p.status === "Pending" ? (
                            <>
                              <button
                                onClick={() => handlePostApproval(p.id, "Approved")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded flex items-center gap-1 cursor-pointer border-0 transition-colors"
                              >
                                <Check className="h-3 w-3" /> Duyệt Đăng
                              </button>
                              <button
                                onClick={() => handlePostApproval(p.id, "Rejected")}
                                className="px-3 py-1.5 bg-red-650/20 border border-red-500/30 hover:bg-red-500/30 text-white font-bold rounded flex items-center gap-1 cursor-pointer border-0 transition-colors"
                              >
                                <X className="h-3 w-3" /> Từ Chối
                              </button>
                            </>
                          ) : p.status === "Approved" ? (
                            <button
                              onClick={() => handlePostApproval(p.id, "Rejected")}
                              className="px-3 py-1.5 bg-red-950/40 border border-red-500/20 hover:bg-red-900/30 text-red-400 font-bold rounded flex items-center gap-1 cursor-pointer border-0 transition-colors"
                            >
                              Bỏ Duyệt
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePostApproval(p.id, "Approved")}
                              className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 hover:bg-emerald-900/30 text-emerald-400 font-bold rounded flex items-center gap-1 cursor-pointer border-0 transition-colors"
                            >
                              Duyệt Đăng
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPostId(p.id);
                              setEditingPostTitle(p.title);
                              setEditingPostContent(p.content);
                              setEditingPostCategory(p.category || "");
                              setEditingPostImageUrl(p.imageUrl || "");
                              setEditingPostStatus(p.status || "Pending");
                            }}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-350 hover:text-amber-400 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            title="Sửa bài viết"
                          >
                            <Edit className="h-3 w-3" /> Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePost(p.id)}
                            className="px-3 py-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-950/80 text-red-400 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            title="Xóa bài viết"
                          >
                            <Trash className="h-3 w-3" /> Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DUYỆT SỰ KIỆN & KHÁCH MỜI DỮ LIỆU ĐĂNG KÝ */}
          {activeTab === "events" && (
            <div className="space-y-8">
              
              {/* Duyệt sự kiện */}
              <div className="space-y-4">
                <h3 className="text-lg font-serif font-bold text-amber-500 border-b border-slate-800 pb-2">KIỂM DUYỆT SỰ KIỆN DO MEMBER TẠO</h3>
                {events.length === 0 ? (
                  <p className="text-slate-550 text-xs font-mono text-center py-6">Chưa có sự kiện nào được khai thác.</p>
                ) : (
                  events.map((e) => {
                    const isEventEditing = editingEventId === e.id;

                    if (isEventEditing) {
                      return (
                        <div key={e.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4 text-left">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">TIÊU ĐỀ SỰ KIỆN</label>
                              <input
                                type="text"
                                value={editingEventTitle}
                                onChange={(evt) => setEditingEventTitle(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">ĐƠN VỊ CHỦ TRÌ (ORGANIZER)</label>
                              <input
                                type="text"
                                value={editingEventOrganizer}
                                onChange={(evt) => setEditingEventOrganizer(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">ĐỊA ĐIỂM SỰ KIỆN</label>
                              <input
                                type="text"
                                value={editingEventLocation}
                                onChange={(evt) => setEditingEventLocation(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 mb-1">THỜI GIAN</label>
                                <input
                                  type="datetime-local"
                                  value={editingEventDateTime}
                                  onChange={(evt) => setEditingEventDateTime(evt.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 mb-1">TRẠNG THÁI DUYỆT</label>
                                <select
                                  value={editingEventStatus}
                                  onChange={(evt) => setEditingEventStatus(evt.target.value as any)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-amber-500 font-bold outline-none cursor-pointer"
                                >
                                  <option value="Pending">⏳ Chờ duyệt (Pending)</option>
                                  <option value="Approved">✔️ Cho phép chạy (Approved)</option>
                                </select>
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">LINK ẢNH COVER BANNER SỰ KIỆN</label>
                              <input
                                type="text"
                                value={editingEventImageUrl}
                                onChange={(evt) => setEditingEventImageUrl(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
                                placeholder="Nhập đường dẫn URL ảnh hoặc dùng ảnh mặc định..."
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-2 border-t border-slate-800/60 font-sans">
                            <button
                              type="button"
                              onClick={() => handleUpdateEvent(e.id)}
                              className="px-4 py-1.5 bg-emerald-650 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs cursor-pointer border-0 flex items-center gap-1 transition-all"
                            >
                              <Check className="h-3.5 w-3.5" /> Lưu Thay Đổi
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingEventId(null)}
                              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer border-0 flex items-center gap-1 transition-all"
                            >
                              <X className="h-3.5 w-3.5" /> Hủy Bỏ
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={e.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {e.status === "Approved" ? (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold font-mono">✔️ HOẠT ĐỘNG</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[9px] font-bold font-mono">⏳ CHỜ DUYỆT</span>
                            )}
                            {e.isHot && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase font-mono font-bold animate-pulse">
                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> HOT
                              </span>
                            )}
                          </div>
                          <h4 className="text-slate-200 font-bold text-sm md:text-base leading-tight">
                            {e.title}
                          </h4>
                          <p className="text-slate-400 text-xs truncate">Địa điểm: {e.location} • Thời gian: {e.dateTime ? new Date(e.dateTime).toLocaleString("vi-VN") : "—"}</p>
                          <p className="text-[10px] text-slate-500 font-mono font-bold">Đơn vị chủ trì: {e.organizerUnit} • Người đăng: {e.creatorName || "Ban Quản Trị"}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto font-mono text-xs">
                          {/* Interactive Star / Hot Toggler */}
                          <button
                            type="button"
                            onClick={() => handleToggleHot(e.id, !!e.isHot)}
                            className={`p-2 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                              e.isHot
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-400/20"
                                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-500/20"
                            }`}
                            title={e.isHot ? "Gỡ trạng thái sự kiện Hot" : "Gắn sao sự kiện Hot phát sóng trang chủ"}
                          >
                            <Star className={`h-3.5 w-3.5 ${e.isHot ? "fill-amber-500 text-amber-500" : ""}`} />
                            <span className="text-[10px] font-bold uppercase">{e.isHot ? "Hot" : "Gắn Hot"}</span>
                          </button>

                          {/* Quick Approve / Put Status conversion button */}
                          {e.status === "Pending" ? (
                            <button
                              onClick={() => handleEventApproval(e.id, "Approved")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded flex items-center gap-1 cursor-pointer border-0 transition-colors"
                            >
                              <Check className="h-3 w-3" /> Duyệt Chạy
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEventApproval(e.id, "Pending")}
                              className="px-3.5 py-1.5 bg-amber-600/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-500 font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              Hủy duyệt
                            </button>
                          )}

                          {/* Edit and Delete Buttons */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventId(e.id);
                              setEditingEventTitle(e.title);
                              setEditingEventLocation(e.location);
                              setEditingEventOrganizer(e.organizerUnit || "");
                              setEditingEventDateTime(e.dateTime ? e.dateTime.slice(0, 16) : "");
                              setEditingEventImageUrl(e.imageUrl || "");
                              setEditingEventStatus(e.status || "Pending");
                            }}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-350 hover:text-amber-400 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            title="Sửa sự kiện"
                          >
                            <Edit className="h-3 w-3" /> Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(e.id)}
                            className="px-3 py-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-950/80 text-red-400 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            title="Xóa sự kiện"
                          >
                            <Trash className="h-3 w-3" /> Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Danh sách CEO đăng ký sự kiện */}
              <div className="space-y-4 pt-6 border-t border-slate-800/80">
                <h3 className="text-lg font-serif font-bold text-amber-500 border-b border-slate-800 pb-2">DANH SÁCH KHÁCH MỜI GỬI FORM THAM GIA SỰ KIỆN</h3>
                {registrations.length === 0 ? (
                  <p className="text-slate-550 text-xs font-mono text-center py-6">Chưa có người dùng nào điền đơn đăng ký sự kiện.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400 font-mono text-[10px] uppercase">
                          <th className="py-3 px-3">Tên CEO / Công Ty Đại Diện</th>
                          <th className="py-3 px-3">Số Điện Thoại / Email</th>
                          <th className="py-3 px-3">Tên Sự Kiện</th>
                          <th className="py-3 px-3 text-center">Số lượng khách</th>
                          <th className="py-3 px-3">Ghi chú lời nhắn kết kết nối</th>
                          <th className="py-3 px-3">Trạng thái duyệt</th>
                          <th className="py-3 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((r) => {
                          const isRegEditing = editingRegId === r.id;
                          const currentRegStatus = r.status || "Approved";

                          return (
                            <tr key={r.id} className="border-b border-slate-850 hover:bg-slate-950/40 transition-colors">
                              {isRegEditing ? (
                                <td colSpan={7} className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-mono text-slate-400 mb-1">CÔNG TY ĐẠI DIỆN</label>
                                      <input
                                        type="text"
                                        value={editingRegCompany}
                                        onChange={(evt) => setEditingRegCompany(evt.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-mono text-slate-400 mb-1">SỐ KHÁCH ĐI CÙNG</label>
                                      <input
                                        type="number"
                                        value={editingRegGuestsCount}
                                        onChange={(evt) => setEditingRegGuestsCount(Number(evt.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-mono text-slate-400 mb-1">GHI CHÚ / LỜI NHẮN</label>
                                      <input
                                        type="text"
                                        value={editingRegNote}
                                        onChange={(evt) => setEditingRegNote(evt.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-mono text-slate-400 mb-1">TRẠNG THÁI DUYỆT</label>
                                      <select
                                        value={editingRegStatus}
                                        onChange={(evt) => setEditingRegStatus(evt.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                                      >
                                        <option value="Pending">🛡️ Chờ duyệt</option>
                                        <option value="Approved">✔️ Đã duyệt</option>
                                        <option value="Rejected">❌ Từ chối</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end mt-3">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRegistrationDetails(r.id)}
                                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs cursor-pointer border-0"
                                    >
                                      Lưu lại
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingRegId(null)}
                                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer border-0"
                                    >
                                      Hủy bỏ
                                    </button>
                                  </div>
                                </td>
                              ) : (
                                <>
                                  <td className="py-4 px-3">
                                    <p className="font-bold text-slate-100">{r.userName}</p>
                                    <p className="text-[10px] text-slate-400">{r.companyRepresenting}</p>
                                  </td>
                                  <td className="py-4 px-3 font-mono text-xs text-slate-300">
                                    <p>📞 {r.userPhone}</p>
                                    <p>✉️ {r.userEmail}</p>
                                  </td>
                                  <td className="py-4 px-3 text-slate-200 bg-slate-950/20 font-bold">
                                    {r.eventTitle}
                                  </td>
                                  <td className="py-4 px-3 text-center font-bold text-amber-500 bg-slate-950/20">
                                    {r.guestsCount}
                                  </td>
                                  <td className="py-4 px-3 text-slate-400 italic font-mono text-[11px] max-w-xs truncate">
                                    "{r.registrationNote || "—"}"
                                  </td>
                                  <td className="py-4 px-3">
                                    {currentRegStatus === "Approved" ? (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-mono font-bold">✔️ ĐÃ DUYỆT</span>
                                    ) : currentRegStatus === "Rejected" ? (
                                      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] font-mono font-bold">❌ BỊ TỪ CHỐI</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[10px] font-mono font-bold">⏳ CHỜ DUYỆT</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-3 text-right">
                                    <div className="flex justify-end items-center gap-1.5">
                                      {currentRegStatus === "Pending" && (
                                        <button
                                          onClick={() => handleUpdateRegistrationStatus(r.id, "Approved")}
                                          className="p-1 px-2 text-emerald-400 border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/20 hover:text-white rounded text-[10px] cursor-pointer"
                                          title="Duyệt khách mời"
                                        >
                                          Duyệt
                                        </button>
                                      )}
                                      {currentRegStatus !== "Rejected" && (
                                        <button
                                          onClick={() => handleUpdateRegistrationStatus(r.id, "Rejected")}
                                          className="p-1 px-2 text-red-400 border border-red-500/25 bg-red-500/5 hover:bg-red-500/20 hover:text-white rounded text-[10px] cursor-pointer"
                                          title="Từ chối khách mời"
                                        >
                                          Từ chối
                                        </button>
                                      )}
                                      {currentRegStatus === "Rejected" && (
                                        <button
                                          onClick={() => handleUpdateRegistrationStatus(r.id, "Approved")}
                                          className="p-1 px-2 text-emerald-400 border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/20 hover:text-white rounded text-[10px] cursor-pointer"
                                          title="Kích hoạt lại"
                                        >
                                          Duyệt lại
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setEditingRegId(r.id);
                                          setEditingRegCompany(r.companyRepresenting || "");
                                          setEditingRegGuestsCount(r.guestsCount || 1);
                                          setEditingRegNote(r.registrationNote || "");
                                          setEditingRegStatus(r.status || "Approved");
                                        }}
                                        className="p-1 text-slate-400 hover:text-amber-500 hover:bg-slate-900 rounded cursor-pointer border-0 bg-transparent"
                                        title="Chỉnh sửa đăng ký"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRegistration(r.id)}
                                        className="p-1 text-red-500 hover:text-red-450 hover:bg-slate-900 rounded cursor-pointer border-0 bg-transparent"
                                        title="Xóa lượt đăng ký"
                                      >
                                        <Trash className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4.5: QUẢN TRỊ GIAO THƯƠNG */}
          {activeTab === "trades" && (
            <div className="space-y-8">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xl font-serif font-bold text-amber-500">QUẢN TRỊ BÀI ĐĂNG GIAO THƯƠNG</h3>
                <p className="text-slate-400 text-xs mt-1">Duyệt, chỉnh sửa chi tiết hoặc xóa bỏ các yêu cầu mua bán, đấu thầu, tìm đối tác doanh nghiệp trên nền tảng.</p>
              </div>

              {/* Danh sách bài viết giao thương */}
              <div className="space-y-4">
                {trades.length === 0 ? (
                  <p className="text-slate-400 text-xs font-mono text-center py-12">Hệ thống chưa có tin đăng giao thương nào.</p>
                ) : (
                  trades.map((t) => {
                    const isEditing = editingTradeId === t.id;
                    const status = t.status || "Approved";

                    if (isEditing) {
                      return (
                        <div key={t.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 text-left">
                          <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">CHỈNH SỬA TIN GIAO THƯƠNG #{t.id}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">TIÊU ĐỀ TIN ĐĂNG</label>
                              <input
                                type="text"
                                value={editingTradeTitle}
                                onChange={(evt) => setEditingTradeTitle(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-250 outline-none focus:border-amber-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-slate-400 mb-1">THỂ LOẠI GIAO DỊCH</label>
                              <select
                                value={editingTradeType}
                                onChange={(evt) => setEditingTradeType(evt.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-250 outline-none focus:border-amber-500 font-sans"
                              >
                                <option value="Cần mua">Cần mua</option>
                                <option value="Cần bán">Cần bán</option>
                                <option value="Tìm đối tác">Tìm đối tác</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 mb-1">NỘI DUNG GIAO THƯƠNG CHÍNH</label>
                            <textarea
                              rows={4}
                              value={editingTradeContent}
                              onChange={(evt) => setEditingTradeContent(evt.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-250 outline-none focus:border-amber-500 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 mb-1">TRẠNG THÁI PHÊ DUYỆT</label>
                            <select
                              value={editingTradeStatus}
                              onChange={(evt) => setEditingTradeStatus(evt.target.value as any)}
                              className="w-full sm:w-1/3 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-250 outline-none focus:border-amber-500 font-sans"
                            >
                              <option value="Pending">Chờ phê duyệt (Pending)</option>
                              <option value="Approved">Đã phê duyệt (Approved)</option>
                              <option value="Rejected">Từ chối hiển thị (Rejected)</option>
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => setEditingTradeId(null)}
                              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer"
                            >
                              HỦY BỎ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateTrade(t.id)}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-all cursor-pointer"
                            >
                              LƯU CẬP NHẬT
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={t.id} className="p-4 bg-slate-950/25 border border-slate-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left transition-all hover:border-slate-800">
                        <div className="space-y-2 max-w-3xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full uppercase ${
                              t.type === "Cần mua" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                              t.type === "Cần bán" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              t.type === "Tìm đối tác" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}>
                              {t.type}
                            </span>
                            
                            {status === "Pending" && (
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/25">
                                🟡 CHỜ DUYỆT (PENDING)
                              </span>
                            )}
                            {status === "Approved" && (
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-green-500/10 text-green-400 rounded border border-green-500/25">
                                🟢 ĐÃ DUYỆT (APPROVED)
                              </span>
                            )}
                            {status === "Rejected" && (
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-500/10 text-red-400 rounded border border-red-500/25">
                                🔴 TỪ CHỐI (REJECTED)
                              </span>
                            )}

                            <span className="text-[11px] font-mono text-slate-500">
                              Mã bài: #{t.id} • {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-tight">{t.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">{t.content}</p>

                          <div className="flex items-center gap-2 text-xs font-sans text-slate-400 pt-1 border-t border-slate-900/40">
                            {t.authorAvatarUrl ? (
                              <img src={t.authorAvatarUrl} alt={t.authorName} className="w-5 h-5 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-300 border border-slate-700">
                                {t.authorName?.charAt(0) || "U"}
                              </div>
                            )}
                            <span className="font-medium text-slate-300">{t.authorName}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500 italic">{t.authorCompanyName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap self-start md:self-center font-mono text-[11px]">
                          {status === "Pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTradeApproval(t.id, "Approved")}
                                className="px-3 py-1.5 bg-green-950/40 border border-green-500/30 hover:bg-green-950/80 text-green-400 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Check className="h-3 w-3" /> Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTradeApproval(t.id, "Rejected")}
                                className="px-3 py-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-950/80 text-red-400 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <X className="h-3 w-3" /> Từ chối
                              </button>
                            </>
                          )}
                          
                          {status !== "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleTradeApproval(t.id, status === "Approved" ? "Rejected" : "Approved")}
                              className={`px-3 py-1.5 border rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                                status === "Approved"
                                  ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400"
                                  : "bg-green-950/40 border-green-500/20 text-green-400"
                              }`}
                            >
                              Tắt/Bật duyệt
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingTradeId(t.id);
                              setEditingTradeTitle(t.title);
                              setEditingTradeContent(t.content);
                              setEditingTradeType(t.type);
                              setEditingTradeStatus(status);
                            }}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Edit className="h-3 w-3" /> Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTrade(t.id)}
                            className="px-3 py-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-950/80 text-red-400 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Trash className="h-3 w-3" /> Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: QUẢN TRỊ MENU ĐỘNG (Chỉ dành cho Admin cao tối cao) */}
          {activeTab === "menus" && currentUser?.role === "Admin" && (
            <div className="space-y-8">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-lg font-serif font-bold text-amber-500">QUẢN TRỊ HỆ THỐNG MENU ĐIỀU HƯỚNG ĐỘNG</h3>
                <p className="text-slate-400 text-xs mt-1">Độ sâu vai trò (Allowed Role) quyết định quyền lực tối thiểu để menu này xuất hiện trước mặt người xem.</p>
              </div>

              {/* Form thêm menu */}
              <form onSubmit={handleAddMenu} className="bg-slate-950 p-4 rounded-xl border border-slate-850 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-1">
                  <label className="block text-slate-400 text-[10px] font-mono mb-1">TIÊU ĐỀ MENU</label>
                  <input
                    type="text"
                    required
                    value={newMenuTitle}
                    onChange={(e) => setNewMenuTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    placeholder="Ví dụ: Tải App"
                  />
                </div>
                <div className="md:col-span-1.5">
                  <label className="block text-slate-400 text-[10px] font-mono mb-1">ĐƯỜNG DẪN / PATH URL</label>
                  <input
                    type="text"
                    required
                    value={newMenuUrl}
                    onChange={(e) => setNewMenuUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    placeholder="/download"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-slate-400 text-[10px] font-mono mb-1">VỊ TRÍ SẮP XẾP ORDER</label>
                  <input
                    type="number"
                    value={newMenuOrder}
                    onChange={(e) => setNewMenuOrder(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-slate-400 text-[10px] font-mono mb-1">LEVEL XEM TỐI THIỂU</label>
                  <select
                    value={newMenuRole}
                    onChange={(e) => setNewMenuRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="Guest">Guest (Cả khách)</option>
                    <option value="Member">Member (Thành viên)</option>
                    <option value="Manager">Manager (Quản lý)</option>
                    <option value="Mod">Mod</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-1 font-mono uppercase"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm Menu
                </button>
              </form>

              {/* Danh sách menus trực thuộc */}
              <div className="space-y-2">
                {menus.map((m) => {
                  const isEditing = editingMenuId === m.id;

                  return (
                    <div key={m.id} className="p-3.5 bg-slate-950 rounded-lg border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs text-left">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 w-full items-center">
                          <div className="md:col-span-1">
                            <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1">POS</label>
                            <input
                              type="number"
                              value={editingMenuOrder}
                              onChange={(e) => setEditingMenuOrder(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1">Tiêu Đề</label>
                            <input
                              type="text"
                              value={editingMenuTitle}
                              onChange={(e) => setEditingMenuTitle(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none font-sans"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1">Đường Dẫn</label>
                            <input
                              type="text"
                              value={editingMenuUrl}
                              onChange={(e) => setEditingMenuUrl(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-slate-500 text-[9px] uppercase font-bold mb-1">Quyền Xem</label>
                            <select
                              value={editingMenuRole}
                              onChange={(e) => setEditingMenuRole(e.target.value as UserRole)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none cursor-pointer"
                            >
                              <option value="Guest">Guest (Cả khách)</option>
                              <option value="Member">Member (Thành viên)</option>
                              <option value="Manager">Manager (Quản lý)</option>
                              <option value="Mod">Mod</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 flex items-center justify-end md:mt-4 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateMenu(m.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-sans text-xs rounded transition-colors flex items-center gap-1 cursor-pointer border-0"
                            >
                              <Check className="h-3.5 w-3.5 text-slate-950" /> Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMenuId(null)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-sans text-xs rounded transition-colors flex items-center gap-1 cursor-pointer border-0"
                            >
                              <X className="h-3.5 w-3.5" /> Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-left flex flex-wrap items-center gap-3 md:gap-4 flex-1">
                            <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded text-[9px] text-slate-400 font-bold" title="Vị trí sắp xếp (POS)">POS: {m.orderIndex}</span>
                            <p className="text-slate-200 font-bold text-sm font-sans">{m.title}</p>
                            <span className="text-slate-500">[{m.url}]</span>
                            
                            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-850">
                              <span className="text-slate-400 text-[10px]">QUYỀN XEM:</span>
                              <select
                                value={m.roleAllowed}
                                onChange={(e) => handleUpdateMenuRole(m.id, e.target.value as UserRole)}
                                className="bg-slate-900 border border-slate-800 text-amber-500 hover:border-amber-500/30 text-[11px] px-2 py-1 rounded cursor-pointer outline-none transition-colors font-bold"
                              >
                                <option value="Guest">Guest (Cả khách)</option>
                                <option value="Member">Member (Thành viên)</option>
                                <option value="Manager">Manager (Quản lý)</option>
                                <option value="Mod">Mod</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMenuId(m.id);
                                setEditingMenuTitle(m.title);
                                setEditingMenuUrl(m.url);
                                setEditingMenuOrder(m.orderIndex);
                                setEditingMenuRole(m.roleAllowed);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-900 rounded transition-colors border-0 bg-transparent cursor-pointer flex items-center gap-1 font-sans font-bold"
                              title="Sửa chi tiết menu này"
                            >
                              <Edit className="h-3.5 w-3.5" /> Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMenu(m.id)}
                              className="p-1.5 text-red-500 hover:text-white hover:bg-red-950/40 rounded transition-colors border-0 bg-transparent cursor-pointer"
                              title="Xóa menu này"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: ĐỒNG BỘ CLOUD SUPABASE (Chỉ dành cho Admin cao tối cao) */}
          {activeTab === "database" && currentUser?.role === "Admin" && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-lg font-serif font-bold text-amber-500 flex items-center gap-2">
                  <Database className="h-5 w-5 text-amber-500" />
                  TRẠNG THÁI VÀ ĐỒNG BỘ CƠ SỞ DỮ LIỆU ĐÁM MÂY SUPABASE
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Kiểm soát an toàn quy trình sao lưu JSON lâu dài nhằm chống mất dữ liệu khi hệ thống khởi động lại hoặc deploy bản cập nhật mới trên đám mây.
                </p>
              </div>

              {diagLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 text-amber-500 animate-spin mx-auto animate-reverse" />
                  <p className="text-slate-400 text-xs mt-2 font-mono">Đang truy vấn trạng thái Supabase PostgreSQL...</p>
                </div>
              ) : dbDiag ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cột 1 & 2: Trạng thái & Chẩn đoán */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
                      <h4 className="text-slate-350 text-xs font-bold font-mono tracking-wider border-b border-slate-850 pb-2">THÔNG SỐ KẾT NỐI KỸ THUẬT</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <p className="text-slate-500">Môi trường đám mây PostgreSQL:</p>
                          <div className="flex items-center gap-1.5 mt-1 font-bold">
                            {dbDiag.usePg ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Cloud className="h-4 w-4 text-emerald-400" /> Kích hoạt (DATABASE_URL khả dụng)
                              </span>
                            ) : (
                              <span className="text-red-400 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4 text-red-400" /> Tắt (Thiếu DATABASE_URL env)
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-slate-500">Đồng bộ lúc khởi động (Auto Boot Sync):</p>
                          <div className="flex items-center gap-1.5 mt-1 font-bold">
                            {dbDiag.isDbSyncCompleted ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="h-4 w-4 bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full" /> Đã hoàn thành tải mây lúc khởi động
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                                <RefreshCw className="h-3.5 w-3.5" /> Chưa đồng bộ hoặc lỗi kết nối khởi động
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-slate-500">Trạng thái Cơ sở dữ liệu đám mây:</p>
                          <p className={`mt-1 font-bold uppercase text-[11px] ${
                            dbDiag.supabaseStatus.includes("Synced") ? "text-emerald-400" :
                            dbDiag.supabaseStatus.includes("Failed") ? "text-red-400" : "text-amber-400"
                          }`}>
                            ⚡ {dbDiag.supabaseStatus}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500 font-mono">Đường dẫn Local DB File:</p>
                          <p className="mt-1 text-slate-300 overflow-x-auto select-all whitespace-nowrap text-[11px] bg-slate-900 border border-slate-850 py-0.5 px-1.5 rounded">{dbDiag.dbFilePath}</p>
                        </div>
                      </div>

                      {dbDiag.connectionError && (
                        <div className="p-3 bg-red-950/40 border border-red-500/25 text-red-300 font-mono text-[11px] overflow-auto space-y-3">
                          <div>
                            <p className="font-bold text-red-400">❌ Chi tiết lỗi kết nối Supabase:</p>
                            <pre className="mt-1 bg-black/30 p-2 border border-slate-900 rounded whitespace-pre-wrap">{dbDiag.connectionError}</pre>
                          </div>
                          
                          {dbDiag.isDirectSupabase && (
                            <div className="mt-2 p-3 bg-amber-950/40 border border-amber-600/30 rounded-lg text-amber-200 font-sans space-y-2">
                              <p className="font-bold text-xs uppercase flex items-center gap-1.5 text-amber-400">
                                <AlertTriangle className="h-4 w-4" /> PHÁT HIỆN SỰ KHÁC BIỆT KẾT NỐI IPV6 (ENETUNREACH):
                              </p>
                              <div className="text-[11px] leading-relaxed space-y-2">
                                <p>
                                  Bạn đang sử dụng cấu hình kết nối trực tiếp (<strong>Direct connection</strong>, mặc định cổng <strong>5432</strong>). 
                                  Supabase chỉ hỗ trợ <strong>IPv6</strong> cho tệp cấu hình trực tiếp này, trong khi hosting Render/Docker hiện tại của bạn chạy mạng <strong>IPv4</strong>. 
                                  Do đó mạng báo lỗi không kết nối được (<code>ENETUNREACH</code>).
                                </p>
                                <p className="font-bold text-emerald-400">
                                  👉 CÁCH KHẮC PHỤC CHUẨN XÁC THEO GIAO DIỆN SUPABASE MỚI:
                                </p>
                                <ul className="list-decimal list-inside space-y-1.5 font-semibold text-[10.5px] pl-1 bg-black/35 p-3 rounded border border-amber-800/20 text-slate-200 select-all leading-normal">
                                  <li>1. Trong bảng <strong className="text-amber-400">Connect to your project</strong> (như bạn chụp), chọn tab số 2: <strong className="text-amber-400 uppercase">Direct</strong>.</li>
                                  <li>2. Ở dòng <strong className="text-amber-400">Connection Method</strong>, chọn <strong className="text-emerald-400 font-bold">Transaction pooler</strong> hoặc <strong className="text-emerald-400 font-bold">Session pooler</strong>.</li>
                                  <li>3. Ở phần <strong className="text-amber-400">Type</strong>, chọn định dạng <strong className="text-amber-400">URI</strong>.</li>
                                  <li>4. Copy chuỗi đường dẫn URI mới được hiển thị. Đường dẫn này sẽ chuyển sang cổng <strong className="text-emerald-400 font-bold">6543</strong> hoặc dùng cụm máy chủ chứa đuôi <strong className="text-emerald-400 font-semibold">.pooler.supabase.com</strong> hỗ trợ hoàn toàn mạng IPv4.</li>
                                  <li>5. Thay mật khẩu của bạn vào chỗ <span className="text-red-400">[YOUR-PASSWORD]</span> và cập nhật lại biến <code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded font-mono">DATABASE_URL</code> trong trình Settings của Web service!</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          <p className="text-slate-400 font-sans leading-relaxed text-[10px]">
                            Lưu ý tổng quát: Bạn hãy kiểm tra lại mật mã của Database Supabase, hãy chắc chắn đã thay thế ký tự mẫu <code className="text-red-400">[YOUR-PASSWORD]</code> bằng mật mã thực tế bạn chọn khi khởi tạo trên Supabase Dashboard.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Thống kê Tổng lượng dữ liệu */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850">
                      <h4 className="text-slate-350 text-xs font-bold font-mono tracking-wider border-b border-slate-850 pb-2 mb-3">CHI TIẾT MẬT ĐỘ BÀN TRONG HỆ THỐNG</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                        <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-center">
                          <p className="text-slate-500 text-[10px]">THÀNH VIÊN</p>
                          <p className="text-lg font-bold text-amber-500 mt-1">{dbDiag.usersCount}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-center">
                          <p className="text-slate-500 text-[10px]">BÀI VIẾT CMS</p>
                          <p className="text-lg font-bold text-amber-500 mt-1">{dbDiag.postsCount}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-center">
                          <p className="text-slate-500 text-[10px]">SỰ KIỆN</p>
                          <p className="text-lg font-bold text-amber-500 mt-1">{dbDiag.eventsCount}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-center">
                          <p className="text-slate-500 text-[10px]">GIAO THƯƠNG</p>
                          <p className="text-lg font-bold text-amber-500 mt-1">{dbDiag.tradesCount}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs font-mono bg-slate-900 border border-slate-850 py-2.5 px-3.5 rounded-lg">
                        <div className="flex items-center gap-1 text-slate-400 font-sans">
                          <Database className="h-4 w-4 text-slate-500" /> Dung dịch Local DB File:
                        </div>
                        <span className="font-bold text-slate-300">{(dbDiag.localDbSize / 1024).toFixed(2)} KB ({dbDiag.localDbSize} bytes)</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs font-mono bg-slate-900 border border-slate-850 py-2.5 px-3.5 rounded-lg">
                        <div className="flex items-center gap-1 text-slate-400 font-sans">
                          <Cloud className="h-4 w-4 text-slate-500" /> Dung lượng Cloud Backup Store:
                        </div>
                        <span className="font-bold text-slate-300">{(dbDiag.cloudSize / 1024).toFixed(2)} KB ({dbDiag.cloudSize} bytes)</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs font-mono bg-slate-900 border border-slate-850 py-2.5 px-3.5 rounded-lg">
                        <div className="flex items-center gap-1 text-slate-400 font-sans">
                          <RefreshCw className="h-4 w-4 text-slate-500" /> Mây sao lưu lần cuối:
                        </div>
                        <span className="font-bold text-amber-400/90">
                          {dbDiag.cloudUpdatedAt ? new Date(dbDiag.cloudUpdatedAt).toLocaleString("vi-VN") : "Chưa từng sao lưu"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cột 3: Hành Động Đồng Bộ Thủ Công */}
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4 text-left">
                      <h4 className="text-slate-350 text-xs font-bold font-mono tracking-wider border-b border-slate-850 pb-2">HÀNH ĐỘNG KHÔI PHỤC & SAO LƯU</h4>

                      <div className="space-y-3">
                        <button
                          onClick={handleDbSyncPull}
                          disabled={syncActionLoading || !dbDiag.usePg}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-2 font-mono uppercase border border-indigo-500"
                        >
                          <Download className="h-4 w-4" /> 
                          {syncActionLoading ? "Đang tải dữ liệu..." : "Tải từ mây Supabase về"}
                        </button>
                        <p className="text-[10px] text-slate-400 leading-normal font-sans">
                          ℹ️ Nhấn nút này để <strong>Cưỡng ép tải toàn bộ dữ liệu</strong> từ đám mây Supabase về ghi đè file local hiện tại. Hỗ trợ cho bạn khôi phục ngay lập tức nếu dữ liệu local bị mất do container reset!
                        </p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-850">
                        <button
                          onClick={handleDbSyncPush}
                          disabled={syncActionLoading || !dbDiag.usePg}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-2 font-mono uppercase"
                        >
                          <Upload className="h-4 w-4" /> 
                          {syncActionLoading ? "Đang đẩy dữ liệu..." : "Lưu thủ công lên Supabase"}
                        </button>
                        <p className="text-[10px] text-slate-400 leading-normal font-sans">
                          ℹ️ Nhấn nút này để <strong>Cưỡng ép đẩy ghi đè dữ liệu cục bộ hiện tại</strong> lưu trữ vĩnh cửu lên đám mây. Hãy nhấn nếu bạn vừa tạo thêm tài khoản hay dữ liệu quan trọng và mây chưa kịp tự sync.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <button
                          onClick={fetchDbDiagnostics}
                          disabled={diagLoading}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${diagLoading ? "animate-spin" : ""}`} /> 
                          LÀM MỚI TRẠNG THÁI
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/15 space-y-2.5">
                      <h5 className="text-amber-500 text-xs font-bold font-sans flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        LƯU Ý VỀ MẤT DỮ LIỆU CLOUD:
                      </h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        Dịch vụ Web hosting miễn phí của <strong>Render Free</strong> sẽ tự động xóa bộ nhớ đệm container và khôi phục các tệp tin lưu cục bộ như <code className="text-slate-200">database_store.json</code> về trạng thái rỗng/seed ban đầu <strong>mỗi khi bạn commit code mới</strong> hoặc hệ thống ngủ đông.
                      </p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold font-sans">
                        Để lưu dữ liệu vĩnh viễn không bao giờ sợ bị reset, bạn HÃY hoàn thành việc thiết lập biến môi trường <code className="text-amber-400">DATABASE_URL</code> của Supabase vào bảng cấu hình Web Service trên Render.com!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs font-mono">
                  Không thể truy vấn thông tin chẩn đoán database.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CẤU HÌNH SPOTLIGHT BANNER */}
          {activeTab === "spotlight" && (currentUser?.role === "Admin" || currentUser?.role === "Mod") && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-lg font-serif font-bold text-amber-500 flex items-center gap-2">
                  <Layout className="h-5 w-5 text-amber-500" />
                  CẤU HÌNH SPOTLIGHT BANNER (VŨ ĐÀI NGHỊ SỰ)
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Thay đổi hình ảnh, nhãn thẻ và tiêu đề dòng sự kiện xuất hiện tại vị trí Spotlight nổi bật nhất của Trang chủ.
                </p>
              </div>

              {spotlightSuccess && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/25 text-emerald-200 text-xs rounded-lg font-mono">
                  ✨ {spotlightSuccess}
                </div>
              )}

              {spotlightError && (
                <div className="p-4 bg-red-950/40 border border-red-500/25 text-red-200 text-xs rounded-lg font-mono">
                  ❌ {spotlightError}
                </div>
              )}

              {spotlightLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 text-amber-500 animate-spin mx-auto" />
                  <p className="text-slate-400 text-xs mt-2 font-mono">Đang tải cấu hình Spotlight Banner...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                  {/* Form */}
                  <form onSubmit={handleUpdateSpotlight} className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-slate-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold font-extrabold text-amber-500">TÊN THẺ BANNER (TAG)</label>
                      <input
                        type="text"
                        value={spotlightTag}
                        onChange={(e) => setSpotlightTag(e.target.value)}
                        placeholder="VD: VŨ ĐÀI NGHỊ SỰ"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-xs font-mono outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold font-extrabold text-amber-500">TIÊU ĐỀ NỔI BẬT</label>
                      <input
                        type="text"
                        value={spotlightTitle}
                        onChange={(e) => setSpotlightTitle(e.target.value)}
                        placeholder="VD: Giao Thương Kết Nối Doanh Nhân Tinh Anh 2026"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-xs outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold font-extrabold text-amber-500">ĐƯỜNG DẪN ẢNH BANNER (URL HOẶC BASE64)</label>
                      <input
                        type="text"
                        value={spotlightImageUrl}
                        onChange={(e) => setSpotlightImageUrl(e.target.value)}
                        placeholder="Nhập link hình ảnh Unsplash hoặc địa chỉ ảnh tĩnh..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-xs font-mono outline-none focus:border-amber-500/50"
                        required
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        Nên sử dụng liên kết ảnh độ phân giải tốt từ Unsplash (VD: 800x600 trở lên) hoặc dẫn link logo.jpg.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold font-extrabold text-amber-500">ĐƯỜNG DẪN ĐIỀU HƯỚNG KHI CLICK BANNER (LINK URL - TÙY CHỌN)</label>
                      <input
                        type="text"
                        value={spotlightLinkUrl}
                        onChange={(e) => setSpotlightLinkUrl(e.target.value)}
                        placeholder="Nhập liên kết ngoài hoặc tab nội bộ (e.g. /posts hoặc https://...)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-xs font-mono outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="submit"
                        className="px-5 py-2.5 text-xs font-mono bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-all shadow-md shadow-amber-950/20 active:scale-[0.98]"
                      >
                        LƯU CẤU HÌNH BANNER
                      </button>
                      <button
                        type="button"
                        onClick={fetchSpotlight}
                        className="px-4 py-2.5 text-xs font-mono bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                      >
                        Khôi phục gốc
                      </button>
                    </div>
                  </form>

                  {/* Preview */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="block text-slate-400 text-xs font-mono uppercase tracking-wider font-semibold font-extrabold text-amber-500">PREVIEW HIỂN THỊ THỰC TẾ</span>
                    
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-4">
                      {/* Similar card with exact layout of HomeSection Spotlight */}
                      <div className="bg-slate-800 rounded-2xl border border-white/5 overflow-hidden group relative min-h-[220px] max-w-[360px] mx-auto aspect-[4/3]">
                        <img
                          src={spotlightImageUrl || "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop"}
                          alt="CEO Networking meeting preview"
                          className="object-cover w-full h-full h-full absolute inset-0"
                          onError={(e: any) => {
                            e.target.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop";
                          }}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 space-y-1">
                          <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded-md font-extrabold">
                            {spotlightTag || "VŨ ĐÀI NGHỊ SỰ"}
                          </span>
                          <h4 className="text-sm font-serif italic text-white font-medium">{spotlightTitle || "Chưa nhập tiêu đề..."}</h4>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 text-center font-mono uppercase leading-snug">
                        Hình ảnh mờ dần phía dưới và phủ bóng chuyển màu đen huyền bí nhằm tạo điểm nhấn tối thượng.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: LỊCH SỬ DUYỆT TÀI KHOẢN */}
          {activeTab === "logs" && (
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-800/80 pb-3">
                <h3 className="text-lg font-serif font-bold text-amber-500 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  LỊCH SỬ DUYỆT TÀI KHOẢN HỆ THỐNG (MẬT)
                </h3>
                <p className="text-slate-400 text-xs mt-1 font-sans">
                  Nhật ký bảo mật tự động ghi nhận mọi hành vi phê duyệt kích hoạt tài khoản hoặc thay đổi quyền hạn của các CEO thuộc hệ thống. Chỉ các tài khoản có vai trò Admin, Mod và Manager mới có quyền xem thông tin này.
                </p>
              </div>

              {approvalLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                  📭 Chưa có lịch sử thao tác duyệt tài khoản nào được ghi nhận trên hệ thống.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/40">
                  <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
                    <thead>
                      <tr className="bg-slate-950/90 text-[10.5px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3.5 px-4 font-bold">Thời gian</th>
                        <th className="py-3.5 px-4 font-bold">Người thực hiện duyệt</th>
                        <th className="py-3.5 px-4 font-bold">CEO / Thành viên được duyệt</th>
                        <th className="py-3.5 px-4 font-bold text-center">Thay đổi Trạng thái</th>
                        <th className="py-3.5 px-4 font-bold text-center">Thay đổi Vai trò</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {[...approvalLogs].reverse().map((log) => {
                        const isStatusChanged = log.oldStatus !== log.newStatus;
                        const isRoleChanged = log.oldRole !== log.newRole;

                        return (
                          <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                            {/* Thời gian */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </td>

                            {/* Người thực hiện */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-200">{log.operatorName}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-mono">@{log.operatorUsername}</span>
                                <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                                  log.operatorRole === "Admin"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/15"
                                    : log.operatorRole === "Mod"
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                                }`}>
                                  {log.operatorRole}
                                </span>
                              </div>
                            </td>

                            {/* Thành viên đích */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-200">{log.targetUserName}</div>
                              <div className="text-[10.5px] text-slate-500 font-mono mt-0.5 line-clamp-1">{log.targetUserCompany}</div>
                            </td>

                            {/* Trạng thái cũ -> mới */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center justify-center gap-1.5 font-mono text-[10.5px]">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  log.oldStatus === "Active"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : log.oldStatus === "Pending"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  {log.oldStatus}
                                </span>
                                {isStatusChanged ? (
                                  <>
                                    <span className="text-amber-500 text-[11px] font-bold">➔</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      log.newStatus === "Active"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : log.newStatus === "Pending"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    }`}>
                                      {log.newStatus}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-500 font-mono text-[10px] italic">(Giữ nguyên)</span>
                                )}
                              </div>
                            </td>

                            {/* Vai trò cũ -> mới */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center justify-center gap-1.5 font-mono text-[10.5px]">
                                <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-800">
                                  {log.oldRole}
                                </span>
                                {isRoleChanged ? (
                                  <>
                                    <span className="text-amber-500 text-[11px] font-bold">➔</span>
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold font-sans">
                                      {log.newRole}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-500 font-mono text-[10px] italic">(Giữ nguyên)</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
