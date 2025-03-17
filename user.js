const WebSocket = require("ws");

connectToBank = () => {
  const socket = new WebSocket("ws://localhost:8080"); // finds the socket of the bank to connect to

  socket.onopen = () => {
    // on open, it sends a message to the server
    socket.send(
      JSON.stringify({
        type: "init",
        userType: "user",
        bankName: "HDFC",
        ifsc: "hdfc1",
        phoneNum: 12345678,
        pin: 321641, // 6 digit pin
        balance: 1000,
      })
    );
    console.log("Connected to server");
  };

  socket.onmessage = (event) => {
    console.log("Message from server:", event.data); // if it receives a message from the server, it logs it
  };
};

const connectToMachine = () => {
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

connectToMachine();
