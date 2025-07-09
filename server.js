// ✅ FILE: server.js (Express backend server ready for Railway)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // ✅ Import pool

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors());
app.use(express.json());

// ✅ Lấy danh sách người dùng
app.get('/nguoidung', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM nguoidung');
    res.json(result);
  } catch (err) {
    console.error('❌ DB lỗi:', err.message);
    res.status(500).json({ error: 'Kết nối DB lỗi hoặc Railway chưa khởi động xong.' });
  }
});

// ✅ Đăng nhập
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM nguoidung WHERE tentaikhoan = ? AND matkhau = ?';
  try {
    const results = await db.query(query, [username, password]);
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
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn CSDL' });
  }
});

// ✅ Lấy sản phẩm theo người dùng
app.get('/checkhang-user/:id', async (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM checkhang WHERE id_nguoidung = ? ORDER BY Thoigiantao DESC';
  try {
    const results = await db.query(query, [userId]);
    const localResults = results.map(row => {
      const date = new Date(row.Thoigiantao);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      row.Thoigiantao = local.toISOString().slice(0, 19).replace('T', ' ');
      return row;
    });
    res.json(localResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Thêm sản phẩm mới
app.post('/checkhang', async (req, res) => {
  const { Thoigiantao, Tensp, NSX, HSD, Songayhethan, Songaysanxuat, Luuy, id_nguoidung } = req.body;
  const query = `
    INSERT INTO checkhang (Thoigiantao, Tensp, NSX, HSD, Songayhethan, Songaysanxuat, Luuy, id_nguoidung)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    const result = await db.query(query, [Thoigiantao, Tensp, NSX, HSD, Songayhethan, Songaysanxuat, Luuy, id_nguoidung]);
    res.json({ message: 'Thêm thành công', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Xoá sản phẩm theo thời gian tạo
app.delete('/checkhang/:thoigiantao', async (req, res) => {
  const thoigiantaoLocal = decodeURIComponent(req.params.thoigiantao);
  const formattedUTC = new Date(thoigiantaoLocal).toISOString().slice(0, 19).replace('T', ' ');
  const query = `DELETE FROM checkhang WHERE Thoigiantao LIKE ? LIMIT 1`;
  try {
    const result = await db.query(query, [`${formattedUTC}%`]);
    if (result.affectedRows > 0) {
      res.json({ message: 'Đã xóa thành công' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm với thời gian đã cho' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Lấy danh sách sản phẩm kèm tên tài khoản
app.get('/showhang/:id', async (req, res) => {
  const idNguoiDung = req.params.id;
  const query = `
    SELECT ch.*, nd.tentaikhoan
    FROM checkhang ch
    JOIN nguoidung nd ON ch.id_nguoidung = nd.id_nguoidung
    WHERE ch.id_nguoidung = ?
    ORDER BY ch.Thoigiantao DESC
  `;
  try {
    const results = await db.query(query, [idNguoiDung]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
