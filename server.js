const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const BCRYPT_SALT_ROUNDS = 10; // rounds for bcrypt hashing

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// --- MULTER CONFIGURATION FOR IMAGE UPLOADS ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/images/');
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
                    CONSTRAINT chk_email_format CHECK (Email LIKE '%@%'),
                    FOREIGN KEY (Username) REFERENCES taikhoan(Username) ON DELETE SET NULL
                );
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
                INSERT INTO danhgia (TenKH, Email, ChuDe, NoiDung, DiemDG) VALUES
                    (N'Minh Hùng', N'hungm@gstore.com', N'order', N'Đặt PG Unleashed RX-78-2, shop tư vấn tận tình từ A-Z. Hộp được đóng gói cực kỳ chắc chắn, giao nhanh hơn dự kiến. Xứng đáng 5 sao!', 5),
                    (N'Thu Lan', N'lant@gstore.com', N'consult', N'Mình là newbie Gunpla, được anh nhân viên tư vấn bắt đầu với HG rất chi tiết. Giờ đã lên đến MG rồi! Shop uy tín, giá cả hợp lý.', 5),
                    (N'Quốc Đạt', N'datq@gstore.com', N'other', N'Mua sỉ cho cửa hàng mình, giá đại lý rất tốt. Hàng về đúng hạn, không thiếu phụ kiện, chất lượng đồng đều. Sẽ tiếp tục hợp tác lâu dài.', 5);
            END

            IF NOT EXISTS (SELECT * FROM taikhoan WHERE Username = N'admin')
            BEGIN
                -- Luu mat khau da duoc hash bang bcrypt, khong luu plain-text
                INSERT INTO taikhoan (Username, Password, Role)
                VALUES (N'admin', N'$2b$10$someplaceholderHashhere123456789012345678901234', N'Admin');
            END
        `);

        console.log('✅ Database schema verified/created successfully!');
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
            .input('HinhAnh', sql.NVarChar, img)
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
            .input('HinhAnh', sql.NVarChar, img)
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
            .query('SELECT Username FROM taikhoan WHERE Username = @username');

        if (result.recordset.length > 0) {
            res.json({ exists: true, message: 'Tài khoản được xác minh.' });
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
app.post('/api/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ error: 'Thiếu thông tin.' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 8 ký tự.' });
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
    const imageUrl = `assets/images/${req.file.filename}`;
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

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request()
                .input('username', sql.NVarChar, username)
                .input('password', sql.NVarChar, password)
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
                await transaction.request()
                    .input('username', sql.NVarChar, username)
                    .input('password', sql.NVarChar, password)
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
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('topic', sql.NVarChar, topic)
            .input('message', sql.NVarChar, message)
            .input('rating', sql.Int, rating || 5)
            .query('INSERT INTO danhgia (TenKH, Email, ChuDe, NoiDung, DiemDG) VALUES (@name, @email, @topic, @message, @rating)');
        res.status(201).json({ success: true, message: 'Review added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
