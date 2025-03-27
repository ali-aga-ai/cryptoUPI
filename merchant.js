const readline = require("readline");
const WebSocket = require("ws");


const connectToBankMerchant = () =>{
  const socket = new WebSocket("ws://localhost:8080"); // finds the socket of the bank to connect to

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
  };
  
  (async () => {
    mer_name = await askQuestion("enter name: ");
    bankName = await askQuestion("enter bank name: ");//this wasn't mentioned in the assignment.
    ifsc = await askQuestion("enter ifsc: ");
    pwd = await askQuestion("enter password: ");
    // balance = await askQuestion("enter balance: ");
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
      connectToMachineMerchant(response.merchantID); // To generate QR right after
    }
  };

}

const connectToMachineMerchant = (merchantID) =>{
    const machineSocket = new WebSocket("ws://localhost:8081"); // finds the socket of the machine to connect to

    machineSocket.onopen = () => {
        // on open, it sends a message to the server
        machineSocket.send(
          JSON.stringify({
            type: "init",
            userType: "merchant", 
            merchantID: merchantID,// will have to update with the merchant id generated.
          })
        );
      };
      
      machineSocket.onmessage = (event) => {
        const response=JSON.parse(event.data)
        if(response.qrCodeUrl){
          console.log("QR Code Generated:", response.qrCodeUrl);
          console.log("Open this URL in your browser to view the QR Code.");
        } else {
          console.log("Error:", response.error);
        }
      }; 
      

}

module.exports = {connectToBankMerchant, connectToMachineMerchant};