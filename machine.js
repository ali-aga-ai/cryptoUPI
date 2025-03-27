const WebSocket = require("ws");
const { handleMerchant, handleUser } = require("./machineServices");

const connectToBankMachine = () =>{
    const socket = new WebSocket("ws://localhost:8080"); // finds the socket of the bank to connect to

    socket.onopen = () => {
        // on open, it sends a message to the server
        socket.send(
          JSON.stringify({
            type: "init",
            userType: "machine",
          })
        );
        console.log("Connected to server");
      };
      
      socket.onmessage = (event) => {
        console.log("Message from server:", event.data); // if it receives a message from the server, it logs it
      };
      
};

const turnOnMachine = () =>{

  const machineServer = new WebSocket.Server({ port: 8081 });
  console.log("Machine server is on");
  machineServer.on("connection", (socket, req) => {
      // socket is the socket of the client who is connecting
    
      const ip = req.socket.remoteAddress;
      const port = req.socket.remotePort;
    
      console.log(`Client connected with ip ${ip} and port ${port} `);
    
      socket.on("message", (message) => {
        const data = JSON.parse(message);
        if (data.userType == "merchant") {
            data.ip = ip;
            data.port = port;
            handleMerchant(socket, data);
        }
        if (data.userType == "user") {
            data.ip = ip;
            data.port = port;
            handleUser(socket, data);
        }
        
      });
    });
    

}

module.exports =  {connectToBankMachine, turnOnMachine};