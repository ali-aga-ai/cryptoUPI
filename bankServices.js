const WebSocket = require("ws");
const crypto = require("crypto");
const { banks } = require("./bank_details.js");
const { error } = require("console");

/*  MERCHANT REGISTRATION FINISHED, NEEDS PWD, BALANCE, USERNAME, BANKNAME, AND IFSC*/
const handleMerchant = (socket, data, merchants) => {
  if (!(data.bankName.toUpperCase() in banks)) {
    socket.send(
      JSON.stringify({
        type: "error",
        errorType: "invalidBank",
        message: "Invalid bank name. Please try again with a valid bank name.",
      })
    );
    return; // Exit the function early
  }

  // Check if the IFSC code is valid for the given bank
  if (!banks[data.bankName.toUpperCase()]?.includes(data.ifsc)) {
    socket.send(
      JSON.stringify({
        type: "error",
        errorType: "invalidIFSC",
        message: "Invalid IFSC code. Please try again with a valid IFSC.",
      })
    );
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
    const hashedID = crypto.createHash("sha256").update(combinedData).digest("hex");

    const merchantID = Math.random() < 0.5 ? hashedID.slice(-16) : hashedID.slice(0, 16);

    merchants[merchantID] = {
      pwd: hashedPwd,
      bankName: data.bankName,
      ifsc: data.ifsc,
      userName: data.userName,
      timeOfCreation: currentTime,
      IP: identifier,
      balance: data.balance,
    };

    socket.send(
      JSON.stringify({
        type: "success",
        message: "Account created successfully",
        merchantID: merchantID,
      })
    );

    console.log(merchants);
  }
};

const handleUser = (socket, data, users) => {
  console.log(data)
  if (data.type == "init") {
    // Check if the bank name exists in the banks object
    const phoneExists = Object.values(users).some(
      (u) => u.phoneNum === data.phoneNum
    );
    if (phoneExists) {
      socket.send(JSON.stringify({ error: "Phone number already registered" }));
      return;
    }

    if (!(data.bankName.toUpperCase() in banks)) {
      socket.send(
        JSON.stringify({
          type: "error",
          errorType: "invalidBank",
          message:
            "Invalid bank name. Please try again with a valid bank name.",
        })
      );
      return; // Exit the function early
    }

    // Check if the IFSC code is valid for the given bank
    if (!banks[data.bankName.toUpperCase()]?.includes(data.ifsc)) {
      socket.send(
        JSON.stringify({
          type: "error",
          errorType: "invalidIFSC",
          message: "Invalid IFSC code. Please try again with a valid IFSC.",
        })
      );
      return;
    }
    // init suggests user Account is being created
    const identifier = data.ip + ":" + data.port;
    const currentTime = new Date().getTime();
    const combinedData = currentTime.toString() + data.pwd + data.userName; //
    
    const hashedID = crypto
      .createHash("sha256")
      .update(combinedData)
      .digest("hex");
    const UID = Math.random() < 0.5  ? hashedID.slice(-16) : hashedID.slice(0, 16);
    const combinedUID = data.phoneNum.toString() + UID.toString(); // Using UID and phoneNum to create MMID

    const MMID = crypto.createHash("sha256").update(combinedUID).digest("hex"); //this gives a 64 digit (256-bit)  hexadecimal number
    //but according to online sources,gpt and real life situation
    //it should be a 7 digit id not 64 digits. so should we implement truncation?
    users[data.phoneNum] = {
      mmid: MMID,
      phoneNum: data.phoneNum,
      bankName: data.bankName,
      PIN: data.pin,
      ifsc: data.ifsc,
      UID: UID,
      IP: identifier,
      balance: data.balance,
    };
    socket.send(
      JSON.stringify({
        type: "success",
        message: "Account created successfully",
        MMID: MMID,
        successType: "init",
      })
    );
    console.log("User added: ", users);
  } 
  
  else if (data.type == "login") {
    if (!users[data.phoneNum]) {
      socket.send(
        JSON.stringify({
          type: "error",
          message: "User not found",
          errorType: "invalidUser",
        })
      );
      return;
    } else if (users[data.phoneNum].PIN != data.pin) {
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Invalid PIN entered",
          errorType: "invalidPIN",
        })
      );
      return;
    } else {
      socket.send(
        JSON.stringify({
          type: "success",
          message: "Login successful!",
          MMID: users[data.phoneNum].mmid,
          successType: "login",
        })
      );
    }
  }
};

const handleUPIMachine = (socket, data, machines, users, merchants) => {
  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;

    machines[identifier] = "temp";

    console.log(machines);
  }
  if (data.type == "validateTxn") {
    const encodedData = data.encodedData;
    const VMID = data.VMID; //this is done at the upi machine side i think
    const MID = data.MID; // chk the data structure once and remove either vmid or mid.
    const decodedData = JSON.parse(encodedData); // need to correct this

    const MMID = decodedData.MMID;
    const pin = decodedData.PIN;
    const txnAmount = decodedData.txnAmount;

    if (users[MMID].pin == pin) {
      if (users[MMID].balance >= txnAmount) {
        users[MMID].balance -= txnAmount;
        merchants[MID].balance += txnAmount;
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
