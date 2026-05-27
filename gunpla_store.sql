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

-- 4. Bảng Sản phẩm (sanpham)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sanpham]') AND type in (N'U'))
BEGIN
    CREATE TABLE sanpham (
        MaSP NVARCHAR(20) PRIMARY KEY,
        TenSP NVARCHAR(255) NOT NULL,
        LoaiSP NVARCHAR(50),
        DonGia DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (DonGia >= 0),
        SoLuong INT DEFAULT 0 CHECK (SoLuong >= 0),
        HinhAnh NVARCHAR(255),
        MoTa NVARCHAR(MAX)
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
    SELECT MaSP, TenSP, LoaiSP, DonGia, SoLuong, HinhAnh FROM sanpham;
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

-- =============================================
-- SAMPLE DATA (Dữ liệu mẫu)
-- =============================================
-- Lưu ý: Kiểm tra trùng lặp trước khi chèn
IF NOT EXISTS (SELECT 1 FROM taikhoan WHERE Username = 'admin')
BEGIN
    INSERT INTO taikhoan (Username, Password, Role) VALUES (N'admin', N'admin123', N'Admin');
    INSERT INTO taikhoan (Username, Password, Role) VALUES (N'nam_pilot', N'123456', N'User');
END

IF NOT EXISTS (SELECT 1 FROM khachhang WHERE Email = 'nam@gst.com')
BEGIN
    INSERT INTO khachhang (TenKH, Email, SDT, DiaChi, Username) 
    VALUES (N'Đặng Hoàng Nam', N'nam@gst.com', N'0123456789', N'Hồ Chí Minh, Việt Nam', N'nam_pilot');
END

IF NOT EXISTS (SELECT 1 FROM sanpham WHERE MaSP = 'GP-782')
BEGIN
    INSERT INTO sanpham (MaSP, TenSP, LoaiSP, DonGia, SoLuong, HinhAnh) VALUES 
    (N'GP-782', N'Gundam RX-78-2', N'PG Unleashed', 6850000, 12, N'assets/images/PG/pg_unleashed.png'),
    (N'GP-000', N'Wing Gundam Zero EW', N'MG Ver.Ka', 1550000, 5, N'assets/images/MG/WingZero.png'),
    (N'GP-004', N'MSN-04 Sazabi', N'RG', 1150000, 2, N'assets/images/RG/Sazabi.png');
END
GO
