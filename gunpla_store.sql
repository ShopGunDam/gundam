-- ==========================================================
-- DATABASE: GUNPLA STORE SYSTEM (T-SQL Version for SQL Server)
-- CREATE DATE: 2026-05-26
-- ==========================================================

-- 1. Khởi tạo Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'gunpla_store')
BEGIN
    CREATE DATABASE gunpla_store;
END
GO

USE gunpla_store;
GO

-- 2. Bảng Tài khoản (taikhoan)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[taikhoan]') AND type in (N'U'))
BEGIN
    CREATE TABLE taikhoan (
        Username NVARCHAR(50) PRIMARY KEY,
        Password NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) DEFAULT 'User' CHECK (Role IN ('Admin', 'User')),
        NgayTao DATETIME DEFAULT GETDATE()
    );
END
GO

-- 3. Bảng Khách hàng (khachhang)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[khachhang]') AND type in (N'U'))
BEGIN
    CREATE TABLE khachhang (
        MaKH INT IDENTITY(1,1) PRIMARY KEY,
        TenKH NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) UNIQUE,
        SDT NVARCHAR(15),
        DiaChi NVARCHAR(MAX),
        Username NVARCHAR(50),
        CONSTRAINT chk_email_format CHECK (Email LIKE '%@%'),
        FOREIGN KEY (Username) REFERENCES taikhoan(Username) ON DELETE SET NULL
    );
END
GO

-- 4. Bảng Nhà cung cấp (nhacungcap)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[nhacungcap]') AND type in (N'U'))
BEGIN
    CREATE TABLE nhacungcap (
        MaNCC INT IDENTITY(1,1) PRIMARY KEY,
        TenNCC NVARCHAR(255) NOT NULL,
        DiaChi NVARCHAR(255),
        SDT NVARCHAR(20),
        Email NVARCHAR(100)
    );
END
GO

-- 5. Bảng Sản phẩm (sanpham)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sanpham]') AND type in (N'U'))
BEGIN
    CREATE TABLE sanpham (
        MaSP NVARCHAR(20) PRIMARY KEY,
        TenSP NVARCHAR(255) NOT NULL,
        LoaiSP NVARCHAR(50),
        MaNCC INT,
        DonGia DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (DonGia >= 0),
        SoLuong INT DEFAULT 0 CHECK (SoLuong >= 0),
        HinhAnh NVARCHAR(255),
        MoTa NVARCHAR(MAX),
        FOREIGN KEY (MaNCC) REFERENCES nhacungcap(MaNCC)
    );
END
GO

-- 5. Bảng Hóa đơn (hoadon)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[hoadon]') AND type in (N'U'))
BEGIN
    CREATE TABLE hoadon (
        MaHD INT IDENTITY(1,1) PRIMARY KEY,
        NgayLap DATETIME DEFAULT GETDATE(),
        TongTien DECIMAL(15,2) DEFAULT 0,
        MaKH INT,
        TrangThai NVARCHAR(20) DEFAULT 'Pending' CHECK (TrangThai IN ('Pending', 'Paid', 'Shipped', 'Cancelled')),
        FOREIGN KEY (MaKH) REFERENCES khachhang(MaKH) ON DELETE CASCADE
    );
END
GO

-- 6. Bảng Chi tiết hóa đơn (cthoadon)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cthoadon]') AND type in (N'U'))
BEGIN
    CREATE TABLE cthoadon (
        MaHD INT,
        MaSP NVARCHAR(20),
        SoLuong INT NOT NULL CHECK (SoLuong > 0),
        DonGiaBan DECIMAL(15,2) NOT NULL CHECK (DonGiaBan >= 0),
        PRIMARY KEY (MaHD, MaSP),
        FOREIGN KEY (MaHD) REFERENCES hoadon(MaHD) ON DELETE CASCADE,
        FOREIGN KEY (MaSP) REFERENCES sanpham(MaSP)
    );
END
GO

-- 7. Bảng Đánh giá (danhgia)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[danhgia]') AND type in (N'U'))
BEGIN
    CREATE TABLE danhgia (
        MaDG INT IDENTITY(1,1) PRIMARY KEY,
        TenKH NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100),
        ChuDe NVARCHAR(100),
        NoiDung NVARCHAR(MAX) NOT NULL,
        NgayTao DATETIME DEFAULT GETDATE(),
        DiemDG INT DEFAULT 5
    );
    INSERT INTO danhgia (TenKH, Email, ChuDe, NoiDung, DiemDG) VALUES
    (N'Minh Hùng', N'hungm@gstore.com', N'order', N'Đặt PG Unleashed RX-78-2, shop tư vấn tận tình từ A-Z. Hộp được đóng gói cực kỳ chắc chắn, giao nhanh hơn dự kiến. Xứng đáng 5 sao!', 5),
    (N'Thu Lan', N'lant@gstore.com', N'consult', N'Mình là newbie Gunpla, được anh nhân viên tư vấn bắt đầu với HG rất chi tiết. Giờ đã lên đến MG rồi! Shop uy tín, giá cả hợp lý.', 5),
    (N'Quốc Đạt', N'datq@gstore.com', N'other', N'Mua sỉ cho cửa hàng mình, giá đại lý rất tốt. Hàng về đúng hạn, không thiếu phụ kiện, chất lượng đồng đều. Sẽ tiếp tục hợp tác lâu dài.', 5);
END
GO

-- =============================================
-- STORED PROCEDURES (Thủ tục cho SQL Server)
-- =============================================

-- 1. Lấy tất cả sản phẩm
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetAllProducts')
    DROP PROCEDURE GetAllProducts;
GO
CREATE PROCEDURE GetAllProducts
AS
BEGIN
    SELECT s.MaSP, s.TenSP, s.LoaiSP, s.MaNCC, n.TenNCC AS TenNCC, s.DonGia, s.SoLuong, s.HinhAnh
    FROM sanpham s
    LEFT JOIN nhacungcap n ON s.MaNCC = n.MaNCC;
END
GO

-- 2. Lấy chi tiết 1 sản phẩm
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetProductDetail')
    DROP PROCEDURE GetProductDetail;
GO
CREATE PROCEDURE GetProductDetail
    @p_MaSP NVARCHAR(20)
AS
BEGIN
    SELECT * FROM sanpham WHERE MaSP = @p_MaSP;
END
GO

-- 3. Thống kê Dashboard Admin
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetAdminDashboardStats')
    DROP PROCEDURE GetAdminDashboardStats;
GO
CREATE PROCEDURE GetAdminDashboardStats
AS
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM hoadon) as TotalOrders,
        (SELECT ISNULL(SUM(TongTien), 0) FROM hoadon WHERE TrangThai = 'Paid') as TotalRevenue,
        (SELECT COUNT(*) FROM sanpham WHERE SoLuong < 5) as LowStockItems;
END
GO

-- 4. Tạo Hóa đơn mới
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'CreateInvoice')
    DROP PROCEDURE CreateInvoice;
GO
CREATE PROCEDURE CreateInvoice
    @p_MaKH INT,
    @p_TongTien DECIMAL(15,2)
AS
BEGIN
    INSERT INTO hoadon (MaKH, TongTien, TrangThai) 
    VALUES (@p_MaKH, @p_TongTien, 'Pending');
    
    SELECT SCOPE_IDENTITY() AS NewInvoiceID;
END
GO

INSERT INTO taikhoan
VALUES ('admin',123,'admin',05/29/2026);