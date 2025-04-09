// sockets in ws are async so don't rely on ordering of code
const WebSocket = require("ws");
const crypto = require("crypto");
const os = require("os");
const fs = require("fs");

const {
  handleMerchant,
  handleUser,
  handleUPIMachine,
  handleBalanceEnquiry,
} = require("./bankServices");

const { banks } = require("./bank_details.js");
const merchants = require("./bank_state");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces).flat()) {
    if (iface.family === "IPv4" && !iface.internal) return iface.address;
  }
  return "127.0.0.1";
}

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
  const roles = {};
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

  console.log("Users:", users);
  console.log("Merchants:", merchants);
  console.log("Machines:", machines);
  console.log("Txns:", txns);
  console.log("Roles:", roles);

  const server = new WebSocket.Server({ port: 8081 }, () => {
    const ip = getLocalIP();
    const bankKey = `${ip}:8081`;
    roles[bankKey] = "banker";
    console.log(`Bank WebSocket server running on ws://${bankKey}`);
  });

  server.on("connection", (socket, req) => {
    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;

    console.log(`WebSocket client connected with IP ${ip} and port ${port}`);

    socket.on("message", (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch (e) {
        console.error("Invalid JSON:", msg.toString());
        return;
      }

      data.ip = ip;
      data.port = port;

      if (data.userType === "user") handleUser(socket, data, users);
      else if (data.userType === "merchant") handleMerchant(socket, data, merchants);
      else if (data.userType === "machine") handleUPIMachine(socket, data, machines, users, merchants);
      else if (data.type === "view_balance") handleBalanceEnquiry(socket, data, users);
    });

    socket.on("close", () => {
      console.log(`Client disconnected: ${ip}:${port}`);
    });
  });
};

module.exports = { turnOnBank };
