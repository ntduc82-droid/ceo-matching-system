-- CEO MATCHING SYSTEM DATABASE SCHEMA (PostgreSQL)
-- Kiến trúc thiết kế bởi Kiến trúc sư Phần mềm & Lập trình viên Full-stack cấp cao

-- 1. ENUMS FOR ROLES & STATUSES
CREATE TYPE user_role AS ENUM ('Admin', 'Mod', 'Manager', 'Member', 'Guest');
CREATE TYPE user_status AS ENUM ('Pending', 'Active', 'Banned');
CREATE TYPE post_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE event_status AS ENUM ('Pending', 'Approved');

-- 2. USERS TABLE
-- Lưu trữ thông tin tài khoản và thông tin cá nhân phong phú của các CEO
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'Member',
    status user_status DEFAULT 'Pending',
    
    -- Thông tin cá nhân & Doanh nghiệp
    full_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(150),
    job_title VARCHAR(100),
    bio TEXT,                 -- Giới thiệu chung về bản thân
    company_description TEXT, -- Giới thiệu chung về công ty
    product_description TEXT, -- Giới thiệu về sản phẩm/dịch vụ
    industry VARCHAR(100),     -- Lĩnh vực hoạt động chính
    
    -- Liên hệ
    phone_number VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    
    -- Liên kết mạng xã hội & Website
    website VARCHAR(255),
    facebook_link VARCHAR(255),
    tiktok_link VARCHAR(255),
    linkedin_link VARCHAR(255),
    other_link VARCHAR(255),
    
    -- Định hướng phát triển
    vision_mission TEXT,      -- Tầm nhìn – sứ mệnh
    matching_needs TEXT,      -- Mong muốn kết nối (nhập tự do hoặc ngăn cách bằng dấu phẩy)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index cho tìm kiếm nhanh theo ngành nghề, công ty và mong muốn kết nối
CREATE INDEX idx_users_industry ON users(industry);
CREATE INDEX idx_users_status_role ON users(status, role);

-- 3. FIELD_PERMISSIONS TABLE
-- Cấu hình ẩn/hiện hoặc phân quyền xem từng trường thông tin cá nhân nhạy cảm của từng user.
-- Mặc định true = hiển thị công khai dạng che giấu một phần hoặc cho phép mọi người xem,
-- false = ẩn hoàn toàn (chỉ Admin, Mod có thể xem được).
CREATE TABLE field_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    phone_visible BOOLEAN DEFAULT TRUE,
    email_visible BOOLEAN DEFAULT TRUE,
    company_description_visible BOOLEAN DEFAULT TRUE,
    product_description_visible BOOLEAN DEFAULT TRUE,
    facebook_visible BOOLEAN DEFAULT TRUE,
    linkedin_visible BOOLEAN DEFAULT TRUE,
    tiktok_visible BOOLEAN DEFAULT TRUE,
    website_visible BOOLEAN DEFAULT TRUE,
    bio_visible BOOLEAN DEFAULT TRUE,
    vision_mission_visible BOOLEAN DEFAULT TRUE,
    matching_needs_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index phục vụ check quyền truy cập nhanh
CREATE INDEX idx_field_permissions_user_id ON field_permissions(user_id);

-- 4. POSTS TABLE (CMS & BÀI VIẾT THÀNH VIÊN)
-- Bài viết của thành viên hoặc tin tức bài viết hệ thống.
-- Nếu author_id null, đó là bài viết chính thức của hệ thống (do Admin/Mod/Manager đăng).
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    status post_status DEFAULT 'Pending',
    category VARCHAR(50) DEFAULT 'Business', -- Tin tức, Cơ hội đầu tư, Chia sẻ kinh nghiệm,...
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_author ON posts(author_id);

-- 5. EVENTS TABLE (SỰ KIỆN HỆ THỐNG & SỰ KIỆN DO MEMBER TẠO)
-- Đối với member, cần được Admin/Mod duyệt (status = Approved) trước khi xuất hiện công khai.
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255) NOT NULL,
    organizer_unit VARCHAR(150), -- Đơn vị tổ chức
    image_url VARCHAR(255),
    status event_status DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date_time);

-- 6. EVENT_REGISTRATIONS TABLE (ĐĂNG KÝ THAM GIA SỰ KIỆN)
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    -- Thông tin nhập thêm khi điền form tham gia sự kiện (nếu cần thiết)
    registration_note TEXT,
    company_representing VARCHAR(150),
    guests_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id) -- Tránh đăng ký lặp lại
);

-- 7. MATCHES TABLE (GỢI Ý KẾT NỐI HOẶC LỊCH SỬ KẾT NỐI)
-- Lưu trữ điểm số tương đồng hoặc các cặp kết nối được đề xuất/chấp nhận
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_a_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_b_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2), -- Điểm tương thích được tính từ 0 - 100
    common_interests TEXT,    -- Các điểm tương đồng giữa 2 bên
    ai_recommendation TEXT,   -- Lời nhận xét, lý do matching thông minh gợi ý bởi AI
    status VARCHAR(20) DEFAULT 'Proposed', -- 'Proposed' (gợi ý), 'Connected' (đã bắt tay kết nối), 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK(user_a_id < user_b_id) -- Đảm bảo tính duy nhất của cặp (A, B) không phân biệt thứ tự
);

CREATE UNIQUE INDEX idx_matches_unique_pair ON matches(user_a_id, user_b_id);

-- 8. SYSTEM_MENUS TABLE (QUẢN TRỊ MENU ĐỘNG)
-- Cho phép Admin tùy biến menu điều hướng bên ngoài trang chủ và trong hệ thống.
CREATE TABLE system_menus (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    role_allowed VARCHAR(20) DEFAULT 'Guest', -- Quyền tối thiểu được xem menu này: Admin, Mod, Manager, Member, Guest
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_menus_order ON system_menus(order_index) WHERE is_visible = TRUE;


-- DATABASE SEEDING (Dữ liệu mẫu khởi tạo hệ thống)
-- Các tài khoản với vai trò tương ứng để kiểm tra phân quyền (Password hashes ở dạng giả lập)

-- Insert Users
-- 1. Admin
-- 2. Mod
-- 3. Manager
-- 4. Member_1 (CEO Tech corp)
-- 5. Member_2 (CEO Logistics VN)
-- 6. Member_3 (CEO Real Estate Group)

-- Insert Field Permissions mặc định tương ứng với Users
-- Insert các Menu mặc định: Trang chủ, Sự kiện, Thành viên, Matching, Quản trị Admin Panel.
