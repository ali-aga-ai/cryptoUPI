const WebSocket = require("ws");
const crypto = require("crypto");
const QRCode = require("qrcode");
const createSpeck = require("generic-speck");
const merchantQRCodes = require("./machineSources.js");
const { banks } = require("./bank_details.js");
const merchantSockets = {};
const { IPs } = require("./ip.js");

const handleMerchant = async (socket, data) => {
  const speck = createSpeck({
    bits: 16,
    rounds: 22,
    rightRotations: 7,
    leftRotations: 2,
  });
  const key = [0x0100, 0x0908, 0x1110, 0x1918];

  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;

    const currentTime = new Date().getTime();
    console.log("Merchant ID in hex", data.merchantID);
    
    // Create a unique ID that combines merchant ID and a checksum
    // This approach uses a hash of the merchant ID as a checksum
    const merchantIDHex = data.merchantID.padStart(16, '0'); // Ensure 16 characters (64 bits)
    const checksum = crypto.createHash('md5').update(merchantIDHex).digest('hex').substring(0, 8);
    const uniqueID = `${merchantIDHex}-${checksum}`;
    
    console.log("Unique ID with checksum:", uniqueID);
    
    // Generate QR code directly with this unique ID
    const qrCodeUrl = await QRCode.toDataURL(uniqueID);

    const fs = require("fs");
    const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, "");
    merchantQRCodes[data.merchantName] = qrCodeUrl; // saving QR codes using merchant name

    console.log(merchantQRCodes);
    console.log(Object.keys(merchantQRCodes).length);

    fs.writeFileSync("qrcode.png", base64Data, "base64");

    console.log("QR code saved as qrcode.png");
    merchantSockets[data.merchantID] = socket;
    socket.send(
      JSON.stringify({
        type: "qrCodeUrl",
        url: qrCodeUrl,
      })
    );
  }
};

const handleUser = async (socket, data) => {
  const speck = createSpeck({
    bits: 16,
    rounds: 22,
    rightRotations: 7,
    leftRotations: 2,
  });
  const key = [0x0100, 0x0908, 0x1110, 0x1918];

  if (data.type == "txn") {
    try {
      console.log(data);
      const encodedData = data.encodedData.VMID;
      
      // Parse the merchant ID directly from the QR code data
      // Expected format: "merchantIDHex-checksum"
      const parts = encodedData.split('-');
      
      if (parts.length !== 2) {
        throw new Error("Invalid QR code format. Expected merchantID-checksum format.");
      }
      
      const merchantIDHex = parts[0];
      const receivedChecksum = parts[1];
      
      // Verify the checksum to ensure data integrity
      const calculatedChecksum = crypto.createHash('md5').update(merchantIDHex).digest('hex').substring(0, 8);
      
      if (receivedChecksum !== calculatedChecksum) {
        throw new Error("Checksum verification failed. The QR code data may be corrupted.");
      }
      
      console.log("Verified merchant ID from QR code:", merchantIDHex);
      const merchantID = merchantIDHex;
      
      // Handle the transaction validation
      const resp = await validateTxnThroughBank(data, merchantID);
      if (resp.approvalStatus) {
        socket.send("Transaction Approved");
        const merchantSocket = merchantSockets[merchantID];
        if (merchantSocket && merchantSocket.readyState === WebSocket.OPEN) {
          merchantSocket.send(JSON.stringify({
            type : "txn_approved",
            message: "Transaction Approved by User",
            txnDetails: resp.txnDetails,
          }));
        }
      } else {
        socket.send(`Transaction Declined, reason: ${resp.approvalMessage}`);
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      socket.send("Transaction Processing Error: " + error.message);
    }
  }
};

const validateTxnThroughBank = (data, merchantID) => {
  return new Promise((resolve, reject) => {
    const bankSocket = new WebSocket(IPs.BANK); // Connects to the bank socket

    // When the WebSocket connection opens, send the validation request
    bankSocket.onopen = () => {
      console.log("WebSocket opened, sending validation request...");
      bankSocket.send(
        JSON.stringify({
          type: "validateTxn",
          encodedData: data.encodedData,
          MID: merchantID,
          userType: "machine"
        })
      );
    };

    // When a message is received from the WebSocket, resolve the promise
    bankSocket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data); // Assuming the response is JSON
        resolve(response); // Resolving with the response
      } catch (error) {
        reject("Error parsing WebSocket response"); // Reject the promise on error
      }
    };

    // Handle any WebSocket errors
    bankSocket.onerror = (error) => {
      reject(error); // Reject the promise if there's a WebSocket error
    };

    // Handle WebSocket closure
    bankSocket.onclose = () => {
      console.log("WebSocket connection closed.");
    };
  });
};

module.exports = { handleMerchant, handleUser };