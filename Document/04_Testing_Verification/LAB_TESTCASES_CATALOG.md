# Danh Mục Các Bộ Testcases Chấm Bài Tự Động (Lab Testcases Specification Catalog)

**Ngày**: 2026-06-01  
**Trạng thái**: Tài liệu chính thức  
**Tập trung vào**: Liệt kê chi tiết toàn bộ các cặp dữ liệu **Input (Đầu vào) / Expected Output (Đầu ra kỳ vọng)** và Chiến lược chấm điểm tương ứng của **17 bài Lab** hiện có trên hệ thống Cloud Lab.

---

## 🏛️ 1. Các Bài Lab Khoa Công Nghệ Phần Mềm (Môn CTDL & Giải Thuật)

Các bài lab này chạy trên môi trường **Monaco Code Runner (`python_basic`)** cô lập. Dữ liệu được đưa vào qua Stdin và đối chiếu kết quả đầu ra Stdout bằng thuật toán **So khớp chính xác từng ký tự (`stdin_stdout_exact`)**.

### 1.1 Sum Two Numbers (`sum_two_numbers`)
*   **Chiến lược**: So khớp Stdin/Stdout
*   **Testcase 1**:
    *   *Input*: `1 2`
    *   *Expected Output*: `3`
*   **Testcase 2**:
    *   *Input*: `5 7`
    *   *Expected Output*: `12`

### 1.2 Thu Gọn Dãy Số (`problem_array_reduction`)
*   **Chiến lược**: So khớp Stdin/Stdout
*   **Testcase 1**:
    *   *Input*:
        ```text
        5
        2 3 4 5 6
        ```
    *   *Expected Output*: `5`
*   **Testcase 2**:
    *   *Input*:
        ```text
        10
        1 5 5 8 6 4 3 5 9 3
        ```
    *   *Expected Output*: `2`

### 1.3 Max Triple (`max_triple`)
*   **Mô tả**: Tìm 3 số nguyên tố trong mảng có tích lớn nhất.
*   **Testcase 1**:
    *   *Input*:
        ```text
        6
        10 3 5 6 20 -10
        ```
    *   *Expected Output*: `1200`
*   **Testcase 2**:
    *   *Input*:
        ```text
        4
        -10 -10 5 2
        ```
    *   *Expected Output*: `200`

### 1.4 Xoay Mảng (`xoay_mang`)
*   **Mô tả**: Dịch chuyển mảng A bên phải K phần tử.
*   **Testcase 1**:
    *   *Input*:
        ```text
        2
        5 2
        1 2 3 4 5
        4 3
        1 2 3 4
        ```
    *   *Expected Output*:
        ```text
        4 5 1 2 3
        2 3 4 1
        ```

### 1.5 Con Số Duyên Nợ (`con_so_duyen_no`)
*   **Mô tả**: Kiểm tra xem chữ số đầu và cuối của số lớn N có thỏa mãn tính chất duyên nợ.
*   **Testcase 1**:
    *   *Input*:
        ```text
        2
        12345
        123451
        ```
    *   *Expected Output*:
        ```text
        NO
        YES
        ```
*   **Testcase 2**:
    *   *Input*:
        ```text
        3
        7
        88
        909
        ```
    *   *Expected Output*:
        ```text
        YES
        YES
        YES
        ```

### 1.6 Lãi Suất Ngân Hàng (`lai_suat_ngan_hang`)
*   **Mô tả**: Tính số năm tối thiểu để tiền gửi N (lãi kép X%) đạt mức M.
*   **Testcase 1**:
    *   *Input*:
        ```text
        2
        200.00 6.5 300
        500 4 1000.00
        ```
    *   *Expected Output*:
        ```text
        7
        18
        ```
*   **Testcase 2**:
    *   *Input*: `1\n1000 5 1500`
    *   *Expected Output*: `9`

### 1.7 Dãy Số Hamming (`day_so_hamming`)
*   **Mô tả**: Kiểm tra số N có thuộc dãy Hamming (chỉ chứa ước nguyên tố 2, 3, 5).
*   **Testcase 1**:
    *   *Input*: `11\n1\n2\n6\n7\n8\n9\n10\n11\n12\n13\n14`
    *   *Expected Output*: `1\n2\n6\nNot in sequence\n7\n8\n9\nNot in sequence\n10\nNot in sequence\nNot in sequence`
*   **Testcase 2**:
    *   *Input*: `3\n80\n81\n82`
    *   *Expected Output*: `30\n31\nNot in sequence`

