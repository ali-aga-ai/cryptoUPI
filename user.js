const WebSocket = require("ws");
const readline = require("readline");
const { type, machine } = require("os");
const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const fs = require("fs");
const crypto = require("crypto");
const { banks } = require("./bank_details.js");
const merchants = require("./bank_state");

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

let rl;
function createReadlineInterface() {
  if (rl) rl.close();
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

const askQuestion = (query) => {
  return new Promise((resolve) => {
    createReadlineInterface();
    rl.question(query, (answer) => {
      rl.close();
      rl = null;
      resolve(answer);
    });
  });
};

function loadFromFile() {
  if (fs.existsSync("merchantQRCodes.json")) {
    const data = fs.readFileSync("merchantQRCodes.json");
    return JSON.parse(data);
  }
  return {};
}
async function handleUserSession(socket, MMID) {
  console.log(`\nWelcome!`);
  while (true) {
    console.log("\nWhat would you like to do?");
    console.log("1. Make a Transaction");
    console.log("2. View Balance");
    console.log("3. Exit");

    const option = await askQuestion("Choose an option (1-3): ");
    if (option === "1") {
      let retryCount = 0;
      let transactionSuccess = false;
      while (retryCount < 3 && !transactionSuccess) {
        const transactionData = await txnDetails();
        transactionData.MMID = transactionData.MMID;
        try {
          await connectToMachineUser(transactionData);
          transactionSuccess = true;
        } catch (err) {
          retryCount++;
          console.log(`Transaction failed. Retries left: ${3 - retryCount}`);
        }
      }
      if (!transactionSuccess) {
        console.log("Transaction failed after 3 attempts. Returning to menu.");
      }
    } else if (option === "2") {
      await requestBalance(socket, MMID);
    } else if (option === "3") {
      console.log("Logging out. Goodbye!");
      socket.close();
      break;
    } else {
      console.log("Invalid option. Please select 1, 2, or 3.");
    }
  }
}

function requestBalance(socket, MMID) {
  return new Promise((resolve, reject) => {
    socket.once("message", (message) => {
      try {
        const response = JSON.parse(message);
        if (response.type === "balance_info") {
          console.log(`\n💰 Your current balance is: ₹${response.balance}\n`);
          resolve();
        } else if (response.type === "error") {
          console.log(`❌ Error: ${response.errorType}`);
          resolve(); // or reject(new Error(...)) if you want to handle errors differently
        }
      } catch (err) {
        console.error("⚠️ Failed to parse bank message:", err.message);
        reject(err);
      }
    });

    // Send balance request
    socket.send(
      JSON.stringify({
        type: "view_balance",
        MMID,
      })
    );
  });
}

const connectToBankUser = () => {
  const BANK_IP = "192.168.118.36"
  const socket = new WebSocket(`ws://${BANK_IP}:8081`);
  let loginAttempts = 0;

  return new Promise(async (resolve, reject) => {
    try {
      console.log("\n1. New User");
      console.log("2. Existing User");
      let choice;
      while (true) {
        choice = await askQuestion("Select an option (1 or 2): ");
        if (choice === "1" || choice === "2") break;
        console.log("Invalid choice. Please enter 1 or 2.");
      }

      if (choice == "1") {
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

        let phoneNum;
        while (true) {
          phoneNum = await askQuestion("Enter phone number (10 digits): ");
          if (/^\d{10}$/.test(phoneNum)) break;
          console.log("Invalid phone number. Please enter a 10-digit number.");
        }

        let pin;
        while (true) {
          pin = await askQuestion("Enter 4-digit PIN: ");
          if (/^\d{4}$/.test(pin)) break;
          console.log("Invalid PIN. Please enter a 4-digit number.");
        }

        let pwd;
        while (true) {
          pwd = await askQuestion("Enter password (min 6 characters, at least one number and one letter): ");
          if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pwd)) break;
          console.log("Invalid password. Must be at least 6 characters with at least one number and one letter.");
        }

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
        await performLogin();
      }
      async function performLogin() {
        let phoneNum;
        while (true) {
          phoneNum = await askQuestion("Enter Phone Number (10 digits): ");
          if (/^\d{10}$/.test(phoneNum)) break;
          console.log("Invalid phone number. Please enter a 10-digit number.");
        }

        let pin;
        while (true) {
          pin = await askQuestion("Enter your 4-digit PIN: ");
          if (/^\d{4}$/.test(pin)) break;
          console.log("Invalid PIN. Please enter a 4-digit number.");
        }

        socket.send(
          JSON.stringify({
            type: "login",
            userType: "user",
            phoneNum,
            pin,
          })
        );
      }
      socket.onmessage = async (event) => {
        const response = JSON.parse(event.data);

        if (response.type === "error") {
          console.log(`❌ Error: ${response.errorType}`);
          
          if (choice === "2") {
            // Login retry logic only for existing users
            loginAttempts++;
            if (loginAttempts >= 3) {
              console.log("🚫 Login failed after 3 attempts. Exiting.");
              socket.close();
              return reject("Login failed");
            } else {
              console.log(`🔁 Retrying login... (${3 - loginAttempts} retries left)\n`);
              await performLogin(); // retry
            }
          } else {
            // For new user creation errors
            socket.close();
            reject(response.errorType);
          }

        } else if (response.type === "success") {
          console.log(`✅ Success: ${response.successType}, MMID: ${response.MMID}`);
          await handleUserSession(socket, response.MMID);
          resolve({ MMID: response.MMID, successType: response.successType });
        }
      };

      socket.onerror = (err) => {
        console.error("❌ Socket error:", err.message);
        reject(err);
      };
    } catch (error) {
      reject(error);
    }
  });
};

