# Hướng Dẫn Từng Bước Chạy Dự Án Bằng Docker Trên CentOS 7 + DirectAdmin

Chào anh Đức, tài liệu này hướng dẫn chi tiết cách vận hành dự án trên máy chủ VPS CentOS 7 đang chạy DirectAdmin của anh mà **KHÔNG** làm ảnh hưởng đến các website PHP hiện tại, khắc phục hoàn toàn lỗi thư viện `GLIBC` và đảm bảo **DỮ LIỆU ĐƯỢC LƯU TRỮ VĨNH VIỄN**.

---

## 1. Tại Sao Lại Có Các Lỗi Trên?

*   **Lỗi cập nhật Profile bị mất sau vài tiếng trên Cloud Run (Google Cloud):**
    Ứng dụng của anh chạy trên Cloud Run sử dụng file database cục bộ là `database_store.json`. Cloud Run là môi trường **Serverless dạng Ephemeral (ngắn hạn)**. Cứ sau vài mươi phút/vài tiếng không hoạt động hoặc khi Google khởi tạo lại container, toàn bộ thiết kế đĩa cục bộ sẽ được reset sạch sẽ về ban đầu. Nghĩa là file `database_store.json` bị phục hồi về mặc định và mất toàn bộ profile anh đã lưu.
*   **Lỗi thư viện `GLIBC` trên CentOS 7:**
    CentOS 7 sử dụng bộ nhân hệ thống cũ với thư viện `glibc` phiên bản 2.17. Các bản NodeJS v18, v20, v22... hiện nay đều yêu cầu thư viện tối thiểu là `glibc 2.28`. Đó là lý do khi chạy trực tiếp `node -v` anh nhận được hàng loạt cảnh báo thiếu thư viện.
*   **DirectAdmin không support chạy chung Node.js:**
    Thực chất là DirectAdmin (phần giao diện quản lý web) chủ yếu hỗ trợ PHP/Apache. Các kỹ thuật viên VPS thường từ chối cài thủ công vì cấu hình ngược (Reverse Proxy) và quản lý tiến trình nền Node.js rất rắc rối, dễ xung đột cổng nếu làm thủ công.

---

## 2. Giải Pháp Hoàn Hảo: Chạy Bằng Docker Trực Tiếp Trên VPS

**Docker** như một chiếc hộp chứa độc lập. Bên trong chiếc hộp đó, chúng ta chạy hệ điều hành siêu nhẹ Alpine Linux mã nguồn hiện đại hỗ trợ đầy đủ `GLIBC` và NodeJS v20. Khi chạy dự án trong Docker:
1.  **Không bị xung đột hệ thống:** CentOS 7 cứ chạy CentOS 7, DirectAdmin cứ chạy DirectAdmin, ứng dụng NodeJS chạy biệt lập trong Docker container.
2.  **Khắc phục lỗi GLIBC triệt để:** Không cần nâng cấp hệ điều hành CentOS 7 tốn kém và nguy cơ hỏng giấy phép DirectAdmin.
3.  **Lưu trữ dữ liệu vĩnh viễn:** Nhờ tính năng Mount Volumes (gán tệp), file `database_store.json` sẽ được lưu trực tiếp trên ổ cứng thật của VPS của anh. Khi ứng dụng khởi động lại hoặc nâng cấp, dữ liệu **vĩnh viễn không bao giờ bị mất**.

---

## 3. Các Bước Cài Đặt Chi Tiết Trên VPS CentOS 7

Anh mở Terminal trên máy tính của anh, login vào VPS qua SSH (như hình anh vừa gõ thành công) và chạy tuần tự các lệnh sau:

### Bước 3.1: Cài đặt Docker trên CentOS 7
Chạy các dòng lệnh sau để cấu hình kho tải và cài Docker chính thức:

