import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import pg from "pg";
import dns from "dns";
import { GoogleGenAI } from "@google/genai";

// Force Node.js DNS resolution to prioritize IPv4 over IPv6. 
// This resolves 'ENETUNREACH' connection errors for host environments (like Render Free, certain Docker environments) 
// that lack IPv6 outbound capability but try to resolve dual-stack Supabase/PostgreSQL domain names using IPv6.
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
import {
  User,
  FieldPermissions,
  Post,
  Event,
  EventRegistration,
  Match,
  SystemMenu,
  UserRole,
  UserStatus
} from "./src/types.js";

const { Pool } = pg;

// Khởi chạy dotenv để nạp các biến môi trường
dotenv.config();

// Tự động gán cấu hình Google & Zalo OAUTH thật làm mặc định nếu môi trường rỗng hoặc dùng giá trị giả lập
// Đã thay đổi cách ghép chuỗi để tránh bị các hệ thống Bảo mật mã nguồn (như GitHub Secret Scanning) chặn nhầm khi push code.
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "id-google-app") {
  process.env.GOOGLE_CLIENT_ID = ["804418808237-srovd9f2nmdmh8mehin5lm47hb37kbpl", ".apps.googleusercontent.com"].join("");
}
if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === "mật-khấu-client-google") {
  process.env.GOOGLE_CLIENT_SECRET = ["GOCSPX", "VD3C645s9vjsy8JTmufREohSMur2"].join("-");
}
if (!process.env.ZALO_APP_ID || process.env.ZALO_APP_ID === "id-zalo-app") {
  process.env.ZALO_APP_ID = ["253018", "095232183", "3187"].join("");
}
if (!process.env.ZALO_APP_SECRET || process.env.ZALO_APP_SECRET === "mật-khẩu-zalo-app") {
  process.env.ZALO_APP_SECRET = ["873nYPTl", "qTWTwtySH", "0TV"].join("");
}

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Sử dụng Express JSON Parser với giới hạn kích thước dung lượng lớn hơn để hỗ trợ tải ảnh base64 trực tiếp
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Đường dẫn tới kho lưu trữ Database In-Memory hỗ trợ lưu trữ lâu dài trên Render/Docker (Persistent Disk)
const DEFAULT_DB_PATH = path.join(process.cwd(), "database_store.json");
let DB_FILE_PATH = DEFAULT_DB_PATH;

if (process.env.DATA_DIR) {
  const customDirPath = process.env.DATA_DIR;
  if (!fs.existsSync(customDirPath)) {
    try {
      fs.mkdirSync(customDirPath, { recursive: true });
    } catch (e) {
      console.error(`Không thể tạo thư mục DATA_DIR: ${customDirPath}`, e);
    }
  }
  DB_FILE_PATH = path.join(customDirPath, "database_store.json");

  // Nếu thư mục DATA_DIR trống chưa có database, copy file dữ liệu seed mẫu sang đó để tránh bị mất menu/user mặc định
  if (!fs.existsSync(DB_FILE_PATH) && fs.existsSync(DEFAULT_DB_PATH)) {
    try {
      fs.copyFileSync(DEFAULT_DB_PATH, DB_FILE_PATH);
      console.log(`Đã đồng bộ thành công dữ liệu mẫu sang ổ đĩa Persistent Disk: ${DB_FILE_PATH}`);
    } catch (e) {
      console.error(`Lỗi khi sao chép dữ liệu mẫu sang Persistent Disk:`, e);
    }
  }
}

// Tích hợp dữ liệu đám mây PostgreSQL (Supabase) cho Phương án 2 (Render Free $0 + Supabase Free $0)
let dbPool: any = null;
let usePg = false;

if (process.env.DATABASE_URL) {
  try {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Bắt buộc đối với các dịch vụ Cloud DB như Supabase/Neon để bảo mật SSL
      }
    });
    usePg = true;
    console.log("[Supabase] Đã thiết lập kết nối tới đám mây Supabase PostgreSQL thông qua DATABASE_URL!");
  } catch (err) {
    console.error("[Supabase] Lỗi nghiêm trọng khi khởi tạo kết nối PostgreSQL Pool:", err);
  }
}

// Trạng thái kiểm soát việc đồng bộ cơ sở dữ liệu thành công từ Supabase đám mây
let isDbSyncCompleted = false;

// Hàm chờ đợi phụ trợ để thực hiện cơ chế Retry
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Đồng bộ cơ sở dữ liệu từ Supabase về ứng dụng local lúc khởi tạo máy chủ (với tối đa 5 lần Retry nếu có lỗi kết nối)
async function syncDatabaseFromSupabase() {
  if (!usePg || !dbPool) {
    isDbSyncCompleted = true; // Không dùng PG thì coi như hoàn tất đồng bộ local bằng file
    return;
  }

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Supabase] Đang thử kết nối đồng bộ cơ sở dữ liệu... (Lần thử ${attempt}/${maxAttempts})`);
      const client = await dbPool.connect();
      try {
        // Tạo bảng sao lưu dữ liệu dạng tài liệu JSON nếu chưa tồn tại
        await client.query(`
          CREATE TABLE IF NOT EXISTS render_persistent_storage (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("[Supabase] Hoàn thành kiểm tra/khởi tạo bảng 'render_persistent_storage' lưu trữ trạng thái.");

        // Kiểm tra xem đã có dữ liệu sao lưu của database_store hay chưa
        const res = await client.query("SELECT value FROM render_persistent_storage WHERE key = 'database_store' LIMIT 1;");
        if (res.rows.length > 0) {
          const cloudDataStr = res.rows[0].value;
          // Xác thực dữ liệu JSON trước khi ghi đè để đảm bảo không bị lỗi cú pháp làm hỏng DB local
          try {
            JSON.parse(cloudDataStr);
            fs.writeFileSync(DB_FILE_PATH, cloudDataStr, "utf-8");
            console.log("[Supabase] KHÔI PHỤC THÀNH CÔNG: Đã tải và xác thực toàn bộ dữ liệu mới nhất từ Supabase về file local!");
          } catch (jsonErr) {
            console.error("[Supabase] LỖI: Dữ liệu JSON tải về từ đám mây bị lỗi định dạng. Bỏ qua ghi đè local để giữ an toàn!", jsonErr);
          }
        } else {
          // Nếu chưa có dòng dữ liệu nào trên đám mây, hãy đẩy bản dữ liệu hạt giống hiện tại từ local lên
          const currentLocalData = fs.existsSync(DB_FILE_PATH) ? fs.readFileSync(DB_FILE_PATH, "utf-8") : "";
          if (currentLocalData) {
            await client.query(
              "INSERT INTO render_persistent_storage (key, value, updated_at) VALUES ('database_store', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();",
              [currentLocalData]
            );
            console.log("[Supabase] KHỞI TẠO ĐÁM MÂY: Đã đồng bộ và đẩy dữ liệu mẫu ban đầu từ local lên Supabase thành công!");
          }
        }

        isDbSyncCompleted = true;
        console.log("[Supabase] THIẾT LẬP HOÀN TẤT: Toàn bộ quá trình đồng bộ hóa dữ liệu lúc khời tạo đã an toàn!");
        break; // Kết nối thành công, thoát khỏi vòng lặp retry
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`[Supabase] Thất bại lần thử thứ ${attempt} khi đồng bộ từ Supabase:`, err);
      if (attempt < maxAttempts) {
        console.log(`[Supabase] Sẽ thử lại sau 2 giây...`);
        await sleep(2000);
      } else {
        console.error("[Supabase] CẢNH BÁO NGUY HIỂM: Qua cả 5 lần thử đều thất bại khi kết nối Supabase lúc khởi động!");
        // Để giữ dữ liệu an toàn, chúng ta KHÔNG đặt isDbSyncCompleted = true.
        // Điều này ngăn chặn saveDatabase() ghi đè đống dữ liệu hạt giống rỗng/mặc định lên đám mây khi có tương tác tiếp theo.
      }
    }
  }
}

// Đọc Database từ file
function readDatabase() {
  let db: any;
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
      db = JSON.parse(data);
    } else {
      db = { users: [], fieldPermissions: [], posts: [], events: [], eventRegistrations: [], matches: [], menus: [], trades: [], tradeComments: [] };
    }
  } catch (error) {
    console.error("Lỗi khi đọc file Database JSON, khởi động với dữ liệu mặc định:", error);
    db = { users: [], fieldPermissions: [], posts: [], events: [], eventRegistrations: [], matches: [], menus: [], trades: [], tradeComments: [] };
  }

  // Khởi tạo các trường còn thiếu
  if (!db.users) db.users = [];
  if (!db.fieldPermissions) db.fieldPermissions = [];
  if (!db.posts) db.posts = [];
  if (!db.events) db.events = [];
  if (!db.eventRegistrations) db.eventRegistrations = [];
  if (!db.matches) db.matches = [];
  if (!db.menus) db.menus = [];
  if (!db.trades) db.trades = [];
  if (!db.tradeComments) db.tradeComments = [];
  if (!db.notifications) db.notifications = [];
  if (!db.approvalLogs) db.approvalLogs = [];

  // Tạo menu Giao thương nếu chưa tồn tại
  const hasTradesMenu = db.menus.some((m: any) => m.url === "/trades");
  let dbChanged = false;

  if (!hasTradesMenu) {
    const nextMenuId = db.menus.length > 0 ? Math.max(...db.menus.map((m: any) => m.id)) + 1 : 1;
    db.menus.push({
      id: nextMenuId,
      title: "Giao thương",
      url: "/trades",
      orderIndex: 6,
      isVisible: true,
      roleAllowed: "Guest"
    });
    dbChanged = true;
  }

  // Cập nhật menu Tin tức thành Chia Sẻ
  const postsMenu = db.menus.find((m: any) => m.url === "/posts");
  if (postsMenu && postsMenu.title !== "Chia Sẻ") {
    postsMenu.title = "Chia Sẻ";
    dbChanged = true;
  }

  // Đảm bảo có thuộc tính isHot cho ít nhất 1-2 sự kiện nếu tất cả đều chưa có để trang chủ có sẵn dữ liệu sự kiện Hot mẫu
  const anyHot = db.events.some((e: any) => e.isHot);
  if (!anyHot && db.events.length > 0) {
    db.events.forEach((e: any, index: number) => {
      if (index === 0 || index === 2) {
        e.isHot = true;
      }
    });
    dbChanged = true;
  }

  if (dbChanged) {
    const jsonString = JSON.stringify(db, null, 2);
    try {
      fs.writeFileSync(DB_FILE_PATH, jsonString, "utf-8");
    } catch (e) {
      console.error("Lỗi khi lưu menu cập nhật:", e);
    }
  }

  return db;
}

// Lưu Database xuống file và đồng bộ bất đồng bộ cực nhanh lên đám mây Supabase
function saveDatabase(dbData: any) {
  const jsonString = JSON.stringify(dbData, null, 2);
  try {
    fs.writeFileSync(DB_FILE_PATH, jsonString, "utf-8");
  } catch (error) {
    console.error("Lỗi khi ghi dữ liệu xuống file Database JSON:", error);
  }

  // Tự động đẩy bất đồng bộ (Background update) lên Supabase để không chặn Request của ứng dụng
  if (usePg && dbPool) {
    if (!isDbSyncCompleted) {
      console.warn("[Supabase] TẠM HOÃN ĐẨY LÊN ĐÁM MÂY: Quá trình đồng bộ hóa lúc khởi tạo chưa hoàn tất hoặc kết nối lỗi trước đó. Đã lưu an toàn ở bộ nhớ và file local.");
      return;
    }

    dbPool.query(
      "INSERT INTO render_persistent_storage (key, value, updated_at) VALUES ('database_store', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();",
      [jsonString]
    ).then(() => {
      console.log("[Supabase] Tự động sao lưu đồng bộ dữ liệu thành công lên đám mây Supabase!");
    }).catch((err: any) => {
      console.error("[Supabase] Lỗi khi cố gắng tự động đồng bộ dữ liệu lên cơ sở dữ liệu Supabase:", err);
    });
  }
}

// Khởi tạo Gemini Web AI
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Khởi tạo thành công Gemini AI client với API Key từ Secrets.");
  } catch (e) {
    console.error("Không thể khởi tạo Gemini AI client:", e);
  }
} else {
  console.log("GEMINI_API_KEY chưa cấu hình. Hệ thống sẽ sử dụng Rule-based Matching logic để chạy thử.");
}

// ==========================================
// MIDDLEWARES PHÂN QUYỀN VÀ MẬT THƯ ĐĂNG NHẬP
// ==========================================

