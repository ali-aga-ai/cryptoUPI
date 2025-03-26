const WebSocket = require("ws");
const crypto = require("crypto");
const {banks} = require("./bank_details.js");

/*    UPDATED handleMerchant()-24th march from here  */
const handleMerchant = (socket, data, merchants) => {
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
  //Can be done if we setup a database/blockchain as of now can be done with an array if required
  // const phoneExists = Object.values(merchants).some(
  //   (u) => u.phoneNum === data.phoneNum
  // );
  // if (phoneExists) {
  //   socket.send(JSON.stringify({ error: "Phone number already registered" }));
  //   return;
  // } chk if the merchant provides phn number too or not.
  if (data.type == "init") {
    const identifier = data.ip + ":" + data.port;
    const currentTime = new Date().getTime();
    const combinedData = currentTime.toString() + data.pwd + data.userName; //also should we change the pwd from plaintext to hashed?
    const hashedPwd = crypto
      .createHash("sha256")
      .update(data.pwd)
      .digest("hex");/* this is correct as there wasn't any clear answer as
                        to should we use plaintxt password or else hashed one
                        but hashed is better as it improves security.*/
    const hashedID = crypto
      .createHash("sha256")
      .update(combinedData)
      .digest("hex");
    const type = Math.random() < 0.5 ? "first" : "last";
    const merchantID = type === "last" ? hashedID.slice(-16) : hashedID.slice(0, 16);
    merchants[merchantID] = {
      pwd: hashedPwd,
      bankName: data.bankName,
      ifsc: data.ifsc,
      userName: data.userName,
      timeOfCreation: currentTime,
      IP: identifier,
      balance: data.balance,
    };
    socket.send(JSON.stringify({
      type: "success",
      message: "Account created successfully",
      merchantID: merchantID
    }));
    console.log(merchants);
  }
};

/*    UPDATED handleUser()-24th march from here  */
const handleUser = (socket, data, users) => {
  const phoneExists = Object.values(users).some(
    (u) => u.phoneNum === data.phoneNum
  );
  if (phoneExists) {
    socket.send(JSON.stringify({ error: "Phone number already registered" }));
    return;
  }
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
    // init suggests user Account is being created
    const identifier = data.ip + ":" + data.port;
    const currentTime = new Date().getTime();
    const combinedData = currentTime.toString() + data.pwd + data.userName;//
    const hashedPwd = crypto //have doubt reg this as in assignment it was mentioned that user reg is same as merchant
                            // i implemented the generation of uid similar to mid. also should this pwd be saved?
      .createHash("sha256")
      .update(data.pwd)
      .digest("hex");/* this is correct as there wasn't any clear answer as
                        to should we use plaintxt password or else hashed one
                        but hashed is better as it improves security.*/
    const hashedID = crypto
      .createHash("sha256")
      .update(combinedData)
      .digest("hex");
    const type = Math.random() < 0.5 ? "first" : "last";
    const UID = type === "last" ? hashedID.slice(-16) : hashedID.slice(0, 16);
    const combinedUID = data.phoneNum.toString() + UID.toString();

    const MMID = crypto.createHash("sha256").update(combinedUID).digest("hex");//this gives a 64 digit (256-bit)  hexadecimal number
                                                                              //but according to online sources,gpt and real life situation
                                                                              //it should be a 7 digit id not 64 digits. so should we implement truncation?
    users[MMID] = {
      phoneNum: data.phoneNum,
      bankName: data.bankName,
      PIN: data.pin,
      ifsc: data.ifsc,
      //balance: data.balance,balance is twice
      UID: UID,
      IP: identifier,
      balance: data.balance,
    };
    socket.send(JSON.stringify({
      type: "success",
      message: "Account created successfully",
      MMID: MMID
    }));
    console.log("User added: ", users);
  }
  else if(data.type == "login"){
    if(!users[data.phoneNum]){
      socket.send(JSON.stringify({
        type : 'error' ,
        message : 'User not found'
      }))
      return;
    }
    else if(users[data.phoneNum].pin!=data.pin){
      socket.send(JSON.stringify(
        {
          type : "error",
          message : "Invalid PIN entered"
        }
      ))
      return;
    }
    else{
      socket.send(JSON.stringify({ type: "success", message: "Login successful!", MMID: users[data.phoneNum].MMID }));
    }
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
    const VMID = data.VMID;//this is done at the upi machine side i think
    const MID = data.MID;// chk the data structure once and remove either vmid or mid.
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
