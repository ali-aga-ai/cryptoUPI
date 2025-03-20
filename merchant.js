const WebSocket = require("ws");


const connectToBankMerchant = () =>{
    const socket = new WebSocket("ws://localhost:8080"); // finds the socket of the bank to connect to

    socket.onopen = () => {
        // on open, it sends a message to the server
        socket.send(
          JSON.stringify({
            type: "init",
            userType: "merchant",
            userName: "merchant1",
            bankName: "HDFC",
            pwd: "password123",
            ifsc: "hdfc1",
            balance: 10000,
          })
        );
        console.log("Connected to server");
      };
      
      socket.onmessage = (event) => {
        console.log("Message from server:", event.data); // if it receives a message from the server, it logs it
      };

}

const connectToMachineMerchant = () =>{
    const machineSocket = new WebSocket("ws://localhost:8081"); // finds the socket of the machine to connect to

    machineSocket.onopen = () => {
        // on open, it sends a message to the server
        machineSocket.send(
          JSON.stringify({
            type: "init",
            userType: "merchant", 
            merchantID: 4214214,
          })
        );
      };
      
      machineSocket.onmessage = (event) => {
        console.log("Message from server:", event.data); // if it receives a message from the server, it logs it
      }; // you will receuve a QR code link, on browser search the link and you will be redirected to the QR code image
      

}

module.exports = {connectToBankMerchant, connectToMachineMerchant};