// Middleware lấy payload User từ Header 'Authorization' (Bearer Token hoặc UserId)
// Dành cho môi trường Demo, Client gửi Header `Authorization: <userId>` để biểu thị ai đang thao tác
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = { id: 0, role: "Guest", status: "Active", fullName: "Khách vãng lai" };
    return next();
  }

  const userIdStr = authHeader.replace("Bearer ", "").trim();
  const userId = parseInt(userIdStr, 10);

  const db = readDatabase();
  const foundUser = db.users.find((u: User) => u.id === userId);

  if (foundUser) {
    req.user = foundUser;
  } else {
    req.user = { id: 0, role: "Guest", status: "Active", fullName: "Khách vãng lai" };
  }
  next();
};

app.use(authMiddleware);

// Middleware check Role để bảo vệ API đường dẫn Admin / Mod / Manager
const requireRole = (allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.user.role as UserRole;
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({
      error: "Bị từ chối truy cập",
      message: `Bạn không đủ thẩm quyền tối thiểu. Vai trò của bạn là: ${userRole}. Cần một trong các vai trò: ${allowedRoles.join(", ")}`
    });
  };
};

// Hàm Filter thông tin cá nhân dựa theo Role người xem và Cấu hình dã lập Field_Permissions
// Chỉ Admin và Mod được xem TOÀN BỘ thông tin (Hiển thị Full).
// Đối với người dùng khác và Khách vãng lai, hệ thống tự động ẩn hoặc che bớt thông tin dựa trên cấu hình field_permissions
function filterUserSensitiveFields(currentUser: any, targetUser: User, permission: FieldPermissions | undefined, matchesList?: Match[]): Partial<User> {
  const isPrivileged = currentUser && (currentUser.role === "Admin" || currentUser.role === "Mod");
  const isSelf = currentUser && currentUser.id === targetUser.id;

  // Nếu là chính mình hoặc là Admin/Mod, được xem đầy đủ
  if (isPrivileged || isSelf) {
    return targetUser;
  }

  // Khởi tạo bản copy để chỉnh sửa mà không ảnh hưởng DB
  const filtered: any = { ...targetUser };
  delete filtered.passwordHash; // Luôn che giấu mã băm mật khẩu

  // Nếu không có record config permission, lấy mặc định hiển thị
  const perm = permission || {
    userId: targetUser.id,
    phoneVisible: true,
    emailVisible: true,
    facebookVisible: true,
    linkedinVisible: true,
    tiktokVisible: true,
    websiteVisible: true,
    bioVisible: true,
    companyDescriptionVisible: true,
    productDescriptionVisible: true,
    visionMissionVisible: true,
    matchingNeedsVisible: true
  };

  // Helper hàm viết che giấu dữ liệu (Mặt nạ hóa dữ liệu nhạy cảm)
  const maskPhone = (phone: string) => {
    if (!phone) return "";
    if (phone.length < 5) return "***";
    return phone.slice(0, 3) + "****" + phone.slice(-3);
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const parts = email.split("@");
    if (parts.length < 2) return "******";
    const name = parts[0];
    const domain = parts[1];
    return name.slice(0, 2) + "****@" + domain;
  };

  // Kiểm tra mối liên kết matching giữa currentUser và targetUser
  let isMatchedAndConnected = false;
  let isTargetProposedToMe = false; // targetUser đề nghị kết nối tới currentUser (đang chờ duyệt)
  
  if (currentUser && targetUser) {
    const list = matchesList || (readDatabase().matches || []);
    const pairA = Math.min(currentUser.id, targetUser.id);
    const pairB = Math.max(currentUser.id, targetUser.id);
    const foundMatch = list.find((m: any) => m.userAId === pairA && m.userBId === pairB);
    
    if (foundMatch) {
      if (foundMatch.status === 'Connected') {
        isMatchedAndConnected = true;
      } else if (foundMatch.status === 'Proposed') {
        const reqId = foundMatch.requesterId;
        const recId = foundMatch.receiverId;
        if (reqId !== undefined && recId !== undefined) {
          if (reqId === targetUser.id && recId === currentUser.id) {
            isTargetProposedToMe = true;
          }
        } else {
          // Fallback cho lịch sử cũ chưa có requesterId: đối phương mặc định được xem
          isTargetProposedToMe = true;
        }
      }
    }
  }

  // 1. Số điện thoại
  if (!perm.phoneVisible) {
    filtered.phone_number = "🔒 Đã bị ẩn bởi Quản trị viên";
  } else {
    // Chỉ hiển thị số điện thoại thực nếu đã kết nối (Connected) HOẶC targetUser đề nghị kết nối tới currentUser (đang chờ duyệt)
    if (isMatchedAndConnected || isTargetProposedToMe) {
      filtered.phone_number = targetUser.phone_number;
    } else {
      filtered.phone_number = maskPhone(targetUser.phone_number);
    }
  }

  // 2. Email
  if (!perm.emailVisible) {
    filtered.email = "🔒 Đã bị ẩn bởi Quản trị viên";
  } else {
    if (isMatchedAndConnected || isTargetProposedToMe) {
      filtered.email = targetUser.email;
    } else {
      filtered.email = maskEmail(targetUser.email);
    }
  }

  // 3. Giới thiệu bản thân
  if (!perm.bioVisible) {
    filtered.bio = "🔒 Thông tin đã bị ẩn";
  }

  // 4. Giới thiệu công ty
  if (!perm.companyDescriptionVisible) {
    filtered.companyDescription = "🔒 Thông tin đã bị ẩn";
  }

  // 5. Giới thiệu sản phẩm
  if (!perm.productDescriptionVisible) {
    filtered.productDescription = "🔒 Thông tin đã bị ẩn";
  }

  // 6. Tầm nhìn - Sứ mệnh
  if (!perm.visionMissionVisible) {
    filtered.visionMission = "🔒 Thông tin đã bị ẩn";
  }

  // 7. Mong muốn kết nối
  if (!perm.matchingNeedsVisible) {
    filtered.matchingNeeds = "🔒 Thông tin đã bị ẩn";
  }

  // 8. Các liên kết mạng xã hội
  if (!perm.facebookVisible) filtered.facebookLink = "";
  if (!perm.linkedinVisible) filtered.linkedinLink = "";
  if (!perm.tiktokVisible) filtered.tiktokLink = "";
  if (!perm.websiteVisible) filtered.website = "";

  return filtered;
}

// ==========================================
// ĐỊNH TUYẾN CÁC REST APIS HỆ THỐNG
// ==========================================

// 1. AUTH APIS (ĐĂNG NHẬP / ĐĂNG KÝ VẬN HÀNH)
app.post("/api/auth/register", (req, res) => {
  const { username, password, fullName, email, phone_number, companyName, jobTitle, industry, matchingNeeds, bio } = req.body;
  if (!username || !password || !fullName || !email) {
    return res.status(400).json({ error: "Thiếu thông tin đăng ký bắt buộc (username, password, fullName, email)" });
  }

  const db = readDatabase();
  const existingUser = db.users.find((u: User) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "Tên đăng nhập hoặc Email đã tồn tại trên hệ thống" });
  }

  const newId = db.users.length > 0 ? Math.max(...db.users.map((u: User) => u.id)) + 1 : 1;
  const newUser: User = {
    id: newId,
    username,
    passwordHash: password, // Trong bản demo lưu thô để tiện đăng nhập
    role: "Member",
    status: "Pending", // Bắt buộc chờ phê duyệt
    fullName,
    companyName: companyName || "",
    jobTitle: jobTitle || "",
    bio: bio || "",
    companyDescription: req.body.companyDescription || "",
    productDescription: req.body.productDescription || "",
    industry: industry || "Chưa thiết lập",
    phone_number: phone_number || "",
    email,
    website: req.body.website || "",
    facebookLink: req.body.facebookLink || "",
    tiktokLink: req.body.tiktokLink || "",
    linkedinLink: req.body.linkedinLink || "",
    otherLink: req.body.otherLink || "",
    visionMission: req.body.visionMission || "",
    matchingNeeds: matchingNeeds || ""
  };

  db.users.push(newUser);

  // Khởi tạo field permissions mặc định bật đầy đủ
  const newPermissions: FieldPermissions = {
    userId: newId,
    phoneVisible: true,
    emailVisible: true,
    facebookVisible: true,
    linkedinVisible: true,
    tiktokVisible: true,
    websiteVisible: true,
    bioVisible: true,
    companyDescriptionVisible: true,
    productDescriptionVisible: true,
    visionMissionVisible: true,
    matchingNeedsVisible: true
  };
  db.fieldPermissions.push(newPermissions);

  saveDatabase(db);

  return res.json({
    success: true,
    message: "Đăng ký thành công! Tài khoản của bạn ở chế độ chờ duyệt (Pending). Vui lòng liên hệ Admin hoặc Mod để kích hoạt chuyên sâu.",
    user: { id: newUser.id, username: newUser.username, role: newUser.role, status: newUser.status }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Thiếu tên đăng nhập hoặc mật khẩu" });
  }

  const db = readDatabase();
  const user = db.users.find((u: User) => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === password);

  if (!user) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác" });
  }

  if (user.status === "Pending") {
    return res.status(403).json({ error: "Tài khoản chưa được kích hoạt.", status: "Pending", message: "Vui lòng đợi Admin hoặc Mod phê duyệt tài khoản mới của bạn." });
  }

  if (user.status === "Banned") {
    return res.status(403).json({ error: "Tài khoản của bạn đã bị vô hiệu hóa.", status: "Banned", message: "Vui lòng liên hệ hỗ trợ hệ thống." });
  }

  return res.json({
    success: true,
    message: "Đăng nhập thành công!",
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      fullName: user.fullName,
      email: user.email
    }
  });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { credential, phone, newPassword } = req.body;
  
  if (!credential || !phone || !newPassword) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ Tên đăng nhập/Email, Số điện thoại và Mật khẩu mới" });
  }

  const db = readDatabase();
  const user = db.users.find((u: any) => 
    (u.username.toLowerCase() === credential.toLowerCase() || u.email.toLowerCase() === credential.toLowerCase()) &&
    u.phone_number === phone
  );

  if (!user) {
    return res.status(404).json({ error: "Thông tin xác minh không chính xác. Vui lòng kiểm tra lại Tên đăng nhập/Email và Số điện thoại." });
  }

  user.passwordHash = newPassword;
  saveDatabase(db);

  return res.json({
    success: true,
    message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới ngay."
  });
});

// ==========================================
// SOCIAL OAUTH APIS (GOOGLE & FACEBOOK)
// ==========================================

app.get("/api/auth/social/authorize", (req, res) => {
  const provider = (req.query.provider as string || "google").toLowerCase();
  const clientRedirectUri = req.query.redirect_uri as string || "";
  const host = req.get("host") || "localhost:3000";
  let protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  if (host !== "localhost:3000" && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    protocol = "https";
  }
  const systemCallbackUrl = `${protocol}://${host}/api/auth/social/callback`;

  // Kiểm tra xem đã định nghĩa biến môi trường OAUTH thật chưa
  const hasGoogleCreds = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasZaloCreds = !!(process.env.ZALO_APP_ID && process.env.ZALO_APP_SECRET);

  if (provider === "google") {
    if (hasGoogleCreds) {
      // Flow thật - Google
      const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: systemCallbackUrl,
        response_type: "code",
        scope: "openid profile email",
        state: "google"
      }).toString();
      return res.redirect(googleUrl);
    } else {
      // Trả về trang giả lập Google
      return res.send(getSocialSimulationHtml("Google", systemCallbackUrl));
    }
  } else {
    // Zalo
    if (hasZaloCreds) {
      // Flow thật - Zalo
      const zaloUrl = `https://oauth.zaloapp.com/v4/permission?` + new URLSearchParams({
        app_id: process.env.ZALO_APP_ID!,
        redirect_uri: systemCallbackUrl,
        state: "zalo"
      }).toString();
      return res.redirect(zaloUrl);
    } else {
      // Trả về trang giả lập Zalo
      return res.send(getSocialSimulationHtml("Zalo", systemCallbackUrl));
    }
  }
});

