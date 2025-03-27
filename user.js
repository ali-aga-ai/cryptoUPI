const WebSocket = require("ws");
const readline = require('readline');
const { type } = require("os");

const connectToBankUser = () => {
  const socket = new WebSocket("ws://localhost:8080"); // finds the socket of the bank to connect to

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
  };
  (async () => {
    console.log("\n1. New User");
    console.log("2. Existing User");
    let choice = await askQuestion("Select an option (1 or 2): ");
    if(choice==1){
    bankName = await askQuestion("enter bank name: ");
    ifsc = await askQuestion("enter ifsc: ");
    phoneNum = await askQuestion("enter phone number: ");
    pin = await askQuestion("enter pin: ");
    pwd = await askQuestion("enter password: ");
    // balance = await askQuestion("enter balance: ");
    // Checking whether balance is valid or not at user side
    while(true){
      balance = await askQuestion("enter balance: ");
      if(isNaN(parseFloat(balance)) || parseFloat(balance) < 0){
        console.log("Invalid balance. Please enter a valid balance.");
      }
      else{
        break;
      }
    }

    socket.send(
      JSON.stringify({
        type: "init",
        userType: "user",
        bankName: bankName,
        ifsc: ifsc,
        phoneNum: phoneNum,
        pin: pin,
        balance: balance,
        pwd: pwd
      })
    );
  }
  else if(choice == 2){
     let phoneNum=await askQuestion("Enter Phone Number :");
     let pin=await askQuestion("Enter your PIN :");
     socket.send(
      JSON.stringify(
        {
          type : "login",
          userType : "user",
          phoneNum : phoneNum,
          pin : pin
        }
      )
     );
  }
  else {
    console.log("Invalid choice. Please restart.");
    rl.close();
    return;
  }
  rl.close();

  socket.onmessage = function(event) {
    const response = JSON.parse(event.data);
    
    if (response.type === "error") {
      if (response.errorType === "invalidBank") {
        console.log("INVALID BANK NAME");
        connectToBankUser();
      } else if (response.errorType === "invalidIFSC") {
        console.log("INVALID IFSC CODE");
        connectToBankUser();
      }
       else if (response.errorType === "invalidUser") {
        console.log("PHONE NUMBER NOT REGISTERED");
        connectToBankUser();
      }
       else if (response.errorType === "invalidPIN") {
        console.log("INVALID PIN");
        connectToBankUser();
      }
    } else if (response.type === "success") {
      if(response.successType === "login"){
        console.log("Login successful. MMID:", response.MMID);
      }
      if(response.successType === "init"){
      console.log("Account created successfully. MMID:", response.MMID);
      }
    }
  };
})();
};

const connectToMachineUser = () => {
  const machineSocket = new WebSocket("ws://localhost:8081"); // finds the socket of the machine to connect to

  // NEED TO HASH  / ENCODE THIS DATA
  const encodedData = JSON.stringify({
    MMID: 32242,
    PIN: 131232,
    txnAmount: 190,
  });

  machineSocket.onopen = () => {
    // on open, it sends a message to the server
    machineSocket.send(
      JSON.stringify({
        type: "txn",
        userType: "user",
        encodedData: encodedData,
        VMID: 23213,
      })
    );
  };

  machineSocket.onmessage = (event) => {
    console.log("Message from server:", event.data);

    // // the user receives the QR code from the machine, after they try to initiate a txn, they mut scan qr code, find vmid of the merchant and input it to confirm the txn
    // if (event.data.type === "scanCode") {
    //   machineSocket.send(
    //     JSON.stringify({
    //       VMID: 23213,
    //       dtype: "confirmTxn",
    //     })
    //   );
    // }
  };
};

module.exports = { connectToBankUser, connectToMachineUser };