```bash
# Cập nhật hệ thống công cụ gói
yum update -y

# Cài đặt các thư viện hỗ trợ
yum install -y yum-utils device-mapper-persistent-data lvm2

# Thêm kho tải Docker chính hãng
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Cài đặt Docker Engine
yum install -y docker-ce docker-ce-cli containerd.io

# Khởi chạy dịch vụ Docker và cấu hình tự bật khi khởi động lại VPS
systemctl start docker
systemctl enable docker
```

Anh kiểm tra xem Docker hoạt động chưa bằng lệnh:
```bash
docker --version
```
(Nếu hiển thị ra version Docker là thành công!).

---

### Bước 3.2: Cấu hình và sử dụng Docker Compose V2
Trên các VPS CentOS / DirectAdmin hiện đại, Docker Compose đã được tích hợp sẵn làm một phần của CLI (Docker Plugin). 

Mệnh lệnh chuẩn để vận hành Docker Compose hiện nay là dùng **khoảng trắng**: **`docker compose`** chứ không phải dùng dấu gạch ngang (`docker-compose`).

Nếu anh gõ thử lệnh dưới đây và nhận được thông tin phiên bản, nghĩa là VPS của anh đã có sẵn:
```bash
docker compose version
```

*(Nếu hệ thống báo thiếu hoặc không tìm thấy lệnh, anh có thể chạy lệnh để liên kết hoặc tải bổ sung):*
```bash
# Tạo liên kết tượng trưng (symlink) để hỗ trợ cả lệnh cũ nếu cần
ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/bin/docker-compose
```

---

### Bước 3.3: Tải mã nguồn dự án về VPS
Anh nén (ZIP) toàn bộ thư mục dự án đang phát triển này (bằng cách xuất ZIP trong Menu của AI Studio hoặc tải trực tiếp về máy), sau đó tải lên một thư mục trên VPS của anh (ví dụ `/home/ceo-matching`).
* *Gợi ý:* Anh cũng có thể tạo thư mục trống trên VPS và đẩy code qua FTP/SFTP.

Thư mục `/home/ceo-matching` tối thiểu phải bao gồm:
* `Dockerfile` 
* `docker-compose.yml` 
* `package.json`
* `server.ts`
* `vite.config.ts`
* Thư mục `src/`, `assets/`,...
* File dữ liệu dự án: `database_store.json`

---

### Bước 3.4: Khởi chạy dự án bằng Docker Compose

Tại thư mục chứa dự án trên VPS (`/home/ceo-matching`), anh chỉ cần gõ đúng 1 lệnh duy nhất này để build và khởi chạy ứng dụng (sử dụng **không có** dấu gạch ngang):

```bash
docker compose up -d --build
```

**Lệnh này sẽ tự động:**
1. Tải môi trường Node 20 Linux Alpine an toàn tương thích GLIBC.
2. Cấu hình cài đặt các gói dependencies cần thiết.
3. Chạy lệnh xây dựng giao diện tĩnh cho dự án.
4. Khởi chạy máy chủ Node/Express chạy cổng `3000` nội bộ độc lập, khép kín trong Docker container.

---

## 4. HƯỚNG DẪN CỨU HỘ KHẨN CẤP & CẤU HÌNH REVERSE PROXY CHUẨN

> [!WARNING]
> **CỨU HỘ KHẨN CẤP: Cách đưa toàn bộ các website cũ hoạt động bình thường trở lại (Cứu lỗi 500 / Internal Server Error)**
> 
> Nếu sau khi dán một mã bất kỳ vào DirectAdmin và bấm áp dụng cấu hình mà các website khác của anh trên máy chủ (như `vietbirdsnest.com`) gặp lỗi **"Internal Server Error" (500)** hoặc bị đơ không truy cập được, điều đó có nghĩa là **MÁY CHỦ WEB (APACHE / PHP-FPM) GẶP LỖI CÚ PHÁP VÀ ĐANG BỊ CRASH**.
> 
> Anh hãy bình tĩnh làm theo đúng **3 bước dọn dẹp sạch sẽ dưới đây** bằng chuột, toàn bộ hệ thống website cũ của anh sẽ tự động sống lại ngay lập tức!

