const WebSocket = require("ws");
const crypto = require("crypto");
const QRCode = require("qrcode");
const createSpeck = require("generic-speck");

const handleMerchant = (socket, data) => {
  const speck = createSpeck(32); // Initialize the Speck cipher with a 32-bit block size
  const key = "1234567890abcdef1234567890abcdef"; // 128-bit key

  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;

    const currentTime = new Date().getTime();
    const combinedData = data.merchantID.toString() + currentTime.toString();
    // Convert data and key to Uint8Array
    const plaintext = new TextEncoder().encode(combinedData);
    const keyArray = new TextEncoder().encode(key);

    const VMID = speck.encrypt(plaintext, keyArray);

    // Convert encrypted data to base64 for QR compatibility
    const VMIDBase64 = Buffer.from(VMID).toString("base64");

    QRCode.toDataURL(VMIDBase64, (err, url) => {
      if (err) {
        console.error("QR Code Error:", err);
        return;
      }
      socket.send(url);
    });
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
