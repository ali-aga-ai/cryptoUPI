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
const { getLocalIP } = require("./getIP");
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
        console.log("BAnk IP : " ,getLocalIP());

        turnOnBank();
        console.log("Bank Server Running");
      } else if (choice == "B") {
        console.log("USER IP : " ,getLocalIP());

        try {
          const userDetails = await connectToBankUser();
        } catch (err) {
          console.error("❌ Login session ended with error:", err);
        }
      } else if (choice == "C") {
        console.log("Merchant IP : " ,getLocalIP());
        connectToBankMerchant();
      } else if (choice == "D") {
        console.log("Machine IP : " ,getLocalIP());
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
