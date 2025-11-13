CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_name VARCHAR(255) NOT NULL COMMENT '股票名称',
    direction VARCHAR(10) NOT NULL COMMENT '投资方向: Buy / Sell',
    transaction_date DATE NOT NULL COMMENT '投资日期',
    industry VARCHAR(100) NULL COMMENT '行业',
    category VARCHAR(50) NOT NULL COMMENT '类别: Stock / Fund',
    
    -- ⭐️ 使用 DECIMAL 存储精确的数字，而不是 FLOAT
    volume DECIMAL(18, 4) NOT NULL COMMENT '成交股数 (支持小数, 如基金)',
    price DECIMAL(18, 6) NOT NULL COMMENT '成交单价 (支持高精度)',
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '手续费',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引以加快查询
    INDEX(stock_name),
    INDEX(transaction_date)
) COMMENT='交易记录表';



ALTER TABLE transactions
    
    -- 1. 修改 stock_name 的注释
    MODIFY COLUMN stock_name VARCHAR(255) NOT NULL COMMENT '股票/基金名称',
    
    -- 2. 修改 direction 的注释 (类型不变, 仍为 NOT NULL)
    MODIFY COLUMN direction VARCHAR(10) NOT NULL COMMENT '投资方向: Buy / Sell / Dividend',
    
    -- 3. 修改 volume 允许 NULL (原表为 NOT NULL)
    MODIFY COLUMN volume DECIMAL(18, 4) NULL COMMENT '成交股数/份额 (分红时可为空)',
    
    -- 4. 修改 price 允许 NULL (原表为 NOT NULL)
    MODIFY COLUMN price DECIMAL(18, 6) NULL COMMENT '成交单价/净值 (分红时可为空)',
    
    -- 5. 新增 dividend_amount 字段 (在 fee 字段后面)
    ADD COLUMN dividend_amount DECIMAL(18, 2) NULL COMMENT '分红金额' AFTER fee;