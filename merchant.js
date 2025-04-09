const readline = require("readline");
const WebSocket = require("ws");
const { banks } = require("./bank_details.js");
const net = require('net');

const connectToBankMerchant = () =>{
  const socket = net.createConnection({ host: '', port: 8080 });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
  };
  
  let mer_name;
  (async () => {
    while (true) {
      mer_name = await askQuestion("Enter Name: ");
      if (/^[A-Za-z\s]{2,}$/.test(mer_name)) break;
      console.log("Invalid name. Must contain at least 2 alphabetic characters.");
    }

    let bankName;
    while (true) {
      bankName = (await askQuestion("Enter bank name: ")).toUpperCase();
      if (banks[bankName]) break;
      console.log("Invalid bank name. Please enter a valid one.");
    }
      
    let ifsc;
    while (true) {
      ifsc = (await askQuestion("Enter IFSC: ")).toLowerCase();
      if (banks[bankName].includes(ifsc)) break;
      console.log("Invalid IFSC. Please enter a valid one");
    }
    
    let pwd;
    while (true) {
      pwd = await askQuestion("Enter password (min 6 characters, at least one number and one letter): ");
      if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pwd)) break;
      console.log("Invalid password. Must be at least 6 characters with at least one number and one letter.");
    }
    // Checking whether balance is valid or not at merchant side
    while(true){
      balance = await askQuestion("enter balance: ");
      if(isNaN(parseFloat(balance)) || parseFloat(balance) < 0){
        console.log("Invalid balance. Please enter a valid balance.");
      }
      else{
        break;
      }
    }
    rl.close()
    socket.send(
      JSON.stringify({
        type: "init",
        userType: "merchant",
        userName: mer_name,
        bankName: bankName,
        ifsc: ifsc,
        balance: balance,
        pwd: pwd,
      })
    );
  })();
  

  socket.onmessage = function(event) {
    const response = JSON.parse(event.data);
    
    if (response.type === "error") {
      if (response.errorType === "invalidBank") {
        console.log("INVALID BANK NAME");
        connectToBankMerchant();
      } else if (response.errorType === "invalidIFSC") {
        console.log("INVALID IFSC CODE");
        connectToBankMerchant();
      }
    } else if (response.type === "success") {
      console.log("Account created successfully. MID:", response.merchantID);
      connectToMachineMerchant(response.merchantID, mer_name); // To generate QR right after
    }
  };

}

const connectToMachineMerchant = (merchantID, merchantName) =>{
    const machineSocket = new WebSocket("ws://localhost:8081"); // finds the socket of the machine to connect to

    machineSocket.onopen = () => {
        // on open, it sends a message to the server
        machineSocket.send(
          JSON.stringify({
            type: "init",
            userType: "merchant", 
            merchantID: merchantID,
            merchantName: merchantName
          })
        );
      };
      
      machineSocket.onmessage = (event) => {
        const response=JSON.parse(event.data)
        if(response.type === "qrCodeUrl"){
          console.log("QR Code Generated");
        } else if(response.type === "txn_approved") {
          console.log("Message from server:", response.message);
        } else {
          console.log("Error:", response.error);
        }
      };
}

module.exports = {connectToBankMerchant, connectToMachineMerchant};