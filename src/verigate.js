import './styles.css';
import CryptoJS from 'crypto-js';

class VeriGate {
  constructor() {
    this.apiBase = window.location.hostname === 'localhost' 
      ? 'http://localhost:8888/.netlify/functions' 
      : 'https://verigate1.netlify.app/.netlify/functions';
    this.challenges = ['slider', 'click', 'puzzle'];
    this.sessions = new Map();
  }

  // 渲染验证组件
  render(selector, options = {}) {
    if (window.VeriGate && window.VeriGate.debug) {
      console.log('[VeriGate] render called:', selector, options);
    }
    const container = document.querySelector(selector);
    if (!container) {
      console.error('[VeriGate] 找不到选择器:', selector);
      throw new Error(`找不到选择器: ${selector}`);
    }

    const config = {
      siteKey: options.siteKey || 'default',
      theme: options.theme || 'light',
      size: options.size || 'normal',
      onSuccess: options.onSuccess || (() => {}),
      onError: options.onError || (() => {}),
      onExpired: options.onExpired || (() => {}),
      ...options
    };

    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, { config, solved: false });

    container.innerHTML = this.createWidget(sessionId, config);
    this.bindEvents(sessionId, container);
    
    return sessionId;
  }

  // 生成会话ID
  generateSessionId() {
    return 'vg_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // 创建验证组件HTML
  createWidget(sessionId, config) {
    const themeClass = `verigate-${config.theme}`;
    const sizeClass = `verigate-${config.size}`;
    
    return `
      <div class="verigate-widget ${themeClass} ${sizeClass}" data-session="${sessionId}">
        <div class="verigate-header">
          <div class="verigate-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
            </svg>
            VeriGate
          </div>
          <div class="verigate-status">验证中...</div>
        </div>
        <div class="verigate-challenge" id="challenge-${sessionId}">
          ${this.createInitialChallenge()}
        </div>
        <div class="verigate-footer">
          <span class="verigate-privacy">隐私 - 条款</span>
          <span class="verigate-powered">由 VeriGate 提供支持</span>
        </div>
      </div>
    `;
  }

  // 创建初始验证挑战
  createInitialChallenge() {
    return `
      <div class="verigate-checkbox-challenge">
        <label class="verigate-checkbox">
          <input type="checkbox" class="verigate-checkbox-input">
          <span class="verigate-checkmark"></span>
          <span class="verigate-label">我不是机器人</span>
        </label>
      </div>
    `;
  }

  // 绑定事件
  bindEvents(sessionId, container) {
    if (window.VeriGate && window.VeriGate.debug) {
      console.log('[VeriGate] bindEvents:', sessionId, container);
    }
    const widget = container.querySelector(`[data-session="${sessionId}"]`);
    const checkbox = widget.querySelector('.verigate-checkbox-input');
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.startChallenge(sessionId, widget);
      }
    });
  }

  // 开始验证挑战
  async startChallenge(sessionId, widget) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 随机选择一个挑战类型
    const challengeType = this.challenges[Math.floor(Math.random() * this.challenges.length)];
    
    const challengeContainer = widget.querySelector(`#challenge-${sessionId}`);
    const statusElement = widget.querySelector('.verigate-status');
    
    statusElement.textContent = '正在验证...';
    widget.classList.add('verigate-loading');

    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 根据挑战类型创建不同的验证界面
      switch (challengeType) {
        case 'slider':
          this.createSliderChallenge(challengeContainer, sessionId);
          break;
        case 'click':
          this.createClickChallenge(challengeContainer, sessionId);
          break;
        case 'puzzle':
          this.createPuzzleChallenge(challengeContainer, sessionId);
          break;
      }
      
      widget.classList.remove('verigate-loading');
      statusElement.textContent = '请完成验证';
      
    } catch (error) {
      this.handleError(sessionId, error);
    }
  }

  // 创建滑块验证
  createSliderChallenge(container, sessionId) {
    container.innerHTML = `
      <div class="verigate-slider-challenge">
        <div class="verigate-slider-instruction">拖动滑块完成验证</div>
        <div class="verigate-slider-track">
          <div class="verigate-slider-thumb" draggable="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
            </svg>
          </div>
          <div class="verigate-slider-progress"></div>
        </div>
      </div>
    `;

    this.bindSliderEvents(container, sessionId);
  }

  // 绑定滑块事件
  bindSliderEvents(container, sessionId) {
    const thumb = container.querySelector('.verigate-slider-thumb');
    const track = container.querySelector('.verigate-slider-track');
    const progress = container.querySelector('.verigate-slider-progress');
    
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    thumb.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - thumb.offsetLeft;
      thumb.style.cursor = 'grabbing';
    });
    thumb.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].clientX - thumb.offsetLeft;
      thumb.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - startX;
      const maxX = track.offsetWidth - thumb.offsetWidth;
      
      currentX = Math.max(0, Math.min(currentX, maxX));
      
      thumb.style.left = currentX + 'px';
      progress.style.width = (currentX / maxX * 100) + '%';
      
      // 如果滑到了最右边，验证成功
      if (currentX >= maxX * 0.95) {
        this.completeVerification(sessionId);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        thumb.style.cursor = 'grab';
        
        // 如果没有完成验证，重置滑块
        if (currentX < track.offsetWidth - thumb.offsetWidth) {
          thumb.style.left = '0px';
          progress.style.width = '0%';
          currentX = 0;
        }
      }
    });
  }

  // 创建点击验证
  createClickChallenge(container, sessionId) {
    const clickChallengeBank = [
      {
        instruction: '点击所有的水果',
        images: ['🍎', '🍌', '🍇', '🚗', '🍉', '🐶', '🍊', '🚲'],
        targets: ['🍎', '🍌', '🍇', '🍉', '🍊']
      },
      {
        instruction: '点击所有的动物',
        images: ['🐶', '🐱', '🦁', '🍎', '🐼', '🚗', '🐸', '🍌'],
        targets: ['🐶', '🐱', '🦁', '🐼', '🐸']
      },
      {
        instruction: '点击所有的交通工具',
        images: ['🚗', '🚲', '🚌', '✈️', '🚢', '🚁', '🚂', '🏍️'],
        targets: ['🚗', '🚲', '🚌', '✈️', '🚢', '🚁', '🚂', '🏍️']
      },
      {
        instruction: '点击所有的蔬菜',
        images: ['🥕', '🍅', '🥦', '🍆', '🍎', '🚗', '🍌', '🥒'],
        targets: ['🥕', '🍅', '🥦', '🍆', '🥒']
      },
      {
        instruction: '点击所有的红色物品',
        images: ['🍎', '🍒', '🍓', '🚗', '🍉', '🍌', '🐶', '🍊'],
        targets: ['🍎', '🍒', '🍓', '🍉']
      }
    ];
    const idx = Math.floor(Math.random() * clickChallengeBank.length);
    const { instruction, images, targets } = clickChallengeBank[idx];

    container.innerHTML = `
      <div class="verigate-click-challenge">
        <div class="verigate-click-instruction">${instruction}</div>
        <div class="verigate-click-grid">
          ${images.map((img, index) => `
            <div class="verigate-click-item" data-image="${img}" data-index="${index}">
              <span class="verigate-click-emoji">${img}</span>
            </div>
          `).join('')}
        </div>
        <button class="verigate-verify-btn" disabled>验证</button>
      </div>
    `;

    this.bindClickEvents(container, sessionId, targets);
  }

  // 绑定点击验证事件
  bindClickEvents(container, sessionId, targetImages) {
    const items = container.querySelectorAll('.verigate-click-item');
    const verifyBtn = container.querySelector('.verigate-verify-btn');
    const selected = new Set();

    items.forEach(item => {
      item.addEventListener('click', () => {
        const image = item.dataset.image;
        
        if (selected.has(image)) {
          selected.delete(image);
          item.classList.remove('selected');
        } else {
          selected.add(image);
          item.classList.add('selected');
        }
        
        verifyBtn.disabled = selected.size === 0;
      });
    });

    verifyBtn.addEventListener('click', () => {
      const selectedArray = Array.from(selected);
      const isCorrect = targetImages.every(img => selectedArray.includes(img)) &&
                       selectedArray.every(img => targetImages.includes(img));
      
      if (isCorrect) {
        this.completeVerification(sessionId);
      } else {
        this.showError(container, '选择错误，请重试');
        setTimeout(() => {
          selected.clear();
          items.forEach(item => item.classList.remove('selected'));
          verifyBtn.disabled = true;
        }, 1500);
      }
    });
  }

  // 创建拼图验证
  createPuzzleChallenge(container, sessionId) {
    container.innerHTML = `
      <div class="verigate-puzzle-challenge">
        <div class="verigate-puzzle-instruction">拖动拼图块到正确位置</div>
        <div class="verigate-puzzle-container">
          <div class="verigate-puzzle-image">
            <div class="verigate-puzzle-piece" style="left: 200px; top: 100px;"></div>
            <div class="verigate-puzzle-slot"></div>
          </div>
        </div>
      </div>
    `;

    this.bindPuzzleEvents(container, sessionId);
  }

  // 绑定拼图验证事件
  bindPuzzleEvents(container, sessionId) {
    const piece = container.querySelector('.verigate-puzzle-piece');
    const slot = container.querySelector('.verigate-puzzle-slot');
    
    let isDragging = false;

    piece.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = piece.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const mouseMoveHandler = (e) => {
        if (!isDragging) return;
        
        const containerRect = container.getBoundingClientRect();
        const x = e.clientX - containerRect.left - offsetX;
        const y = e.clientY - containerRect.top - offsetY;
        
        piece.style.left = x + 'px';
        piece.style.top = y + 'px';
      };

      const mouseUpHandler = () => {
        isDragging = false;
        
        // 检查是否放置在正确位置
        const pieceRect = piece.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();
        
        const distance = Math.sqrt(
          Math.pow(pieceRect.left - slotRect.left, 2) + 
          Math.pow(pieceRect.top - slotRect.top, 2)
        );
        
        if (distance < 30) {
          piece.style.left = (slotRect.left - container.getBoundingClientRect().left) + 'px';
          piece.style.top = (slotRect.top - container.getBoundingClientRect().top) + 'px';
          piece.classList.add('placed');
          
          setTimeout(() => {
            this.completeVerification(sessionId);
          }, 500);
        }
        
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });
  }

  // 完成验证
