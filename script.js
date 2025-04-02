// Inisialisasi Socket.io
const socket = io();

// Elemen DOM
const joinForm = document.getElementById('joinForm');
const usernameInput = document.getElementById('username');
const countryInput = document.getElementById('country');
const roomInput = document.getElementById('room');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const userAvatar = document.getElementById('userAvatar');
const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarCountry = document.getElementById('sidebarCountry');
const roomTitle = document.getElementById('roomTitle');
const onlineCount = document.getElementById('onlineCount');
const onlineCountHeader = document.getElementById('onlineCountHeader');
const usersContainer = document.getElementById('usersContainer');
const usersBtn = document.getElementById('usersBtn');
const fileModal = document.getElementById('fileModal');
const attachmentBtn = document.getElementById('attachmentBtn');
const fileModalClose = document.getElementById('fileModalClose');
const cancelUpload = document.getElementById('cancelUpload');
const confirmUpload = document.getElementById('confirmUpload');
const filePreview = document.getElementById('filePreview');
const previewImage = document.getElementById('previewImage');
const fileInfo = document.getElementById('fileInfo');
const photoInput = document.getElementById('photoInput');
const videoInput = document.getElementById('videoInput');
const docInput = document.getElementById('docInput');
const menuItems = document.querySelectorAll('.menu-item');

// Data Pengguna
let currentUser = {
    username: '',
    country: '',
    room: 'general'
};

// Join Chat
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    currentUser = {
        username: usernameInput.value.trim(),
        country: countryInput.value,
        room: roomInput.value
    };
    
    // Simpan ke localStorage
    localStorage.setItem('chatUser', JSON.stringify(currentUser));
    
    // Join room
    socket.emit('join', {
        username: currentUser.username,
        room: currentUser.room
    });
    
    // Redirect ke halaman chat
    window.location.href = 'diskusi.html';
});

// Jika sudah di halaman chat
if (window.location.pathname.includes('diskusi.html')) {
    // Load user data dari localStorage
    const savedUser = JSON.parse(localStorage.getItem('chatUser'));
    if (savedUser) {
        currentUser = savedUser;
        
        // Update UI
        userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        sidebarUsername.textContent = currentUser.username;
        sidebarCountry.textContent = getCountryName(currentUser.country);
        roomTitle.textContent = `#${getRoomName(currentUser.room)}`;
        
        // Join room
        socket.emit('join', {
            username: currentUser.username,
            room: currentUser.room
        });
    } else {
        // Redirect ke halaman awal jika tidak ada data user
        window.location.href = 'index.html';
    }
}

// Fungsi helper
function getCountryName(code) {
    const countries = {
        'ID': 'Indonesia',
        'MY': 'Malaysia',
        'SG': 'Singapura',
        'US': 'Amerika Serikat',
        'GB': 'Inggris',
        'JP': 'Jepang',
        'KR': 'Korea Selatan',
        'other': 'Lainnya'
    };
    return countries[code] || 'Lainnya';
}

function getRoomName(room) {
    const rooms = {
        'general': 'Umum',
        'technology': 'Teknologi',
        'games': 'Game',
        'movies': 'Film & TV',
        'music': 'Musik',
        'sports': 'Olahraga'
    };
    return rooms[room] || room;
}

// Socket.io Events
socket.on('message', (message) => {
    displayMessage(message);
});

socket.on('previousMessages', (messages) => {
    messages.forEach(message => {
        displayMessage(message);
    });
});

socket.on('userList', (users) => {
    updateOnlineUsers(users);
});

socket.on('userJoined', (username) => {
    displaySystemMessage(`${username} bergabung dalam chat`);
});

socket.on('userLeft', (username) => {
    displaySystemMessage(`${username} meninggalkan chat`);
});