### 1.8 Liệt Kê Cặp Số Nguyên Tố Cùng Nhau (`liet_ke_cap_so_nguyen_to_cung_nhau`)
*   **Testcase 1**:
    *   *Input*: `5\n3 7 9 6 13`
    *   *Expected Output*: `3 7\n3 13\n6 7\n6 13\n7 9\n7 13\n9 13`
*   **Testcase 2**:
    *   *Input*: `4\n5 10 15 7`
    *   *Expected Output*: `5 7\n7 10\n7 15`

### 1.9 Tính Toán Lượng Mưa (`tinh_toan_luong_mua`)
*   **Testcase 1**:
    *   *Input*:
        ```text
        3
        Dong Anh
        07:30
        08:00
        60
        Cau Giay
        07:45
        08:12
        50
        Soc Son
        08:00
        09:15
        78
        ```
    *   *Expected Output*:
        ```text
        T01 Dong Anh 120.00
        T02 Cau Giay 111.11
        T03 Soc Son 62.40
        ```

---

## 🛡️ 2. Các Bài Lab Khoa An Toàn Thông Tin (Môn Mật Mã & An Ninh Mạng)

Các bài lab này chạy trên môi trường sandbox đa dạng hơn, bao gồm dòng lệnh Linux (`security_shell`) và Container Wine tương tác (`malware-env`).

### 2.1 Identifying SSH Port (`lab_nmap_ssh`)
*   **Chiến lược**: So khớp Stdin/Stdout
*   *Input*: `172.25.0.2`
*   *Expected Output*: `Port 2005 is OPEN`

### 2.2 HMAC-SHA256 Calculation (`lab_hmac_hash`)
*   **Chiến lược**: So khớp Stdin/Stdout
*   *Input*:
    ```text
    hello
    secret
    ```
*   *Expected Output*: `8a32a6ee33431ba207ad34063f25c83fa99042b4b45500d0246a2a5efc3545b7`

### 2.3 Task 1 — Generate Hash (`lab_gen_hash`)
*   **Chiến lược**: So khớp Stdin/Stdout (Khảo sát hash MD5, SHA1, SHA256)
*   *Input*: `secretmessage`
*   *Expected Output*:
    ```json
    {"md5": "70d2bda0a80e0524458f3319082531a8", "sha1": "713afaa8cf15cf01542f7c040d7c7afbe1a4cf13", "sha256": "4fd414c1ff065b7e8d75cf82db141cc1df75e1176b6a6c221e847c10b754117b"}
    ```

### 2.4 Task 2 — HMAC via OpenSSL CLI (`lab_openssl_hmac`)
*   **Chiến lược**: So khớp Stdin/Stdout qua binary OpenSSL.
*   *Input*: `mysecuremessage`
*   *Expected Output*: `SHA256(stdin)= a110c74900aef484d7a8d56b0bc5ce6db39294e773cf29e92594685ffcb64c7a`

### 2.5 Task 3 — Avalanche Effect (`lab_avalanche`)
*   **Chiến lược**: Tính toán độ lệch bit của SHA256 khi thay đổi 1 ký tự đầu vào.
*   *Input*:
    ```text
    hello
    hellp
    ```
*   *Expected Output*: `PASS` (Độ lệch vượt quá 32 bit).

### 2.6 Task 4 — Simple Brute-force (`lab_bruteforce_mock`)
*   **Chiến lược**: Khảo sát băm đảo, tìm ra số gốc từ tiền tố băm.
*   *Input*: `5feceb`
*   *Expected Output*: `0` (Vì SHA256('0') bắt đầu bằng `5feceb`).

### 2.7 Dynamic Analysis of Winlocker (`lab_winlocker_analysis`)
*   **Chiến lược**: **Kiểm tra hành vi (Behavioral auto-grading)**.
*   *Thực thi*: Chạy mã độc Wine `WinlockerVB6Blacksod.exe` dưới sự theo dõi của `strace` và `tcpdump`.
*   *Expected Output*:
    ```text
    ENCRYPTED_FILE: C:\users\public\encrypted_data.txt
    C2_IP: 172.25.0.100
    ```

### 2.8 Network Scanning with Labtainer (`lab_labtainer_nmap`)
*   **Chiến lược**: **NPS Labtainer Core Engine grading (`stoplab` + `gradelab`)**.
*   *Thao tác*: Quét mạng, xâm nhập hệ thống Target qua Web Terminal.
*   *Expected Report Criteria (Từ .report)*:
    *   `nmap_scan`: Đạt (`True`)
    *   `identify_ssh`: Đạt (`True`)
    *   `firewall_rules`: Đạt (`True`)
