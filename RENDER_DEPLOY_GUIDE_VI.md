# HƯỚNG DẪN CHI TIẾT TỪ ĐẦU: DEPLOY LÊN RENDER KHÔNG MẤT DỮ LIỆU (100% MIỄN PHÍ)

Chào anh Đức, em xin lỗi vì sự nhầm lẫn ở bước giải thích gói cước trong file hướng dẫn trước! 

Em đã cập nhật lại mã nguồn hệ thống để hỗ trợ hoàn hảo cả **hai phương án** cấu hình:
1.  **PHƯƠNG ÁN 2 (Khuyên dùng - 100% MIỄN PHÍ):** Chạy ứng dụng trên gói **Render Free ($0)** và tự động đồng bộ lưu trữ vĩnh viễn sang **Database Supabase PostgreSQL Free ($0)**. Không bao giờ lo bị mất hay reset dữ liệu, cũng không tốn một đồng chi phí nào!
2.  **PHƯƠNG ÁN 1 (Đơn giản hơn nhưng trả phí):** Chạy ứng dụng trên gói Render Starter ($7/tháng) và gắn ổ đĩa ảo Persistent Disk ($1/tháng).

Dưới đây là **hướng dẫn chi tiết bằng chuột từ đầu**, chỉ rõ anh cần mở cái gì, bấm vào đâu để anh dễ dàng thao tác nhất!

---

## PHẦN A: ĐẨY MÃ NGUỒN LÊN GITHUB (BƯỚC BẮT BUỘC BAN ĐẦU)

Render sẽ tự động đọc mã nguồn và tải ứng dụng từ tài khoản GitHub cá nhân của anh.

1.  **Tải Code về máy tính:** 
    *   Tại giao diện Google AI Studio, anh nhấp chuột vào biểu tượng **Settings (Răng cưa) hoặc nút Export / Download** ở phần quản lý dự án để tải file nén Zip mã nguồn của dự án này về máy tính.
    *   Giải nén tệp Zip đó ra một thư mục trên máy tính của anh.
