const WebSocket = require("ws");
const crypto = require("crypto");
const {banks} = require("./bank_details.js");
const handleMerchant = (socket, data, merchants) => {
  if (!banks[data.bankName]?.includes(data.ifsc)) {
    socket.send(JSON.stringify({ error: "Invalid bank or IFSC" }));
    return;
  }
  const phoneExists = Object.values(users).some(
    (u) => u.phoneNum === data.phoneNum
  );
  if (phoneExists) {
    socket.send(JSON.stringify({ error: "Phone number already registered" }));
    return;
  }
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

// const handleUser = (socket, data, users) => {
//   if (data.type == "init") { 
//     // init suggests user Account is being created
    
//     // if (!banks[data.bankName]?.includes(data.ifsc)) {
//     //   socket.send(JSON.stringify({ error: "Invalid bank or IFSC" }));
//     //   return;
//     // }  // BANKS OBJECT IS NOT DEFINED

//     const identifier = data.ip + ":" + data.port;
//     const UID = crypto.randomBytes(8).toString("hex"); // unsure if this is how tbd
//     const combinedData = data.phoneNum.toString() + UID.toString(); // unsure if this is how tbd

//     const MMID = crypto.createHash("sha256").update(combinedData).digest("hex"); // unsure if this is how tbd
//     users[MMID] = {
//       phoneNum: data.phoneNum,
//       bankName: data.bankName,
//       PIN: data.pin,
//       ifsc: data.ifsc,
//       balance: data.balance,
//       UID: UID,
//       IP: identifier,
//       balance: data.balance,
//     };

//     console.log("User added: ", users);
//     socket.send("Account created", JSON.stringify({ MMID: MMID }));
//   }
// };
/*    UPDATED handleUser()-24th march from here  */
const handleUser = (socket, data, users) => {
  if (data.type == "init") {
    // Check if the bank name exists in the banks object
    if (!(data.bankName.toUpperCase() in banks)) {
      socket.send(JSON.stringify({
        type: "error",
        errorType: "invalidBank",
        message: "Invalid bank name. Please try again with a valid bank name."
      }));
      return; // Exit the function early
    }

    // Check if the IFSC code is valid for the given bank
    if (!(banks[data.bankName.toUpperCase()]?.includes(data.ifsc))) {
      socket.send(JSON.stringify({
        type: "error",
        errorType: "invalidIFSC",
        message: "Invalid IFSC code. Please try again with a valid IFSC."
      }));
      return;
    }
    // Generate MMID
    const identifier = data.ip + ":" + data.port;
    const UID = crypto.randomBytes(8).toString("hex"); // unsure if this is how tbd
    const combinedData = data.phoneNum + new Date().getTime().toString();
    const MMID = crypto.createHash("sha256").update(combinedData).digest("hex");
    // If all validations pass, send success message
    socket.send(JSON.stringify({
      type: "success",
      message: "Account created successfully",
      MMID: MMID
    }));
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
    console.log("User added",users);
  }
};
/*  Till here- 24th march  */
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