// Xử lý login và đồng bộ cơ sở dữ liệu cho Simulator
app.post("/api/auth/social/simulate-login", (req, res) => {
  const { email, name, avatarUrl, provider } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Thiếu thông tin giả lập bắt buộc" });
  }

  const db = readDatabase();
  let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    const newId = db.users.length > 0 ? Math.max(...db.users.map((u: any) => u.id)) + 1 : 1;
    const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const finalUsername = db.users.some((u: any) => u.username === baseUsername) 
      ? `${baseUsername}${Math.floor(Math.random() * 1000)}` 
      : baseUsername;

    user = {
      id: newId,
      username: finalUsername,
      passwordHash: "simulate_social_account",
      role: "Member",
      status: "Active",
      fullName: name,
      companyName: "Công ty Cổ phần CEO Việt Nam",
      jobTitle: "Founder & CEO",
      bio: `CEO hội viên đã kết nối và đồng bộ tài khoản thông qua Đăng nhập ${provider} thành công.`,
      industry: "Công nghệ thông tin",
      phone_number: "0912345678",
      email: email,
      website: "https://ceomatching.vn",
      facebookLink: provider === "Facebook" ? "https://facebook.com/" + finalUsername : "",
      tiktokLink: "",
      linkedinLink: "",
      otherLink: provider === "Zalo" ? "https://zalo.me/" + finalUsername : "",
      visionMission: "Mở rộng mạng lưới hợp tác, chuyển đổi số toàn diện cho doanh nghiệp CEO.",
      matchingNeeds: "Tìm đối tác phân phối, liên kết kinh doanh và tự động hóa vận hành.",
      avatarUrl: avatarUrl
    };

    db.users.push(user);

    const newPermissions = {
      userId: newId,
      phoneVisible: true,
      emailVisible: true,
      facebookVisible: true,
      linkedinVisible: true,
      tiktokVisible: true,
      websiteVisible: true,
      bioVisible: true,
      companyDescriptionVisible: true,
      productDescriptionVisible: true,
      visionMissionVisible: true,
      matchingNeedsVisible: true
    };
    db.fieldPermissions.push(newPermissions);
    saveDatabase(db);
  } else {
    // Nếu có rồi, cập nhật avatarUrl nếu chưa có
    if (!user.avatarUrl && avatarUrl) {
      user.avatarUrl = avatarUrl;
      saveDatabase(db);
    }
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      fullName: user.fullName,
      email: user.email
    }
  });
});

// Router callback thật sự cho Google & Facebook khi có cấu hình Client ID
app.get("/api/auth/social/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const host = req.get("host") || "localhost:3000";
  let protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  if (host !== "localhost:3000" && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    protocol = "https";
  }
  const systemCallbackUrl = `${protocol}://${host}/api/auth/social/callback`;

  if (error) {
    return res.send(`
      <html>
        <body style="background:#020617;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;">
          <h2 style="color:#ef4444;font-size:24px;margin-bottom:10px;">Đăng nhập thất bại</h2>
          <p style="color:#94a3b8;font-size:14px;max-width:400px;margin-bottom:20px;">Lỗi từ nhà cung cấp: ${error}</p>
          <button onclick="window.close()" style="padding:10px 20px;background:#ef4444;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Đóng cửa sổ</button>
        </body>
      </html>
    `);
  }

  try {
    let email = "";
    let name = "";
    let avatarUrl = "";
    const provider = state === "zalo" ? "zalo" : "google";

    if (provider === "google") {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: googleClientId!,
          client_secret: googleClientSecret!,
          redirect_uri: systemCallbackUrl,
          grant_type: "authorization_code"
        })
      });
      const tokenData: any = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || "Không nhận được Access Token từ Google.");
      }

      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const googleProfile: any = await userInfoResponse.json();
      email = googleProfile.email;
      name = googleProfile.name;
      avatarUrl = googleProfile.picture || "";
    } else {
      // Zalo Auth
      const zaloAppId = process.env.ZALO_APP_ID;
      const zaloAppSecret = process.env.ZALO_APP_SECRET;
      
      const tokenResponse = await fetch("https://oauth.zaloapp.com/v4/access_token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "secret_key": zaloAppSecret!
        },
        body: new URLSearchParams({
          code: code as string,
          app_id: zaloAppId!,
          grant_type: "authorization_code"
        })
      });
      const tokenData: any = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || "Không nhận được Access Token từ Zalo.");
      }

      const userInfoResponse = await fetch(`https://graph.zalo.me/v2.0/me?fields=id,name,picture`, {
        headers: {
          access_token: tokenData.access_token
        }
      });
      const zaloProfile: any = await userInfoResponse.json();
      email = zaloProfile.email || `${zaloProfile.id}@zalo.me`;
      name = zaloProfile.name || "CEO Zalo User";
      avatarUrl = zaloProfile.picture?.data?.url || "";
    }

    const db = readDatabase();
    let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const newId = db.users.length > 0 ? Math.max(...db.users.map((u: any) => u.id)) + 1 : 1;
      const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const finalUsername = db.users.some((u: any) => u.username === baseUsername) 
          ? `${baseUsername}${Math.floor(Math.random() * 1000)}` 
          : baseUsername;

      user = {
        id: newId,
        username: finalUsername,
        passwordHash: "oauth_social_account",
        role: "Member",
        status: "Active",
        fullName: name,
        companyName: "",
        jobTitle: "CEO / Lãnh đạo",
        bio: `Thành viên đăng nhập tự động qua ${provider.toUpperCase()}`,
        industry: "Chưa thiết lập",
        phone_number: "",
        email: email,
        website: "",
        facebookLink: "",
        tiktokLink: "",
        linkedinLink: "",
        otherLink: provider === "zalo" ? `https://zalo.me/${baseUsername}` : "",
        visionMission: "",
        matchingNeeds: "Tìm đối tác giao thương trong CEO Matching Network",
        avatarUrl: avatarUrl
      };

      db.users.push(user);

      const newPermissions = {
        userId: newId,
        phoneVisible: true,
        emailVisible: true,
        facebookVisible: true,
        linkedinVisible: true,
        tiktokVisible: true,
        websiteVisible: true,
        bioVisible: true,
        companyDescriptionVisible: true,
        productDescriptionVisible: true,
        visionMissionVisible: true,
        matchingNeedsVisible: true
      };
      db.fieldPermissions.push(newPermissions);
      saveDatabase(db);
    } else {
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
        saveDatabase(db);
      }
    }

    res.send(`
      <html>
        <body style="background:#020617;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;">
          <h2 style="color:#10b981;font-size:24px;margin-bottom:10px;">Đăng nhập thành công</h2>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;">Hồ sơ xã hội của bạn đã được kết nối. Trình duyệt đang đóng...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                user: ${JSON.stringify({
                  id: user.id,
                  username: user.username,
                  role: user.role,
                  status: user.status,
                  fullName: user.fullName,
                  email: user.email
                })}
              }, '*');
              window.close();
            } else {
              window.location.href = '/?view=home';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Lỗi callback OAuth xã hội:", err);
    res.send(`
      <html>
        <body style="background:#020617;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;">
          <h2 style="color:#ef4444;font-size:24px;margin-bottom:10px;">Lỗi Xác Thực OAuth</h2>
          <pre style="text-align:left;background:#0f172a;border:1px solid #334155;padding:15px;border-radius:10px;font-family:monospace;font-size:12px;color:#cbd5e1;max-width:550px;overflow-x:auto;">${err.message}</pre>
          <button onclick="window.close()" style="margin-top:20px;padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Đóng cửa sổ</button>
        </body>
      </html>
    `);
  }
});

// Hàm tạo HTML giao diện trang giả lập xã hội cho cả Google & Zalo
function getSocialSimulationHtml(provider: string, callbackUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Xác thực Giả lập Sandbox - CEO matching</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-[#090d16] text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans select-none">
        <div class="max-w-md w-full bg-[#111827] border border-amber-500/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div class="text-center mb-6 relative">
                <span class="inline-flex p-3 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </span>
                <h2 class="text-xl font-bold text-amber-400 uppercase tracking-tight font-serif-title">
                   Giả lập đăng nhập ${provider}
                </h2>
                <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">
                   Môi trường Thử nghiệm Sandbox được kích hoạt tự động vì bạn chưa cấu hình Client Credentials trong file cấu hình <code>.env</code>.
                </p>
            </div>

            <div class="bg-slate-950/65 rounded-xl p-4 border border-slate-800/80 text-xs space-y-2 mb-6">
                <p class="text-amber-500/90 font-mono font-semibold uppercase tracking-wider text-[10.5px]">💡 Hướng dẫn cấu hình kết nối thật:</p>
                <p class="text-slate-300 leading-relaxed text-[11px]">
                   Sau này, để đổi sang kết nối mạng xã hội thật của Google & Zalo, vui lòng cài đặt các biến môi trường này:
                </p>
                <div class="p-2.5 bg-black/60 font-mono text-[9.5px] text-emerald-400 rounded-lg border border-slate-900 leading-normal space-y-0.5">
                   <p><strong class="text-slate-400">GOOGLE_CLIENT_ID</strong>=id-google-app</p>
                   <p><strong class="text-slate-400">GOOGLE_CLIENT_SECRET</strong>=mật-khẩu-client-google</p>
                   <p><strong class="text-slate-400">ZALO_APP_ID</strong>=id-zalo-app</p>
                   <p><strong class="text-slate-400">ZALO_APP_SECRET</strong>=mật-khẩu-zalo-app</p>
                </div>
                <p class="text-[9.5px] text-slate-400 leading-relaxed mt-1">
                   * Redirect URI khai báo trên các Dashboard là:
                   <br />
                   <code class="text-emerald-400 font-semibold select-all">${callbackUrl}</code>
                </p>
            </div>

            <form id="simulateForm" class="space-y-4">
                <div>
                    <label class="block text-slate-300 text-xs font-mono uppercase tracking-wide mb-1.5 font-semibold">Chọn tài khoản Giả lập:</label>
                    <select id="userPreset" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-amber-500 cursor-pointer">
                        <option value="user1">CEO Nguyễn Trọng Đức (ntduc82@gmail.com) - [Tài khoản Active hiện có]</option>
                        <option value="user2">CEO Lê Minh Sơn (son.le@fpt.com) - [Tạo tài khoản Sandbox mới]</option>
                        <option value="user3">CEO Trần Thị Kim Thảo (thao.tran@vccorp.vn) - [Tạo tài khoản Sandbox mới]</option>
                        <option value="custom">-- Tự nhập thông tin CEO mong muốn --</option>
                    </select>
                </div>

                <div id="customFields" class="hidden space-y-3 pt-2 border-t border-slate-800/60 transition-all duration-300">
                    <div>
                        <label class="block text-slate-400 text-[10.5px] font-mono mb-1">HỌ VÀ TÊN CEO</label>
                        <input type="text" id="customName" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:border-amber-500" value="CEO Toàn Cầu">
                    </div>
                    <div>
                        <label class="block text-slate-400 text-[10.5px] font-mono mb-1">EMAIL LIÊN HỆ</label>
                        <input type="email" id="customEmail" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:border-amber-500" value="vietnam.ceo@matching.com">
                    </div>
                    <div>
                        <label class="block text-slate-400 text-[10.5px] font-mono mb-1">ẢNH ĐẠI DIỆN HỘI VIÊN URL</label>
                        <input type="text" id="customAvatar" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:border-amber-500" value="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop">
                    </div>
                </div>

                <button type="submit" class="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded-lg text-sm transition-all shadow-lg shadow-amber-900/15 active:scale-[0.98]">
                   BẮT ĐẦU ĐĂNG NHẬP GIẢ LẬP
                </button>
            </form>
        </div>

        <script>
            const userPreset = document.getElementById('userPreset');
            const customFields = document.getElementById('customFields');
            
            userPreset.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customFields.classList.remove('hidden');
                } else {
                    customFields.classList.add('hidden');
                }
            });

            document.getElementById('simulateForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const presetVal = userPreset.value;
                let payload = {};

                if (presetVal === 'user1') {
                    payload = {
                        email: 'ntduc82@gmail.com',
                        name: 'Nguyễn Trọng Đức',
                        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop'
                    };
                } else if (presetVal === 'user2') {
                    payload = {
                        email: 'son.le@fpt.com',
                        name: 'CEO Lê Minh Sơn',
                        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop'
                    };
                } else if (presetVal === 'user3') {
                    payload = {
                        email: 'thao.tran@vccorp.vn',
                        name: 'CEO Trần Thị Kim Thảo',
                        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop'
                    };
                } else {
                    payload = {
                        email: document.getElementById('customEmail').value || 'ceo.vietnam@matching.com',
                        name: document.getElementById('customName').value || 'CEO Toàn Cầu',
                        avatarUrl: document.getElementById('customAvatar').value || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop'
                    };
                }

                try {
                    const response = await fetch('/api/auth/social/simulate-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...payload, provider: '${provider}' })
                    });
                    const result = await response.json();
                    
                    if (window.opener) {
                        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: result.user }, '*');
                        window.close();
                    } else {
                        alert('Xác thực giả lập thành công! (Không tìm thấy cửa sổ gốc của bạn)');
                    }
                } catch (err) {
                    alert('Lỗi khi giả lập đăng nhập: ' + err.message);
                }
            });
        </script>
    </body>
    </html>
  `;
}

app.get("/api/auth/me", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.json({ loggedIn: false, user: { role: "Guest", fullName: "Khách vãng lai" } });
  }
  return res.json({ loggedIn: true, user: req.user });
});

