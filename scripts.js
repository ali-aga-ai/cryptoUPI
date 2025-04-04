
const bank = {
    turnOnBank: function() {
        return "Bank server is now running. Ready to process transactions.";
        console.log("Bank Server is on");
    }
};

const machine = {
    turnOnMachine: function() {
        return "Payment machine is now online.";
    },
    connectToBankMachine: function() {
        return "Machine successfully connected to bank network.";
    }
};

const merchant = {
    connectToBankMerchant: function() {
        return "Merchant account connected to bank. Ready to receive payments.";
    },
    connectToMachineMerchant: function() {
        return "Merchant terminal connected to payment machine.";
    },
    registerNewMerchant: function(data) {
        const newMerchant = {
            id: "M" + Math.floor(Math.random() * 10000),
            name: data.name,
            bank: data.bank,
            ifsc: data.ifsc,
            phone: data.phone,
            password: data.password,
            registrationDate: new Date().toISOString()
        };
        
        // In a real app, we would add this to the database
        merchantDatabase.push(newMerchant);
        
        return newMerchant;
    },
    loginMerchant: function(phone, password) {
        const merchant = merchantDatabase.find(m => 
            m.phone === phone && m.password === password);
        
        if (merchant) {
            return {
                success: true,
                merchant: merchant
            };
        } else {
            return {
                success: false,
                message: "Invalid phone number or password"
            };
        }
    }
};

const user = {
    connectToBankUser: function() {
        return {
            id: "U" + Math.floor(Math.random() * 10000),
            name: "John Doe",
            accountBalance: "$" + (Math.random() * 10000).toFixed(2)
        };
    },
    txnDetails: function(customData) {
        if (customData) {
            return customData;
        }
        
        return {
            amount: "$" + (Math.random() * 100).toFixed(2),
            merchantId: "M" + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            description: "Default purchase"
        };
    },
    connectToMachineUser: function(transactionData) {
        return `Transaction processed: ${JSON.stringify(transactionData)}`;
    },
    registerNewUser: function(data) {
        const newUser = {
            id: "U" + Math.floor(Math.random() * 10000),
            bank: data.bank,
            ifsc: data.ifsc,
            phone: data.phone,
            password: data.password,
            accountBalance: "$" + (Math.random() * 1000).toFixed(2),
            registrationDate: new Date().toISOString()
        };
        
        // In a real app, we would add this to the database
        userDatabase.push(newUser);
        
        return newUser;
    },
    loginUser: function(phone, password) {
        const user = userDatabase.find(u => 
            u.phone === phone && u.password === password);
        
        if (user) {
            return {
                success: true,
                user: user
            };
        } else {
            return {
                success: false,
                message: "Invalid phone number or password"
            };
        }
    }
};

// DOM elements
const outputDiv = document.getElementById('output');
const userSelection = document.getElementById('user-selection');
const merchantSelection = document.getElementById('merchant-selection');
const userRegistrationForm = document.getElementById('user-registration-form');
const merchantRegistrationForm = document.getElementById('merchant-registration-form');
const userLoginForm = document.getElementById('user-login-form');
const merchantLoginForm = document.getElementById('merchant-login-form');
const transactionForm = document.getElementById('transaction-form');
const merchantTransactionView = document.getElementById('merchant-transaction-view');

// Hide all forms
function hideAllForms() {
    userSelection.style.display = 'none';
    merchantSelection.style.display = 'none';
    userRegistrationForm.style.display = 'none';
    merchantRegistrationForm.style.display = 'none';
    userLoginForm.style.display = 'none';
    merchantLoginForm.style.display = 'none';
    transactionForm.style.display = 'none';
    merchantTransactionView.style.display = 'none';
}

// Button event listeners for main roles
document.getElementById('banker-btn').addEventListener('click', function() {
    hideAllForms() ;
    const result = bank.turnOnBank();
    outputDiv.textContent = "Role: Banker\n\n" + result;
});

document.getElementById('user-btn').addEventListener('click', function() {
    hideAllForms();
    userSelection.style.display = 'block';
    outputDiv.textContent = "Role: User\n\nPlease select user type...";
});

document.getElementById('merchant-btn').addEventListener('click', function() {
    hideAllForms();
    merchantSelection.style.display = 'block';
    outputDiv.textContent = "Role: Merchant\n\nPlease select merchant type...";
});

document.getElementById('machine-btn').addEventListener('click', function() {
    hideAllForms();
    const turnOnResult = machine.turnOnMachine();
    const connectResult = machine.connectToBankMachine();
    outputDiv.textContent = "Role: Machine\n\n" + turnOnResult + "\n" + connectResult;
});

// User type selection
document.getElementById('existing-user-btn').addEventListener('click', function() {
    hideAllForms();
    userLoginForm.style.display = 'block';
    outputDiv.textContent = "Role: Existing User\n\nPlease login with your credentials.";
});

document.getElementById('new-user-btn').addEventListener('click', function() {
    hideAllForms();
    userRegistrationForm.style.display = 'block';
    outputDiv.textContent = "Role: New User\n\nPlease complete registration form.";
});

// Merchant type selection
document.getElementById('existing-merchant-btn').addEventListener('click', function() {
    hideAllForms();
    merchantLoginForm.style.display = 'block';
    outputDiv.textContent = "Role: Existing Merchant\n\nPlease login with your credentials.";
});

document.getElementById('new-merchant-btn').addEventListener('click', function() {
    hideAllForms();
    merchantRegistrationForm.style.display = 'block';
    outputDiv.textContent = "Role: New Merchant\n\nPlease complete registration form.";
});

