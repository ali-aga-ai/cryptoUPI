const WebSocket = require("ws");
const crypto = require("crypto");
const QRCode = require("qrcode");
const createSpeck = require("generic-speck");
const merchantQRCodes  = require("./machineSources.js");

const handleMerchant = async (socket, data) => {
  const speck = createSpeck(32); // Initialize the Speck cipher with a 32-bit block size
  const key = "1234567890abcdef1234567890abcdef"; // 128-bit key
  const keyArray = new TextEncoder().encode(key);
  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;

    const currentTime = new Date().getTime();
    console.log(data)
    const combinedData = data.merchantID + currentTime.toString();
    // Convert data and key to Uint8Array
    console.log(combinedData)
    const encoder = new TextEncoder();
    let dataBytes = encoder.encode(combinedData);
    dataBytes = dataBytes.slice(0, 16);
    var encryptedBytes = speck.encrypt(dataBytes, keyArray);
    encryptedBytes=encryptedBytes.toString();
    const VMIDBuffer = Buffer.from(encryptedBytes);
    const VMIDBase64 = VMIDBuffer.toString("base64");
    const qrCodeUrl = await QRCode.toDataURL(VMIDBase64);
    const fs = require("fs");
    const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, "");
    merchantQRCodes[data.merchantName] = qrCodeUrl; // saving QR codes using merchant name
    console.log(merchantQRCodes)
    console.log(Object.keys(merchantQRCodes).length)
    fs.writeFileSync("qrcode.png", base64Data, "base64");
    console.log("QR code saved as qrcode.png");
  }
};

const handleUser = (socket, data, bankSocket) => {
  if (data.type == "txn") {
    const identifier = data.ip + ":" + data.port;
    const VMIDBase64 = data.VMIDBase64
    const encryptedVMID = Buffer.from(VMIDBase64, "base64");
    const decryptedBytes = speck.decrypt(encryptedVMID, keyArray);
    const decryptedText = new TextDecoder().decode(decryptedBytes);
    console.log("Decrypted Text:", decryptedText);
    // Extract 16-digit Merchant ID
    const mID = decryptedText.match(/^[0-9A-Fa-f]{16}/)[0];//this may not work chk once
    console.log("Extracted Merchant ID:", mID);

    const resp = validateTxnThroughBank(bankSocket, data,mID);
    if (resp.approvalStatus) {
      socket.send("Transaction Approved");
    } else {
      socket.send("Transaction Declined, reason: ", resp.approvalMessage);
    }
  }
};

const validateTxnThroughBank = (bankSocket, data,mID) => {
  bankSocket.send(
    JSON.stringify({
      type: "validateTxn",
      encodedData: data.encodedData,
      MID: mID,//modify this based on how and where msg is going.
    })
  );

  bankSocket.onmessage = (event) => {
    return event.data;
  };
};

module.exports = { handleMerchant, handleUser };