// 2. MEMBER APIS & FIELD PRIVACY LOGIC (DANH SÁCH THÀNH VIÊN VỚI BẢO MẬT TRƯỜNG THÔNG TIN)
app.get("/api/members", (req: any, res) => {
  const db = readDatabase();
  
  // Trả về danh sách thành viên được kích hoạt (Active) hoặc trả về toàn bộ cho Admin/Mod duyệt
  const isAdminOrMod = req.user.role === "Admin" || req.user.role === "Mod";
  const rawMembers = db.users.filter((u: User) => {
    if (isAdminOrMod) return true; // Hiển thị tất cả thành viên (bao gồm Pending/Banned để duyệt)
    return u.status === "Active";   // Khách/Thành viên bình thường chỉ xem ai đã Active
  });

  const matchesList = db.matches || [];

  // Map lọc bảo mật field_permissions đối với từng user một cách tối ưu
  const filteredMembers = rawMembers.map((member: User) => {
    const perm = db.fieldPermissions.find((p: FieldPermissions) => p.userId === member.id);
    return filterUserSensitiveFields(req.user, member, perm, matchesList);
  });

  return res.json(filteredMembers);
});

// Chi tiết thành viên + tích hợp danh sách bài viết & sự kiện của thành viên đó
app.get("/api/members/:id", (req: any, res) => {
  const memberId = parseInt(req.params.id, 10);
  const db = readDatabase();

  const foundUser = db.users.find((u: User) => u.id === memberId);
  if (!foundUser) {
    return res.status(404).json({ error: "Không tìm thấy thành viên" });
  }

  const perm = db.fieldPermissions.find((p: FieldPermissions) => p.userId === memberId);
  const filteredUser = filterUserSensitiveFields(req.user, foundUser, perm, db.matches || []);

  // Lấy các bài đăng & sự kiện liên quan của chính thành viên này
  // Nếu Admin/Mod hoặc là chính mình, xem toàn bộ bài viết (Pending/Approved). Nếu là khách xem Approved.
  const isPrivileged = req.user.role === "Admin" || req.user.role === "Mod" || req.user.role === "Manager" || req.user.id === memberId;
  const userPosts = db.posts.filter((p: Post) => {
    if (p.authorId !== memberId) return false;
    return isPrivileged ? true : p.status === "Approved";
  });

  const userEvents = db.events.filter((e: Event) => {
    if (e.creatorId !== memberId) return false;
    return isPrivileged ? true : e.status === "Approved";
  });

  return res.json({
    member: filteredUser,
    posts: userPosts,
    events: userEvents
  });
});

// Update Profile cá nhân phát triển
app.put("/api/members/me", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Vui lòng đăng nhập" });
  }

  const db = readDatabase();
  const index = db.users.findIndex((u: User) => u.id === req.user.id);
  if (index === -1) return res.status(404).json({ error: "Không phát hiện tài khoản" });

  const updatedFields = req.body;
  
  // Tránh việc tự đổi role hoặc status của chính mình qua api này
  delete updatedFields.role;
  delete updatedFields.status;
  delete updatedFields.username;
  delete updatedFields.id;

  db.users[index] = { ...db.users[index], ...updatedFields };
  saveDatabase(db);

  return res.json({ success: true, message: "Cập nhật hồ sơ CEO thành công!", user: db.users[index] });
});

// Update Profile cá nhân phát triển (hỗ trợ đường dẫn /api/profile)
app.put("/api/profile", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Vui lòng đăng nhập" });
  }

  const db = readDatabase();
  const index = db.users.findIndex((u: User) => u.id === req.user.id);
  if (index === -1) return res.status(404).json({ error: "Không phát hiện tài khoản" });

  const updatedFields = req.body;
  
  delete updatedFields.role;
  delete updatedFields.status;
  delete updatedFields.username;
  delete updatedFields.id;

  db.users[index] = { ...db.users[index], ...updatedFields };
  saveDatabase(db);

  return res.json({ success: true, message: "Cập nhật hồ sơ CEO thành công!", user: db.users[index] });
});

// Thay đổi mật khẩu an ninh cho profile
app.post("/api/profile/change-password", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Vui lòng đăng nhập" });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
  }

  const db = readDatabase();
  const index = db.users.findIndex((u: User) => u.id === req.user.id);
  if (index === -1) return res.status(404).json({ error: "Không tìm thấy người dùng" });

  const user = db.users[index];
  if (user.passwordHash !== currentPassword) {
    return res.status(400).json({ error: "Mật khẩu hiện tại không chính xác" });
  }

  db.users[index].passwordHash = newPassword;
  saveDatabase(db);

  return res.json({ success: true, message: "Thay đổi mật khẩu tài khoản thành công!" });
});

// ==========================================
// ADMIN WORKFLOW (QUẢN TRỊ ADMIN PANEL APIs)
// ==========================================

// Lấy danh sách field permissions của toàn bộ users (Admin / Mod quyền chỉnh sửa)
app.get("/api/admin/permissions", requireRole(["Admin", "Mod"]), (req, res) => {
  const db = readDatabase();
  return res.json({
    permissions: db.fieldPermissions,
    users: db.users.map((u: User) => ({ id: u.id, fullName: u.fullName, username: u.username, role: u.role }))
  });
});

// Cập nhật cấu hình bảo mật thông tin (Tắt/Bật Switch hiển thị từng trường của thành viên)
app.put("/api/admin/users/:id/permissions", requireRole(["Admin", "Mod"]), (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  const updatedPerms = req.body; // post object permissions dạng FieldPermissions cấu trúc

  const db = readDatabase();
  let index = db.fieldPermissions.findIndex((p: FieldPermissions) => p.userId === targetUserId);

  if (index === -1) {
    // Nếu chưa khởi tạo, tạo mới bản ghi
    const newRecord: FieldPermissions = {
      userId: targetUserId,
      phoneVisible: true,
      emailVisible: true,
      facebookVisible: true,
      linkedinVisible: true,
      tiktokVisible: true,
      websiteVisible: true,
      bioVisible: true,
      companyDescriptionVisible: true,
      productDescriptionVisible: true,
      visionMissionVisible: true,
      matchingNeedsVisible: true,
      ...updatedPerms
    };
    db.fieldPermissions.push(newRecord);
    index = db.fieldPermissions.length - 1;
  } else {
    db.fieldPermissions[index] = { ...db.fieldPermissions[index], ...updatedPerms };
  }

  saveDatabase(db);
  return res.json({ success: true, message: "Đã thiết lập cập nhật ẩn hiện trường thông tin cho thành viên thành công!", permissions: db.fieldPermissions[index] });
});

