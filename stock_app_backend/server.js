// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析前端发来的 JSON 数据

const PORT = 3000; // 后端运行在 3000 端口

// 数据库连接池配置
// 确保使用你自己的数据库、用户和密码
const dbPool = mysql.createPool({
    host: 'localhost',
    user: 'stock_app_user',      // 你的新用户名
    password: 'Invest@1', // 你的新密码
    database: 'stock_tracker',   // 你的数据库名
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ⭐️ 让数据库返回的 DECIMAL 保持为数字 (Number)
    decimalNumbers: true 
});

// --- API 路由 ---

// 1. GET /api/transactions
// 获取所有交易记录
app.get('/api/transactions', async (req, res) => {
    try {
        // 永远按日期排序，这对于前端计算至关重要
        const [rows] = await dbPool.query("SELECT * FROM transactions ORDER BY transaction_date ASC, id ASC");
        res.json(rows);
    } catch (error) {
        console.error("获取数据失败:", error);
        res.status(500).json({ message: "服务器错误" });
    }
});

// 2. POST /api/transactions
// 添加一笔新交易
app.post('/api/transactions', async (req, res) => {
    try {
        const { 
            stockName, direction, date, industry, category, volume, price, fee 
        } = req.body;

        const sql = `
            INSERT INTO transactions 
            (stock_name, direction, transaction_date, industry, category, volume, price, fee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [stockName, direction, date, industry, category, volume, price, fee];

        const [result] = await dbPool.execute(sql, values);

        // ⭐️ 新增：根据 insertId 获取刚插入的完整数据
        const [newRows] = await dbPool.query("SELECT * FROM transactions WHERE id = ?", [result.insertId]);
        
        if (newRows.length > 0) {
            // 返回从数据库中查到的实际数据 (确保 snake_case 字段名)
            res.status(201).json(newRows[0]);
        } else {
            throw new Error('无法检索新插入的记录');
        }

    } catch (error) {
        console.error("插入数据失败:", error);
        res.status(500).json({ message: "服务器错误" });
    }
});

// 3. POST /api/transactions/delete
// 批量删除交易
app.post('/api/transactions/delete', async (req, res) => {
    try {
        const { ids } = req.body; // 期望 { ids: [1, 2, 3] }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "无效的 ID 列表" });
        }

        // --- ⭐️ 修复开始 ⭐️ ---
        // 1. 根据 ids 数组的长度动态创建占位符
        // 例如: [1, 2] -> "?,?"
        const placeholders = ids.map(() => '?').join(',');

        // 2. 创建新的 SQL 字符串
        const sql = `DELETE FROM transactions WHERE id IN (${placeholders})`;
        // --- ⭐️ 修复结束 ⭐️ ---


        // 3. ⭐️ 重要修复：
        //    执行时，直接传递 ids 数组 (例如 [1, 2])
        //    而不是像以前那样传递 [ids] (例如 [[1, 2]])
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


// 启动服务器
app.listen(PORT, () => {
    console.log(`后端 API 运行在 http://localhost:${PORT}`);
});