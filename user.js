const WebSocket = require("ws");
const readline = require('readline');

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
    bankName = await askQuestion("enter bank name: ");
    ifsc = await askQuestion("enter ifsc: ");
    phoneNum = await askQuestion("enter phone number: ");
    pin = await askQuestion("enter pin: ");
    balance = await askQuestion("enter balance: ");
  
    socket.send(
      JSON.stringify({
        type: "init",
        userType: "user",
        bankName: bankName,
        ifsc: ifsc,
        phoneNum: phoneNum,
        pin: pin,
        balance: balance,
      })
    );
  })();
  

  socket.onmessage = (event) => {
    console.log("Message from server:", event.data); // if it receives a message from the server, it logs it
  };
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