### BƯỚC 1: Tìm ô Tìm kiếm trên trang quản trị DirectAdmin
1. Anh nhìn lên **góc trên cùng của trang DirectAdmin** bất kỳ, click chuột vào ô tìm kiếm dài có chứa dòng chữ: **`Please enter your search criteria`** (hoặc ô Search).
2. Nhập chính xác chữ: **`HTTPD`**.
3. Danh sách tìm kiếm sẽ xổ xuống, anh nhấp chuột trực tiếp chọn vào dòng: **`Custom HTTPD Configurations`** (Cấu hình HTTPD tùy chỉnh). Giao diện này chứa cấu hình của toàn bộ các tên miền trên VPS.

### BƯỚC 2: Xóa sạch cấu hình lỗi đã dán của tên miền `ceomatching.com`
Tại trang cấu hình tùy biến:
1. Tìm dòng có tên miền **`ceomatching.com`** và click chọn trực tiếp vào liên kết chữ **`httpd.conf`** thẳng hàng với nó.
2. Giao diện tùy chỉnh `httpd.conf` cho `ceomatching.com` hiện ra. Anh vui lòng **XÓA KHÔI PHỤC HOÀN TOÀN TRỐNG TRƠN** (không để lại bất kỳ ký tự nào, kể cả dấu cách hay dòng trống) trong tất cả các ô nhập văn bản:
   * **`CUSTOM1`**
   * **`CUSTOM2`**
   * **`CUSTOM3`**
   * **`CUSTOM4`**
3. Cuộn trang web xuống **tuốt bên dưới cùng** (dưới cả ô nhập `CUSTOM4`), anh sẽ thấy nút **`Save` (Lưu)** màu xanh xuất hiện.
4. **Nhấp chuột vào nút `Save`** này để xác nhận trả cấu hình tên miền `ceomatching.com` về trạng thái mặc định sạch sẽ 100%.

### BƯỚC 3: Dọn dẹp cả ô cấu hình PHP-FPM (Nếu lỡ dán nhầm vào đó)
Cũng tại trang dịch vụ tùy chỉnh cho `ceomatching.com` này (hoặc quay lại trang Custom HTTPD):
1. Bên cạnh tab `httpd.conf`, anh click chọn vào tab có chữ **`php-fpm`** (hoặc tab cấu hình PHP).
2. Kiểm tra xem trong các ô nhập của trang php-fpm có chứa bất kỳ dòng mã nào hay không (đặc biệt là các dòng `Proxy...`, `ProxyPass`, ...).
3. **Xóa sạch sẽ hoàn toàn trống trơn toàn bộ các ô đó**.
4. Cuộn chuột xuống dưới cùng trang và click nút **`Save` (Lưu)**.

### BƯỚC 4: Kích hoạt biên dịch lại cấu hình sạch để hồi sinh máy chủ
1. Sau khi đã bấm **`Save`** dọn dẹp sạch cả 2 trang `httpd.conf` và `php-fpm` về rỗng hoàn toàn.
2. Anh cuộn màn hình lên trên cùng và nhìn sang góc phía trên bên phải.
3. Nhấp chuột vào nút màu xanh lam nổi bật ghi chữ **`DA BUILD REWRITE_CONFS`** (như trong ảnh DirectAdmin anh đã chụp).
4. **CHỜ 1 PHÚT:** DirectAdmin sẽ tự động dọn dẹp các mã lỗi, cấu hình lại hệ thống Apache trơn tru và khởi tạo lại PHP-FPM sạch sẽ.
5. **KIỂM TRA:** Mở một thẻ (tab) trình duyệt mới và truy cập thử trang `vietbirdsnest.com` (hoặc các web khác của anh). **Tất cả các web sẽ khôi phục chạy bình thường 100% ngay lập tức!**

---

## 5. HƯỚNG DẪN CẤU HÌNH REVERSE PROXY AN TOÀN TRÊN DIRECTADMIN