// User login form submission
document.getElementById('login-user-btn').addEventListener('click', function() {
    const phone = document.getElementById('user-login-phone').value;
    const password = document.getElementById('user-login-password').value;
    
    if (!phone || !password) {
        alert("Please enter both phone number and password");
        return;
    }
    
    const loginResult = user.loginUser(phone, password);
    
    if (loginResult.success) {
        outputDiv.textContent = "User Login Successful!\n\nWelcome back, " + 
                              loginResult.user.name + "\n\nAccount Balance: " + 
                              loginResult.user.accountBalance;
        
        // Show transaction form after successful login
        userLoginForm.style.display = 'none';
        transactionForm.style.display = 'block';
    } else {
        outputDiv.textContent = "Login Failed: " + loginResult.message;
    }
});

// Merchant login form submission
document.getElementById('login-merchant-btn').addEventListener('click', function() {
    const phone = document.getElementById('merchant-login-phone').value;
    const password = document.getElementById('merchant-login-password').value;
    
    if (!phone || !password) {
        alert("Please enter both phone number and password");
        return;
    }
    
    const loginResult = merchant.loginMerchant(phone, password);
    
    if (loginResult.success) {
        outputDiv.textContent = "Merchant Login Successful!\n\nWelcome back, " + 
                              loginResult.merchant.name;
        
        // Show merchant dashboard after successful login
        merchantLoginForm.style.display = 'none';
        document.getElementById('display-merchant-id').textContent = loginResult.merchant.id;
        merchantTransactionView.style.display = 'block';
    } else {
        outputDiv.textContent = "Login Failed: " + loginResult.message;
    }
});

// User registration form submission
document.getElementById('register-user-btn').addEventListener('click', function() {
    const bankName = document.getElementById('bank-name').value;
    const ifscCode = document.getElementById('ifsc-code').value;
    const phoneNumber = document.getElementById('phone-number').value;
    const userPin = document.getElementById('user-pin').value;
    const userPassword = document.getElementById('user-password').value;
    
    if (!bankName || !ifscCode || !phoneNumber || !userPin || !userPassword) {
        alert("Please fill in all fields");
        return;
    }
    
    const userData = {
        bank: bankName,
        ifsc: ifscCode,
        phone: phoneNumber,
        pin: userPin,
        password: userPassword
    };
    
    const registeredUser = user.registerNewUser(userData);
    outputDiv.textContent = "User Registration Successful!\n\nUser Details:\n" + 
                           JSON.stringify(registeredUser, null, 2);
    
    // Show transaction form after successful registration
    userRegistrationForm.style.display = 'none';
    transactionForm.style.display = 'block';
});

// Merchant registration form submission
document.getElementById('register-merchant-btn').addEventListener('click', function() {
    const merchantName = document.getElementById('merchant-name').value;
    const merchantBank = document.getElementById('merchant-bank').value;
    const merchantIfsc = document.getElementById('merchant-ifsc').value;
    const merchantPhone = document.getElementById('merchant-phone').value;
    const merchantPin = document.getElementById('merchant-pin').value;
    const merchantPassword = document.getElementById('merchant-password').value;
    
    if (!merchantName || !merchantBank || !merchantIfsc || !merchantPhone || !merchantPin || !merchantPassword) {
        alert("Please fill in all fields");
        return;
    }
    
    const merchantData = {
        name: merchantName,
        bank: merchantBank,
        ifsc: merchantIfsc,
        phone: merchantPhone,
        pin: merchantPin,
        password: merchantPassword
    };
    
    const registeredMerchant = merchant.registerNewMerchant(merchantData);
    outputDiv.textContent = "Merchant Registration Successful!\n\nMerchant Details:\n" + 
                           JSON.stringify(registeredMerchant, null, 2);
    
    // Show merchant transaction view after successful registration
    merchantRegistrationForm.style.display = 'none';
    document.getElementById('display-merchant-id').textContent = registeredMerchant.id;
    merchantTransactionView.style.display = 'block';
});

// Transaction form submission
document.getElementById('submit-transaction').addEventListener('click', function() {
    const amount = document.getElementById('amount').value;
    const merchantId = document.getElementById('merchant-id').value;
    const description = document.getElementById('description').value;
    
    if (!amount || !merchantId) {
        alert("Please fill in amount and merchant ID");
        return;
    }
    
    const transactionData = {
        amount: "$" + parseFloat(amount).toFixed(2),
        merchantId: merchantId,
        timestamp: new Date().toISOString(),
        description: description || "Purchase"
    };
    
    const processResult = user.connectToMachineUser(transactionData);
    outputDiv.textContent += "\n\n" + processResult;
});

// View transactions button
document.getElementById('view-transactions-btn').addEventListener('click', function() {
    const merchantId = document.getElementById('display-merchant-id').textContent;
    const randomTransactions = [
        {
            id: "T" + Math.floor(Math.random() * 10000),
            amount: "$" + (Math.random() * 200).toFixed(2),
            timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            status: "Completed"
        },
        {
            id: "T" + Math.floor(Math.random() * 10000),
            amount: "$" + (Math.random() * 150).toFixed(2),
            timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            status: "Completed"
        },
        {
            id: "T" + Math.floor(Math.random() * 10000),
            amount: "$" + (Math.random() * 100).toFixed(2),
            timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            status: "Pending"
        }
    ];
    
    outputDiv.textContent += "\n\nRecent Transactions for Merchant " + merchantId + ":\n" + 
                           JSON.stringify(randomTransactions, null, 2);
});