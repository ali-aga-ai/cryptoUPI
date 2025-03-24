// BOILERPLATE FOR MAIN FILE, RUN THIS FILE TO START THE APPLICATION, INNEEFFICIENT AS FUCK

const readline = require('readline');
const { turnOnMachine , connectToBank} = require('./machine');
const { connectToBankMerchant, connectToMachineMerchant } = require('./merchant');
const { connectToBankUser, connectToMachineUser } = require('./user');
const {turnOnBank} = require('./bank');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const files = {
  A: 'bank.js',
  B: 'user.js',
  C: 'merchant.js',
  D: 'machine.js'
};

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};


rl.question('Are you A) a banker B) a user C) a merchant D) a machine: ', (input) => {
  const choice = input.toUpperCase();
  rl.close()
  if (files[choice]) {
    if(choice == "A")  {
        turnOnBank();
        console.log('Bank Server Running');
    }
    else if(choice == "B"){
        connectToBankUser();
    }
    else if(choice == "C"){
        connectToBankMerchant();
    }
    else if(choice == "D"){
      turnOnMachine();

    }
    else{
      console.log("Invalid choice");
    }
    if(choice === 'D') {
      turnOnMachine();
    } 
  } else {
    console.log('Invalid input');
    rl.close();
  }
});
