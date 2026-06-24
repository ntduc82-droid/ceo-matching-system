/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Định nghĩa các Role và Status đồng bộ giữa Backend và Frontend
export type UserRole = 'Admin' | 'Mod' | 'Manager' | 'Member' | 'Guest';
export type UserStatus = 'Pending' | 'Active' | 'Banned';
export type PostStatus = 'Pending' | 'Approved' | 'Rejected';
export type EventStatus = 'Pending' | 'Approved';

// Interface cho bảng Users
export interface User {
  id: number;
  username: string;
  passwordHash?: string; // Sẽ bị lược bỏ khi gửi về client nếu không cần thiết
  role: UserRole;
  status: UserStatus;
  
  // Thông tin cá nhân & doanh nghiệp
  fullName: string;
  companyName: string;
  jobTitle: string;
  bio: string;
  companyDescription: string;
  productDescription: string;
  industry: string;
  
  // Liên hệ
  phone_number: string;
  email: string;
  
  // Liên kết mạng xã hội
  website: string;
  facebookLink: string;
  tiktokLink: string;
  linkedinLink: string;
  otherLink: string;
  
  // Định hướng phát triển
  visionMission: string;
  matchingNeeds: string;

  // Ảnh đại diện, màu chủ đạo & hình ảnh phong phú
  avatarUrl?: string;
  profileImageUrl?: string;
  companyImages?: string[];
  productImages?: string[];
  profileColor?: string;
}

// Interface lưu cấu hình ẩn/hiện trường thông tin riêng biệt của từng User (Bảng Field_Permissions)
export interface FieldPermissions {
  userId: number;
  phoneVisible: boolean;
  emailVisible: boolean;
  facebookVisible: boolean;
  linkedinVisible: boolean;
  tiktokVisible: boolean;
  websiteVisible: boolean;
  bioVisible: boolean;
  companyDescriptionVisible: boolean;
  productDescriptionVisible: boolean;
  visionMissionVisible: boolean;
  matchingNeedsVisible: boolean;
}

// Interface lưu thông tin bài viết (Bảng Posts)
export interface Post {
  id: number;
  authorId: number | null; // null biểu thị bài viết của chính hệ thống
  title: string;
  content: string;
  imageUrl?: string;
  status: PostStatus;
  category: string;
  createdAt: string;
  authorName?: string; // Dùng để hiển thị
  authorRole?: string;
}

// Interface lưu thông tin sự kiện (Bảng Events)
export interface Event {
  id: number;
  creatorId: number | null;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  organizerUnit: string;
  imageUrl?: string;
  status: EventStatus;
  createdAt: string;
  creatorName?: string;
  showOnHome?: boolean;
  isHot?: boolean;
}

// Interface lưu thông tin đăng ký tham gia sự kiện (Bảng Event_Registrations)
export interface EventRegistration {
  id: number;
  eventId: number;
  userId: number;
  registrationNote: string;
  companyRepresenting: string;
  guestsCount: number;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  status?: "Pending" | "Approved" | "Rejected";
}

// Interface lưu thông tin gợi ý kết nối (Bảng Matches)
export interface Match {
  id: number;
  userAId: number;
  userBId: number;
  matchScore: number;
  commonInterests: string;
  aiRecommendation: string;
  status: 'Proposed' | 'Connected' | 'Rejected';
  createdAt: string;
}

// Interface lưu thông tin Menu Hệ Thống (Bảng System_Menus)
export interface SystemMenu {
  id: number;
  title: string;
  url: string;
  orderIndex: number;
  isVisible: boolean;
  roleAllowed: UserRole;
}

// Interface lưu thông tin bài viết giao thương (Bảng Trades)
export interface Trade {
  id: number;
  authorId: number;
  title: string;
  content: string;
  type: string; // "Cần mua" | "Cần bán" | "Tìm đối tác" | "Khác"
  createdAt: string;
  authorName?: string;
  authorCompanyName?: string;
  authorAvatarUrl?: string;
}

// Interface lưu phản hồi liên hệ của bài giao thương (Bảng TradeComments)
export interface TradeComment {
  id: number;
  tradeId: number;
  userId: number;
  content: string;
  createdAt: string;
  userName?: string;
  userCompanyName?: string;
  userAvatarUrl?: string;
  userPhone?: string;
  userEmail?: string;
}

// Tổng hợp trạng thái Dashboard cho Admin/Mod/Manager
export interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalEvents: number;
  pendingEvents: number;
  totalPosts: number;
  pendingPosts: number;
}

// Interface cho Thông báo (Bảng Notifications)
export interface AppNotification {
  id: number;
  userId: number; // 0: Tất cả mọi người (Broadcasting), hoặc ID cụ thể của CEO nhận
  type: 'ConnectionRequest' | 'ConnectionAccepted' | 'ProfileStatusChanged' | 'NewMember' | 'System';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  meta?: {
    matchId?: number;
    senderId?: number;
    senderName?: string;
    senderAvatar?: string;
    targetUserId?: number;
  };
}