// Fungsi untuk menampilkan pesan
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.username === currentUser.username ? 'sent' : 'received'}`;
    
    let contentHTML = '';
    
    if (message.type === 'text' || message.type === 'notification') {
        contentHTML = `<div class="message-text">${message.text}</div>`;
    } else if (message.type === 'image') {
        contentHTML = `
            <div class="message-text">${message.text}</div>
            <img src="${message.file}" class="message-image" alt="Gambar">
        `;
    } else if (message.type === 'video') {
        contentHTML = `
            <div class="message-text">${message.text}</div>
            <video controls width="100%" class="message-video">
                <source src="${message.file}" type="video/mp4">
                Browser tidak mendukung video.
            </video>
        `;
    } else if (message.type === 'file') {
        contentHTML = `
            <div class="message-text">${message.text}</div>
            <a href="${message.file}" class="message-file" download>
                <i class="fas fa-file-download"></i>
                <div class="message-file-info">
                    <h5>${message.text}</h5>
                    <p>File</p>
                </div>
            </a>
        `;
    }
    
    messageElement.innerHTML = `
        <div class="message-info">
            <div class="message-avatar">${message.username.charAt(0).toUpperCase()}</div>
            <span class="message-sender">${message.username}</span>
            <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="message-content">
            ${contentHTML}
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displaySystemMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">${text}</div>
        </div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateOnlineUsers(users) {
    onlineCount.textContent = users.length;
    onlineCountHeader.textContent = `${users.length} online`;
    
    usersContainer.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'online-user';
        userElement.innerHTML = `
            <div class="online-user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="online-user-info">
                <h4>${user.username}</h4>
                <p>${user.room}</p>
            </div>
        `;
        usersContainer.appendChild(userElement);
    });
}

// Kirim pesan
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('sendMessage', {
            username: currentUser.username,
            room: currentUser.room,
            text: message,
            type: 'text'
        });
        messageInput.value = '';
        messageInput.style.height = 'auto';
    }
}

// Event listeners
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

// Toggle sidebar di mobile
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Menu items untuk ganti room
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const room = item.getAttribute('data-room');
        if (room !== currentUser.room) {
            currentUser.room = room;
            localStorage.setItem('chatUser', JSON.stringify(currentUser));
            
            // Leave current room dan join baru
            socket.emit('leaveRoom', currentUser.room);
            socket.emit('join', {
                username: currentUser.username,
                room: currentUser.room
            });
            
            // Update UI
            roomTitle.textContent = `#${getRoomName(currentUser.room)}`;
            messagesContainer.innerHTML = '';
            
            // Update active menu item
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        }
    });
});

// File upload
attachmentBtn.addEventListener('click', () => {
    fileModal.classList.add('active');
});

fileModalClose.addEventListener('click', () => {
    fileModal.classList.remove('active');
    resetFileUpload();
});

cancelUpload.addEventListener('click', () => {
    fileModal.classList.remove('active');
    resetFileUpload();
});

function resetFileUpload() {
    filePreview.classList.remove('active');
    photoInput.value = '';
    videoInput.value = '';
    docInput.value = '';
}

// Handle file selection
photoInput.addEventListener('change', handleFileSelect);
videoInput.addEventListener('change', handleFileSelect);
docInput.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            if (e.target.id === 'photoInput') {
                previewImage.src = event.target.result;
                fileInfo.innerHTML = `
                    <h5>${file.name}</h5>
                    <p>${(file.size / 1024).toFixed(2)} KB</p>
                `;
            } else {
                previewImage.src = 'https://via.placeholder.com/300x150?text=File+Preview';
                fileInfo.innerHTML = `
                    <h5>${file.name}</h5>
                    <p>${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                `;
            }
            filePreview.classList.add('active');
        };
        
        if (e.target.id === 'photoInput') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }
}

// Confirm file upload
confirmUpload.addEventListener('click', () => {
    let fileInput;
    let fileType;
    
    if (photoInput.files.length > 0) {
        fileInput = photoInput;
        fileType = 'image';
    } else if (videoInput.files.length > 0) {
        fileInput = videoInput;
        fileType = 'video';
    } else if (docInput.files.length > 0) {
        fileInput = docInput;
        fileType = 'file';
    } else {
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        socket.emit('uploadFile', {
            username: currentUser.username,
            room: currentUser.room,
            fileData: event.target.result,
            fileName: file.name,
            fileType: fileType
        });
    };
    
    reader.readAsDataURL(file);
    
    fileModal.classList.remove('active');
    resetFileUpload();
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});