async completeVerification(sessionId) {
  if (window.VeriGate && window.VeriGate.debug) {
    console.log('[VeriGate] completeVerification called:', sessionId);
  }
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // 生成验证令牌
      const token = await this.generateToken(sessionId, session.config.siteKey);
      if (window.VeriGate && window.VeriGate.debug) {
        console.log('[VeriGate] token generated:', token);
      }
    if (window.VeriGate && window.VeriGate.debug) {
      console.log('[VeriGate] token generated:', token);
    }
      
      // 更新UI
      const widget = document.querySelector(`[data-session="${sessionId}"]`);
      const statusElement = widget.querySelector('.verigate-status');
      const challengeContainer = widget.querySelector(`#challenge-${sessionId}`);
      
      statusElement.textContent = '验证成功';
      widget.classList.add('verigate-success');
      
      challengeContainer.innerHTML = `
        <div class="verigate-success-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>验证完成</span>
        </div>
      `;
      
      // 标记会话为已解决
      session.solved = true;
      
      // 自动跳转模式
      if (session.config.autoRedirect) {
      if (window.VeriGate && window.VeriGate.debug) {
        console.log('[VeriGate] autoRedirect mode, verifying token and redirecting:', session.config.autoRedirect);
      }
        try {
          const res = await fetch(this.apiBase + '/verify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ token, siteKey: session.config.siteKey })
          });
          const data = await res.json();
          if (window.VeriGate && window.VeriGate.debug) {
            console.log('[VeriGate] token verify result:', data);
          }
          if (data.success) {
            window.location.href = session.config.autoRedirect;
          } else {
            this.showError(widget, '验证失败，请重试');
          }
        } catch (e) {
          this.showError(widget, '验证异常');
        }
      } else if (session.config.onSuccess) {
        if (window.VeriGate && window.VeriGate.debug) {
          console.log('[VeriGate] 调用 onSuccess 回调');
        }
        session.config.onSuccess(token);
      }
      
    } catch (error) {
      this.handleError(sessionId, error);
    }
  }

  // 生成验证令牌
  async generateToken(sessionId, siteKey) {
    const payload = {
      sessionId,
      siteKey,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      challenge: 'completed'
    };

    // 简单的令牌生成（生产环境应该使用更安全的方法）
    const token = CryptoJS.AES.encrypt(JSON.stringify(payload), 'verigate-secret').toString();
    
    return token;
  }

  // 显示错误
  showError(container, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'verigate-error';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  // 处理错误
  handleError(sessionId, error) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.error('VeriGate Error:', error);
    
    if (session.config.onError) {
      session.config.onError(error);
    }
  }

  // 验证令牌（客户端验证）
  async verifyToken(token, siteKey) {
    try {
      const response = await fetch(`${this.apiBase}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, siteKey })
      });

      return await response.json();
    } catch (error) {
      console.error('Token verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 重置验证
  reset(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const widget = document.querySelector(`[data-session="${sessionId}"]`);
    if (widget) {
      widget.classList.remove('verigate-success', 'verigate-loading');
      const challengeContainer = widget.querySelector(`#challenge-${sessionId}`);
      challengeContainer.innerHTML = this.createInitialChallenge();
      
      const statusElement = widget.querySelector('.verigate-status');
      statusElement.textContent = '验证中...';
      
      this.bindEvents(sessionId, widget.parentElement);
    }

    session.solved = false;
  }
}