Sau khi hệ thống VPS đã được cứu sống hoạt động trơn tru toàn bộ, dưới đây là lý do tại sao Proxy bị lỗi và cách để anh đưa ứng dụng của mình chạy qua tên miền `ceomatching.com` một cách an toàn nhất:

### Tại sao khi thêm ProxyPass lại bị sập web?
Mặc định trên một số máy chủ DirectAdmin chạy Apache, **module Proxy (mod_proxy)** chưa được kích hoạt hoặc cấu hình cổng nội bộ chưa được cho phép. Khi anh dán lệnh `ProxyPass` trực tiếp vào `httpd.conf` của một tên miền cá nhân, Apache khi khởi động lại sẽ kiểm tra cú pháp (syntax check). Vì module chưa sẵn sàng, Apache sẽ báo lỗi cú pháp và dừng hoạt động (crash) toàn cục, kéo theo toàn bộ các website khác bị lỗi 500 hay Service Unavailable theo.

### Cách đưa ứng dụng Node.js Docker lên tên miền `ceomatching.com` chuẩn nhất:

Nếu anh không muốn động vào cấu hình sâu của VirtualHost Apache có thể gây lỗi hệ thống, anh hãy thực hiện theo cách **an toàn nhất 100% không bao giờ ảnh hưởng đến VPS**:

### Bước 4.1: Cài đặt chứng chỉ SSL miễn phí (HTTPS) - Hướng dẫn chi tiết tìm trên DirectAdmin

Để tìm khu vực cài đặt SSL cấp tốc cho tên miền `ceomatching.com`, anh làm theo các cách sau cực kỳ nhanh:

1. **Cách 1 - Dùng ô tìm kiếm (Nhanh nhất):**
   - Anh nhìn lên góc phía trên cùng của trang quản trị DirectAdmin, click chuột vào ô tìm kiếm **"Please enter your search criteria"** (như trong ảnh thứ nhất anh vừa gửi).
   - Anh chỉ cần gõ đúng chữ **`SSL`** vào đó, hệ thống sẽ hiện ra ngay dòng **`SSL Certificates`**. Anh hãy nhấp chuột chọn nó.

2. **Cách 2 - Vào từ Menu quản lý:**
   - Hoặc anh quay lại trang chính của tài khoản (giao diện User Level).
   - Tìm đến phân mục hàng đầu có tên là **`Account Manager`** (hoặc Quản lý tài khoản nếu dùng Tiếng Việt).
   - Anh sẽ thấy ngay biểu tượng chìa khóa vàng có tên là **`SSL Certificates`** (Chứng chỉ SSL). Click chọn nó.

3. **Các thao tác cấu hình sau khi vào trang SSL Certificates:**
   - Khi giao diện hiện ra, anh chọn tab **`Let's Encrypt`** (mục cấp chứng chỉ SSL miễn phí tốt nhất toàn cầu).
   - Tích chọn tên miền **`ceomatching.com`** và các bí danh như `www.ceomatching.com` nếu có.
   - Nhập email quản trị của anh vào ô thông tin (nếu hệ thống yêu cầu).
   - Cuộn màn hình xuống phía dưới cùng, nhấp nút **`Save` (Lưu)**. Hệ thống sẽ tự động xác thực tên miền của anh và cấp phát HTTPS màu xanh lá cây cực kỳ uy tín bảo mật!

---

## 5. Khắc Phục Lỗi Xung Đột Giữa CSF Firewall Và Docker (Connection reset by peer)

Trên các máy chủ DirectAdmin sử dụng tường lửa **CSF (ConfigServer Security & Firewall)**, tường lửa này khi khởi động lại hoặc chạy định kỳ sẽ thực hiện lệnh xóa sạch (flush) các cấu hình dẫn tuyến (iptables rules) của hệ thống. Điều này làm mất các chuỗi rules của Docker, dẫn đến lỗi **`Connection reset by peer`** hoặc **`Connection refused`** khi anh gọi API hoặc truy cập cổng `3000`.

