Banking Payment System

This project contains a simulated banking system with multiple connected entities: banks, users, merchants, and machines. The system allows for different roles and functionalities within a banking network.

Bank: Central server that manages accounts and transactions
User: Client who can connect to the bank and perform transactions
Merchant: Business entity that can process payments
Machine: ATM machine that connects to the bank network

It contains a role-based system with different functionalities which work together in a network with connectivity between all entities using IP addresses and Web Sockets. 

Flow of the project: 

First the bank and the machine server is started on different devices, allowing the machine to connect with the bank through sharing of IP addresses. Then on different devices the user and the machine server is connected to the bank (central server) after which a user or merchant can be created (if not existing already). Once the user is created the MMID is generated. For the merchant, once created, a QR code will be generated which on scanning gives the VMID of that merchant which will be used by the user while making a transaction. On authentication of the user through his PIN, the transaction will be initiated and the amount and balance of the User/Merchant will be updated.

Prerequisites

Node.js (v12 or higher recommended)
npm (Node Package Manager)

Installation

Clone this repository:

git clone <repository-link>

Install dependencies:

npm i

Run the application:

node main.js

Members:

Ali Mehdi Aga - 2022A7PS1282H
Mohammed Adeeb Ulla - 2022AAPS1475H
Mohammed Kamaalullah Khan Quadri - 2022A7PS0109H
Mahesh Pappu - 2022A7PS0142H
Abdul Rahman Yakoob - 2022A7PS0021H
