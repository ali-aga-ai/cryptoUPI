# 💳 Banking Payment System

A **simulated digital banking system** that models real-world banking interactions between **banks**, **users**, **merchants**, and **machines (ATMs)** — all connected via **WebSockets** over a network using IP addresses.

---

## 👥 Team Members

- **Mohammed Kamaalullah Khan Quadri** - [2022A7PS0109H]
- **Ali Mehdi Aga** - [2022A7PS1282H]
- **Mahesh Pappu** - [2022A7PS0142H]
- **Abdul Rahman Yakoob** - [2022A7PS0021H]
- **Mohammed Adeeb Ulla** - [2022AAPS1475H]

---

## 🏗️ Project Overview

This system provides a **role-based architecture**, enabling different functionalities for each type of participant in the network:

- **🏦 Bank**: Central server responsible for managing accounts, transactions, and secure communication.
- **🧑‍💼 User**: Individual who can register, authenticate, and initiate transactions.
- **🏪 Merchant**: Business entity that can register to receive payments. Each merchant is identified via a VMID and QR code.
- **🏧 Machine**: Acts as an ATM; connects with the bank to simulate machine-based interactions.

All modules communicate securely through **WebSockets**, enabling real-time financial operations in a decentralized yet synchronized manner.

---

## 🔁 Workflow

1. **Start the Bank and Machine Servers** on separate devices.
   - The **Machine Server** connects to the **Bank Server** using IP-based WebSocket communication.

2. **Start the User and Merchant Clients**, each on their respective devices.
   - Connect them to the **Bank Server** by providing the bank’s IP address.

3. **Registration & Setup**:
   - Users and merchants can register if not already created.
   - Upon user registration, a unique **MMID** (Mobile Money ID) is generated.
   - Upon merchant registration, a unique **VMID** is created along with a **QR Code** representing it.

4. **Transaction Flow**:
   - The user scans the merchant’s QR Code to fetch the VMID.
   - After **PIN authentication**, a transaction is initiated.
   - The transaction updates both the **user’s** and **merchant’s** balances in real time.

---

## ⚙️ Prerequisites

Ensure the following are installed:

- [Node.js](https://nodejs.org/) (v12 or higher recommended)
- npm (Node Package Manager, comes with Node.js)

---

## 🚀 Getting Started

1. **Clone the Repository**
   ```bash
   git clone <repository-link>
   cd cryptoUPI

2. **Install Dependencies**

   ```bash

   npm install
   pip install simonspeckciphers
   pip install flask

3. **Run the Application**

   ``` bash

   node main.js
