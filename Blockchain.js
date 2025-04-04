const SHA256 = require('crypto-js/sha256');

class Block{
    constructor(index, previousHash = '', timestamp, data){
        this.transactionId = data;
        this.index = index;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.hash = '';
        this.nonce = 0;
    }
    calculateHash(){
        return SHA256(this.nonce + this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)).toString();
    }
    mineBlock(difficulty){
        while(this.hash.substring(0,difficulty) !== Array(difficulty + 1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: " + this.hash);
        console.log("Nonce: " + this.nonce);
    }
}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 5;
    }
    createGenesisBlock(){
        let currentTime = new Date().toString();
        return new Block(0, '0', currentTime , 'Genesis Block');
    }
    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }
    addBlock(newBlock){
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
    }
}

module.exports = {
    Blockchain,
    Block
};
