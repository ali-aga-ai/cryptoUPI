
function gcd(a, b) {
    while(b !== 0){
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}
// Function to find period r of a^r mod N we find r such a^r=m*N+1
// (Quantum computers enhance this)
function findPeriod(a, N) {
    let r = 1;
    while (Math.pow(a, r) % N !== 1) {
        r++;
    }
    return r;
}
// Shor's Algorithm implementation
function shor(N) {
    if (N % 2 === 0) { //If N is even no need of computing 2 is a factor
        return [N / 2, 2]; 
    }
    while (true) {
        // Step 1: Select a random integer in the range(2,N-1)
        let a = Math.floor(Math.random() * (N - 2)) + 2;
        let g = gcd(a, N);
        // Step 2 : If gcd(a, N) is not 1 then it's a factor
        if (g > 1) {
            return [g, N / g];
        }
        // Step 3: Find period r of a^r mod N
        let r = findPeriod(a, N);
        // If r is odd, retry with a different 'a' because powers must be even
        if (r % 2 === 1) {
            continue;
        }
        // Step 4: Compute possible factors
        var factor1 = gcd(Math.pow(a, r / 2) - 1, N);
        var factor2 = gcd(Math.pow(a, r / 2) + 1, N);
        if (factor1 === 1 || factor2 === 1 || factor1 === N || factor2 === N) {
            continue; 
        }
        return [factor1, factor2];
    }
}
var userID=1234567890123456; //this one is a sample 16-digit number
var pin=3321; // this one is a sample 4-digit pin
var factors = shor(pin);
console.log(`Factors of ${pin} are: ${factors}`);

