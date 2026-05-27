const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

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
    user: process.env.DB_USER || 'sa', 
    password: process.env.DB_PASSWORD || '123456', 
    server: process.env.DB_SERVER || 'AC05\\SQL2019', 
    database: process.env.DB_NAME || 'gunpla_store',
    options: {
        encrypt: false,
        trustServerCertificate: true 
    }
};

// --- DATABASE CONNECTION ---
async function connectDB() {
    try {
        console.log('[DB] Connecting to SQL Server with SA account...');
        await sql.connect(config);
        console.log('✅ Connected to SQL Server - Database connected successfully!');
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
        const result = await sql.query('SELECT * FROM sanpham ORDER BY MaSP DESC');
        // Map SQL fields to Frontend field names
        const products = result.recordset.map(row => ({
            id: row.MaSP,
            name: row.TenSP,
            series: row.LoaiSP,
            price: row.DonGia.toLocaleString() + '₫',
            stock: row.SoLuong,
            img: row.HinhAnh || 'assets/images/default.png'
        }));
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /api/products
 * @desc Add a new product to SQL Server
 */
app.post('/api/products', async (req, res) => {
    const { id, name, series, price, stock, img } = req.body;
    
    // Clean price string to decimal (e.g. "1.150.000₫" -> 1150000)
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
            .query(`INSERT INTO sanpham (MaSP, TenSP, LoaiSP, DonGia, SoLuong, HinhAnh) 
                    VALUES (@MaSP, @TenSP, @LoaiSP, @DonGia, @SoLuong, @HinhAnh)`);
        
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
 * @route POST /api/login
 * @desc Simple admin login check against SQL Server
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect(config);
        console.log(`[AUTH] Login Attempt: User="${username}", Pass="${password}"`);
        
        const result = await pool.request()
            .input('user', sql.NVarChar, username)
            .input('pass', sql.NVarChar, password)
            .query('SELECT * FROM taikhoan WHERE RTRIM(LTRIM(Username)) = @user AND RTRIM(LTRIM(Password)) = @pass');
        
        console.log(`[AUTH] Matches found: ${result.recordset.length}`);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            console.log(`[AUTH] Success! Role detected: ${user.Role}`);
            // Normalize role to 'Admin' or 'User'
            const role = RTRIM_JS(user.Role).toLowerCase() === 'admin' ? 'Admin' : 'User';
            res.json({ success: true, role: role });
        } else {
            console.log(`[AUTH] Failed: No match in database.`);
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

// Helper for JS trimming if needed
function RTRIM_JS(str) {
    return str ? str.toString().trim() : '';
}
    } catch (err) {
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