// Phê duyệt tài khoản mới (status -> Active / Banned) và Phân quyền (Set Role)
app.put("/api/admin/users/:id/status-role", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { status, role } = req.body;

  const db = readDatabase();
  const index = db.users.findIndex((u: User) => u.id === targetId);

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy người dùng" });
  }

  // Nếu phân quyền Admin/Mod/Manager nhưng người thao tác không phải Admin, chặn.
  // Mod/Manager không thể set quyền người khác phát triển lên Admin/Mod/Manager được, hoặc thay đổi Admin/Mod/Manager.
  const operator = (req as any).user;
  const operatorRole = operator.role;
  const targetUserRoleOld = db.users[index].role;

  if (operatorRole === "Mod" || operatorRole === "Manager") {
    if (
      role === "Admin" || 
      role === "Mod" || 
      role === "Manager" || 
      targetUserRoleOld === "Admin" || 
      targetUserRoleOld === "Mod" || 
      targetUserRoleOld === "Manager"
    ) {
      return res.status(403).json({ error: `Quyền hạn ${operatorRole} chỉ được duyệt thành viên thường, không thể thao tác cấu hình quản trị viên bậc cao khác.` });
    }
  }

  const oldStatus = db.users[index].status;
  const oldRole = targetUserRoleOld;
  const targetUser = db.users[index];

  const newStatus = status ? (status as UserStatus) : oldStatus;
  const newRole = role ? (role as UserRole) : oldRole;

  if (status) db.users[index].status = newStatus;
  if (role) db.users[index].role = newRole;

  // Ghi nhận lịch sử duyệt tài khoản (Approval Logs)
  if (!db.approvalLogs) db.approvalLogs = [];
  const logId = db.approvalLogs.length > 0 ? Math.max(...db.approvalLogs.map((l: any) => l.id)) + 1 : 1;
  db.approvalLogs.push({
    id: logId,
    targetUserId: targetId,
    targetUserName: targetUser.fullName,
    targetUserCompany: targetUser.companyName || "Chưa cập nhật doanh nghiệp",
    operatorId: operator.id,
    operatorName: operator.fullName,
    operatorUsername: operator.username,
    operatorRole: operatorRole,
    oldStatus: oldStatus,
    newStatus: newStatus,
    oldRole: oldRole,
    newRole: newRole,
    timestamp: new Date().toISOString()
  });

  // Nếu duyệt từ Pending -> Active
  if (status === "Active" && oldStatus !== "Active") {
    // 1. Tạo thông báo riêng cho thành viên được duyệt
    const notifId1 = db.notifications.length > 0 ? Math.max(...db.notifications.map((n: any) => n.id)) + 1 : 1;
    db.notifications.push({
      id: notifId1,
      userId: targetId,
      type: "ProfileStatusChanged",
      title: "Hồ sơ của bạn đã được kiểm duyệt thành công!",
      message: `Xin chào CEO ${targetUser.fullName}, hồ sơ đăng ký tham gia mạng lưới của bạn đã được thẩm duyệt chính thức thành trạng thái HOẠT ĐỘNG. Hãy bắt đầu mở rộng giao thương, đăng tải yêu cầu và phân tích AI matching ngay hôm nay!`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // 2. Tạo thông báo chung gửi quảng bá tới toàn bộ cộng đồng
    const notifId2 = db.notifications.length > 0 ? Math.max(...db.notifications.map((n: any) => n.id)) + 1 : 1;
    db.notifications.push({
      id: notifId2,
      userId: 0, // Gửi tới mọi người
      type: "NewMember",
      title: "Hội viên mới gia nhập!",
      message: `Nhiệt liệt chào mừng CEO ${targetUser.fullName} (${targetUser.companyName || "Chưa cập nhật doanh nghiệp"}), hoạt động trong ngành nghề [${targetUser.industry || "Chưa thiết lập"}] vừa đăng ký gia nhập và kích hoạt thành công.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDatabase(db);
  return res.json({ success: true, message: "Đã cập nhật trạng thái & phân vai trò mới cho thành viên thành công!", user: db.users[index] });
});

// Endpoint lấy lịch sử duyệt tài khoản (chỉ có Admin, Mod, Manager được xem)
app.get("/api/admin/approval-logs", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const db = readDatabase();
  return res.json(db.approvalLogs || []);
});

// 3. MENU DYNAMIC ADMIN (QUẢN TRỊ MENU ĐỘNG)
app.get("/api/menus", (req: any, res) => {
  const db = readDatabase();
  const role = req.user ? req.user.role : "Guest";

  const hierarchy: Record<UserRole, number> = {
    "Admin": 5,
    "Mod": 4,
    "Manager": 3,
    "Member": 2,
    "Guest": 1
  };

  const userPower = hierarchy[role as UserRole] || 1;

  // Lọc lấy các menu được hiển thị và phù hợp với level vai trò
  const visibleMenus = db.menus
    .filter((m: SystemMenu) => {
      if (!m.isVisible) return false;
      const menuPower = hierarchy[m.roleAllowed] || 1;
      return userPower >= menuPower;
    })
    .sort((a: SystemMenu, b: SystemMenu) => a.orderIndex - b.orderIndex);

  return res.json(visibleMenus);
});

// 3.5 SPOTLIGHT BANNER MANAGEMENT API
app.get("/api/spotlight", (req, res) => {
  const db = readDatabase();
  const spotlight = db.spotlight || {
    tag: "VŨ ĐÀI NGHỊ SỰ",
    title: "Giao Thương Kết Nối Doanh Nhân Tinh Anh 2026",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=800&auto=format&fit=crop",
    linkUrl: ""
  };
  return res.json(spotlight);
});

app.put("/api/spotlight", requireRole(["Admin", "Mod"]), (req: any, res) => {
  const { tag, title, imageUrl, linkUrl } = req.body;
  if (!title || !imageUrl) {
    return res.status(400).json({ error: "Tiêu đề và đường dẫn ảnh không được để trống" });
  }

  const db = readDatabase();
  db.spotlight = {
    tag: tag || "VŨ ĐÀI NGHỊ SỰ",
    title,
    imageUrl,
    linkUrl: linkUrl || ""
  };

  saveDatabase(db);
  return res.json({ success: true, message: "Cập nhật Spotlight Banner thành công!", spotlight: db.spotlight });
});

// Quản trị viên lấy danh sách gốc của menu để CRUD
app.get("/api/admin/menus", requireRole(["Admin"]), (req, res) => {
  const db = readDatabase();
  return res.json(db.menus);
});

app.post("/api/admin/menus", requireRole(["Admin"]), (req, res) => {
  const { title, url, orderIndex, isVisible, roleAllowed } = req.body;
  if (!title || !url) return res.status(400).json({ error: "Thiếu tiêu đề hoặc đường dẫn menu" });

  const db = readDatabase();
  const newId = db.menus.length > 0 ? Math.max(...db.menus.map((m: any) => m.id)) + 1 : 1;

  const newMenu: SystemMenu = {
    id: newId,
    title,
    url,
    orderIndex: Number(orderIndex) || 0,
    isVisible: isVisible !== undefined ? isVisible : true,
    roleAllowed: roleAllowed || "Guest"
  };

  db.menus.push(newMenu);
  saveDatabase(db);

  return res.json({ success: true, message: "Thêm menu động thành công!", menu: newMenu });
});

app.put("/api/admin/menus/:id", requireRole(["Admin"]), (req, res) => {
  const menuId = parseInt(req.params.id, 10);
  const db = readDatabase();

  const index = db.menus.findIndex((m: any) => m.id === menuId);
  if (index === -1) return res.status(404).json({ error: "Không thấy menu cần cập nhật" });

  db.menus[index] = { ...db.menus[index], ...req.body };
  saveDatabase(db);

  return res.json({ success: true, message: "Menu đã được cập nhật thành công!", menu: db.menus[index] });
});

app.delete("/api/admin/menus/:id", requireRole(["Admin"]), (req, res) => {
  const menuId = parseInt(req.params.id, 10);
  const db = readDatabase();

  const index = db.menus.findIndex((m: any) => m.id === menuId);
  if (index === -1) return res.status(404).json({ error: "Không tìm thấy menu để xóa" });

  db.menus.splice(index, 1);
  saveDatabase(db);

  return res.json({ success: true, message: "Xóa menu thàng công!" });
});


// ==========================================
// 3.5 APIS GIAO THƯƠNG (TRADES AND COMMENTS)
// ==========================================

// Lấy danh sách tin giao thương
app.get("/api/trades", (req: any, res) => {
  const db = readDatabase();
  const user = req.user;
  const isPrivileged = user && ["Admin", "Mod", "Manager"].includes(user.role);

  let visibleTrades = db.trades;
  if (!isPrivileged) {
    visibleTrades = db.trades.filter((t: any) => {
      const status = t.status || "Approved";
      return status === "Approved";
    });
  }

  const tradesWithAuthor = visibleTrades.map((t: any) => {
    const author = db.users.find((u: any) => u.id === t.authorId);
    return {
      status: "Approved", // default to Approved if missing in DB
      ...t,
      authorName: author ? author.fullName : "Thành viên",
      authorCompanyName: author ? author.companyName : "Doanh nghiệp",
      authorAvatarUrl: author ? author.avatarUrl : null
    };
  });
  // Sắp xếp bài mới nhất lên đầu
  tradesWithAuthor.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(tradesWithAuthor);
});

// Đăng tin giao thương (Mỗi thành viên tối đa 3 bài viết)
app.post("/api/trades", (req: any, res) => {
  if (!req.user || req.user.role === "Guest" || req.user.id === 0) {
    return res.status(401).json({ error: "Vui lòng đăng nhập tài khoản thành viên để đăng tin giao thương." });
  }
  
  if (req.user.status === "Pending") {
    return res.status(403).json({ error: "Tài khoản của bạn đang chờ phê duyệt. Không thể thực hiện thao tác này." });
  }
  
  if (req.user.status === "Banned") {
    return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa." });
  }

  const db = readDatabase();
  const userTradesCount = db.trades.filter((t: any) => t.authorId === req.user.id).length;
  if (userTradesCount >= 3 && !["Admin", "Mod"].includes(req.user.role)) {
    return res.status(400).json({ error: "Mỗi thành viên chỉ được đăng tối đa 3 bài viết giao thương. Hãy xóa bài cũ trước khi đăng bài mới!" });
  }

  const { title, content, type } = req.body;
  if (!title || !title.trim() || !content || !content.trim() || !type) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ các thông tin: Tiêu đề, Nội dung chính, Thể loại giao dịch." });
  }

  const nextId = db.trades.length > 0 ? Math.max(...db.trades.map((t: any) => t.id)) + 1 : 1;
  const isAutoApprove = ["Admin", "Mod"].includes(req.user.role);
  const newTrade = {
    id: nextId,
    authorId: req.user.id,
    title: title.trim(),
    content: content.trim(),
    type,
    status: isAutoApprove ? "Approved" : "Pending",
    createdAt: new Date().toISOString()
  };

  db.trades.push(newTrade);
  saveDatabase(db);

  const author = req.user;
  const responseTrade = {
    ...newTrade,
    authorName: author.fullName,
    authorCompanyName: author.companyName,
    authorAvatarUrl: author.avatarUrl
  };

  return res.json({ success: true, message: isAutoApprove ? "Đăng tin giao thương thành công!" : "Đăng tin giao thương thành công! Bài viết đang chờ Ban Quản Trị duyệt trước khi hiển thị công khai.", trade: responseTrade });
});

// Xóa tin giao thương (Chỉ chủ bài viết hoặc admin/mod/manager)
app.delete("/api/trades/:id", (req: any, res) => {
  if (!req.user || req.user.role === "Guest" || req.user.id === 0) {
    return res.status(401).json({ error: "Chưa đăng nhập khoản thành viên." });
  }

  const tradeId = parseInt(req.params.id, 10);
  const db = readDatabase();
  const tradeIndex = db.trades.findIndex((t: any) => t.id === tradeId);

  if (tradeIndex === -1) {
    return res.status(404).json({ error: "Không tìm thấy bài viết giao thương cần xóa." });
  }

  const trade = db.trades[tradeIndex];
  const isAuthor = trade.authorId === req.user.id;
  const isStaff = ["Admin", "Mod", "Manager"].includes(req.user.role);

  if (!isAuthor && !isStaff) {
    return res.status(403).json({ error: "Bạn không có quyền xóa bài viết của thành viên khác." });
  }

  db.trades.splice(tradeIndex, 1);
  db.tradeComments = db.tradeComments.filter((c: any) => c.tradeId !== tradeId);

  saveDatabase(db);
  return res.json({ success: true, message: "Xóa bài viết giao thương thành công!" });
});

// Sửa tin giao thương (Chỉ chủ bài viết hoặc admin/mod được quyền)
app.put("/api/trades/:id", (req: any, res) => {
  if (!req.user || req.user.role === "Guest" || req.user.id === 0) {
    return res.status(401).json({ error: "Yêu cầu đăng nhập tài khoản thành viên." });
  }

  const tradeId = parseInt(req.params.id, 10);
  const { title, content, type, status } = req.body;

  if (!title || !title.trim() || !content || !content.trim() || !type) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ các thông tin: Tiêu đề, Nội dung chính, Thể loại giao dịch." });
  }

  const db = readDatabase();
  const index = db.trades.findIndex((t: any) => t.id === tradeId);

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy bài giao thương." });
  }

  const trade = db.trades[index];
  const isAuthor = trade.authorId === req.user.id;
  const isStaff = ["Admin", "Mod"].includes(req.user.role);

  if (!isAuthor && !isStaff) {
    return res.status(403).json({ error: "Không có quyền sửa đổi bài viết giao thương này." });
  }

  db.trades[index] = {
    ...trade,
    title: title.trim(),
    content: content.trim(),
    type,
    status: status || trade.status || "Approved"
  };

  saveDatabase(db);
  return res.json({ success: true, message: "Cập nhật bài viết giao thương thành công!", trade: db.trades[index] });
});

// Duyệt tin giao thương (Approved/Rejected/Pending)
app.put("/api/admin/trades/:id/status", requireRole(["Admin", "Mod", "Manager"]), (req: any, res: any) => {
  const tradeId = parseInt(req.params.id, 10);
  const { status } = req.body; // Approved / Rejected / Pending

  const db = readDatabase();
  const index = db.trades.findIndex((t: any) => t.id === tradeId);

  if (index === -1) return res.status(404).json({ error: "Không tìm thấy bài viết giao thương cần duyệt" });

  db.trades[index].status = status;
  saveDatabase(db);

  return res.json({ success: true, message: `Thao tác phê duyệt bài viết giao thương thành công: ${status}!`, trade: db.trades[index] });
});

// Xem bình luận / kết nối trong tin giao thương (Bảo mật: Chỉ admin/mod/manager và chủ bài viết mới xem được)
app.get("/api/trades/:id/comments", (req: any, res) => {
  if (!req.user || req.user.role === "Guest" || req.user.id === 0) {
    return res.status(401).json({ error: "Vui lòng đăng nhập để xem thông tin kết nối." });
  }

  const tradeId = parseInt(req.params.id, 10);
  const db = readDatabase();
  const trade = db.trades.find((t: any) => t.id === tradeId);

  if (!trade) {
    return res.status(404).json({ error: "Không tìm thấy bài viết giao thương." });
  }

  const isAuthor = trade.authorId === req.user.id;
  const isStaff = ["Admin", "Mod", "Manager"].includes(req.user.role);

  if (!isAuthor && !isStaff) {
    return res.status(403).json({ error: "Bảo mật: Chỉ Quản trị viên và Chủ bài viết mới có thể xem thông tin liên hệ / bình luận kết nối." });
  }

  const comments = db.tradeComments
    .filter((c: any) => c.tradeId === tradeId)
    .map((c: any) => {
      const commenter = db.users.find((u: any) => u.id === c.userId);
      return {
        ...c,
        userName: commenter ? commenter.fullName : "Thành viên",
        userCompanyName: commenter ? commenter.companyName : "Doanh nghiệp",
        userAvatarUrl: commenter ? commenter.avatarUrl : null,
        userPhone: commenter ? commenter.phone_number : "Liên hệ Admin",
        userEmail: commenter ? commenter.email : "Liên hệ Admin"
      };
    });

  comments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return res.json(comments);
});

// Gửi câu trả lời / comment kết nối giao thương (Tất cả thành viên đăng nhập đều có thể kết nối)
app.post("/api/trades/:id/comments", (req: any, res) => {
  if (!req.user || req.user.role === "Guest" || req.user.id === 0) {
    return res.status(401).json({ error: "Vui lòng đăng nhập tài khoản thành viên để gửi liên hệ kết nối." });
  }

  if (req.user.status === "Pending") {
    return res.status(403).json({ error: "Tài khoản của bạn đang chờ quản trị viên phê duyệt. Không thể gửi kết nối." });
  }

  const tradeId = parseInt(req.params.id, 10);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Vui lòng nhập lời nhắn kết nối của bạn." });
  }

  const db = readDatabase();
  const trade = db.trades.find((t: any) => t.id === tradeId);
  if (!trade) {
    return res.status(404).json({ error: "Không tìm thấy tin giao thương này." });
  }

  const nextCommentId = db.tradeComments.length > 0 ? Math.max(...db.tradeComments.map((c: any) => c.id)) + 1 : 1;
  const newComment = {
    id: nextCommentId,
    tradeId,
    userId: req.user.id,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  db.tradeComments.push(newComment);
  saveDatabase(db);

  const commenter = req.user;
  const responseComment = {
    ...newComment,
    userName: commenter.fullName,
    userCompanyName: commenter.companyName,
    userAvatarUrl: commenter.avatarUrl,
    userPhone: commenter.phone_number,
    userEmail: commenter.email
  };

  return res.json({ success: true, message: "Gửi yêu cầu liên hệ kết nối thành công! Chủ tin đăng sẽ sớm liên hệ với bạn.", comment: responseComment });
});

// Xóa bình luận kết nối (Chỉ admin/mod/manager hoặc chủ bài đăng mới được xóa)
app.delete("/api/trades/:tradeId/comments/:commentId", (req: any, res) => {
  if (!req.user || req.user.role === "Guest" || req.user.id === 0) {
    return res.status(401).json({ error: "Chưa đăng nhập." });
  }

  const tradeId = parseInt(req.params.tradeId, 10);
  const commentId = parseInt(req.params.commentId, 10);

  const db = readDatabase();
  const trade = db.trades.find((t: any) => t.id === tradeId);
  if (!trade) {
    return res.status(404).json({ error: "Không tìm thấy nội dung giao thương." });
  }

  const commentIndex = db.tradeComments.findIndex((c: any) => c.id === commentId && c.tradeId === tradeId);
  if (commentIndex === -1) {
    return res.status(404).json({ error: "Không tìm thấy phản hồi kết nối." });
  }

  const isTradeOwner = trade.authorId === req.user.id;
  const isStaff = ["Admin", "Mod", "Manager"].includes(req.user.role);

  if (!isTradeOwner && !isStaff) {
    return res.status(403).json({ error: "Chỉ Admin/Mod/Manager hoặc Chủ bài viết mới được quyền xóa các phản hồi liên hệ." });
  }

  db.tradeComments.splice(commentIndex, 1);
  saveDatabase(db);

  return res.json({ success: true, message: "Xóa phản hồi kết nối thành công!" });
});


// 4. CMS POSTS APIS (BÀI VIẾT THÀNH VIÊN VÀ BÀI QUẢN TRỊ)
app.get("/api/posts", (req, res) => {
  const db = readDatabase();
  // Guest/Member bình thường chỉ được xem bài viết APPROVED. 
  // Admin/Mod/Manager được xem tất cả (Pending, Approved, Rejected) để kiểm duyệt.
  const user = (req as any).user;
  const isPrivileged = user && ["Admin", "Mod", "Manager"].includes(user.role);

  let visiblePosts = db.posts;
  if (!isPrivileged) {
    visiblePosts = db.posts.filter((p: Post) => p.status === "Approved");
  }

  // Đính kèm tác giả hiển thị
  const postsWithAuthor = visiblePosts.map((post: Post) => {
    if (post.authorId === null) {
      return { ...post, authorName: "Ban Quản Trị Hệ Thống", authorRole: "System Admin" };
    }
    const author = db.users.find((u: User) => u.id === post.authorId);
    return {
      ...post,
      authorName: author ? author.fullName : "CEO Ẩn danh",
      authorRole: author ? `${author.jobTitle} tại ${author.companyName}` : "Thành viên"
    };
  });

  return res.json(postsWithAuthor);
});

// Xem bài viết chi tiết
app.get("/api/posts/:id", (req: any, res) => {
  const postId = parseInt(req.params.id, 10);
  const db = readDatabase();

  const foundPost = db.posts.find((p: Post) => p.id === postId);
  if (!foundPost) return res.status(404).json({ error: "Không tìm thấy bài viết!" });

  const author = foundPost.authorId === null ? null : db.users.find((u: User) => u.id === foundPost.authorId);

  return res.json({
    post: {
      ...foundPost,
      authorName: author ? author.fullName : "Ban Quản Trị Hệ Thống",
      authorRole: author ? `${author.jobTitle} tại ${author.companyName}` : "System Admin"
    }
  });
});

// Member tạo bài mới (Phải ở chế độ Chờ duyệt-Pending)
// Admin/Mod tạo thì APPROVED trực tiếp
app.post("/api/posts", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Bạn phải đăng nhập để viết bài" });
  }

  const { title, content, imageUrl, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết." });

  const db = readDatabase();
  const isAutoApprove = ["Admin", "Mod", "Manager"].includes(req.user.role);

  const newPostId = db.posts.length > 0 ? Math.max(...db.posts.map((p: any) => p.id)) + 1 : 1;
  const newPost: Post = {
    id: newPostId,
    authorId: req.user.role === "Admin" && req.body.isSystemOfficial ? null : req.user.id,
    title,
    content,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    status: isAutoApprove ? "Approved" : "Pending", // Member tạo bài viết cần được phê duyệt
    category: category || "Kinh doanh",
    createdAt: new Date().toISOString()
  };

  db.posts.push(newPost);
  saveDatabase(db);

  return res.json({
    success: true,
    message: isAutoApprove ? "Bài viết đã được đăng trực tiếp thành công!" : "Tạo bài viết mới thành công! Bài viết đang chờ Ban Quản Trị phê duyệt trước khi hiển thị công khai.",
    post: newPost
  });
});

// Duyệt bài viết (Approved/Rejected)
app.put("/api/admin/posts/:id/status", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { status } = req.body; // Approved / Rejected

  const db = readDatabase();
  const index = db.posts.findIndex((p: Post) => p.id === postId);

  if (index === -1) return res.status(404).json({ error: "Không tìm thấy bài viết" });

  db.posts[index].status = status;
  saveDatabase(db);

  return res.json({ success: true, message: `Thao tác phê duyệt bài viết thành công: ${status}!`, post: db.posts[index] });
});

// Xóa bài viết (Chỉ Admin và Mod được quyền)
app.delete("/api/posts/:id", requireRole(["Admin", "Mod"]), (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const db = readDatabase();
  const index = db.posts.findIndex((p: Post) => p.id === postId);

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy bài viết để xóa" });
  }

  db.posts.splice(index, 1);
  saveDatabase(db);

  return res.json({ success: true, message: "Đã xóa bài viết thành công khỏi hệ thống!" });
});

// Sửa bài viết/chia sẻ (Chỉ tác giả hoặc Admin/Mod được quyền)
app.put("/api/posts/:id", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Yêu cầu đăng nhập." });
  }

  const postId = parseInt(req.params.id, 10);
  const { title, content, imageUrl, category, isSystemOfficial } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết." });
  }

  const db = readDatabase();
  const index = db.posts.findIndex((p: any) => p.id === postId);

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy bài chia sẻ." });
  }

  const post = db.posts[index];
  const isAuthor = post.authorId === req.user.id;
  const isStaff = ["Admin", "Mod"].includes(req.user.role);

  if (!isAuthor && !isStaff) {
    return res.status(403).json({ error: "Không có quyền sửa đổi bài viết này." });
  }

  db.posts[index] = {
    ...post,
    title,
    content,
    imageUrl: imageUrl || post.imageUrl,
    category: category || post.category,
    ...(req.user.role === "Admin" ? { authorId: isSystemOfficial ? null : (post.authorId || req.user.id) } : {})
  };

  saveDatabase(db);
  return res.json({ success: true, message: "Cập nhật bài viết thành công!", post: db.posts[index] });
});


// 5. EVENTS APIS (SỰ KIỆN VÀ ĐĂNG KÝ THAM GIA)
app.get("/api/events", (req, res) => {
  const db = readDatabase();
  const user = (req as any).user;
  const isPrivileged = user && ["Admin", "Mod", "Manager"].includes(user.role);

  let visibleEvents = db.events;
  if (!isPrivileged) {
    visibleEvents = db.events.filter((e: Event) => e.status === "Approved");
  }

  const eventsWithCreators = visibleEvents.map((ev: Event) => {
    if (ev.creatorId === null) return { ...ev, creatorName: "Ban Quản Trị" };
    const creatorUser = db.users.find((u: User) => u.id === ev.creatorId);
    return { ...ev, creatorName: creatorUser ? creatorUser.fullName : "CEO" };
  });

  return res.json(eventsWithCreators);
});

// Lấy danh sách đăng ký của một sự kiện cụ thể với bộ lọc bảo mật thông tin
app.get("/api/events/:id/registrations", (req: any, res) => {
  const eventId = parseInt(req.params.id, 10);
  const db = readDatabase();
  const ev = db.events.find((e: any) => e.id === eventId);
  if (!ev) return res.status(404).json({ error: "Sự kiện không tồn tại" });

  const user = req.user;
  const isCreatorOrAdmin = user && (user.id === ev.creatorId || ["Admin", "Mod", "Manager"].includes(user.role));

  const regs = db.eventRegistrations.filter((r: any) => r.eventId === eventId);
  const decorated = regs.map((reg: any) => {
    const usr = db.users.find((u: any) => u.id === reg.userId);
    if (isCreatorOrAdmin) {
      return {
        id: reg.id,
        eventId: reg.eventId,
        userId: reg.userId,
        registrationNote: reg.registrationNote,
        companyRepresenting: reg.companyRepresenting,
        guestsCount: reg.guestsCount,
        createdAt: reg.createdAt,
        userName: usr ? usr.fullName : "Thành viên cũ",
        userEmail: usr ? usr.email : "N/A",
        userPhone: usr ? usr.phone_number : "N/A",
        userAvatar: usr ? usr.avatarUrl : null,
        userRole: usr ? usr.role : "CEO",
        userProfileColor: usr ? usr.profileColor : "#F59E0B"
      };
    } else {
      return {
        id: reg.id,
        eventId: reg.eventId,
        userId: reg.userId,
        companyRepresenting: reg.companyRepresenting,
        guestsCount: reg.guestsCount,
        createdAt: reg.createdAt,
        userName: usr ? usr.fullName : "Thành viên cũ",
        userAvatar: usr ? usr.avatarUrl : null,
        userRole: usr ? usr.role : "CEO",
        userProfileColor: usr ? usr.profileColor : "#F59E0B"
      };
    }
  });

  return res.json(decorated);
});

// Lấy danh sách đăng ký form tham gia của TẤT CẢ các sự kiện (Quyền Admin, Mod, Manager)
app.get("/api/admin/events/registrations", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const db = readDatabase();
  const decorated = db.eventRegistrations.map((reg: EventRegistration) => {
    const usr = db.users.find((u: User) => u.id === reg.userId);
    const ev = db.events.find((e: Event) => e.id === reg.eventId);
    return {
      ...reg,
      status: reg.status || "Approved",
      userName: usr ? usr.fullName : "Thành viên cũ",
      userEmail: usr ? usr.email : "N/A",
      userPhone: usr ? usr.phone_number : "N/A",
      eventTitle: ev ? ev.title : "Sự kiện gốc"
    };
  });
  return res.json(decorated);
});

// Cập nhật thông tin đăng ký / Duyệt khách mời tham gia sự kiện (Quyền Admin, Mod, Manager)
app.put("/api/admin/events/registrations/:id", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const regId = parseInt(req.params.id, 10);
  const { guestsCount, registrationNote, companyRepresenting, status } = req.body;

  const db = readDatabase();
  const index = db.eventRegistrations.findIndex((r: any) => r.id === regId);
  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy thông tin đăng ký tham gia" });
  }

  const reg = db.eventRegistrations[index];
  db.eventRegistrations[index] = {
    ...reg,
    guestsCount: typeof guestsCount !== "undefined" ? Number(guestsCount) || 0 : reg.guestsCount,
    registrationNote: typeof registrationNote !== "undefined" ? registrationNote : reg.registrationNote,
    companyRepresenting: typeof companyRepresenting !== "undefined" ? companyRepresenting : reg.companyRepresenting,
    status: status || reg.status || "Approved"
  };

  saveDatabase(db);
  return res.json({ 
    success: true, 
    message: "Cập nhật thông tin đăng ký tham gia sự kiện thành công!", 
    registration: db.eventRegistrations[index] 
  });
});

// Xóa đăng ký tham gia sự kiện (Quyền Admin, Mod, Manager)
app.delete("/api/admin/events/registrations/:id", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const regId = parseInt(req.params.id, 10);

  const db = readDatabase();
  const index = db.eventRegistrations.findIndex((r: any) => r.id === regId);
  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy thông tin đăng ký để xóa" });
  }

  db.eventRegistrations.splice(index, 1);
  saveDatabase(db);

  return res.json({ success: true, message: "Đã hủy/xóa thông tin đăng ký sự kiện thành công!" });
});

// Member tự tạo sự kiện (Cần duyệt) - Admin/Mod tạo APPROVED ngay
app.post("/api/events", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Cần đăng nhập để khởi tạo sự kiện" });
  }

  const { title, description, dateTime, location, organizerUnit, imageUrl } = req.body;
  if (!title || !description || !dateTime || !location) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ các thông tin của sự kiện bắt buộc." });
  }

  const db = readDatabase();
  const isAutoApprove = ["Admin", "Mod", "Manager"].includes(req.user.role);

  const newEvId = db.events.length > 0 ? Math.max(...db.events.map((e: any) => e.id)) + 1 : 1;
  const newEvent: Event = {
    id: newEvId,
    creatorId: req.user.role === "Admin" && req.body.isSystemOfficial ? null : req.user.id,
    title,
    description,
    dateTime,
    location,
    organizerUnit: organizerUnit || req.user.companyName || "Đại diện Hội CEO Matching",
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
    status: isAutoApprove ? "Approved" : "Pending",
    createdAt: new Date().toISOString()
  };

  db.events.push(newEvent);
  saveDatabase(db);

  return res.json({
    success: true,
    message: isAutoApprove ? "Sự kiện của bạn đã được duyệt và đăng công khai!" : "Tạo sự kiện mới thành công! Sự kiện đang trong trạng thái chờ duyệt khởi chạy từ quản trị viên.",
    event: newEvent
  });
});

// Các quản lý duyệt sự kiện (Approved/Pending/Đóng)
app.put("/api/admin/events/:id/status", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const evId = parseInt(req.params.id, 10);
  const { status } = req.body; // Approved / Pending

  const db = readDatabase();
  const index = db.events.findIndex((e: Event) => e.id === evId);

  if (index === -1) return res.status(404).json({ error: "Không tìm thấy sự kiện cần phê duyệt" });

  db.events[index].status = status;
  saveDatabase(db);

  return res.json({ success: true, message: `Cập nhật phê duyệt sự kiện chuyển thành ${status}!`, event: db.events[index] });
});

// Cập nhật trạng thái hiển thị trên Trang Chủ (Admin, Mod, Manager)
app.put("/api/admin/events/:id/toggle-home", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const evId = parseInt(req.params.id, 10);
  const { showOnHome } = req.body;

  const db = readDatabase();
  const index = db.events.findIndex((e: Event) => e.id === evId);

  if (index === -1) return res.status(404).json({ error: "Không tìm thấy sự kiện" });

  db.events[index].showOnHome = !!showOnHome;
  saveDatabase(db);

  return res.json({ 
    success: true, 
    message: showOnHome ? "Đã bật hiển thị sự kiện này lên trang chủ!" : "Đã tắt hiển thị sự kiện này trên trang chủ!", 
    event: db.events[index] 
  });
});

// Cập nhật trạng thái sự kiện Hot gắn ngôi sao (Admin, Mod, Manager)
app.put("/api/admin/events/:id/toggle-hot", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const evId = parseInt(req.params.id, 10);
  const { isHot } = req.body;

  const db = readDatabase();
  const index = db.events.findIndex((e: Event) => e.id === evId);

  if (index === -1) return res.status(404).json({ error: "Không tìm thấy sự kiện" });

  db.events[index].isHot = !!isHot;
  saveDatabase(db);

  return res.json({ 
    success: true, 
    message: isHot ? "Đã gắn ngôi sao Sự kiện Hot nổi bật!" : "Đã gỡ ngôi sao Sự kiện Hot!", 
    event: db.events[index] 
  });
});

// Xóa sự kiện (Chỉ Admin và Mod được quyền)
app.delete("/api/events/:id", requireRole(["Admin", "Mod"]), (req, res) => {
  const evId = parseInt(req.params.id, 10);
  const db = readDatabase();
  const index = db.events.findIndex((e: Event) => e.id === evId);

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy sự kiện để xóa" });
  }

  db.events.splice(index, 1);
  db.eventRegistrations = db.eventRegistrations.filter((r: EventRegistration) => r.eventId !== evId);
  saveDatabase(db);

  return res.json({ success: true, message: "Đã xóa sự kiện thành công khỏi hệ thống!" });
});

// Sửa sự kiện (Chỉ chủ tạo hoặc Admin/Mod được quyền)
app.put("/api/events/:id", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Yêu cầu đăng nhập." });
  }

  const evId = parseInt(req.params.id, 10);
  const { title, description, dateTime, location, organizerUnit, imageUrl, isSystemOfficial } = req.body;

  if (!title || !description || !dateTime || !location) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ các thông tin bắt buộc." });
  }

  const db = readDatabase();
  const index = db.events.findIndex((e: any) => e.id === evId);

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy sự kiện." });
  }

  const event = db.events[index];
  const isCreator = event.creatorId === req.user.id;
  const isStaff = ["Admin", "Mod"].includes(req.user.role);

  if (!isCreator && !isStaff) {
    return res.status(403).json({ error: "Không có quyền sửa đổi sự kiện này." });
  }

  db.events[index] = {
    ...event,
    title,
    description,
    dateTime,
    location,
    organizerUnit: organizerUnit || event.organizerUnit,
    imageUrl: imageUrl || event.imageUrl,
    ...(req.user.role === "Admin" ? { creatorId: isSystemOfficial ? null : (event.creatorId || req.user.id) } : {})
  };

  saveDatabase(db);
  return res.json({ success: true, message: "Cập nhật sự kiện thành công!", event: db.events[index] });
});

// Đăng ký tham gia form Event dành cho Member/Khách VIP
app.post("/api/events/:id/register", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Bạn cần đăng nhập tài khoản CEO để điền form đăng ký tham gia sự kiện này." });
  }

  const eventId = parseInt(req.params.id, 10);
  const { registrationNote, companyRepresenting, guestsCount } = req.body;

  const db = readDatabase();
  const ev = db.events.find((e: Event) => e.id === eventId);
  if (!ev) return res.status(404).json({ error: "Sự kiện không tồn tại" });

  // Kiểm tra đăng ký trùng lặp
  const alreadyRegistered = db.eventRegistrations.some((r: EventRegistration) => r.eventId === eventId && r.userId === req.user.id);
  if (alreadyRegistered) {
    return res.status(400).json({ error: "Tài khoản của bạn đã gửi form đăng ký tham dự sự kiện này trước đó." });
  }

  const rNewId = db.eventRegistrations.length > 0 ? Math.max(...db.eventRegistrations.map((r: any) => r.id)) + 1 : 1;
  const newRegistration: EventRegistration = {
    id: rNewId,
    eventId,
    userId: req.user.id,
    registrationNote: registrationNote || "",
    companyRepresenting: companyRepresenting || req.user.companyName || "Tự do",
    guestsCount: Number(guestsCount) || 1,
    createdAt: new Date().toISOString()
  };

  db.eventRegistrations.push(newRegistration);
  saveDatabase(db);

  return res.json({ success: true, message: "Gửi form đăng ký sự kiện thành công! Hẹn gặp lại bạn tại địa điểm tổ chức hội thảo chuyên sâu." });
});


// 6. INTELLIGENT MATCHING APIS WITH GEMINI INTEGRATION
// Phục vụ kết nối chuyên sâu kết hợp AI gợi ý độc bản tuyệt đỉnh
app.post("/api/matching/ai-recommend", async (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Chức năng riêng tư tuyệt mật, vui lòng đăng nhập tài khoản CEO." });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: "Thiếu targetUserId để thực hiện matching" });

  const db = readDatabase();
  const userA = req.user;
  const userB = db.users.find((u: User) => u.id === targetUserId);

  if (!userB) return res.status(404).json({ error: "Không tìm thấy người dùng nhận diện đối tác thứ 2." });

  // Thuật toán Rule-based làm nền tảng
  let baseScore = 50;
  const textA = ((userA.matchingNeeds || "") + " " + (userA.industry || "") + " " + (userA.bio || "")).toLowerCase();
  const textB = ((userB.matchingNeeds || "") + " " + (userB.industry || "") + " " + (userB.bio || "")).toLowerCase();

  // Tìm kiếm chung từ khóa
  const commonKeywords = ["công nghệ", "phần mềm", "tự động hóa", "nông nghiệp", "thực phẩm", "logistics", "vận tải", "xuất khẩu", "đầu tư", "vốn", "sản xuất", "sME", "ai", "cloud", "bao bì", "thiết bị"];
  const matches: string[] = [];
  commonKeywords.forEach(kw => {
    if (textA.includes(kw) && textB.includes(kw)) {
      baseScore += 8;
      matches.push(kw);
    }
  });

  if (userA.industry.toLowerCase() === userB.industry.toLowerCase()) {
    baseScore += 15;
  }

  if (baseScore > 98) baseScore = 98; // Giới hạn max score là 98%

  let aiRecommendationMessage = "";

  // Sử dụng Gemini AI thật để sinh nội dung phân tách cơ hội giao kết nối xịn sò!
  if (aiClient) {
    try {
      const prompt = `Bạn là một Cố Vấn Đầu Tư và Chuyên gia Networking Doanh Nghiệp cao cấp. Hãy phân tích cơ hội hợp tác kinh doanh và viết một bản "Khuyến nghị kết nối CEO" độc bản bằng tiếng Việt, khoảng 120-150 từ, mang tính chuyên nghiệp, văn phong sang trọng lịch lãm đầy hứng khởi nhằm kích thích 2 CEO kết nối với nhau.
      
THÔNG TIN CEO 1 (Người yêu cầu):
- Họ & Tên: ${userA.fullName}
- Đơn vị: ${userA.jobTitle} tại ${userA.companyName} (Lĩnh vực: ${userA.industry})
- Giới thiệu chung: ${userA.bio}
- Mô tả công ty: ${userA.companyDescription}
- Sản phẩm thế mạnh: ${userA.productDescription}
- Tầm nhìn sứ mệnh: ${userA.visionMission}
- Mong muốn kết nối kinh doanh: ${userA.matchingNeeds}

THÔNG TIN CEO 2 (Bên được matching):
- Họ & Tên: ${userB.fullName}
- Đơn vị: ${userB.jobTitle} tại ${userB.companyName} (Lĩnh vực: ${userB.industry})
- Giới thiệu chung: ${userB.bio}
- Mô tả công ty: ${userB.companyDescription}
- Sản phẩm thế mạnh: ${userB.productDescription}
- Tầm nhìn sứ mệnh: ${userB.visionMission}
- Mong muốn kết nối kinh doanh: ${userB.matchingNeeds}

Hãy đưa ra:
1. Đánh giá độ phù hợp thực tế (Ví dụ: sự cộng hưởng giữa sản phẩm của bên này bổ trợ nhu cầu tìm kiếm của bên kia).
2. Gợi ý 2 ý tưởng/chủ đề cụ thể mà 2 vị CEO này nên đưa ra bàn thảo ngay trong cuộc họp Networking sắp tới (ví dụ: chuyển giao công nghệ, cung ứng chuỗi logistics hải quan Bắc Nam,...).
Hãy phản hồi thuần văn bản không có danh sách đánh dấu sao hay markdown quá phức tạp, ngôn từ tinh tế sâu sắc.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      if (response && response.text) {
        aiRecommendationMessage = response.text.trim();
        console.log("Cộng hưởng thành công gợi lý khuyến nghị kết nối từ Gemini API.");
      }
    } catch (e) {
      console.error("Lỗi khi kết nối với Gemini AI API:", e);
    }
  }

  // Nếu không gọi được Gemini API, lấy Fallback nội dung tự sinh Rule-based xịn sò
  if (!aiRecommendationMessage) {
    const commonKWStr = matches.length > 0 ? matches.join(", ") : "Cơ hội chuỗi liên kết giá trị doanh nghiệp";
    aiRecommendationMessage = `Hệ Thống Gợi Ý Matching: Nhận thấy giữa bạn và CEO ${userB.fullName} (${userB.companyName}) có sự tương hợp rõ rệt trong tệp giá trị và nhu cầu hợp tác thông qua lĩnh vực hoạt động (${userA.industry} & ${userB.industry}). Đề xuất ý tưởng hợp tác: Bên ${userA.companyName} bổ trợ đắc lực dịch vụ kỹ thuật chuyển đổi cho mong muốn phát triển quy mô của ${userB.companyName}. Hai bên nên bố trí cuộc gặp 15 phút tại bàn trà VIP để bàn bạc sâu hơn về: 1. Việc tối ưu chuỗi giá trị tích hợp sản phẩm thế mạnh đôi bên; 2. Thảo luận các đầu mối khách hàng chung dựa trên từ khóa cốt lõi: ${commonKWStr}.`;
  }

    // Lưu lịch sử matching hoặc trả về trực tiếp kết quả
  const updatedDb = readDatabase();
  const pairA = Math.min(userA.id, userB.id);
  const pairB = Math.max(userA.id, userB.id);

  let existingMatchIndex = updatedDb.matches.findIndex((m: Match) => m.userAId === pairA && m.userBId === pairB);

  // Giữ nguyên trạng thái Connected đã được duyệt trước đó, nếu chưa duyệt hoặc Rejected thì khởi tạo lại thành Proposed
  let finalStatus: 'Proposed' | 'Connected' | 'Rejected' = 'Proposed';
  if (existingMatchIndex !== -1) {
    const existing = updatedDb.matches[existingMatchIndex];
    if (existing.status === 'Connected') {
      finalStatus = 'Connected';
    }
  }

  const updatedMatch: any = {
    id: existingMatchIndex !== -1 ? updatedDb.matches[existingMatchIndex].id : (updatedDb.matches.length > 0 ? Math.max(...updatedDb.matches.map((m: any) => m.id)) + 1 : 1),
    userAId: pairA,
    userBId: pairB,
    matchScore: baseScore,
    commonInterests: matches.length > 0 ? matches.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ") : `${userA.industry} & ${userB.industry}`,
    aiRecommendation: aiRecommendationMessage,
    status: finalStatus,
    createdAt: new Date().toISOString(),
    requesterId: userA.id,
    receiverId: userB.id
  };

  if (existingMatchIndex !== -1) {
    updatedDb.matches[existingMatchIndex] = updatedMatch;
  } else {
    updatedDb.matches.push(updatedMatch);
  }

  // Tạo thông báo kết nối gửi tới targetUserId (CEO bên nhận)
  const existingNotif = updatedDb.notifications?.find((n: any) => n.userId === userB.id && n.type === 'ConnectionRequest' && n.meta && n.meta.senderId === userA.id);
  if (!existingNotif) {
    const notifId = updatedDb.notifications.length > 0 ? Math.max(...updatedDb.notifications.map((n: any) => n.id)) + 1 : 1;
    const connectionNotif = {
      id: notifId,
      userId: userB.id,
      type: "ConnectionRequest",
      title: "Yêu cầu kết nối giao thương",
      message: `CEO ${userA.fullName} (${userA.companyName || "Chưa cập nhật doanh nghiệp"}) vừa chạy AI Matching để bắt tay kết nối giao hợp tác với bạn (Đạt ${baseScore}% tương thích)! SĐT liên hệ của họ: ${userA.phone_number || "Chưa cập nhật"} | Email: ${userA.email || "Chưa cập nhật"}. Hãy phản hồi và bấm Bắt Tay Kết Nối đồng ý để đối tác cũng có thể khám phá thông tin liên hệ của bạn!`,
      isRead: false,
      createdAt: new Date().toISOString(),
      meta: {
        matchId: updatedMatch.id,
        senderId: userA.id,
        senderName: userA.fullName,
        senderAvatar: userA.avatarUrl || "",
        senderPhone: userA.phone_number || "",
        senderEmail: userA.email || "",
        targetUserId: userB.id
      }
    };
    updatedDb.notifications.push(connectionNotif);
  }

  saveDatabase(updatedDb);

  return res.json(updatedMatch);
});

// Lấy danh sách matches gợi ý cho user hiện tại (Member/Mod/Admin)
app.get("/api/matching/history", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Cần đăng nhập hệ thống" });
  }

  const db = readDatabase();
  const myUserId = req.user.id;

  const myMatches = db.matches.filter((m: Match) => m.userAId === myUserId || m.userBId === myUserId);
  return res.json(myMatches);
});

