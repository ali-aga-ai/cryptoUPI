const WebSocket = require("ws");
const { handleMerchant, handleUser } = require("./machineServices");
const merchantQRCodes = require("./machineSources.js");
const {getLocalIP} = require("./getIP")
const { IPs } = require("./ip.js");
const { exec } = require('child_process');

const connectToBankMachine = () =>{
exec('python3 speck1.py', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Output: ${stdout}`);
});
  const socket = new WebSocket(IPs.BANK);
    socket.onopen = () => {
        // on open, it sends a message to the server
        socket.send(
          JSON.stringify({
            type: "init",
            userType: "machine",
          })
        );
        console.log("Connected to server");
      };
      
      socket.onmessage = (event) => {
        console.log("Message from server:", event.data); // if it receives a message from the server, it logs it
      };
      
};

const turnOnMachine = () => {
  const machineServer = new WebSocket.Server({ port: 8082 });
  console.log("Machine server is on");
  console.log(getLocalIP())
  machineServer.on("connection", (socket, req) => {
    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;

    console.log(`Client connected with IP ${ip} and port ${port}`);

    socket.on("message", (message) => {
      const data = JSON.parse(message);

      if (data.userType === "merchant") {
        data.ip = ip;
        data.port = port;
        handleMerchant(socket, data);
      }

      if (data.userType === "user") {
        data.ip = ip;
        data.port = port;
        handleUser(socket, data);
      }

      if (data.event === "getQRCodeUrl") {  
        const qrCodeUrl = merchantQRCodes[data.merchantName] || "Not found";
        socket.send(JSON.stringify({ event: "qrCodeUrl", url: qrCodeUrl }));
      }
    });
  });
};

module.exports =  {connectToBankMachine, turnOnMachine};