const connectToMachineUser = (transactionData) => {
  return new Promise((resolve, reject) => {
    const machineSocket = new WebSocket("ws://localhost:8081");

    machineSocket.onopen = () => {
      machineSocket.send(
        JSON.stringify({
          type: "txn",
          userType: "user",
          encodedData: transactionData,
        })
      );
    };

    machineSocket.onmessage = (event) => {
      console.log("Message from server:", event.data);
      machineSocket.close();
      resolve();
    };

    machineSocket.onerror = (error) => {
      console.error("Error with machine socket:", error);
      reject(error);
    };
  });
};

const txnDetails = () => {
  const machineSocket = new WebSocket("ws://localhost:8081");

  return new Promise((resolve, reject) => {
    machineSocket.on("open", async () => {
      try {
        console.log("\nTransaction Initialization");
        const merchantName = await askQuestion("Enter Merchant Name: ");

        machineSocket.send(JSON.stringify({ event: "getQRCodeUrl", merchantName }));

        machineSocket.onmessage = async (message) => {
          const data = JSON.parse(message.data);

          if (data.event === "qrCodeUrl") {
            console.log("Received QR Code URL:", data.url);
            const qrCodeUrl = data.url;
            const base64Data = qrCodeUrl.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(`${merchantName}qrcode.png`, base64Data, "base64");

            console.log("Scanning Merchant QR Code...");
            const vmid = await askQuestion("Enter Virtual Merchant ID (VMID) from QR Code: ");

            let txnAmount;
            while (true) {
              txnAmount = await askQuestion("Enter Transaction Amount: ");
              if (!isNaN(parseFloat(txnAmount)) && parseFloat(txnAmount) > 0) break;
              console.log("Invalid amount. Please enter a valid positive number.");
            }

            const mmid = await askQuestion("Enter your MMID: ");
            const pin = await askQuestion("Enter your PIN: ");

            const txnData = {
              VMID: vmid,
              txnAmount: parseFloat(txnAmount),
              pin: encryptWithPublicKey(pin),
              MMID: mmid,
            };

            resolve(txnData);
            machineSocket.close();
          }
        };
      } catch (error) {
        reject(error);
        machineSocket.close();
      }
    });

    machineSocket.on("error", (err) => {
      console.error("WebSocket error:", err);
      reject(err);
    });
  });
};
module.exports = { connectToBankUser, connectToMachineUser, txnDetails };