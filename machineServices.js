const WebSocket = require("ws");
const crypto = require("crypto");
const QRCode = require("qrcode");
const createSpeck = require("generic-speck");
const merchantQRCodes = require("./machineSources.js");
const { banks } = require("./bank_details.js");
const merchantSockets = {};
const { IPs } = require("./ip.js");
const axios = require('axios');
const fs = require("fs");

const handleMerchant = async (socket, data) => {
  if (data.type == "init") {
    try {
      console.log("Merchant ID in hex", data.merchantID);

      const res = await axios.post('http://localhost:5000/encrypt', {
        plaintext: data.merchantID
      });

      const uniqueID = res.data.ciphertext.toString();

      console.log(res.data)
      console.log(res.data.ciphertext)
      console.log("VMID is: " ,uniqueID)

      const qrCodeUrl = await QRCode.toDataURL(uniqueID);
      const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, "");

      merchantQRCodes[data.merchantName] = qrCodeUrl;
      fs.writeFileSync("qrcode.png", base64Data, "base64");

      console.log("QR code saved as qrcode.png");
      merchantSockets[data.merchantID] = socket;

      socket.send(JSON.stringify({
        type: "qrCodeUrl",
        url: qrCodeUrl,
      }));

    } catch (err) {
      console.error(err);
    }
  }
};


const handleUser = async (socket, data) => {

  if (data.type == "txn") {
    try {
      console.log(data);
      const encodedData = data.encodedData.VMID;
      
      const res = await axios.post('http://localhost:5000/decrypt',{ciphertext: encodedData});
      
      console.log("res data: ", res.data)
      const merchantID = res.data.plaintext;
      console.log("Verified merchant ID from QR code:", merchantID);

      // Handle the transaction validation
      const resp = await validateTxnThroughBank(data, merchantID);
      if (resp.approvalStatus) {
        socket.send("Transaction Approved, amount: " + resp.txnAmount);
        console.log("Transaction Approved, sending approval msg to both user and merchant");
        const merchantSocket = merchantSockets[merchantID];
        if (merchantSocket && merchantSocket.readyState === WebSocket.OPEN) {
          merchantSocket.send(JSON.stringify({
            type : "txn_approved",
            message: "Transaction Approved by User",
            txnAmount: resp.txnAmount,
            mmid: resp.mmid,
            mer_balance: resp.mer_balance,
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
      console.log("Validation request sent to bank.");
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