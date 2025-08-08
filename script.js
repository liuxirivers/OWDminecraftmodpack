document.addEventListener('DOMContentLoaded', function() {
    // 缓存DOM元素引用以提高性能
    const elements = {
        // 导航元素
        introBtn: document.getElementById('introBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        feedbackBtn: document.getElementById('feedbackBtn'),
        introSection: document.getElementById('introSection'),
        downloadSection: document.getElementById('downloadSection'),
        commentsSection: document.getElementById('commentsSection'),
        
        // 评论系统元素
        loginBtn: document.getElementById('loginBtn'),
        registerBtn: document.getElementById('registerBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        loginPrompt: document.getElementById('loginPrompt'),
        commentForm: document.getElementById('commentForm'),
        submitBtn: document.getElementById('submitBtn'),
        commentInput: document.getElementById('commentInput'),
        imageUrl: document.getElementById('imageUrl'),
        imagePreview: document.getElementById('imagePreview'),
        commentsList: document.getElementById('commentsList'),
        currentUser: document.getElementById('currentUser'),
        injectionWarning: document.getElementById('injectionWarning'),
        deleteCommentsBtn: document.getElementById('deleteCommentsBtn'),
        
        // 模态框元素
        registerModal: document.getElementById('registerModal'),
        loginModal: document.getElementById('loginModal'),
        deleteCommentsModal: document.getElementById('deleteCommentsModal'),
        closeRegister: document.getElementById('closeRegister'),
        closeLogin: document.getElementById('closeLogin'),
        closeDeleteModal: document.getElementById('closeDeleteModal'),
        registerForm: document.getElementById('registerForm'),
        loginForm: document.getElementById('loginForm'),
        deleteCommentsForm: document.getElementById('deleteCommentsForm'),
        
        // 错误信息元素
        regUsernameError: document.getElementById('regUsernameError'),
        regPasswordError: document.getElementById('regPasswordError'),
        regConfirmError: document.getElementById('regConfirmError'),
        loginError: document.getElementById('loginError'),
        deleteError: document.getElementById('deleteError')
    };

    // 数据存储
    let users = JSON.parse(localStorage.getItem('owd_users')) || {};
    let comments = JSON.parse(localStorage.getItem('owd_comments')) || [];
    let currentUserId = localStorage.getItem('owd_currentUserId');
    
    // 管理员密码验证
    function decodeAdminKey(encoded) {
        let key = '';
        for (let i = 0; i < encoded.length; i++) {
            key += String.fromCharCode(encoded.charCodeAt(i) - 1);
        }
        return key;
    }
    
    const adminKey = decodeAdminKey('234bcdRR');
    
    // 防注入函数
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
    }
    
    function detectMaliciousCode(input) {
        if (!input) return false;
        const maliciousPatterns = [
            /<script.*?>.*?<\/script>/gi,
            /<iframe.*?>.*?<\/iframe>/gi,
            /<img.*?onerror.*?>/gi,
            /<.*?on\w+.*?>/gi,
            /javascript:/gi,
            /data:/gi
        ];
        
        return maliciousPatterns.some(pattern => pattern.test(input));
    }
    
    function isValidImageUrl(url) {
        if (!url) return true;
        
        try {
            new URL(url);
        } catch (e) {
            return false;
        }
        
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;
        }
        
        const validExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
        return validExtensions.test(urlObj.pathname);
    }
    
    // 渲染评论
    function renderComments() {
        if (comments.length === 0) {
            elements.commentsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无评论，快来发表你的看法吧！</div>';
            return;
        }
        
        // 使用文档片段减少DOM重绘
        const fragment = document.createDocumentFragment();
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-item';
            
            let imageHtml = '';
            if (comment.image && isValidImageUrl(comment.image)) {
                imageHtml = `<img class="comment-image" src="${escapeHtml(comment.image)}" alt="用户上传的图片">`;
            }
            
            const authorElement = document.createElement('div');
            authorElement.className = 'comment-author';
            
            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = comment.username;
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'comment-date';
            dateSpan.textContent = comment.date;
            
            authorElement.appendChild(usernameSpan);
            authorElement.appendChild(dateSpan);
            
            const contentElement = document.createElement('div');
            contentElement.className = 'comment-content';
            contentElement.textContent = comment.content;
            
            commentElement.appendChild(authorElement);
            commentElement.appendChild(contentElement);
            
            if (imageHtml) {
                const imageContainer = document.createElement('div');
                imageContainer.innerHTML = imageHtml;
                commentElement.appendChild(imageContainer);
            }
            
            fragment.appendChild(commentElement);
        });
        
        elements.commentsList.innerHTML = '';
        elements.commentsList.appendChild(fragment);
    }
    
    // 初始化页面
    renderComments();
    
    // 检查登录状态
    if (currentUserId && users[currentUserId]) {
        elements.loginPrompt.style.display = 'none';
        elements.commentForm.style.display = 'block';
        elements.currentUser.textContent = escapeHtml(users[currentUserId].username);
    }
    
    // 导航按钮功能
    elements.introBtn.addEventListener('click', () => {
        elements.introSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    elements.downloadBtn.addEventListener('click', () => {
        elements.downloadSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    elements.feedbackBtn.addEventListener('click', () => {
        elements.commentsSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    // 评论删除相关事件
    elements.deleteCommentsBtn.addEventListener('click', () => {
        elements.deleteCommentsModal.style.display = 'block';
        elements.deleteError.style.display = 'none';
        document.getElementById('deletePassword').value = '';
    });
    
    elements.closeDeleteModal.addEventListener('click', () => {
        elements.deleteCommentsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === elements.deleteCommentsModal) {
            elements.deleteCommentsModal.style.display = 'none';
        }
    });
    
    elements.deleteCommentsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('deletePassword').value;
        
        if (password === adminKey) {
            if (confirm('确定要删除所有评论吗？此操作不可恢复！')) {
                comments = [];
                localStorage.setItem('owd_comments', JSON.stringify(comments));
                renderComments();
                elements.deleteCommentsModal.style.display = 'none';
                alert('所有评论已成功删除');
            }
        } else {
            elements.deleteError.style.display = 'block';
        }
    });
    
    // 登录注册相关事件
    elements.loginBtn.addEventListener('click', () => {
        elements.loginModal.style.display = 'block';
    });
    
    elements.registerBtn.addEventListener('click', () => {
        elements.registerModal.style.display = 'block';
    });
    
    elements.closeRegister.addEventListener('click', () => {
        elements.registerModal.style.display = 'none';
        resetRegisterForm();
    });
    
    elements.closeLogin.addEventListener('click', () => {
        elements.loginModal.style.display = 'none';
        elements.loginError.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === elements.registerModal) {
            elements.registerModal.style.display = 'none';
            resetRegisterForm();
        }
        if (event.target === elements.loginModal) {
            elements.loginModal.style.display = 'none';
            elements.loginError.style.display = 'none';
        }
    });
    
    // 注册表单提交
    elements.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (detectMaliciousCode(username) || detectMaliciousCode(email)) {
            alert('用户名或邮箱包含不允许的内容');
            return;
        }
        
        if (checkUsernameExists(username)) {
            elements.regUsernameError.style.display = 'block';
            return;
        } else {
            elements.regUsernameError.style.display = 'none';
        }
        
        if (password.length < 6) {
            elements.regPasswordError.style.display = 'block';
            return;
        } else {
            elements.regPasswordError.style.display = 'none';
        }
        
        if (password!== confirmPassword) {
            elements.regConfirmError.style.display = 'block';
            return;
        } else {
            elements.regConfirmError.style.display = 'none';
        }
        
        const userId = Date.now().toString();
        users[userId] = {
            id: userId,
            username: escapeHtml(username),
            email: escapeHtml(email),
            password: password
        };
        
        localStorage.setItem('owd_users', JSON.stringify(users));
        currentUserId = userId;
        localStorage.setItem('owd_currentUserId', currentUserId);
        
        elements.loginPrompt.style.display = 'none';
        elements.commentForm.style.display = 'block';
        elements.currentUser.textContent = users[userId].username;
        
        elements.registerModal.style.display = 'none';
        alert('注册成功！已自动登录');
        resetRegisterForm();
    });
    
    // 登录表单提交
    elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        const userId = findUserIdByUsername(username);
        if (userId && users[userId].password === password) {
            currentUserId = userId;
            localStorage.setItem('owd_currentUserId', currentUserId);
            
            elements.loginPrompt.style.display = 'none';
            elements.commentForm.style.display = 'block';
            elements.currentUser.textContent = users[userId].username;
            
            elements.loginModal.style.display = 'none';
            elements.loginForm.reset();
            elements.loginError.style.display = 'none';
        } else {
            elements.loginError.style.display = 'block';
        }
    });
    
    // 退出登录
    elements.logoutBtn.addEventListener('click', () => {
        currentUserId = null;
        localStorage.removeItem('owd_currentUserId');
        
        elements.loginPrompt.style.display = 'block';
        elements.commentForm.style.display = 'none';
        
        alert('已成功退出登录');
    });
    
    // 图片预览
    elements.imageUrl.addEventListener('input', () => {
        const url = elements.imageUrl.value.trim();
        if (url) {
            if (!isValidImageUrl(url)) {
                elements.imagePreview.style.display = 'none';
                alert('请输入有效的图片URL（仅支持http/https协议和常见图片格式）');
                return;
            }
            elements.imagePreview.src = url;
            elements.imagePreview.style.display = 'block';
        } else {
            elements.imagePreview.style.display = 'none';
        }
    });
    
    // 提交评论
    elements.submitBtn.addEventListener('click', () => {
        const content = elements.commentInput.value.trim();
        const imageUrlValue = elements.imageUrl.value.trim();
        
        if (!content &&!imageUrlValue) {
            alert('请输入评论内容或提供图片链接');
            return;
        }
        
        if (detectMaliciousCode(content)) {
            elements.injectionWarning.style.display = 'block';
            return;
        } else {
            elements.injectionWarning.style.display = 'none';
        }
        
        if (imageUrlValue &&!isValidImageUrl(imageUrlValue)) {
            alert('请输入有效的图片URL（仅支持http/https协议和常见图片格式）');
            return;
        }
        
        const now = new Date();
        const comment = {
            id: Date.now(),
            userId: currentUserId,
            username: users[currentUserId].username,
            content: escapeHtml(content),
            image: imageUrlValue,
            date: now.toLocaleString()
        };
        
        comments.unshift(comment);
        localStorage.setItem('owd_comments', JSON.stringify(comments));
        
        elements.commentInput.value = '';
        elements.imageUrl.value = '';
        elements.imagePreview.style.display = 'none';
        
        renderComments();
    });
    
    // 辅助函数
    function checkUsernameExists(username) {
        for (const userId in users) {
            if (users[userId].username === username) {
                return true;
            }
        }
        return false;
    }
    
    function findUserIdByUsername(username) {
        for (const userId in users) {
            if (users[userId].username === username) {
                return userId;
            }
        }
        return null;
    }
    
    function resetRegisterForm() {
        elements.registerForm.reset();
        elements.regUsernameError.style.display = 'none';
        elements.regPasswordError.style.display = 'none';
        elements.regConfirmError.style.display = 'none';
    }
});
    