Để khắc phục triệt để lỗi này, anh cần cấu hình cho CSF bỏ qua (skip) card mạng ảo của Docker và khởi động lại dịch vụ theo các bước sau:

### Bước 5.1: Cấu hình CSF bỏ qua các kết nối nội bộ của Docker
Anh chạy lệnh dưới đây sử dụng công cụ `sed` (sửa lại lỗi gõ lệnh `ed` trước đó của anh) để thêm các interface `docker0` và `veth+` vào cấu hình bỏ qua lọc của tường lửa trong file `/etc/csf/csf.conf`:

```bash
# Thêm cấu hình thiết bị mạng bỏ qua lọc
sed -i 's/ETH_DEVICE_SKIP = ""/ETH_DEVICE_SKIP = "docker0,veth+"/' /etc/csf/csf.conf
```

> *Lưu ý:* Nếu trong file `/etc/csf/csf.conf` của anh mục `ETH_DEVICE_SKIP` đã có các thiết bị mạng khác rồi, anh có thể mở file trực tiếp bằng lệnh `nano /etc/csf/csf.conf` và tìm đến dòng `ETH_DEVICE_SKIP` để viết thêm `,docker0,veth+` vào phía cuối giá trị cũ.

### Bước 5.2: Khởi động lại CSF Firewall để áp dụng
Anh chạy lệnh sau để tường lửa nạp lại cấu hình mới:

```bash
csf -r
```

### Bước 5.3: Khởi động lại dịch vụ Docker để tạo lại các quy tắc Iptables
Đây là bước **CỰC KỲ QUAN TRỌNG**. Vì CSF vừa nạp lại đã flush sạch iptables, anh cần bắt buộc khởi động lại Docker để tiến trình Docker tái tạo lại các chuỗi NAT, FORWARD và PORT rules:

```bash
systemctl restart docker
```

### Bước 5.4: Vào thư mục dự án và chạy lại container
Anh di chuyển vào thư mục dự án và khởi chạy lại container để mọi luồng cấu hình mạng đồng bộ trở lại (lưu ý dùng lệnh `docker compose` có dấu cách):

```bash
cd /home/ceo-matching
docker compose down
docker compose up -d --build
```

### Bước 5.5: Kiểm tra lại kết nối bằng curl
Cuối cùng, anh chạy thử lệnh kiểm tra:

```bash
curl http://127.0.0.1:3000
```

Nếu anh vẫn nhận được lỗi **`Connection reset by peer`**, hãy làm tiếp các bước chẩn đoán và khắc phục nâng cao dưới đây:

---

## 6. Chẩn Đoán Lỗi Nâng Cao & Khắc Phục Triệt Để

Lỗi **`Connection reset by peer`** thường có hai nguyên nhân phổ biến nhất:
1. **Container bị Crash liên tục ngay khi khởi động** (Do lỗi cú pháp hoặc thư mục mount lỗi).
2. **Cấu hình chặn Forwarding trong Iptables của CSF Firewall** (Tường lửa chặn luồng gói tin đi từ card ngoài vào card ảo Docker).

Dưới đây là các bước để tìm ra nguyên nhân và xử lý ngay lập tức:

### Bước 6.1: Kiểm tra xem container có đang Chạy thực tế hay đã bị Reset/Exit
Anh chạy lệnh này để xem danh sách tiến trình Docker hiện tại:
```bash
docker ps -a
```
- Nếu cột **STATUS** ghi dạng `Up ... seconds` hoặc `Up ... hours` -> Container đang chạy tốt, nguyên nhân là do tường lửa **CSF chặn**.
- Nếu cột **STATUS** ghi dạng `Exited (1) ...` hoặc `Restarting (...)` -> Container đang bị crash liên tục. Hãy chuyển sang **Bước 6.2**.

---

### Bước 6.2: Cách xử lý khi Container bị Crash (Status: Exited hoặc Restarting)
Hãy xem log lỗi của Node.js để biết nguyên nhân crash bằng lệnh:
```bash
docker logs ceo-matching-app
```

