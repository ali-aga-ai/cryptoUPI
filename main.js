// BOILERPLATE FOR MAIN FILE, RUN THIS FILE TO START THE APPLICATION, INNEEFFICIENT AS FUCK
const readline = require("readline");
const { turnOnMachine, connectToBankMachine } = require("./machine");
const {
  connectToBankMerchant,
  connectToMachineMerchant,
} = require("./merchant");
const {
  connectToBankUser,
  connectToMachineUser,
  txnDetails,
} = require("./user");
const { turnOnBank } = require("./bank");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const files = {
  A: "bank.js",
  B: "user.js",
  C: "merchant.js",
  D: "machine.js",
};

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

rl.question(
  "Are you A) a banker B) a user C) a merchant D) a machine: ",
  async (input) => {
    const choice = input.toUpperCase();
    rl.close();
    if (files[choice]) {
      if (choice == "A") {
        turnOnBank();
        console.log("Bank Server Running");
      } else if (choice == "B") {
        const userDetails = await connectToBankUser();
        // const transactionData = await txnDetails();
        // console.log("User:", userDetails);
        // console.log("Transaction:", transactionData);
        // connectToMachineUser(transactionData)
      } else if (choice == "C") {
        connectToBankMerchant();
      } else if (choice == "D") {
        turnOnMachine();
        connectToBankMachine();
      } else {
        console.log("Invalid choice");
      }
    } else {
      console.log("Invalid input");
      rl.close();
    }
  }
);

