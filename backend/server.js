const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const nodemailer = require('nodemailer');
const https = require('https');

const BCRYPT_SALT_ROUNDS = 10; // rounds for bcrypt hashing

const otpStore = new Map(); // Key: username, Value: { otp, email, expiresAt }

// --- NODEMAILER EMAIL CONFIGURATION ---
const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};

let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    mailTransporter = nodemailer.createTransport(smtpConfig);
    console.log('[EMAIL] Nodemailer SMTP Transporter configured.');
} else {
    console.log('[EMAIL] Warning: SMTP configuration missing in .env. Falling back to console log for OTP.');
}

// Function to send OTP Email
async function sendOTPEmail(email, username, otp) {
    if (!mailTransporter) {
        console.log(`\n======================================================`);
        console.log(`[OTP FALLBACK] MÃ OTP CỦA BẠN LÀ: ${otp}`);
        console.log(`[OTP FALLBACK] Tài khoản: ${username} | Email: ${email}`);
        console.log(`======================================================\n`);
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || `"GUNPLA STORE" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '🔒 MÃ XÁC MINH OTP - KHÔI PHỤC MẬT KHẨU | GUNPLA STORE',
        html: `
            <div style="font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #0c0f16; color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #00ffcc; box-shadow: 0 0 20px rgba(0, 255, 204, 0.2);">
                <div style="margin-bottom: 30px;">
                    <h1 style="color: #00ffcc; font-size: 28px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">GUNPLA STORE NETWORK</h1>
                    <p style="color: #64748b; font-size: 12px; margin: 5px 0 0; letter-spacing: 1px;">SECURE PROTOCOL TRANSMISSION</p>
                </div>
                <div style="background-color: rgba(0, 255, 204, 0.05); border: 1px solid rgba(0, 255, 204, 0.2); padding: 30px; border-radius: 4px; margin-bottom: 30px;">
                    <p style="font-size: 16px; margin: 0 0 20px; color: #e2e8f0;">Chào phi công <strong style="color: #00ffcc;">${username}</strong>,</p>
                    <p style="font-size: 14px; margin: 0 0 25px; color: #94a3b8; line-height: 1.6;">Yêu cầu đặt lại mật khẩu truy cập của bạn đã được nhận. Vui lòng sử dụng mã xác minh bảo mật (OTP) dưới đây để tiếp tục:</p>
                    <div style="font-size: 36px; font-weight: bold; color: #00ffcc; letter-spacing: 10px; background-color: #07090e; padding: 15px; border-radius: 4px; border: 1px dashed rgba(0, 255, 204, 0.5); display: inline-block; margin-bottom: 25px;">${otp}</div>
                    <p style="font-size: 12px; margin: 0; color: #ef4444;">Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng tuyệt đối không chia sẻ mã này với bất kỳ ai.</p>
                </div>
                <div style="border-top: 1px solid #1e293b; padding-top: 20px; color: #64748b; font-size: 12px;">
                    <p style="margin: 0;">Đây là email tự động từ hệ thống bảo mật G-STORE NETWORK.</p>
                    <p style="margin: 5px 0 0;">&copy; 2026 G-STORE NETWORK. ALL RIGHTS RESERVED.</p>
                </div>
            </div>
        `
    };

    try {
        await mailTransporter.sendMail(mailOptions);
        console.log(`[OTP] Email OTP successfully sent to ${email} (User: ${username})`);
    } catch (err) {
        console.error('❌ [OTP] Failed to send OTP email:', err.message);
        // Fallback print to console if mailing fails
        console.log(`\n======================================================`);
        console.log(`[OTP FALLBACK (SEND ERROR)] MÃ OTP CỦA BẠN LÀ: ${otp}`);
        console.log(`[OTP FALLBACK (SEND ERROR)] Tài khoản: ${username} | Email: ${email}`);
        console.log(`======================================================\n`);
    }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- MULTER CONFIGURATION FOR IMAGE UPLOADS ---
const UPLOAD_DIR = path.join(__dirname, '../frontend/assets/images/anhGunDam');

// Tạo thư mục nếu chưa tồn tại
const fs = require('fs');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('[UPLOAD] Created upload directory:', UPLOAD_DIR);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- SQL SERVER CONFIGURATION ---
const config = {
    user: process.env.DB_USER || 'your_db_user',
    password: process.env.DB_PASSWORD || '1your_db_password',
    server: process.env.DB_SERVER || 'your_db_server',
    database: process.env.DB_NAME || 'your_db_name',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// --- DATABASE CONNECTION ---
async function connectDB() {
    try {
        console.log('[DB] Connecting to SQL Server with SA account...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server - Database connected successfully!');

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[taikhoan]') AND type in (N'U'))
            BEGIN
                CREATE TABLE taikhoan (
                    Username NVARCHAR(50) PRIMARY KEY,
                    Password NVARCHAR(255) NOT NULL,
                    Role NVARCHAR(20) NOT NULL DEFAULT 'User' CHECK (Role IN ('Admin', 'User')),
                    NgayTao DATETIME DEFAULT GETDATE()
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[khachhang]') AND type in (N'U'))
            BEGIN
                CREATE TABLE khachhang (
                    MaKH INT IDENTITY(1,1) PRIMARY KEY,
                    TenKH NVARCHAR(100) NOT NULL,
                    Email NVARCHAR(100) UNIQUE,
                    SDT NVARCHAR(15),
                    DiaChi NVARCHAR(MAX),
                    Username NVARCHAR(50),
                    HinhAnh NVARCHAR(MAX),
                    CONSTRAINT chk_email_format CHECK (Email LIKE '%@%'),
                    FOREIGN KEY (Username) REFERENCES taikhoan(Username) ON DELETE SET NULL
                );
            END

            -- Đảm bảo cột HinhAnh tồn tại nếu bảng đã được tạo trước đó
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[khachhang]') AND name = 'HinhAnh')
            BEGIN
                ALTER TABLE khachhang ADD HinhAnh NVARCHAR(MAX);
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[nhacungcap]') AND type in (N'U'))
            BEGIN
                CREATE TABLE nhacungcap (
                    MaNCC INT IDENTITY(1,1) PRIMARY KEY,
                    TenNCC NVARCHAR(150) NOT NULL,
                    Email NVARCHAR(100),
                    SDT NVARCHAR(15),
                    DiaChi NVARCHAR(MAX)
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sanpham]') AND type in (N'U'))
            BEGIN
                CREATE TABLE sanpham (
                    MaSP NVARCHAR(20) PRIMARY KEY,
                    TenSP NVARCHAR(255) NOT NULL,
                    LoaiSP NVARCHAR(50),
                    DonGia DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (DonGia >= 0),
                    SoLuong INT DEFAULT 0 CHECK (SoLuong >= 0),
                    HinhAnh NVARCHAR(255),
                    MoTa NVARCHAR(MAX),
                    MaNCC INT NULL
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[sanpham]') AND name = 'MaNCC')
            BEGIN
                ALTER TABLE sanpham ADD MaNCC INT NULL;
            END

            -- Đảm bảo cột HinhAnh của sanpham là NVARCHAR(MAX) để lưu Base64
            ALTER TABLE sanpham ALTER COLUMN HinhAnh NVARCHAR(MAX);

            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = N'FK_sanpham_nhacungcap' AND parent_object_id = OBJECT_ID(N'[dbo].[sanpham]'))
            BEGIN
                ALTER TABLE sanpham
                ADD CONSTRAINT FK_sanpham_nhacungcap FOREIGN KEY (MaNCC) REFERENCES nhacungcap(MaNCC) ON DELETE SET NULL;
            END

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

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tintuc]') AND type in (N'U'))
            BEGIN
                CREATE TABLE tintuc (
                    MaTin INT IDENTITY(1,1) PRIMARY KEY,
                    TieuDe NVARCHAR(255) NOT NULL,
                    LoaiTin NVARCHAR(50) NOT NULL,
                    TomTat NVARCHAR(MAX) NOT NULL,
                    NoiDung NVARCHAR(MAX),
                    HinhAnh NVARCHAR(255),
                    NgayDang DATETIME DEFAULT GETDATE()
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[danhgia]') AND type in (N'U'))
            BEGIN
                CREATE TABLE danhgia (
                    MaDG INT IDENTITY(1,1) PRIMARY KEY,
                    TenKH NVARCHAR(100) NOT NULL,
                    Email NVARCHAR(100),
                    ChuDe NVARCHAR(100),
                    NoiDung NVARCHAR(MAX) NOT NULL,
                    NgayTao DATETIME DEFAULT GETDATE(),
                    DiemDG INT DEFAULT 5 CHECK (DiemDG BETWEEN 1 AND 5)
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[danhgia]') AND name = 'DiemDG')
            BEGIN
                ALTER TABLE danhgia ADD DiemDG INT DEFAULT 5 CHECK (DiemDG BETWEEN 1 AND 5);
            END

            IF NOT EXISTS (SELECT * FROM taikhoan WHERE Username = N'admin')
            BEGIN
                -- Luu mat khau da duoc hash bang bcrypt, khong luu plain-text
                INSERT INTO taikhoan (Username, Password, Role)
                VALUES (N'admin', N'$2b$10$someplaceholderHashhere123456789012345678901234', N'Admin');
            END
        `);

        console.log('✅ Database schema verified/created successfully!');

        // --- MIGRATE IMAGE PATHS TO anhGunDam ---
        // Cập nhật đường dẫn ảnh cũ (assets/images/HG/..., assets/images/MG/..., v.v.)
        // sang định dạng mới assets/images/anhGunDam/<tenfile>
        const migrateResult = await pool.request().query(`
            UPDATE sanpham
            SET HinhAnh = 'assets/images/anhGunDam/' + 
                          SUBSTRING(HinhAnh, LEN(HinhAnh) - CHARINDEX('/', REVERSE(HinhAnh)) + 2, 999)
            WHERE HinhAnh IS NOT NULL
              AND HinhAnh NOT LIKE 'assets/images/anhGunDam/%'
              AND HinhAnh NOT LIKE 'http%'
              AND HinhAnh LIKE 'assets/images/%/%'
        `);
        if (migrateResult.rowsAffected[0] > 0) {
            console.log(`✅ [MIGRATE] Đã cập nhật ${migrateResult.rowsAffected[0]} đường dẫn ảnh sang anhGunDam/`);
        }
    } catch (err) {
        console.error('❌ Database Connection Failed!', err.message);
        console.log('💡 Note: Ensure SA account is enabled and SQL Server allows SQL Authentication.');
    }
}
connectDB();