**⚠️ Thường gặp nhất (Lỗi Mount nhầm Thư mục database_store.json):**
Khi chạy lệnh `docker compose up -d` lần đầu, nếu trên VPS **chưa có sẵn** file trắng `database_store.json`, Docker Engine sẽ tự động tạo một **thư mục** (Folder) tên là `database_store.json` trên host để mount vào container. Khi chạy, Node.js cố gắng đọc file JSON này nhưng phát hiện nó là một thư mục, dẫn đến lỗi crash:
`Error: EISDIR: illegal operation on a directory, read ... database_store.json`

**Cách sửa cực nhanh:**
```bash
# 1. Dừng container và xóa thư mục rác bị tạo làm file
cd /home/ceo-matching
docker compose down
rm -rf database_store.json

# 2. Tạo một file trống thực sự thay vì thư mục
touch database_store.json
echo '{"users": [], "fieldPermissions": [], "posts": [], "events": [], "eventRegistrations": [], "matches": [], "menus": []}' > database_store.json

# 3. Chạy lại container
docker compose up -d --build
```

---

### Bước 6.3: Cách xử lý khi CSF Firewall chặn luồng kết nối Docker
Nếu kết quả ở Bước 6.1 cho thấy container vẫn `Up` tốt nhưng không gọi được `curl`, anh hãy chạy thử lệnh **tạm thời tắt hoàn toàn tường lửa** để kiểm tra:
```bash
# Tạm thời vô hiệu hóa tường lửa CSF
csf -x
```

Sau khi chạy lệnh trên, anh chạy lại lệnh:
```bash
curl http://127.0.0.1:3000
```
- **Trường hợp A:** Nếu chạy `curl` thấy phản hồi thành công (trả ra đoạn mã HTML của ứng dụng) -> Chắc chắn 100% **do CSF đã chặn quy tắc Forward**. Anh hãy bật lại CSF bằng lệnh `csf -e` và xem cấu hình tự động sửa lỗi ở **Bước 6.4**.
- **Trường hợp B:** Nếu vẫn bị `Connection reset` mặc dù CSF đã tắt -> Vấn đề nằm sâu trong tệp Node code hoặc cổng nội bộ Docker chưa bind ra `0.0.0.0` (Tuy nhiên trong source code server.ts chúng tôi đã khuyên mặc định bind vào `0.0.0.0` nên trường hợp này cực kỳ hiếm gặp).

---

### Bước 6.4: Tự động khai báo chuỗi quy tắc Docker vào tiền-khởi-động CSF (Permanent Fix)
Để ngăn CSF xóa sạch chuỗi định tuyến iptables của Docker mỗi lần khởi động lại firewall, anh có thể ghi đè quy tắc cho phép luồng gói tin của Docker chạy tự do trước lúc CSF nạp chính sách chặn.

Thay vì dùng trình soạn thảo `nano` dễ bị bỡ ngỡ giao diện, anh hãy **sử dụng thẳng lệnh này** để tự động tạo và ghi nội dung vào file `/etc/csf/csfpre.sh` chỉ với một cú click chuột (Lưu ý copy trọn vẹn cả từ `cat` cho tới hết chữ `EOF` ở dòng cuối cùng):

```bash
cat << 'EOF' > /etc/csf/csfpre.sh
#!/bin/bash
# Cho phép lưu lượng định tuyến tự do qua cầu nối ảo docker0
iptables -A FORWARD -i docker0 -o eth0 -j ACCEPT
iptables -A FORWARD -i eth0 -o docker0 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i docker0 -o docker0 -j ACCEPT
EOF
```

Khi lệnh trên đã chạy xong và terminal quay về dấu nhắc mặc định `[root@directadmin ~]#`, anh chạy tiếp lệnh cấp quyền thực thi cho file vừa tạo:
```bash
chmod +x /etc/csf/csfpre.sh
```

*(Lưu ý: Nếu cạc mạng ngoài của VPS của anh không phải là `eth0` (ví dụ `ens192`, `ens3` hay `vnet0`), anh có thể kiểm tra cạc mạng thật bằng lệnh `ip route` hoặc thay thế tên cạc mạng cho chuẩn xác.)*

