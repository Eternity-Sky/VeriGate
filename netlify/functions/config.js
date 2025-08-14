// 站点配置管理API
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // 获取站点配置
      const siteKey = event.queryStringParameters?.siteKey;
      
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

      // 这里可以从数据库获取配置，现在返回默认配置
      const config = {
        siteKey,
        theme: 'light',
        size: 'normal',
        challenges: ['slider', 'click', 'puzzle'],
        difficulty: 'medium',
        timeout: 300000, // 5分钟
        allowedDomains: ['*'], // 允许所有域名
        rateLimit: {
          requests: 100,
          window: 3600000 // 1小时
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          config
        })
      };

    } else if (event.httpMethod === 'POST') {
      // 更新站点配置（需要管理员权限）
      const { siteKey, config, adminKey } = JSON.parse(event.body);

      // 简单的管理员验证（生产环境应该使用更安全的方法）
      if (adminKey !== 'verigate-admin-key') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: '权限不足' 
          })
        };
      }

      // 这里应该保存到数据库
      console.log('更新站点配置:', { siteKey, config });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '配置更新成功'
        })
      };

    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: '不支持的请求方法' 
        })
      };
    }

  } catch (error) {
    console.error('配置API错误:', error);
    
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
