// Finds GCD 
const readline = require('readline');
function gcd(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Modular exponentiation to handle large numbers
function modPow(base, exponent, modulus) {
    if (modulus === 1) return 0;
    let result = 1;
    base = base % modulus;
    while (exponent > 0) {
        if (exponent % 2 === 1) {
            result = (result * base) % modulus;
        }
        exponent = Math.floor(exponent / 2);
        base = (base * base) % modulus;
    }
    return result;
}

// Period finding (Quantum computers enhance this)
function findPeriod(a, N) {
    let r = 1;
    while (modPow(a, r, N) !== 1) {
        r++;
        if (r > 10000) break; // Avoiding infinite loop
    }
    return r;
}

// Shor's Algorithm 
function shor(N) {
    if (N % 2 === 0) {
        return [2, N / 2];
    }
    while (true) {
        let a = Math.floor(Math.random() * (N - 2)) + 2;
        let g = gcd(a, N);

        if (g > 1) {
            return [g, N / g];
        }

        let r = findPeriod(a, N);
        if (r % 2 === 1) {
            continue;
        }

        let factor1 = gcd(modPow(a, r / 2, N) - 1, N);
        let factor2 = gcd(modPow(a, r / 2, N) + 1, N);

        if (factor1 === 1 || factor1 === N) {
            if (factor2 === 1 || factor2 === N) {
                continue;
            }
            return [factor2, N / factor2];
        }

        return [factor1, N / factor1];
    }
}

// Modular inverse using Extended Euclidean Algorithm for finding d 
function modInverse(e, phi) {
    let [old_r, r] = [phi, e];
    let [old_s, s] = [1, 0];
    let [old_t, t] = [0, 1];
    while (r !== 0) {
        let quotient = Math.floor(old_r / r);
        [old_r, r] = [r, old_r - quotient * r];
        [old_s, s] = [s, old_s - quotient * s];
        [old_t, t] = [t, old_t - quotient * t];
    }
    // Make sure we return a positive modular inverse
    if (old_t < 0) {
        old_t += phi;
    }
    // Check if gcd(e, phi) = 1, necessary for a modular inverse to exist
    if (old_r !== 1) {
        throw new Error("Modular inverse does not exist");
    }
    return old_t;
}

function generateRSAKey(p, q) {
    const N = p * q;
    const phi = (p - 1) * (q - 1);
    // Choose e such that 1 < e < phi and gcd(e, phi) = 1
    // Using 19 here in this case
    const e = 19;
    const d = modInverse(e, phi);
    return { publicKey: { e, N }, privateKey: { d, N }, phi };
}

// Encryption and decryption
function encryptRSA(m, e, N) {
    return modPow(m, e, N);
}

function decryptRSA(c, d, N) {
    return modPow(c, d, N);
}

// Main simulation
function breakingRSA(pin) {
    const p = 103;
    const q = 101;

    console.log("RSA Parameters:");
    console.log("p =", p);
    console.log("q =", q);

    const { publicKey, privateKey, phi } = generateRSAKey(p, q);
    const { e, N } = publicKey;
    const { d } = privateKey;

    console.log("N =", N);
    console.log("phi =", phi);
    console.log("Public key component e =", e);
    console.log("Original private key component d =", d);
    console.log("\nOriginal PIN:", pin);
    const cipher = encryptRSA(pin, e, N);
    console.log("Encrypted PIN:", cipher);
    console.log("\nStarting Shor's Algorithm to factor N...");
    const [factor1, factor2] = shor(N);
    console.log("Shor's Algorithm Factors N into:", factor1, "and", factor2);
    const cracked_phi = (factor1 - 1) * (factor2 - 1);
    const cracked_pc = modInverse(e, cracked_phi);
    console.log("Decrypted private key d =", cracked_pc);
    const decrypted = decryptRSA(cipher, cracked_pc, N);
    console.log("\nDecrypted PIN:", decrypted);
    const verified = decryptRSA(cipher, d, N);
    console.log("Verification with original key:", verified);
}
//we have used a 5 digit n to ensure any 4 digit pin can be handled
//Taking input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question("Enter your 4-digit PIN: ", (input) => {
    const pin = parseInt(input, 10);
    if (isNaN(pin) || pin < 0 || pin > 9999) {
        console.log("Invalid PIN. Please enter a 4-digit number.");
        rl.close();
        return;
    }
    breakingRSA(pin);
    rl.close();
});