Sau đó, anh chạy lệnh khởi động lại CSF và Docker để áp dụng quy tắc mới:

```bash
# Khởi động lại CSF firewall để nạp rule
csf -r

# Khởi động lại Docker để tự động liên kết với CSF
systemctl restart docker
```

*Lưu ý quan trọng:* Vì anh đang ở bước thiết lập kết nối ban đầu và **chưa đưa mã nguồn ứng dụng lên thư mục `/home/ceo-matching`**, anh **CHƯA CẦN** chạy các lệnh di chuyển thư mục hay chạy docker-compose. Khi nào anh đã tải code lên thư mục dự án đầy đủ, anh mới chạy các lệnh dưới đây:

```bash
# Chờ khi đưa code ứng dụng lên rồi mới chạy phần này:
cd /home/ceo-matching
docker compose down && docker compose up -d
```

Lúc này, toàn bộ hệ thống của anh sẽ chạy mượt mà bền bỉ vĩnh viễn không lo tường lửa chặn đứng luồng mạng nữa! Chúc anh Đức áp dụng thành công rực rỡ!

---

## 7. Cứu Hộ Khi Bị Chặn Kết Nối SSH (Treo Terminal / Connection Timed Out)

Khi chạy các lệnh liên quan đến tường lửa (ví dụ `csf -r`) hoặc sửa file cấu hình mạng hệ thống, tường lửa **CSF** có thể hiểu lầm và chặn địa chỉ IP hiện tại của anh hoặc chặn cổng SSH (mặc định là cổng `22`). Điều này dẫn đến hiện tượng **kết nối SSH (như qua PowerShell, PuTTY, MobaXterm...) bị treo cứng dầm dề không phản hồi** hoặc báo lỗi `Connection timed out`.

Anh **hoàn toàn yên tâm**, VPS của anh không hề bị hỏng hay bị treo hệ điều hành, đây chỉ là cơ chế bảo vệ của tường lửa chặn kết nối IP của anh mà thôi. Vì anh đang mở sẵn giao diện quản trị **DirectAdmin** với quyền **Admin** cao nhất, anh có tới 2 cách cực kỳ nhanh chóng để vượt qua cổng chặn này bằng chuột:

---

### CÁCH 1: TẮT HOẶC GỠ CHẶN BẰNG CLICK CHUỘT TRÊN DIRECTADMIN (KHUYÊN DÙNG - DỄ NHẤT)

Do DirectAdmin được cài đặt trực tiếp trên VPS và giao tiếp qua cổng Web (`2222` hoặc cổng riêng của anh), nó không bị tường lửa CSF chặn kết nối điều khiển này. Anh làm như sau:

#### Hướng đi 1.1: Sử dụng công cụ "ConfigServer Security & Firewall" trên giao diện (Nếu đã cài plugin)
1. Ở màn hình trang chủ DirectAdmin của anh, nhấp vào danh mục **`Extra Features`** (Tính năng bổ sung).
2. Tìm và nhấp vào biểu tượng hoặc dòng chữ **`ConfigServer Security & Firewall`** (hoặc viết tắt là **`CSF`**).
3. **Tại màn hình DirectAdmin anh vừa gửi ảnh chụp:** Anh hãy **CLICK CHUỘT THẲNG VÀO CÁI HỘP màu trắng có hình bức tường lửa gạch đỏ** (ở chỗ có ghi chữ *`ConfigServer Security & Firewall - csf v14.24`*). Cái hộp đó chính là một nút liên kết (Link).
4. Ngay sau khi click vào cái hộp gạch đỏ đó, giao diện chi tiết CSF sẽ hiện ra:
   - **Để tắt hẳn Tường lửa chặn:** Anh cuộn xuống tìm và nhấp chọn nút **`Firewall Disable`** (Tắt Tường lửa) -> Toàn bộ quy tắc chặn được gỡ bỏ ngay lập tức!
   - **Để gỡ chặn IP của anh:** Tìm ô **`Quick Unblock`** (Gỡ chặn nhanh), nhập địa chỉ IP hiện tại của anh vào (IP của anh được xem tại trang `https://checkip.danatools.com`) rồi bấm nút **`Quick Unblock`** bên cạnh là xong!

