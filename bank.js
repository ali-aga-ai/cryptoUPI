// sockets in ws are async so dont rely on ordering of code
const WebSocket = require("ws");
const crypto = require("crypto");
const {
  handleMerchant,
  handleUser,
  handleUPIMachine,
  handleBalanceEnquiry,
} = require("./bankServices");
const { banks } = require("./bank_details.js");
const merchants = require("./bank_state");

const fs = require("fs");
const KEY_PATH = "./bank_rsa_keys";
// Load existing keys or generate new ones
let publicKey, privateKey;
if (fs.existsSync(`${KEY_PATH}_public.pem`)) {
  publicKey = fs.readFileSync(`${KEY_PATH}_public.pem`, "utf8");
  privateKey = fs.readFileSync(`${KEY_PATH}_private.pem`, "utf8");
} else {
  const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  fs.writeFileSync(`${KEY_PATH}_public.pem`, pub);
  fs.writeFileSync(`${KEY_PATH}_private.pem`, priv);
  publicKey = pub;
  privateKey = priv;
}

global.bankPrivateKey = privateKey;
global.bankPublicKey = publicKey;
const turnOnBank = () => {
  const server = new WebSocket.Server({ port: 8080 });

  const users = {
    alice: {
      pwd: "password123",
      mmid: "1024",
      uid: "1234",
      phoneNum: "0123456789",
      bankName: "HDFC",
      ifsc: "hdfc1",
      balance: 1122,
      PIN: "1234",
    },
    bob: { pwd: "hunter2", bankName: "HDFC", ifsc: "hdfc2", balance: 13213 },
  };

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
      if (data.type == "view_balance"){
        handleBalanceEnquiry(socket, data, users);        
      }
    });
  });
};
module.exports = { turnOnBank };
