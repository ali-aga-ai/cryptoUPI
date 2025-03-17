const WebSocket = require("ws");
const crypto = require("crypto");
const QRCode = require("qrcode");

const handleMerchant = (socket, data) => {
  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;

    const currentTime = new Date().getTime();
    const combinedData = data.merchantID.toString() + currentTime.toString();

    const VMID = crypto.createHash("sha256").update(combinedData).digest("hex"); // NEED TO USE LWC
    console.log(VMID);
    QRCode.toDataURL(VMID, (err, url) => {
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

    const resp = validateTxnThroughBank(bankSocket, data);
    if (resp.approvalStatus) {
      socket.send("Transaction Approved");
    } else {
      socket.send("Transaction Declined, reason: ", resp.approvalMessage);
    }
  }
};

const validateTxnThroughBank = (bankSocket, data) => {
  bankSocket.send(
    JSON.stringify({
      type: "validateTxn",
      encodedData: data.encodedData,
      VMID: data.VMID,
    })
  );

  bankSocket.onmessage = (event) => {
    return event.data;
  } 
};

module.exports = { handleMerchant, handleUser };
