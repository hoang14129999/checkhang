// ✅ FILE: server.js (Express backend server ready for deployment)
require('dotenv').config(); // Nạp biến môi trường từ .env

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ Kết nối MySQL thất bại:', err.message);
  } else {
    console.log('✅ Kết nối MySQL thành công');
  }
});

// Lấy danh sách người dùng
app.get('/nguoidung', (req, res) => {
  db.query('SELECT * FROM nguoidung', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Đăng nhập
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM nguoidung WHERE tentaikhoan = ? AND matkhau = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Lỗi truy vấn CSDL' });
    if (results.length > 0) {
      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        user: {
          id_nguoidung: results[0].id_nguoidung,
          tentaikhoan: results[0].tentaikhoan
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }
  });
});

// Lấy sản phẩm theo người dùng
app.get('/checkhang-user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM checkhang WHERE id_nguoidung = ? ORDER BY Thoigiantao DESC';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // ✅ Chuyển Thoigiantao từ UTC về local time
    const localResults = results.map(row => {
      const date = new Date(row.Thoigiantao);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      row.Thoigiantao = local.toISOString().slice(0, 19).replace('T', ' ');
      return row;
    });

    res.json(localResults);
  });
});

// Thêm sản phẩm mới
app.post('/checkhang', (req, res) => {
  const { Thoigiantao, Tensp, NSX, HSD, Songayhethan, Songaysanxuat, Luuy, id_nguoidung } = req.body;
  const query = `
    INSERT INTO checkhang (Thoigiantao, Tensp, NSX, HSD, Songayhethan, Songaysanxuat, Luuy, id_nguoidung)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [Thoigiantao, Tensp, NSX, HSD, Songayhethan, Songaysanxuat, Luuy, id_nguoidung], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Thêm thành công', id: result.insertId });
  });
});

// Xóa sản phẩm theo thời gian tạo
app.delete('/checkhang/:thoigiantao', (req, res) => {
  const thoigiantao = decodeURIComponent(req.params.thoigiantao);
  const query = `DELETE FROM checkhang WHERE Thoigiantao = ?`;
  db.query(query, [thoigiantao], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã xóa thành công' });
  });
});

// Lấy danh sách sản phẩm kèm tên tài khoản
app.get('/showhang/:id', (req, res) => {
  const idNguoiDung = req.params.id;
  const query = `
    SELECT ch.*, nd.tentaikhoan
    FROM checkhang ch
    JOIN nguoidung nd ON ch.id_nguoidung = nd.id_nguoidung
    WHERE ch.id_nguoidung = ?
    ORDER BY ch.Thoigiantao DESC
  `;
  db.query(query, [idNguoiDung], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
