from flask import Flask, request, jsonify
from speck import SpeckCipher

app = Flask(__name__)

my_key = 0x123456789ABCDEF00FEDCBA987654321
cipher = SpeckCipher(my_key)

@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.json
    plaintext = int(data['plaintext'],16)  # assuming int input
    ciphertext = cipher.encrypt(plaintext)
    ciphertext_hex = hex(ciphertext)[2:].zfill(16)  # ensure 16 hex digits
    return jsonify({'ciphertext': ciphertext_hex})

@app.route('/decrypt', methods=['POST'])
def decrypt():
    data = request.json
    ciphertext = int(data['ciphertext'], 16)
    plaintext = cipher.decrypt(ciphertext)
    plaintext_hex = hex(plaintext)[2:].zfill(16)
    return jsonify({'plaintext': plaintext_hex})


app.run(port = 5000)


# # Example specifying key size, block size, mode, and IV
# key = 0x123456789ABCDEF0
# iv = 0x999999
# cipher_ofb = SpeckCipher(key, key_size=64, block_size=32, mode='OFB', init=iv)

