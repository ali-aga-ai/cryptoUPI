// sockets in ws are async so dont rely on ordering of code
const WebSocket = require("ws");
const crypto = require("crypto");
const {
  handleMerchant,
  handleUser,
  handleUPIMachine,
} = require("./bankServices");
const { banks } = require("./bank_details.js");

const turnOnBank = () => {
  const server = new WebSocket.Server({ port: 8080 });

  const users = {
    alice: {
      pwd: "password123",
      bankName: "HDFC",
      ifsc: "hdfc1",
      balance: 1122,
    },
    bob: { pwd: "hunter2", bankName: "HDFC", ifsc: "hdfc2", balance: 13213 },
  };

  const merchants = {};
  const machines = {};
  const txns = {};

  console.log("Users :  ", users);
  console.log("Merchants :  ", merchants);
  console.log("Machines :  ", machines);
  console.log("Txns :  ", txns);

  server.on("connection", (socket, req) => {
    // socket is the socket of the client who is connecting

    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;

    console.log(`Client connected with ip ${ip} and port ${port} `);

    socket.on("message", (message) => {
      const data = JSON.parse(message);
      console.log("Data received: ", data);
      if (data.userType == "user") {
        data.ip = ip;
        data.port = port;
        handleUser(socket, data, users);
      }
      if (data.userType == "merchant") {
        data.ip = ip;
        data.port = port;
        handleMerchant(socket, data, merchants);
      }
      if (data.userType == "machine") {
        data.ip = ip;
        data.port = port;
        handleUPIMachine(socket, data, machines, users, merchants);
      }
    });
  });
};
module.exports = { turnOnBank };
