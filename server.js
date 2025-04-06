// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { turnOnMachine, connectToBankMachine } = require("./machine");
const {
  connectToBankMerchant,
  connectToMachineMerchant,
} = require("./merchant");
const {
  connectToBankUser,
  connectToMachineUser,
  txnDetails,
} = require("./user");
const { turnOnBank } = require("./bank");

// Initialize express app and server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/api/bank/turnOn', (req, res) => {
    // some logic to turn on bank
    res.json({ success: true }); // ✅ Make sure it's JSON
});
app.post('/api/user/connectToBank', (req, res) => {
    // some logic to turn on bank
    res.json({ success: true }); // ✅ Make sure it's JSON
});
app.post('/api/merchant/register', (req, res) => {
    // some logic to turn on bank
    res.json({ success: true }); // ✅ Make sure it's JSON
});
app.post('/api/machine/turnOn', (req, res) => {
    // some logic to turn on bank
    res.json({ success: true }); // ✅ Make sure it's JSON
});
app.post('/api/merchant/generateQR', (req, res) => {
    // some logic to turn on bank
    res.json({ success: true }); // ✅ Make sure it's JSON
});


// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Banker role
  socket.on('turnOnBank', async () => {
    try {
      await turnOnBank();
      socket.emit('bankStatus', { status: 'Running' });
      console.log('Bank server running');
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Bank error:', error);
    }
  });
  
  // User role
  socket.on('connectToBankUser', async (data) => {
    try {
      const userDetails = await connectToBankUser(data);
      socket.emit('userConnected', userDetails);
      console.log('User connected:', userDetails);
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('User connection error:', error);
    }
  });
  
  socket.on('txnDetails', async (data) => {
    try {
      // If txnDetails in your original code accepts parameters, pass them
      const transactionData = await txnDetails(data);
      socket.emit('transactionUpdate', transactionData);
      console.log('Transaction:', transactionData);
      
      // Connect to machine user
      await connectToMachineUser(transactionData);
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Transaction error:', error);
    }
  });
  
  // Merchant role
  socket.on('connectToBankMerchant', async (data) => {
    try {
      const merchantDetails = await connectToBankMerchant(data);
      socket.emit('merchantConnected', merchantDetails);
      console.log('Merchant connected');
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Merchant connection error:', error);
    }
  });
  
  // Machine role
  socket.on('turnOnMachine', async (data) => {
    try {
      await turnOnMachine(data);
      socket.emit('machineStatus', { status: 'On' });
      console.log('Machine turned on');
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Machine error:', error);
    }
  });
  
  socket.on('connectToBankMachine', async (data) => {
    try {
      const machineDetails = await connectToBankMachine(data);
      socket.emit('machineStatus', { status: 'Connected', details: machineDetails });
      console.log('Machine connected to bank');
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.error('Machine connection error:', error);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});