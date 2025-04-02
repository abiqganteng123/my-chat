const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api', require('./routes/api'));

// Socket.io
const Message = require('./models/Message');
const User = require('./models/User');

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join room
  socket.on('join', async ({ username, room }) => {
    socket.join(room);
    
    // Save user to DB
    const user = new User({ 
      socketId: socket.id, 
      username, 
      room,
      status: 'online'
    });
    await user.save();
    
    // Broadcast user joined
    socket.broadcast.to(room).emit('message', {
      username: 'System',
      text: `${username} has joined the chat`,
      type: 'notification'
    });

    // Send previous messages
    const messages = await Message.find({ room }).sort({ createdAt: 1 }).limit(100);
    socket.emit('previousMessages', messages);
  });

  // Handle new message
  socket.on('sendMessage', async ({ username, room, text, type, file }) => {
    const message = new Message({
      username,
      room,
      text,
      type,
      file
    });
    await message.save();
    
    io.to(room).emit('message', message);
  });

  // Handle file upload
  socket.on('uploadFile', async ({ username, room, fileData, fileName, fileType }) => {
    const message = new Message({
      username,
      room,
      text: fileName,
      type: fileType,
      file: fileData
    });
    await message.save();
    
    io.to(room).emit('message', message);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    const user = await User.findOneAndDelete({ socketId: socket.id });
    if (user) {
      io.to(user.room).emit('message', {
        username: 'System',
        text: `${user.username} has left the chat`,
        type: 'notification'
      });
      
      io.to(user.room).emit('userLeft', user.username);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));