// 创建全局实例
const veriGate = new VeriGate();

// 导出API
window.VeriGate = {
    render: (selector, options) => veriGate.render(selector, options),
    verify: (token, siteKey) => veriGate.verify(token, siteKey),
    reset: (sessionId) => veriGate.reset(sessionId)
};

// === VeriGate 全屏验证集成脚本 ===
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a.verigate-redirect, button.verigate-redirect').forEach(function(el) {
    el.addEventListener('click', function(e) {
      var url = el.getAttribute('href') || el.dataset.url;
      if(url){
        e.preventDefault();
        // 插入全屏遮罩
        if(!document.getElementById('verigate-fullscreen-mask')){
          var mask = document.createElement('div');
          mask.id = 'verigate-fullscreen-mask';
          mask.style = 'position:fixed;left:0;top:0;width:100vw;height:100vh;background:#fff;z-index:99998;';
          document.body.appendChild(mask);
        }
        // 隐藏页面主内容
        Array.from(document.body.children).forEach(function(node){
          if(node.id !== 'verigate-fullscreen-mask' && node.id !== 'verigate-container'){
            if(node.style) node.style.display = 'none';
          }
        });
        // 插入验证容器
        if(!document.getElementById('verigate-container')){
          var div = document.createElement('div');
          div.id = 'verigate-container';
          div.style = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;background:#fff;border-radius:8px;box-shadow:0 2px 16px rgba(0,0,0,0.15);';
          document.body.appendChild(div);
        }
        window.VeriGate.render('#verigate-container', { autoRedirect: url, mode: 'slider' });
      }
    });
  });
});
// === VeriGate 全屏验证集成脚本 END ===