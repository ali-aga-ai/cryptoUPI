const WebSocket = require("ws");
const crypto = require("crypto");

const handleMerchant = (socket, data, merchants) => {
  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;

    const currentTime = new Date().getTime();
    const combinedData = currentTime.toString() + data.pwd + data.userName;
    const hashedPwd = crypto
      .createHash("sha256")
      .update(data.pwd)
      .digest("hex");
    const merchantID = crypto
      .createHash("sha256")
      .update(combinedData)
      .digest("hex"); // unsure if this is how tbd

    merchants[merchantID] = {
      pwd: hashedPwd,
      bankName: data.bankName,
      ifsc: data.ifsc,
      userName: data.userName,
      timeOfCreation: currentTime,
      IP: identifier,
      balance: data.balance,
    };
    console.log(merchants);
  }
};

const handleUser = (socket, data, users) => {
  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;
    const UID = crypto.randomBytes(8).toString("hex"); // unsure if this is how tbd
    const combinedData = data.phoneNum.toString() + UID.toString(); // unsure if this is how tbd

    const MMID = crypto.createHash("sha256").update(combinedData).digest("hex"); // unsure if this is how tbd
    users[MMID] = {
      phoneNum: data.phoneNum,
      bankName: data.bankName,
      PIN: data.pin,
      ifsc: data.ifsc,
      balance: data.balance,
      UID: UID,
      IP: identifier,
      balance: data.balance,
    };

    console.log(users);
  }
};

const handleUPIMachine = (socket, data, machines, users, merchants) => {
  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;

    machines[identifier] = "temp";

    console.log(users);
  }
  if (data.type == "validateTxn") {
    const encodedData = data.encodedData;
    const VMID = data.VMID;

    const decodedData = JSON.parse(encodedData); // need to correct this

    const mmid = decodedData.MMID;
    const pin = decodedData.PIN;
    const txnAmount = decodedData.txnAmount;

    if (users[MMID].pin == pin) {
      if (users[MMID].balance >= txnAmount) {
        users[MMID].balance -= txnAmount;
        merchants[VMID].balance += txnAmount;
        socket.send(
          JSON.stringify({ approvalStatus: true, approvalMessage: "Accepted" })
        );
      } else {
        socket.send(
          JSON.stringify({
            approvalStatus: false,
            approvalMessage: "Not sufficient balance",
          })
        );
      }
    } else {
      socket.send(
        JSON.stringify({
          approvalStatus: false,
          approvalMessage: "Incorrect PIN",
        })
      );
    }
  }
};
module.exports = { handleMerchant, handleUser, handleUPIMachine };
