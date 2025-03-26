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
    phoneNum = await askQuestion("enter phone number: ")
    socket.send(
      JSON.stringify({
        type: "init",
        userType: "merchant",
        userName: mer_name,
        bankName: bankName,
        ifsc: ifsc,
        balance: balance,
        pwd: pwd,
        phoneNum : phoneNum
      })
    );
  })();
  

  socket.onmessage = function(event) {
    const response = JSON.parse(event.data);
    
    if (response.type === "error") {
      if (response.errorType === "invalidBank") {
        console.log("INVALID BANK NAME");
        // connecting again to enter correct details
        connectToBankUser();
      } else if (response.errorType === "invalidIFSC") {
        console.log("INVALID IFSC CODE");
        // connecting again to enter correct details
        connectToBankUser();
      }
    } else if (response.type === "success") {
      console.log("Account created successfully. MID:", response.merchantID);
      // connectToBankUser();
      connectToMachineMerchant(response.merchantID); // To generate QR right after
    }
  };

    // socket.onopen = () => {
    //     // on open, it sends a message to the server
    //     socket.send(
    //       JSON.stringify({
    //         type: "init",
    //         userType: "merchant",
    //         userName: "merchant1",
    //         bankName: "HDFC",
    //         pwd: "password123",
    //         ifsc: "hdfc1",
    //         balance: 10000,
    //       })
    //     );
    //     console.log("Connected to server");
    //   };
      
    //   socket.onmessage = (event) => {
    //     console.log("Message from server:", event.data); // if it receives a message from the server, it logs it
    //   };


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
        // if it receives a message from the server, it logs it
      }; // you will receuve a QR code link, on browser search the link and you will be redirected to the QR code image
      

}

module.exports = {connectToBankMerchant, connectToMachineMerchant};