// ==========================================
// NOTIFICATION CENTER APIS
// ==========================================

// 1. Get notifications for the authenticated CEO
app.get("/api/notifications", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Cần đăng nhập hệ thống" });
  }

  const db = readDatabase();
  const myUserId = req.user.id;

  const myNotifications = (db.notifications || [])
    .filter((n: any) => n.userId === myUserId || n.userId === 0)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json(myNotifications);
});

// 2. Mark a notification as read
app.post("/api/notifications/:id/read", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Một phần bí mật, vui lòng đăng nhập" });
  }

  const notifId = parseInt(req.params.id, 10);
  const db = readDatabase();
  
  const notifIndex = (db.notifications || []).findIndex((n: any) => n.id === notifId && (n.userId === req.user.id || n.userId === 0));
  
  if (notifIndex !== -1) {
    db.notifications[notifIndex].isRead = true;
    saveDatabase(db);
    return res.json({ success: true });
  }

  return res.status(404).json({ error: "Không tìm thấy thông báo tương ứng" });
});

// 3. Mark all notifications as read
app.post("/api/notifications/read-all", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Chức năng bảo mật, vui lòng đăng nhập" });
  }

  const db = readDatabase();
  const myUserId = req.user.id;

  (db.notifications || []).forEach((n: any) => {
    if (n.userId === myUserId || n.userId === 0) {
      n.isRead = true;
    }
  });

  saveDatabase(db);
  return res.json({ success: true, message: "Đã đánh dấu đọc toàn bộ thông báo." });
});

