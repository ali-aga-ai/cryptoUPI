const WebSocket = require("ws");
const readline = require("readline");
const { type, machine } = require("os");
const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const fs = require("fs");
const crypto = require("crypto");

const encryptWithPublicKey = (plaintext) => {
  return crypto.publicEncrypt(
    {
      key: global.bankPublicKey, // Retrieved from bank.js
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(plaintext, "utf8")
  ).toString("base64");
};
// Load latest data
function loadFromFile() {
  if (fs.existsSync("merchantQRCodes.json")) {
    const data = fs.readFileSync("merchantQRCodes.json");
    return JSON.parse(data);
  }
  return {};
}
const connectToBankUser = () => {
  const socket = new WebSocket("ws://localhost:8080");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  return new Promise(async (resolve, reject) => {
    // Wrap in a Promise
    try {
      console.log("\n1. New User");
      console.log("2. Existing User");
      const choice = await askQuestion("Select an option (1 or 2): ");

      if (choice == "1") {
        const bankName = await askQuestion("Enter bank name: ");
        const ifsc = await askQuestion("Enter IFSC: ");
        const phoneNum = await askQuestion("Enter phone number: ");
        const pin = await askQuestion("Enter PIN: ");
        const pwd = await askQuestion("Enter password: ");

        let balance;
        while (true) {
          balance = await askQuestion("Enter balance: ");
          if (!isNaN(parseFloat(balance)) && parseFloat(balance) >= 0) break;
          console.log("Invalid balance. Please enter a valid balance.");
        }

        socket.send(
          JSON.stringify({
            type: "init",
            userType: "user",
            bankName,
            ifsc,
            phoneNum,
            pin,
            balance,
            pwd,
          })
        );
      } else if (choice == "2") {
        const phoneNum = await askQuestion("Enter Phone Number: ");
        const pin = await askQuestion("Enter your PIN: ");

        socket.send(
          JSON.stringify({
            type: "login",
            userType: "user",
            phoneNum,
            pin,
          })
        );
      } else {
        console.log("Invalid choice. Please restart.");
        rl.close();
        reject("Invalid choice");
        return;
      }

      rl.close();

      socket.onmessage = (event) => {
        const response = JSON.parse(event.data);

        if (response.type === "error") {
          console.log(`Error: ${response.errorType}`);
          reject(response);
        } else if (response.type === "success") {
          console.log(
            `Success: ${response.successType}, MMID: ${response.MMID}`
          );
          resolve({ MMID: response.MMID, successType: response.successType });
        }
      };

      socket.onerror = (error) => reject(error);
    } catch (error) {
      rl.close();
      reject(error);
    }
  });
};

const connectToMachineUser = (transactionData) => {
  const machineSocket = new WebSocket("ws://localhost:8081"); // finds the socket of the machine to connect to

  
  machineSocket.onopen = () => {
    // on open, it sends a message to the server
    machineSocket.send(
      JSON.stringify({
        type: "txn",
        userType: "user",
        encodedData: transactionData, // for now the data is not being hashed and sent, rather it is directly being sent becuase unclear whether pin needs to be hashed or whole txnData
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
const txnDetails = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const machineSocket = new WebSocket("ws://localhost:8081");

  const askQuestion = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  return new Promise((resolve, reject) => {
    machineSocket.on("open", async () => {
      // Ensure connection is open
      try {
        console.log("\nTransaction Initialization");
        const merchantName = await askQuestion("Enter Merchant Name: ");

        machineSocket.send(
          JSON.stringify({ event: "getQRCodeUrl", merchantName })
        );

        machineSocket.onmessage = async (message) => {
          const data = JSON.parse(message.data);

          if (data.event === "qrCodeUrl") {
            console.log("Received QR Code URL:", data.url);
            const qrCodeUrl = data.url;
            const base64Data = qrCodeUrl.replace(
              /^data:image\/png;base64,/,
              ""
            );
            fs.writeFileSync(`${merchantName}qrcode.png`, base64Data, "base64");

            console.log("Scanning Merchant QR Code...");
            const vmid = await askQuestion(
              "Enter Virtual Merchant ID (VMID) from QR Code: "
            );

            let txnAmount;
            while (true) {
              txnAmount = await askQuestion("Enter Transaction Amount: ");
              if (!isNaN(parseFloat(txnAmount)) && parseFloat(txnAmount) > 0)
                break;
              console.log(
                "Invalid amount. Please enter a valid positive number."
              );
            }

            const mmid = await askQuestion("Enter your MMID: ");
            const pin = await askQuestion("Enter your PIN: ");

            const txnData = {
              VMID: vmid, 
              txnAmount: parseFloat(txnAmount),
              pin:encryptWithPublicKey(pin), // Encrypt the PIN with the public key
              MMID: mmid
            };
            // hash the txnData and send it to the machine
            rl.close();
            resolve(txnData);
            machineSocket.close();
          }
        };
      } catch (error) {
        rl.close();
        reject(error);
        machineSocket.close();
      }
    });

    machineSocket.on("error", (err) => {
      console.error("WebSocket error:", err);
      rl.close();
      reject(err);
    });
  });
};
module.exports = { connectToBankUser, connectToMachineUser, txnDetails };
