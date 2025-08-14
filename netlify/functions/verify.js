const CryptoJS = require('crypto-js');

// 验证令牌的API端点
exports.handler = async (event, context) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: '只允许POST请求' 
      })
    };
  }

  try {
    const { token, siteKey } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: '缺少验证令牌' 
        })
      };
    }

    if (!siteKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: '缺少站点密钥' 
        })
      };
    }

    // 验证令牌
    const verification = await verifyToken(token, siteKey);
    
    if (verification.success) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '验证成功',
          data: {
            sessionId: verification.sessionId,
            timestamp: verification.timestamp,
            challenge: verification.challenge
          }
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: verification.error || '验证失败'
        })
      };
    }

  } catch (error) {
    console.error('验证API错误:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: '服务器内部错误' 
      })
    };
  }
};

// 验证令牌函数
async function verifyToken(token, siteKey) {
  try {
    // 解密令牌
    const decryptedBytes = CryptoJS.AES.decrypt(token, 'verigate-secret');
    const decryptedData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));

    // 验证令牌结构
    if (!decryptedData.sessionId || !decryptedData.siteKey || !decryptedData.timestamp) {
      return { success: false, error: '令牌格式无效' };
    }

    // 验证站点密钥
    if (decryptedData.siteKey !== siteKey) {
      return { success: false, error: '站点密钥不匹配' };
    }

    // 验证时间戳（令牌5分钟内有效）
    const now = Date.now();
    const tokenAge = now - decryptedData.timestamp;
    const maxAge = 5 * 60 * 1000; // 5分钟

    if (tokenAge > maxAge) {
      return { success: false, error: '令牌已过期' };
    }

    // 验证挑战完成状态
    if (decryptedData.challenge !== 'completed') {
      return { success: false, error: '挑战未完成' };
    }

    // 可以添加更多验证逻辑，比如：
    // - 检查IP地址
    // - 检查用户代理
    // - 防重放攻击
    // - 速率限制

    return {
      success: true,
      sessionId: decryptedData.sessionId,
      timestamp: decryptedData.timestamp,
      challenge: decryptedData.challenge
    };

  } catch (error) {
    console.error('令牌解密错误:', error);
    return { success: false, error: '令牌解析失败' };
  }
}