2.  **Đăng ký tài khoản GitHub:**
    *   Mở trình duyệt web, truy cập vào đường link: [https://github.com](https://github.com).
    *   Nếu chưa có tài khoản, hãy click nút **Sign up** để đăng ký một tài khoản miễn phí. Nếu có rồi, hãy click **Sign in** để đăng nhập.
3.  **Tạo kho lưu trữ mới (Repository):**
    *   Khi đã đăng nhập thành công vào GitHub, anh nhìn lên góc trên cùng bên phải màn hình, click vào nút có dấu cộng **`+`** -> Chọn **`New repository`** (Kho lưu trữ mới).
    *   **Repository name:** Nhập chữ chính xác là: `ceo-matching-system` (viết liền không dấu).
    *   **Public/Private:** Tìm mục này và nhấp chuột chọn **`Private`** (Riêng tư) để bảo mật mã nguồn và tài khoản của anh.
    *   Kéo xuống cuối trang, click nút màu xanh: **`Create repository`** (Tạo kho lưu trữ).
4.  **Tải file code lên GitHub (Phương pháp thủ công hoặc qua Git Terminal của VS Code):**
    
    *   **CÁCH 1: Tải trực tiếp bằng chuột (Đơn giản nhất):**
        *   Sau khi tạo xong repo `ceo-matching-system`, anh sẽ thấy một trang hướng dẫn trên web GitHub. Tìm dòng chữ: **`Get started by creating a new file or uploading an existing file`**.
        *   Nhấp chuột vào chữ: **`uploading an existing file`** (Tải lên tệp có sẵn).
        *   Mở thư mục code đã giải nén trên máy tính của anh ở Bước 1. Chọn toàn bộ các tệp tin và thư mục bên trong, dùng chuột kéo và thả chúng trực tiếp vào ô tải lên của trình duyệt. (Gồm các tệp `package.json`, `server.ts`, `database_store.json`, thư mục `src`, `assets`, v.v.).
        *   Đợi thanh trạng thái tải lên hoàn thành 100%.
        *   Cuộn trang xuống dưới cùng, click nút màu xanh: **`Commit changes`** (Xác nhận các thay đổi). Vậy là code của anh đã được đưa lên mây an toàn!

    *   **CÁCH 2: Cập nhật thông qua Terminal trong VS Code (Sửa triệt để các lỗi đỏ anh vừa gặp):**
        *   **Lý do bị lỗi anh gặp trong ảnh chụp:** 
            1. Lúc trước, Git của anh đang lưu địa chỉ là đường dẫn mẫu ẩn danh `ten tai khoan github của anh/ceo-matching.git` nên khi `git pull` báo lỗi repo `not found`.
            2. Khi anh gõ `git remote add origin https://github.com/ntduc82-droid/ceo-matching`, hệ thống báo lỗi `remote origin already exists` do địa chỉ cũ vẫn còn bị kẹt và chưa được xóa đi.
            3. Hơn nữa, tên repo chính xác của anh là `ceo-matching-system` chứ không phải `ceo-matching`.
        *   **CÁCH KHẮC PHỤC HOÀN HẢO 100%:** Anh hãy mở terminal trong VS Code lên (không cần phải mở terminal mới làm gì, cứ dán đè trực tiếp các lệnh này vào màn hình hiện tại):
            
            ```bash
            # Bước 2.1: Sửa lại địa chỉ Git chính xác của anh (Ghi đè cấu hình cũ đang bị lỗi)
            git remote set-url origin https://github.com/ntduc82-droid/ceo-matching-system.git
            
            # Bước 2.2: Chọn nhánh chính là main
            git branch -M main
            
            # Bước 2.3: Thêm toàn bộ các file mới cập nhật vào hàng chờ của Git
            git add .
            
            # Bước 2.4: Tạo một ghi chú xác nhận thay đổi (Commit)
            git commit -m "cap nhat footer va link facebook group"
            
            # Bước 2.5: Đẩy toàn bộ code mới cập nhật lên GitHub
            # LƯU Ý QUAN TRỌNG: Nếu gặp lỗi [rejected] main -> main (fetch first) do GitHub có chứa file sẵn trước đó (như README.md),
            # anh chỉ cần chạy lệnh có thêm chữ "-f" (force) ở dưới để ép buộc đẩy đè bản code chuẩn từ máy tính lên:
            git push -u origin main -f
            ```
            
            *Chạy xong các lệnh trên là code từ máy tính của anh sẽ bay thẳng lên GitHub `ceo-matching-system` cực kỳ mượt mà, không gặp bất cứ lỗi kẹt hay tồn tại nào nữa!*

---

## PHẦN B: HƯỚNG DẪN PHƯƠNG ÁN 2 (100% MIỄN PHÍ - RENDER FREE + SUPABASE FREE)

### Bước 1: Lấy đường dẫn kết nối cơ sở dữ liệu free trên Supabase

1.  Truy cập vào trang web: [https://supabase.com](https://supabase.com).
2.  Nhấp vào nút **`Start your project`** hoặc nhấp vào **`Sign In / Sign Up`** (Đăng nhập bằng chính tài khoản GitHub của anh cực nhanh bằng 1 click chuột).
3.  Khi đưa vào trang quản trị (Dashboard), nhấp chuột chọn nút **`New Project`** (Dự án mới) -> Chọn tổ chức (Organization) của anh.
4.  Điền các thông tin sau:
    *   **Name:** Nhập tên dự án, ví dụ: `ceomatching-db`.
    *   **Database Password:** Nhấp nút **`Generate a password`** để hệ thống tự tạo mật khẩu mạnh. **CỰC KỲ QUAN TRỌNG:** Anh hãy nhấp vào nút **`Copy`** để lưu lại mật khẩu này ra Notepad trên máy tính (nếu quên mật khẩu này sẽ không lấy lại được).
    *   **Region:** Chọn vùng có chữ **`Singapore (ap-southeast-1)`** để dữ liệu truyền về Việt Nam nhanh nhất.
    *   **Pricing Plan:** Chọn gói **`Free`** ($0 / month).
    *   Bấm chọn **`Create new project`** để tạo. Đợi khoảng 1 - 2 phút cho Supabase khởi tạo máy chủ xong.
5.  **Lấy chuỗi kết nối DATABASE_URL (CHUẨN XÁC 100% VỚI BẢNG KẾT NỐI MỚI NHẤT):**
    *   Trong bảng **`Connect to your project`** đang hiện ra trên màn hình của anh:
    *   **Bước 5.1:** Anh click chuột chọn vào ô thứ 2 có tên là **`Direct`** (ngay bên dưới có chữ nhỏ là `Connection string`, có biểu tượng hình chiếc lu/ổ cứng database).
    *   **Bước 5.2:** Khi bấm vào đó, giao diện sẽ chuyển sang phần hiển thị chuỗi kết nối trực tiếp. Anh sẽ nhìn thấy ngay dòng địa chỉ PostgreSQL của mình có dạng:
        `postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`
    *   **Bước 5.3:** Hãy nhấp vào biểu tượng nút **`Copy`** ở góc bên phải của ô chuỗi kết nối đó để sao chép.
    *   **LƯU Ý CỰC KỲ QUAN TRỌNG:** Sau khi copy chuỗi này ra Notepad, anh nhớ tìm đoạn chữ `[YOUR-PASSWORD]` (hoặc đoạn nằm giữa dấu `:` và `@`) và thay thế bằng chính xác mật khẩu database anh đã tự đặt ở **Mục 4** lúc tạo dự án nhé! Đây chính là **DATABASE_URL** hoàn hảo để dán vào Render.

### Bước 2: Deploy ứng dụng hoàn toàn miễn phí lên Render.com

1.  Truy cập vào trang web: [https://render.com](https://render.com). Đăng nhập bằng tài khoản GitHub của anh.
2.  Click chuột vào nút màu tím **`New`** ở góc trên bên phải -> Chọn **`Web Service`** (Dịch vụ web).
3.  Tìm dòng kết nối với kho lưu trữ GitHub của anh, nhấp chuột chọn repository tên **`ceo-matching-system`** mà anh vừa đẩy lên ở Phần A.
4.  Cấu hình chi tiết Web Service bằng chuột:
    *   **Name:** Nhập `ceo-matching-system` (viết liền, không dấu).
    *   **Region:** Chọn vùng có chữ **`Singapore (Southeast Asia)`** để tối ưu hóa tốc độ.
    *   **Branch:** Chọn nhánh `main` (hoặc `master`).
    *   **Language (Runtime):** Chọn **`Node`**.
    *   **Build Command:** Điền chính xác:
        ```bash
        npm run build
        ```
    *   **Start Command:** Điền chính xác:
        ```bash
        npm run start
        ```
    *   **Instance Type (Cấu hình máy chủ):** Trình duyệt sẽ hiện các gói cước. Anh nhấp chuột chọn đúng dòng đầu tiên có chữ **`Free`** ($0 / month, 512MB RAM, 0.1 CPU).
5.  **Gán Biến Môi Trường (Environment Variables):**
    *   Vẫn tại trang cấu hình đó, anh cuộn chuột xuống dưới cùng chọn tab **`Advanced`** (hoặc tab **`Environment`**).
    *   Nhấp chuột vào nút **`Add Environment Variable`** (Thêm biến môi trường).
    *   Thêm chính xác cặp giá trị sau bằng cách sao chép và dán:

| Key (Khóa) | Value (Giá trị) | Ý nghĩa |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | *(Dán chuỗi URI kết nối Supabase anh đã chuẩn bị ở Bước 1)* | **BẮT BUỘC:** Kích hoạt tính năng lưu dữ liệu vĩnh viễn lên Supabase. |
| **`GEMINI_API_KEY`** | *(Mã API Key Gemini của anh)* | Kích hoạt bộ não trí tuệ nhân tạo gợi ý kết nối CEO Matching. |
| **`NODE_ENV`** | `production` | Giúp ứng dụng chạy nhanh hơn và mượt mà hơn. |

6.  Kéo hẳn chuột xuống dưới cùng trang, click nút màu tím nổi bật: **`Create Web Service`** (Tạo dịch vụ).

---

## CƠ CHẾ HOẠT ĐỘNG HOÀN HẢO CỦA PHƯƠNG ÁN 2

1.  **Dọn dẹp và khởi động:** Khi Render dọn dẹp bộ nhớ và khởi chạy bản cập nhật code, ứng dụng Node.js sẽ khởi động và đọc biến `DATABASE_URL`.
2.  **Khôi phục dữ liệu tức thì:** Hệ thống tự động tạo ra bảng lưu trữ trên Supabase nếu chưa có. Nếu trong cơ sở dữ liệu Supabase đã có sẵn bản sao lưu, hệ thống sẽ **tự động tải toàn bộ tài khoản, bài viết, cuộc trò chuyện mới nhất** từ Supabase về đặt vào file `database_store.json` của server local.
3.  **Tốc độ siêu nhanh:** Khi người dùng click, duyệt bài, đăng nhập... hệ thống đọc trực tiếp dữ liệu từ file local nên **tốc độ phản hồi cực kỳ tức thì (gần như 0ms)**, hoàn toàn không bị trễ nải so với việc truy vấn database từ xa liên tục.
4.  **Tự động lưu trữ vĩnh viễn:** Khi có bất kỳ thay đổi nào (thêm mới thành viên, sửa hồ sơ, tạo sự kiện,...), hệ thống sẽ lập tức cập nhật file local, đồng thời **âm thầm tự động đẩy sao lưu đồng bộ lên Supabase** trong background mà không làm chậm trải nghiệm của người dùng.
5.  **Dữ liệu bất tử:** Dù Render của anh là gói miễn phí $0/tháng bị Reset đĩa khi khởi động lại, mỗi khi máy chủ Render của anh thức dậy hay Deploy phiên bản mới, nó sẽ tự động kéo bản sao lưu từ Supabase về. Dữ liệu của anh và toàn bộ thành viên CEO Matching được bảo toàn vĩnh viễn!

---

## PHẦN C: HƯỚNG DẪN PHƯƠNG ÁN 1 (TRẢ PHÍ - GIÁ $8/THÁNG RENDER STARTER + DISK)

Nếu anh Đức không muốn tạo tài khoản Supabase phức tạp, chỉ muốn cấu hình duy nhất trên Render và chấp nhận chi trả **$8/tháng**:

1.  Tại giao diện tạo Web Service trên Render, mục **Instance Type** anh chọn gói **`Starter`** ($7/tháng).
2.  Cuộn xuống dưới phần cấu hình, click chọn nút **`Add Disk`** (Gắn thêm ổ đĩa).
3.  Điền cấu hình ổ đĩa:
    *   **Name:** `ceodb`
    *   **Mount Path:** `/data`
    *   **Size:** `1` (1 Gigabyte giá $1/tháng).
4.  Ở phần **Environment Variables**, anh thêm biến môi trường sau:
    *   **`DATA_DIR`**: `/data` (Giúp chỉ dẫn ứng dụng lưu trữ file database lên ổ đĩa ngoài `/data` để tránh bị mất file khi redeploy).
5.  Lưu lại cấu hình và bấm **Create Web Service**.

---

## PHẦN D: HƯỚNG DẪN CÁCH LẤY `GEMINI_API_KEY` (MIỄN PHÍ 100%)

Để kích hoạt tính năng trí tuệ nhân tạo gợi ý kết nối kinh doanh thông minh cho website, anh cần lấy mã bảo mật API Key của Gemini. Cách lấy vô cùng đơn giản như sau:

1.  **Truy cập vào AI Studio:**
    *   Anh mở tab mới trên trình duyệt và truy cập vào đường link sau: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
    *   Đăng nhập bằng tài khoản Gmail cá nhân của anh.
2.  **Tạo mã `GEMINI_API_KEY` mới:**
    *   Tại giao diện Google AI Studio, anh tìm và nhấp chuột vào nút màu xanh **`Create API key`** (Tạo khóa API) ở góc trên bên trái.
    *   Một cửa sổ tùy chọn sẽ hiện ra:
        *   Chọn **`Create API key in new project`** (Tạo khóa API trong một dự án mới).
        *   Nếu hệ thống yêu cầu đồng ý điều khoản, anh tích chọn đồng ý rồi bấm xác nhận.
3.  **Sao chép mã API Key:**
    *   Sau khi tạo xong, một đoạn mã dài chứa cả chữ và số (ví dụ: `AIzaSyD...`) sẽ hiện ra.
    *   Anh nhấp chuột vào chữ **`Copy`** để sao chép mã này.
    *   **Lưu ý:** Hãy lưu tạm mã API này vào Notepad trên máy tính của anh. Đây chính là giá trị để anh điền vào phần biến môi trường **`GEMINI_API_KEY`** khi cấu hình Web Service trên Render ở bước trên!

---

## PHẦN E: CÁCH KIỂM TRA (TEST) ĐỂ CHẮC CHẮN 100% DỮ LIỆU ĐÃ LƯU VĨNH VIỄN, KHÔNG BỊ RESET

Để kiểm tra và tự mình kiểm chứng dữ liệu của anh Đức đã được đồng bộ vĩnh viễn, không bao giờ lo bị mất hay reset nữa, anh có thể thực hiện 3 cách thử nghiệm cực kỳ trực quan sau:

### **Cách 1: Kiểm tra trực tiếp dữ liệu "bay" vào Supabase (Bằng mắt thường)**
Mỗi khi anh thao tác trên trang web (ví dụ: đăng ký tài khoản CEO mới, hoặc đăng bài viết kết nối mới):
1.  Anh đăng nhập vào **Supabase** -> Chọn dự án `ceomatching-db`.
2.  Ở thanh menu dọc màu xám bên trái màn hình, anh nhấp chuột chọn biểu tượng **`Table Editor`** (Biểu tượng xếp thứ 2 từ trên xuống, hình bảng ô vuông dữ liệu).
3.  Anh sẽ thấy danh sách các bảng dữ liệu hiện ra (ví dụ: `ceos`, `posts`, `messages`, `users`... tùy cấu hình).
4.  Anh nhấp chuột vào từng bảng, anh sẽ nhìn thấy **chính nội dung, tên tài khoản, hay bài viết anh vừa tạo** đã hiển thị trực tiếp thành các dòng thông tin lưu trữ tại đây. 

*Khi dữ liệu đã nằm trên bảng Supabase này, nó đã nằm ở trung tâm dữ liệu an toàn của Supabase tại Singapore, không một tác vụ restart máy chủ nào của Render xóa được!*

---

### **Cách 2: Ra lệnh cho Render xóa đĩa và khởi động lại (Mô phỏng máy chủ reset)**
Do gói Render Free tự động dọn sạch ổ đĩa ảo khi Sleep hoặc khi cập nhật code:
1.  Anh vào trang quản lý **Render.com**, nhấp chọn dự án Web Service `ceo-matching-system` của anh.
2.  Anh nhìn lên góc trên cùng bên phải, tìm nút **`Manual Deploy`** (Deploy thủ công).
3.  Click chọn dòng: **`Clear build cache & deploy`** (Xóa toàn bộ cache cũ và deploy lại từ đầu).
4.  Lúc này, Render sẽ xóa sạch toàn bộ file lưu trữ tạm thời trên máy chủ cũ của nó, kéo code mới về chạy lại hoàn toàn mới.
5.  Đợi 2-3 phút cho Render báo trạng thái màu xanh lá cây **`Live`** (Đang hoạt động).
6.  Anh mở/tải lại (F5) trang web của mình. Nếu anh **vẫn đăng nhập được tài khoản cũ và các bài viết của các CEO vẫn hiển thị đầy đủ**, đó chính là minh chứng cơ chế tự động kéo dữ liệu dự phòng từ Supabase về lúc khởi động đã hoạt động hoàn hảo 100%!

---

### **Cách 3: Thử nghiệm truy cập bằng tab ẩn danh (Incognito Window)**
Để chắc chắn dữ liệu không bị "ảo" do lưu giữ tạm thời trong trình duyệt:
1.  Anh mở tab trình duyệt khác dạng **Cửa sổ ẩn danh mới** (Incognito window / Private window) hoặc dùng một điện thoại/máy tính khác truy cập trực tiếp vào link website của anh.
2.  Nếu mọi dữ liệu hiển thị đồng bộ đầy đủ và thông suốt, thì dữ liệu của anh đã được toàn cầu hóa, lưu trực tiếp trên Cloud Server của Supabase rồi!

---

Chúc anh Đức thao tác thật trơn tru bằng chuột và sở hữu một trang web CEO Matching miễn phí vĩnh viễn và không bao giờ bị mất dữ liệu nữa! Thao tác có tâm từ những chi tiết nhỏ nhất ạ!