#### Hướng đi 1.2: Dừng dịch vụ Tường lửa qua "Service Monitor" (Nếu không thấy mục CSF ở trên)
1. Trên màn hình trang chủ DirectAdmin, nhấp chọn mục **`Admin Tools`** (Công cụ quản trị).
2. Nhấp chọn mục **`Service Monitor`** (Giám sát dịch vụ).
3. Trong danh sách các dịch vụ đang chạy trên VPS, anh tìm dòng có tên là **`iptables`** hoặc **`csf`**.
4. Nhấp vào nút **`Stop`** (hoặc dấu dừng) ngay bên cạnh dịch vụ đó.
5. Ngay lập tức tường lửa bị hạ xuống, anh hãy thử gõ lại lệnh SSH trên PowerShell của máy tính, kết nối sẽ thông suốt ngay!

---

### CÁCH 2: TRUY CẬP VPS QUA WEB VNC CONSOLE (CỨU HỘ VẬT LÝ)

Nếu VPS mất hoàn toàn kết nối mạng hoặc không vào được DirectAdmin, anh mới cần dùng đến cách này:

1. Đăng nhập vào trang quản trị dịch vụ VPS của anh (Ví dụ: AzDigi, Vietnix, TinoHost, Hostinger...).
2. Vào phần quản lý chiếc VPS `103.63.215.57` đang dùng.
3. Tìm và nhấp vào nút **VNC** hoặc **Console** (thường nằm ở góc điều khiển khởi động/tắt máy).
4. Một cửa sổ đen hiện ra, anh gõ phím `Enter` để màn hình hiện dòng nhập tài khoản.
5. Đăng nhập với thông tin:
   - **login:** `root`
   - **Password:** Nhập mật khẩu Linux của anh (Lưu ý: Mật khẩu Linux khi nhập **sẽ không hiển thị bất kỳ dấu sao hay ký tự nào** vì lý do bảo mật, anh cứ gõ chính xác rồi bấm `Enter` là được).

### Bước 7.2: Tắt tạm thời CSF Firewall qua VNC Console
Sau khi đăng nhập thành công vào VNC Console, anh gõ đúng lệnh sau để xóa tức khắc các rule chặn mạng:

```bash
csf -x
```

Hệ thống sẽ báo dòng cảnh báo: `*WARNING* CSF is disabled`. Lúc này màng tường lửa đã được tạm dừng hoạt động hoàn toàn.

### Bước 7.3: Kết nối lại qua PowerShell trên máy tính
1. Anh tắt cửa sổ PowerShell bị treo cũ đi.
2. Mở một cửa sổ PowerShell mới tinh trên Windows.
3. Gõ lệnh kết nối SSH bình thường:
   ```bash
   ssh root@103.63.215.57
   ```
4. Hệ thống sẽ kết nối thành công mượt mà ngay lập tức!

### Bước 7.4: Hướng dẫn Khắc phục & Mở lại Firewall an toàn
Khi đã vào lại được SSH qua PowerShell, anh cần đảm bảo IP của anh không bị CSF chặn nữa và cổng SSH được cho phép trước khi bật lại tường lửa:

```bash
# Bỏ chặn tất cả IP đang bị khóa (nếu IP của anh bị đưa vào blacklist tạm thời)
csf -df

# Cho phép (Whitelist) IP nhà/công ty của anh vĩnh viễn không bao giờ bị chặn:
# (Thay x.x.x.x bằng IP hiện tại của anh, anh có thể vào trang checkip.danatools.com để xem IP của mình)
csf -a x.x.x.x

# Bật lại tường lửa sau khi đã Whitelist thành công:
csf -e
```
