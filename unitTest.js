// sender.js
const net = require('net');
const readline = require('readline');

const client = net.createConnection({ host: '192.168.118.65', port: 8080 }, () => {
  console.log('Connected to receiver');
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (line) => {
  client.write(line);
});
