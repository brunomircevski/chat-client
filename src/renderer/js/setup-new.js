const Store = require('electron-store');
const bip39 = require('bip39');
const forge = require('node-forge');

const store = new Store();

const url = store.get('serverAddress');
store.clear();
store.set('serverAddress', url);

const firstStepBtn = document.getElementById("firstStepBtn");
const secondStepBtn = document.getElementById("secondStepBtn");
const thirdStepBtn = document.getElementById("thirdStepBtn");
const fourthStepBtn = document.getElementById("fourthStepBtn");
const fifthStepBtn = document.getElementById("fifthStepBtn");
const thirdStepBtnBack = document.getElementById("thirdStepBtnBack");

const firstStepDiv = document.getElementById("firstStepDiv");
const secondStepDiv = document.getElementById("secondStepDiv");
const thirdStepDiv = document.getElementById("thirdStepDiv");
const fourthStepDiv = document.getElementById("fourthStepDiv");
const fifthStepDiv = document.getElementById("fifthStepDiv");
const sixthStepDiv = document.getElementById("sixthStepDiv");

const passphraseBox = document.getElementById("passphraseBox");
const passphraseCheckInput = document.getElementById("passphraseCheckInput");

const thirdStepErrorMsg = document.getElementById("thirdStepErrorMsg");
const fourthStepErrorMsg = document.getElementById("fourthStepErrorMsg");
const fifthStepErrorMsg = document.getElementById("fifthStepErrorMsg");
const fifthStepSpinner = document.getElementById("fifthStepSpinner");

const usernameInput = document.getElementById("username");
const appPasswordInput = document.getElementById("appPassword");
const repeatAppPasswordInput = document.getElementById("repeatAppPassword");

const h1 = document.getElementById("h1");
const sixthStepAccountInfo = document.getElementById("sixthStepAccountInfo");

let mnemonic, appPassword;

firstStepBtn.addEventListener("click", () => {
    mnemonic = bip39.generateMnemonic(256);

    passphraseBox.innerText = mnemonic;

    firstStepDiv.style.display = "none";
    secondStepDiv.style.display = "block";
});

secondStepBtn.addEventListener("click", () => {

    secondStepDiv.style.display = "none";
    thirdStepDiv.style.display = "block";
});

thirdStepBtn.addEventListener("click", () => {
    const userInput = passphraseCheckInput.value.trim();

    if (userInput == mnemonic) {
        thirdStepDiv.style.display = "none";
        fourthStepDiv.style.display = "block";
    } else {
        thirdStepErrorMsg.style.opacity = "1";
    }
});

thirdStepBtnBack.addEventListener("click", () => {
    thirdStepDiv.style.display = "none";
    secondStepDiv.style.display = "block";
});

fourthStepBtn.addEventListener("click", () => {
    const password1 = appPasswordInput.value;
    const password2 = repeatAppPasswordInput.value;

    store.delete('usingAppPassword');

    if (password1?.length != 0) {

        if (password1.length < 6) {
            fourthStepErrorMsg.innerText = "Password must be at least 6 characters long.";
            fourthStepErrorMsg.style.opacity = "1";
            return;
        }

        if (password1 != password2) {
            fourthStepErrorMsg.innerText = "Passwords are not the same.";
            fourthStepErrorMsg.style.opacity = "1";
            return;
        }

        appPassword = password1;
        store.set('usingAppPassword', 'true');
    }

    fourthStepDiv.style.display = "none";
    fifthStepDiv.style.display = "block";

    generateKeysAsync();
});

const generateKeysAsync = async () => {
    if (!bip39.validateMnemonic(mnemonic)) {
        fifthStepErrorMsg.style.opacity = '1';
        fifthStepErrorMsg.innerText = 'Error. Could not generate keys.';
    }

    const seed = (await bip39.mnemonicToSeed(mnemonic)).toString('hex');

    const prng = forge.random.createInstance();
    prng.seedFileSync = () => seed;

    const { privateKey, publicKey } = await new Promise(resolve => {
        forge.pki.rsa.generateKeyPair({ bits: 2048, prng, workers: 2 }, (err, keyPair) => {
            if (err) {
                reject(err)
            } else {
                resolve(keyPair)
            }
        })
    })

    const publicKeyPem = forge.pki.publicKeyToPem(publicKey);
    store.set('publicKey', publicKeyPem);

    if (store.get('usingAppPassword')) {
        const derivedKey = await new Promise(resolve => {
            forge.pkcs5.pbkdf2(appPassword, '', 10000, 32, (err, key) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(key)
                }
            })
        })

        const encryptedPrivateKeyPem = forge.pki.encryptRsaPrivateKey(privateKey, derivedKey, {
            algorithm: 'aes256',
        });

        store.set('privateKey', encryptedPrivateKeyPem);

    } else {
        const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
        store.set('privateKey', privateKeyPem);
    }

    fifthStepSpinner.style.opacity = '0';
    fifthStepBtn.disabled = false;
};

fifthStepBtn.addEventListener("click", () => {

    const username = usernameInput.value.trim();

    if (username.length < 4 || username.length > 32) {
        fifthStepErrorMsg.innerText = "Username must be 4-32 characters long.";
        fifthStepErrorMsg.style.opacity = "1";
        return;
    }

    if (!/^[a-zA-Z0-9]*$/.test(username)) {
        fifthStepErrorMsg.innerText = "Only Letters and Numbers allowed in username.";
        fifthStepErrorMsg.style.opacity = "1";
        return;
    }

    fifthStepSpinner.style.opacity = '1';
    fifthStepErrorMsg.style.opacity = "0";
    fifthStepBtn.disabled = true;

    fetch(url + "api/auth/register", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            publicKey: store.get('publicKey')
        })
    })
    .then(res => {
        if(res.status == 200) {
            res.json().then(res => {
                if(res.username == username) {
                    sixthStepAccountInfo.innerHTML = `${res.message}<br><br>Username: ${res.username}<br>Account ID: ${res.uuid}`
                    fifthStepDiv.style.display = "none";
                    sixthStepDiv.style.display = "block";
                    h1.innerText = "Account created"
    
                    store.set('username', username);
                    store.set('appReady', "true");
                } else {
                    throw Error("Server returned different username.");
                }
            });
        } else {
            res.json().then(res => {
                if(!res.message) {
                    console.log(res);
                    fifthStepErrorMsg.innerText = "Unknown error.";
                } else {
                    fifthStepErrorMsg.innerText = res.message;
                    fifthStepSpinner.style.opacity = '0';
                    fifthStepBtn.disabled = false;
                }
                fifthStepErrorMsg.style.opacity = "1";
            })
        }
    }).catch(e => {
        fifthStepErrorMsg.innerText = "Unknown error.";
        console.log(e);
    });
});

//Hide error on input focus
passphraseCheckInput.addEventListener('focus', () => { thirdStepErrorMsg.style.opacity = "0"; });
appPasswordInput.addEventListener('focus', () => { fourthStepErrorMsg.style.opacity = "0"; });
repeatAppPasswordInput.addEventListener('focus', () => { fourthStepErrorMsg.style.opacity = "0"; });
usernameInput.addEventListener('focus', () => { fifthStepErrorMsg.style.opacity = "0"; });