// --- API ENDPOINTS ---

/**
 * @route GET /api/products
 * @desc Get all products from SQL Server
 */
app.get('/api/products', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT s.MaSP, s.TenSP, s.LoaiSP, s.DonGia, s.SoLuong, s.HinhAnh, s.MaNCC,
                   n.TenNCC AS NhaCungCap
            FROM sanpham s
            LEFT JOIN nhacungcap n ON s.MaNCC = n.MaNCC
            ORDER BY s.MaSP DESC
        `);
        const products = result.recordset.map(row => ({
            id: row.MaSP,
            name: row.TenSP,
            series: row.LoaiSP,
            price: row.DonGia.toLocaleString() + '₫',
            stock: row.SoLuong,
            img: row.HinhAnh || 'assets/images/default.png',
            supplierId: row.MaNCC,
            supplier: row.NhaCungCap || 'Không xác định'
        }));
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.NVarChar, productId)
            .query(`
                SELECT s.MaSP, s.TenSP, s.LoaiSP, s.DonGia, s.SoLuong, s.HinhAnh, s.MaNCC,
                       n.TenNCC AS NhaCungCap
                FROM sanpham s
                LEFT JOIN nhacungcap n ON s.MaNCC = n.MaNCC
                WHERE s.MaSP = @id
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const row = result.recordset[0];
        const product = {
            id: row.MaSP,
            name: row.TenSP,
            series: row.LoaiSP,
            price: row.DonGia.toLocaleString() + '₫',
            stock: row.SoLuong,
            img: row.HinhAnh || 'assets/images/default.png',
            supplierId: row.MaNCC,
            supplier: row.NhaCungCap || 'Không xác định'
        };
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/suppliers', async (req, res) => {
    try {
        const result = await sql.query('SELECT MaNCC, TenNCC, Email, SDT, DiaChi FROM nhacungcap ORDER BY TenNCC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('TenNCC', sql.NVarChar, name)
            .input('Email', sql.NVarChar, email)
            .input('SDT', sql.NVarChar, phone)
            .input('DiaChi', sql.NVarChar, address)
            .query(`INSERT INTO nhacungcap (TenNCC, Email, SDT, DiaChi)
                    VALUES (@TenNCC, @Email, @SDT, @DiaChi);
                    SELECT SCOPE_IDENTITY() AS MaNCC;`);
        res.status(201).json({ id: result.recordset[0].MaNCC, message: 'Supplier added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT MaTin AS id, TieuDe AS title, LoaiTin AS category, TomTat AS excerpt,
                   NoiDung AS body, HinhAnh AS img, CONVERT(VARCHAR(10), NgayDang, 120) AS datePosted
            FROM tintuc
            ORDER BY NgayDang DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/news', async (req, res) => {
    const { title, category, excerpt, body, img } = req.body;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('TieuDe', sql.NVarChar, title)
            .input('LoaiTin', sql.NVarChar, category)
            .input('TomTat', sql.NVarChar, excerpt)
            .input('NoiDung', sql.NVarChar, body)
            .input('HinhAnh', sql.NVarChar, img)
            .query(`INSERT INTO tintuc (TieuDe, LoaiTin, TomTat, NoiDung, HinhAnh)
                    VALUES (@TieuDe, @LoaiTin, @TomTat, @NoiDung, @HinhAnh)`);
        res.status(201).json({ message: 'News post created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    const newsId = req.params.id;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, newsId)
            .query('DELETE FROM tintuc WHERE MaTin = @id');
        res.json({ message: 'News post deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/products
 * @desc Add a new product to SQL Server
 */
app.post('/api/products', async (req, res) => {
    const { id, name, series, price, stock, img, supplierId } = req.body;

    const cleanPrice = parseFloat(price.toString().replace(/[^\d]/g, '')) || 0;

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('MaSP', sql.NVarChar, id)
            .input('TenSP', sql.NVarChar, name)
            .input('LoaiSP', sql.NVarChar, series)
            .input('DonGia', sql.Decimal(15, 2), cleanPrice)
            .input('SoLuong', sql.Int, stock)
            .input('HinhAnh', sql.NVarChar(sql.MAX), img)
            .input('MaNCC', sql.Int, supplierId || null)
            .query(`INSERT INTO sanpham (MaSP, TenSP, LoaiSP, DonGia, SoLuong, HinhAnh, MaNCC) 
                    VALUES (@MaSP, @TenSP, @LoaiSP, @DonGia, @SoLuong, @HinhAnh, @MaNCC)`);

        res.status(201).json({ message: 'Product added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route DELETE /api/products/:id
 * @desc Remove a product from SQL Server
 */
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.NVarChar, productId)
            .query('DELETE FROM sanpham WHERE MaSP = @id');
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PUT /api/products/:id
 * @desc Update an existing product in SQL Server
 */
app.put('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, series, price, stock, img, supplierId } = req.body;

    const cleanPrice = parseFloat(price.toString().replace(/[^\d]/g, '')) || 0;

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.NVarChar, productId)
            .input('TenSP', sql.NVarChar, name)
            .input('LoaiSP', sql.NVarChar, series)
            .input('DonGia', sql.Decimal(15, 2), cleanPrice)
            .input('SoLuong', sql.Int, stock)
            .input('HinhAnh', sql.NVarChar(sql.MAX), img)
            .input('MaNCC', sql.Int, supplierId || null)
            .query(`UPDATE sanpham 
                    SET TenSP = @TenSP, LoaiSP = @LoaiSP, DonGia = @DonGia, SoLuong = @SoLuong, HinhAnh = @HinhAnh, MaNCC = @MaNCC 
                    WHERE MaSP = @id`);

        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/login
 * @desc Login: so sanh mat khau bang bcrypt.compare (ho tro ca hash lan plain-text cu)
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect(config);
        console.log(`[AUTH] Login Attempt: User="${username}"`);

        const result = await pool.request()
            .input('user', sql.NVarChar, username)
            .query('SELECT * FROM taikhoan WHERE RTRIM(LTRIM(Username)) = @user');

        if (result.recordset.length === 0) {
            console.log(`[AUTH] Failed: Username not found.`);
            return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const user = result.recordset[0];
        const storedPw = user.Password ? user.Password.toString().trim() : '';

        let isMatch = false;

        // Kiem tra xem mat khau co phai bcrypt hash khong (bat dau bang $2b$ hoac $2a$)
        if (storedPw.startsWith('$2b$') || storedPw.startsWith('$2a$')) {
            // So sanh bcrypt - bao mat
            isMatch = await bcrypt.compare(password, storedPw);
        } else {
            // Tuong thich nguoc: mat khau plain-text cu (can migrate)
            isMatch = (storedPw === password);
            if (isMatch) {
                // Tu dong hash lai mat khau cu len bcrypt
                const newHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
                await pool.request()
                    .input('hash', sql.NVarChar, newHash)
                    .input('uname', sql.NVarChar, username)
                    .query('UPDATE taikhoan SET Password = @hash WHERE Username = @uname');
                console.log(`[AUTH] Migrated plain-text password to bcrypt for user: ${username}`);
            }
        }

        if (isMatch) {
            const role = user.Role ? user.Role.toString().trim() : 'User';
            const normalizedRole = role.toLowerCase() === 'admin' ? 'Admin' : 'User';
            console.log(`[AUTH] Success! Role: ${normalizedRole}`);
            res.json({ success: true, role: normalizedRole, username: user.Username });
        } else {
            console.log(`[AUTH] Failed: Wrong password.`);
            res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
    } catch (err) {
        console.error('[AUTH] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /api/config/google-client-id
 * @desc Lay Google Client ID tu .env (bao mat thong tin trong code frontend)
 */
app.get('/api/config/google-client-id', (req, res) => {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

/**
 * @route POST /api/auth/google
 * @desc Dang nhap bang Google OAuth2 - xac thuc access_token va tu dong tao/tim tai khoan
 */
app.post('/api/auth/google', async (req, res) => {
    const { access_token } = req.body;
    if (!access_token) {
        return res.status(400).json({ success: false, message: 'Thiếu access_token từ Google.' });
    }

    // Goi Google UserInfo API de lay thong tin nguoi dung
    const googleUser = await new Promise((resolve, reject) => {
        https.get(
            `https://www.googleapis.com/oauth2/v3/userinfo`,
            { headers: { Authorization: `Bearer ${access_token}` } },
            (resp) => {
                let data = '';
                resp.on('data', chunk => data += chunk);
                resp.on('end', () => {
                    try { 
                        const parsed = JSON.parse(data);
                        // Đảm bảo lấy được ảnh chất lượng cao từ Google
                        if (parsed.picture) {
                            parsed.picture = parsed.picture.replace('=s96-c', '=s300-c');
                        }
                        resolve(parsed); 
                    }
                    catch (e) { reject(e); }
                });
            }
        ).on('error', reject);
    }).catch(() => null);

    if (!googleUser || !googleUser.email) {
        return res.status(401).json({ success: false, message: 'Token Google không hợp lệ hoặc đã hết hạn.' });
    }

    const { sub: googleId, email, name: displayName, picture } = googleUser;
    // Username duy nhat theo Google ID, gioi han 50 ky tu
    const username = `gg_${googleId}`.substring(0, 50);

    try {
        const pool = await sql.connect(config);

        // Kiem tra tai khoan Google da ton tai chua
        const existing = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT t.Username, t.Role FROM taikhoan t WHERE t.Username = @username');

        if (existing.recordset.length > 0) {
            // Da ton tai -> dang nhap luon
            const role = existing.recordset[0].Role || 'User';
            console.log(`[GOOGLE-AUTH] Existing user "${username}" logged in via Google.`);
            return res.json({ success: true, username, displayName, role, picture });
        }

        // Chua ton tai -> tao tai khoan moi
        const randomPw = await bcrypt.hash(googleId + Date.now(), BCRYPT_SALT_ROUNDS);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Tao tai khoan trong bang taikhoan
            await transaction.request()
                .input('username', sql.NVarChar, username)
                .input('password', sql.NVarChar, randomPw)
                .input('role', sql.NVarChar, 'User')
                .query('INSERT INTO taikhoan (Username, Password, Role) VALUES (@username, @password, @role)');

            // Kiem tra email da co trong khachhang chua
            const emailCheck = await transaction.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT MaKH, Username FROM khachhang WHERE Email = @email');

            if (emailCheck.recordset.length > 0) {
                // Email da ton tai -> chi cap nhat lien ket Username
                await transaction.request()
                    .input('username', sql.NVarChar, username)
                    .input('email', sql.NVarChar, email)
                    .query('UPDATE khachhang SET Username = @username WHERE Email = @email AND (Username IS NULL OR Username = \'\')');
            } else {
                // Email chua ton tai -> tao moi khach hang
                await transaction.request()
                    .input('name', sql.NVarChar, displayName || username)
                    .input('email', sql.NVarChar, email)
                    .input('username', sql.NVarChar, username)
                    .input('picture', sql.NVarChar(sql.MAX), picture)
                    .query('INSERT INTO khachhang (TenKH, Email, Username, HinhAnh) VALUES (@name, @email, @username, @picture)');
            }

            await transaction.commit();
            console.log(`[GOOGLE-AUTH] New Google user "${username}" (${email}) registered and logged in.`);
            return res.status(201).json({ success: true, username, displayName, role: 'User', picture });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('[GOOGLE-AUTH] Error:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống. Vui lòng thử lại.' });
    }
});

/**
 * @route POST /api/register
 * @desc Dang ky tai khoan moi - mat khau duoc ma hoa bcrypt truoc khi luu
 */
app.post('/api/register', async (req, res) => {
    const { username, password, name, email } = req.body;

    // Validation
    if (!username || !password || !name || !email) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ error: 'Username chỉ chứa a-z, 0-9, _ (3-20 ký tự).' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Mật khẩu tối thiểu 8 ký tự.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Email không hợp lệ.' });
    }

    try {
        const pool = await sql.connect(config);

        // Kiem tra username da ton tai chua
        const checkUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT Username FROM taikhoan WHERE Username = @username');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.' });
        }

        // Kiem tra email da ton tai chua
        const checkEmail = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT Email FROM khachhang WHERE Email = @email');

        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({ error: 'Email này đã được sử dụng cho tài khoản khác.' });
        }

        // === HASH MAT KHAU BANG BCRYPT TRUOC KHI LUU ===
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        console.log(`[REGISTER] Hashing password for user "${username}" with bcrypt (saltRounds=${BCRYPT_SALT_ROUNDS})`);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Luu mat khau da duoc hash - TUYET DOI KHONG LUU PLAIN-TEXT
            await transaction.request()
                .input('username', sql.NVarChar, username)
                .input('password', sql.NVarChar, hashedPassword)
                .input('role', sql.NVarChar, 'User')
                .query('INSERT INTO taikhoan (Username, Password, Role) VALUES (@username, @password, @role)');

            await transaction.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('username', sql.NVarChar, username)
                .query('INSERT INTO khachhang (TenKH, Email, Username) VALUES (@name, @email, @username)');

            await transaction.commit();
            console.log(`[REGISTER] User "${username}" registered successfully with bcrypt password.`);
            res.status(201).json({ success: true, message: 'Tài khoản đã được tạo thành công!' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('[REGISTER] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/verify-user
 * @desc Xac minh username ton tai (cho trang quen mat khau)
 */
app.post('/api/verify-user', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ exists: false, message: 'Vui lòng nhập tên đăng nhập.' });
    }
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT t.Username, k.Email 
                FROM taikhoan t
                LEFT JOIN khachhang k ON t.Username = k.Username
                WHERE RTRIM(LTRIM(t.Username)) = @username
            `);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const email = user.Email ? user.Email.toString().trim() : '';
            
            // Tạo mã OTP 6 chữ số
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Lưu vào otpStore tạm thời, có hiệu lực trong 5 phút (300000 ms)
            otpStore.set(username, { otp, email, expiresAt: Date.now() + 5 * 60 * 1000 });
            
            // Gửi email thật (hoặc fallback ra console log)
            await sendOTPEmail(email || 'pilot@gstore.com', username, otp);
            
            // Tạo masked email để hiển thị an toàn trên giao diện
            let maskedEmail = 'chưa liên kết email';
            if (email && email.includes('@')) {
                const parts = email.split('@');
                const namePart = parts[0];
                const domainPart = parts[1];
                if (namePart.length <= 2) {
                    maskedEmail = namePart[0] + '*@' + domainPart;
                } else {
                    maskedEmail = namePart.substring(0, 2) + '*'.repeat(Math.max(1, namePart.length - 3)) + namePart.slice(-1) + '@' + domainPart;
                }
            }

            // Trả thêm debugOtp trong phản hồi để test dễ dàng
            res.json({ exists: true, maskedEmail, debugOtp: otp, message: 'Tài khoản được xác minh và mã OTP đã được gửi.' });
        } else {
            res.status(404).json({ exists: false, message: 'Không tìm thấy tài khoản với username này.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/reset-password
 * @desc Dat lai mat khau - hash bcrypt truoc khi luu
 */
app.post('/api/verify-otp', (req, res) => {
    const { username, otp } = req.body;
    if (!username || !otp) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin xác thực OTP.' });
    }
    const record = otpStore.get(username);
    if (!record) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy yêu cầu xác thực OTP của tài khoản này.' });
    }
    if (Date.now() > record.expiresAt) {
        otpStore.delete(username);
        return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.' });
    }
    if (record.otp !== otp.toString().trim()) {
        return res.status(400).json({ success: false, message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' });
    }
    res.json({ success: true, message: 'Xác minh mã OTP thành công.' });
});

app.post('/api/reset-password', async (req, res) => {
    const { username, otp, newPassword } = req.body;

    if (!username || !otp || !newPassword) {
        return res.status(400).json({ error: 'Thiếu thông tin đặt lại mật khẩu.' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 8 ký tự.' });
    }

    const record = otpStore.get(username);
    if (!record || record.otp !== otp.toString().trim() || Date.now() > record.expiresAt) {
        return res.status(400).json({ error: 'Xác thực mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    try {
        const pool = await sql.connect(config);

        // Kiem tra username ton tai
        const checkUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT Username FROM taikhoan WHERE Username = @username');

        if (checkUser.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
        }

        // === HASH MAT KHAU MOI BANG BCRYPT TRUOC KHI LUU ===
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        console.log(`[RESET-PW] Hashing new password for user "${username}" with bcrypt (saltRounds=${BCRYPT_SALT_ROUNDS})`);

        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE taikhoan SET Password = @password WHERE Username = @username');

        console.log(`[RESET-PW] Password updated successfully for user "${username}".`);
        
        // Xóa OTP khỏi store sau khi dùng thành công
        otpStore.delete(username);

        res.json({ success: true, message: 'Mật khẩu đã được cập nhật thành công và mã hóa bcrypt!' });
    } catch (err) {
        console.error('[RESET-PW] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/upload
 * @desc Upload an image file
 */
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `assets/images/anhGunDam/${req.file.filename}`;
    console.log(`[UPLOAD] Image saved: ${req.file.filename} -> ${imageUrl}`);
    res.json({ url: imageUrl });
});

/**
 * @route GET /api/users
 * @desc Get all accounts/pilots joined with khachhang
 */
app.get('/api/users', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT t.Username as id, k.TenKH as name, k.Email as email, t.Role as role, 
                   CONVERT(VARCHAR(10), t.NgayTao, 120) as joined
            FROM taikhoan t
            LEFT JOIN khachhang k ON t.Username = k.Username
            ORDER BY t.NgayTao DESC
        `);

        const users = result.recordset.map(u => ({
            id: u.id,
            name: u.name || u.id,
            email: u.email || `${u.id}@gstore.com`,
            role: u.role,
            joined: u.joined || new Date().toISOString().split('T')[0]
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/users
 * @desc Create a new account and associated customer profile
 */
app.post('/api/users', async (req, res) => {
    const { username, password, name, email, role } = req.body;
    try {
        const pool = await sql.connect(config);

        const checkUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT Username FROM taikhoan WHERE Username = @username');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại!' });
        }

        // Mã hóa mật khẩu trước khi lưu
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request()
                .input('username', sql.NVarChar, username)
                .input('password', sql.NVarChar, hashedPassword)
                .input('role', sql.NVarChar, role)
                .query('INSERT INTO taikhoan (Username, Password, Role) VALUES (@username, @password, @role)');

            await transaction.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('username', sql.NVarChar, username)
                .query('INSERT INTO khachhang (TenKH, Email, Username) VALUES (@name, @email, @username)');

            await transaction.commit();
            res.status(201).json({ message: 'User created successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete an account and its customer profile
 */
app.delete('/api/users/:id', async (req, res) => {
    const username = req.params.id;
    try {
        const pool = await sql.connect(config);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request()
                .input('username', sql.NVarChar, username)
                .query('DELETE FROM khachhang WHERE Username = @username');

            await transaction.request()
                .input('username', sql.NVarChar, username)
                .query('DELETE FROM taikhoan WHERE Username = @username');

            await transaction.commit();
            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user account and profile
 */
app.put('/api/users/:id', async (req, res) => {
    const username = req.params.id;
    const { password, name, email, role } = req.body;

    try {
        const pool = await sql.connect(config);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update taikhoan table
            if (password && password.trim() !== '') {
                // Mã hóa mật khẩu mới trước khi cập nhật
                const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
                await transaction.request()
                    .input('username', sql.NVarChar, username)
                    .input('password', sql.NVarChar, hashedPassword)
                    .input('role', sql.NVarChar, role)
                    .query('UPDATE taikhoan SET Password = @password, Role = @role WHERE Username = @username');
            } else {
                await transaction.request()
                    .input('username', sql.NVarChar, username)
                    .input('role', sql.NVarChar, role)
                    .query('UPDATE taikhoan SET Role = @role WHERE Username = @username');
            }

            // Update khachhang table
            await transaction.request()
                .input('username', sql.NVarChar, username)
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .query('UPDATE khachhang SET TenKH = @name, Email = @email WHERE Username = @username');

            await transaction.commit();
            res.json({ message: 'User updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /api/profile/:username
 * @desc Get customer profile for prefilling review forms
 */
app.get('/api/profile/:username', async (req, res) => {
    const username = (req.params.username || '').trim();
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT k.TenKH, k.Email, k.SDT, k.DiaChi, k.HinhAnh
                FROM khachhang k
                WHERE RTRIM(LTRIM(k.Username)) = @username
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PUT /api/profile/:username
 * @desc Cập nhật thông tin cá nhân của phi công
 */
app.put('/api/profile/:username', async (req, res) => {
    const username = (req.params.username || '').trim();
    const { name, email, phone, address, avatar } = req.body;

    try {
        const pool = await sql.connect(config);
        
        // Cập nhật bảng khách hàng
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar(sql.MAX), address)
            .input('avatar', sql.NVarChar(sql.MAX), avatar) // Fix error 500: Allow long image strings
            .query(`
                UPDATE khachhang 
                SET TenKH = @name, 
                    Email = @email, 
                    SDT = @phone, 
                    DiaChi = @address, 
                    HinhAnh = @avatar
                WHERE RTRIM(LTRIM(Username)) = @username
            `);

        res.json({ success: true, message: 'Hồ sơ đã được cập nhật trên hệ thống!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /api/orders/:username
 * @desc Lấy lịch sử đơn hàng của một phi công cụ thể
 */
app.get('/api/orders/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT h.MaHD, h.NgayLap, h.TongTien, h.TrangThai,
                       (SELECT TOP 1 s.TenSP FROM cthoadon ct 
                        JOIN sanpham s ON ct.MaSP = s.MaSP 
                        WHERE ct.MaHD = h.MaHD) as SanPhamChinh,
                       (SELECT COUNT(*) FROM cthoadon WHERE MaHD = h.MaHD) as SoLuongSP
                FROM hoadon h
                JOIN khachhang k ON h.MaKH = k.MaKH
                WHERE k.Username = @username
                ORDER BY h.NgayLap DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('[ORDER-API] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /api/reviews
 * @desc Get all reviews/testimonials from database
 */
app.get('/api/reviews', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM danhgia ORDER BY NgayTao DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/reviews
 * @desc Add a new review to the database
 */
app.post('/api/reviews', async (req, res) => {
    const { name, email, topic, message, rating } = req.body;
    if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required' });
    }
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email || '')
            .input('topic', sql.NVarChar, topic || '')
            .input('message', sql.NVarChar, message)
            .input('rating', sql.Int, rating || 5)
            .query(`
                INSERT INTO danhgia (TenKH, Email, ChuDe, NoiDung, DiemDG)
                OUTPUT INSERTED.*
                VALUES (@name, @email, @topic, @message, @rating)
            `);
        res.status(201).json({ success: true, review: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
