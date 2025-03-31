const WebSocket = require("ws");
const crypto = require("crypto");
const QRCode = require("qrcode");
const createSpeck = require("generic-speck");
const merchantQRCodes = require("./machineSources.js");
const { banks } = require("./bank_details.js");

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
    const combinedData = parseInt(data.merchantID,16); // need to use current Time to encrypt
    console.log("Merchant ID in integer",combinedData);
    // Encrypt and properly handle the result
    const encryptedHex = speck.encrypt(combinedData, key);

    // Check what type of data is returned
    console.log("Type of encrypted result:", typeof encryptedHex);
    console.log("Encrypted Merchant ID:", encryptedHex);

    
    const qrCodeUrl = await QRCode.toDataURL(encryptedHex.toString());

    const fs = require("fs");
    const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, "");
    merchantQRCodes[data.merchantName] = qrCodeUrl; // saving QR codes using merchant name

    console.log(merchantQRCodes);
    console.log(Object.keys(merchantQRCodes).length);

    fs.writeFileSync("qrcode.png", base64Data, "base64");

    console.log("QR code saved as qrcode.png");
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
      const encryptedHex = data.encodedData.VMID;
      const encryptedToINT = parseInt(encryptedHex);
      console.log("Encrypted String Value:", encryptedHex);
      console.log("Encrypted Hex Type:", typeof encryptedHex);
      console.log("Parsed into int:", encryptedToINT); // 33 (decimal)

      // Now decode to text
      const decryptedText = speck.decrypt(encryptedToINT, key);
      console.log("Decrypted Text (merchant ID in):", decryptedText);
      const merchantID = decryptedText.toString(16); // Convert the integer back to a hexadecimal string
      console.log("Merchant ID in Hex:", merchantID);
      
      // Handle the transaction validation
      const resp = await validateTxnThroughBank(data,merchantID);
      if (resp.approvalStatus) {
        socket.send("Transaction Approved");
      } else {
        socket.send("Transaction Declined, reason: ", resp.approvalMessage);
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      socket.send("Transaction Processing Error");
    }
  }
};

const validateTxnThroughBank = (data, mID) => {
  return new Promise((resolve, reject) => {
    const bankSocket = new WebSocket("ws://localhost:8080"); // Connects to the bank socket

    // When the WebSocket connection opens, send the validation request
    bankSocket.onopen = () => {
      console.log("WebSocket opened, sending validation request...");
      bankSocket.send(
        JSON.stringify({
          type: "validateTxn",
          encodedData: data.encodedData,
          MID: mID,
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
