// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析前端发来的 JSON 数据

const PORT = 3000; // 后端运行在 3000 端口

// ... dbPool ...
const dbPool = mysql.createPool({
    host: 'localhost',
    user: 'stock_app_user',      // 你的新用户名
    password: 'Invest@1', // 你的新密码
    database: 'stock_tracker',   // 你的数据库名
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true 
});

// --- API 路由 ---

// 1. GET /api/transactions (无变化)
app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await dbPool.query("SELECT * FROM transactions ORDER BY transaction_date ASC, id ASC");
        res.json(rows);
    } catch (error) {
        console.error("获取数据失败:", error);
        res.status(500).json({ message: "服务器错误" });
    }
});

// 2. POST /api/transactions (⭐️ 变更)
// 添加一笔新交易 (支持分红)
app.post('/api/transactions', async (req, res) => {
    try {
        // ⭐️ 变更 1：解构出 dividendAmount
        const { 
            stockName, direction, date, industry, category, 
            volume, price, fee, dividendAmount // 新增 dividendAmount
        } = req.body;

        // ⭐️ 变更 2：更新 SQL 语句以包含 dividend_amount
        const sql = `
            INSERT INTO transactions 
            (stock_name, direction, transaction_date, industry, category, volume, price, fee, dividend_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // ⭐️ 变更 3：更新插入的值
        //    (前端逻辑会确保分红时 volume/price/fee 为 null 或 0)
        const values = [
            stockName, 
            direction, 
            date, 
            industry || null, 
            category || 'Stock', // 分红默认归类为 Stock
            volume || null, 
            price || null, 
            fee || 0, 
            dividendAmount || null
        ];

        const [result] = await dbPool.execute(sql, values);

        const [newRows] = await dbPool.query("SELECT * FROM transactions WHERE id = ?", [result.insertId]);
        
        if (newRows.length > 0) {
            res.status(201).json(newRows[0]);
        } else {
            throw new Error('无法检索新插入的记录');
        }

    } catch (error) {
        console.error("插入数据失败:", error);
        res.status(500).json({ message: "服务器错误" });
    }
});

// 3. POST /api/transactions/delete (无变化)
app.post('/api/transactions/delete', async (req, res) => {
    try {
        const { ids } = req.body; 

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "无效的 ID 列表" });
        }

        const placeholders = ids.map(() => '?').join(',');
        const sql = `DELETE FROM transactions WHERE id IN (${placeholders})`;
        
        const [result] = await dbPool.execute(sql, ids);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: `成功删除 ${result.affectedRows} 条记录` });
        } else {
            res.status(404).json({ message: "未找到要删除的记录" });
        }
    } catch (error) {
        console.error("删除数据失败:", error);
        res.status(500).json({ message: "服务器错误" });
    }
});




// --- 新增: Memo API ---

// 1.XZ 获取所有日记
app.get('/api/memos', async (req, res) => {
    try {
        const [rows] = await dbPool.query("SELECT * FROM memos ORDER BY memo_date DESC, id DESC");
        res.json(rows);
    } catch (error) {
        console.error("获取日记失败:", error);
        res.status(500).json({ message: "服务器错误" });
    }
});

// 2.vZ 添加日记
app.post('/api/memos', async (req, res) => {
    try {
        const { content, date } = req.body;
        const sql = "INSERT INTO memos (content, memo_date) VALUES (?, ?)";
        const [result] = await dbPool.execute(sql, [content, date]);
        
        const [newRows] = await dbPool.query("SELECT * FROM memos WHERE id = ?", [result.insertId]);
        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error("添加日记失败:", error);
        res.status(500).json({ message: "服务器错误" });
    }
});

// 3. 删除日记
app.delete('/api/memos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbPool.execute("DELETE FROM memos WHERE id = ?", [id]);
        res.status(200).json({ message: "删除成功" });
    } catch (error) {
        res.status(500).json({ message: "服务器错误" });
    }
});



// 启动服务器
app.listen(PORT, () => {
    console.log(`后端 API 运行在 http://localhost:${PORT}`);
});