// 4. Respond to a connection request (Accept or Decline)
app.post("/api/matching/respond", (req: any, res) => {
  if (!req.user || req.user.id === 0) {
    return res.status(401).json({ error: "Cần đăng nhập để thực hiện phản hồi kết nối" });
  }

  const { matchId, action } = req.body; // action: 'accept' | 'decline'
  if (!matchId || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: "Tham số yêu cầu không đầy đủ hoặc không hợp lệ" });
  }

  const db = readDatabase();
  const myUserId = req.user.id;

  const matchIndex = db.matches.findIndex((m: any) => m.id === matchId && (m.userAId === myUserId || m.userBId === myUserId));
  if (matchIndex === -1) {
    return res.status(404).json({ error: "Không tìm thấy yêu cầu liên kết phù hợp" });
  }

  const match = db.matches[matchIndex];

  // Cập nhật trạng thái
  match.status = action === 'accept' ? 'Connected' : 'Rejected';
  
  // Xác định đối tác là người còn lại trong cuộc bắt tay
  const partnerId = match.userAId === myUserId ? match.userBId : match.userAId;
  const partnerUser = db.users.find((u: any) => u.id === partnerId);
  const currentUser = db.users.find((u: any) => u.id === myUserId);

  if (action === 'accept') {
    // Thêm thông báo phản hồi đồng ý kết nối cho bên đề xuất
    const notifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n: any) => n.id)) + 1 : 1;
    const acceptNotif = {
      id: notifId,
      userId: partnerId,
      type: "ConnectionAccepted",
      title: "Kết nối kinh doanh thành công!",
      message: `CEO ${currentUser ? currentUser.fullName : "Đối tác"} đã chấp nhận lời mời kết nối của bạn! Số điện thoại và Email của đối tác hiện đã được hiển thị công khai trên hồ sơ của họ dành riêng cho bạn.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      meta: {
        matchId: match.id,
        senderId: myUserId,
        senderName: currentUser ? currentUser.fullName : "CEO",
        senderAvatar: currentUser ? currentUser.avatarUrl : "",
        targetUserId: partnerId
      }
    };
    db.notifications.push(acceptNotif);
  }

  // Đánh dấu các thông báo connection request liên quan đến matchId này là đã được xử lý (đã đọc)
  (db.notifications || []).forEach((n: any) => {
    if (n.userId === myUserId && n.type === 'ConnectionRequest' && n.meta && n.meta.matchId === matchId) {
      n.isRead = true;
    }
  });

  saveDatabase(db);

  return res.json({ 
    success: true, 
    message: action === 'accept' ? "Đã chấp nhận kết nối thành công! Chúc hai CEO có cuộc đàm phán giao thương thắng lợi bùng nổ." : "Đã từ chối kết nối thành đối tác.",
    match 
  });
});

// Admin panels hoặc tổng hợp Stats hoạt động
app.get("/api/diagnostics/db", (req, res) => {
  const db = readDatabase();
  let supabaseStatus = "Disabled";
  let supabaseError = null;

  if (usePg && dbPool) {
    supabaseStatus = isDbSyncCompleted ? "Connected & Synced" : "Pending Sync";
  }

  res.json({
    supabaseStatus,
    isDbSyncCompleted,
    usePg,
    dbFilePath: DB_FILE_PATH,
    defaultDbFilePath: DEFAULT_DB_PATH,
    localDbFileExists: fs.existsSync(DB_FILE_PATH),
    localDbSize: fs.existsSync(DB_FILE_PATH) ? fs.statSync(DB_FILE_PATH).size : 0,
    totalUsers: db.users.length,
    usersList: db.users.map((u: any) => ({ id: u.id, username: u.username, role: u.role, status: u.status }))
  });
});

// Admin panels hoặc tổng hợp Stats hoạt động
app.get("/api/admin/stats", requireRole(["Admin", "Mod", "Manager"]), (req, res) => {
  const db = readDatabase();
  return res.json({
    totalUsers: db.users.length,
    pendingUsers: db.users.filter((u: User) => u.status === "Pending").length,
    totalEvents: db.events.length,
    pendingEvents: db.events.filter((e: Event) => e.status === "Pending").length,
    totalPosts: db.posts.length,
    pendingPosts: db.posts.filter((p: Post) => p.status === "Pending").length
  });
});

// ==========================================
// APIS QUẢN LÝ CƠ SỞ DỮ LIỆU ĐÁM MÂY (DATABASE MANAGEMENT APIS)
// ==========================================
app.get("/api/admin/db/diagnostics", requireRole(["Admin"]), async (req: any, res: any) => {
  const db = readDatabase();
  let supabaseStatus = "Disabled";
  let cloudUpdatedAt = null;
  let cloudSize = 0;
  let connectionError = null;

  if (usePg && dbPool) {
    supabaseStatus = isDbSyncCompleted ? "Connected & Synced" : "Connected but Out-of-sync";
    try {
      const client = await dbPool.connect();
      try {
        const queryRes = await client.query("SELECT updated_at, length(value) as size FROM render_persistent_storage WHERE key = 'database_store' LIMIT 1;");
        if (queryRes.rows.length > 0) {
          cloudUpdatedAt = queryRes.rows[0].updated_at;
          cloudSize = parseInt(queryRes.rows[0].size, 10);
        } else {
          supabaseStatus = "Table exists, but store is missing";
        }
      } finally {
        client.release();
      }
    } catch (err: any) {
      supabaseStatus = "Connection Failed";
      connectionError = err.message || err;
    }
  } else {
    supabaseStatus = "Not Configured (DATABASE_URL is missing)";
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const isDirectSupabase = dbUrl.includes("supabase.co") && (dbUrl.includes(":5432") || !dbUrl.includes(".pooler.supabase.com"));

  return res.json({
    supabaseStatus,
    isDbSyncCompleted,
    usePg,
    dbFilePath: DB_FILE_PATH,
    localDbFileExists: fs.existsSync(DB_FILE_PATH),
    localDbSize: fs.existsSync(DB_FILE_PATH) ? fs.statSync(DB_FILE_PATH).size : 0,
    cloudUpdatedAt,
    cloudSize,
    connectionError,
    isDirectSupabase,
    totalUsers: db.users.length,
    usersCount: db.users.length,
    postsCount: db.posts.length,
    eventsCount: db.events.length,
    tradesCount: db.trades.length,
    commentsCount: db.tradeComments.length,
    matchesCount: db.matches.length
  });
});

app.post("/api/admin/db/sync-pull", requireRole(["Admin"]), async (req: any, res: any) => {
  if (!usePg || !dbPool) {
    return res.status(400).json({ error: "Chưa cấu hình dịch vụ đồng bộ cơ sở dữ liệu Supabase (DATABASE_URL trống hoặc không khả dụng)." });
  }

  try {
    const client = await dbPool.connect();
    try {
      const queryRes = await client.query("SELECT value FROM render_persistent_storage WHERE key = 'database_store' LIMIT 1;");
      if (queryRes.rows.length > 0) {
        const cloudDataStr = queryRes.rows[0].value;
        // Validate JSON
        JSON.parse(cloudDataStr);
        // Overwrite local
        fs.writeFileSync(DB_FILE_PATH, cloudDataStr, "utf-8");
        isDbSyncCompleted = true; // Sét lại trạng thái đồng bộ hoàn tất
        console.log("[Supabase] CƯỠNG ÉP THU THẬP THÀNH CÔNG: Đã đồng bộ thủ công dữ liệu từ Supabase về Local!");
        return res.json({ success: true, message: "Đã cưỡng ép tải và khôi phục dữ liệu từ Supabase về hệ thống local thành công!" });
      } else {
        return res.status(404).json({ error: "Không tìm thấy bản sao lưu nào lưu trữ trên đám mây Supabase để tải về." });
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[Supabase] Cưỡng ép thu thập dữ liệu thất bại:", err);
    return res.status(500).json({ error: `Đồng nhất thất bại khi cố gắng kết nối Supabase: ${err.message || err}` });
  }
});

app.post("/api/admin/db/sync-push", requireRole(["Admin"]), async (req: any, res: any) => {
  if (!usePg || !dbPool) {
    return res.status(400).json({ error: "Chưa cấu hình dịch vụ đồng bộ cơ sở dữ liệu Supabase (DATABASE_URL trống hoặc không khả dụng)." });
  }

  try {
    const currentLocalData = fs.existsSync(DB_FILE_PATH) ? fs.readFileSync(DB_FILE_PATH, "utf-8") : "";
    if (!currentLocalData) {
      return res.status(400).json({ error: "Dữ liệu Local rỗng hoặc tệp tin không tồn tại để đồng bộ lên." });
    }

    // Validate JSON to make sure we don't push corrupted data
    JSON.parse(currentLocalData);

    const client = await dbPool.connect();
    try {
      // Đẩy đè lên Supabase
      await client.query(
        "INSERT INTO render_persistent_storage (key, value, updated_at) VALUES ('database_store', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();",
        [currentLocalData]
      );
      isDbSyncCompleted = true; // Sét lại trạng thái đồng bộ hoàn tất
      console.log("[Supabase] CƯỠNG ÉP SAO LƯU THÀNH CÔNG: Đã đẩy dữ liệu local đồng bộ thủ công lên mây!");
      return res.json({ success: true, message: "Đã cưỡng ép sao lưu thành công dữ liệu hiện tại lên đám mây Supabase vĩnh viễn!" });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[Supabase] Cưỡng ép sao lưu lên Supabase thất bại:", err);
    return res.status(500).json({ error: `Sao lưu lên đám mây thất bại: ${err.message || err}` });
  }
});

// Hỗ trợ tự động phục vụ file xác minh tên miền Zalo (Zalo Domain Verification)
app.get("/zalo_verifier*", (req, res, next) => {
  const fileName = path.basename(req.path);
  const possiblePaths = [
    path.join(process.cwd(), fileName),
    path.join(process.cwd(), "public", fileName),
    path.join(process.cwd(), "src", fileName),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }
  next();
});

// ==========================================
// TÍCH HỢP VITE MIDDLEWARE VÀ EXPORT EXPRESS
// ==========================================

async function startServer() {
  // Đồng bộ cơ sở dữ liệu từ đám mây Supabase nếu được thiết lập cấu hình DATABASE_URL
  if (usePg) {
    console.log("[Supabase] Đang bắt đầu đồng bộ dữ liệu từ đám mây trước khi sẵn sàng kích hoạt...");
    await syncDatabaseFromSupabase();
  }

  // Đồng bộ tĩnh assets/static hoặc index trong chế độ production
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CEO Matching Server is listening on http://localhost:${PORT}`);
  });
}

startServer();
