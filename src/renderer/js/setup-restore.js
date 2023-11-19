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

const firstStepDiv = document.getElementById("firstStepDiv");
const secondStepDiv = document.getElementById("secondStepDiv");
const thirdStepDiv = document.getElementById("thirdStepDiv");
const fourthStepDiv = document.getElementById("fourthStepDiv");
const fifthStepDiv = document.getElementById("fifthStepDiv");

const passphraseInput = document.getElementById("passphraseInput");

const secondStepErrorMsg = document.getElementById("secondStepErrorMsg");
const thirdStepErrorMsg = document.getElementById("thirdStepErrorMsg");
const fourthStepErrorMsg = document.getElementById("fourthStepErrorMsg");

const fourthStepSpinner = document.getElementById("fourthStepSpinner");

const usernameInput = document.getElementById("username");
const appPasswordInput = document.getElementById("appPassword");
const repeatAppPasswordInput = document.getElementById("repeatAppPassword");

const h1 = document.getElementById("h1");

let mnemonic, appPassword, privateKeyTmp;

firstStepBtn.addEventListener("click", () => {
    firstStepDiv.style.display = "none";
    secondStepDiv.style.display = "block";
});

secondStepBtn.addEventListener("click", () => {
    const userInputPassphrase = passphraseInput.value.trim();
    if(bip39.validateMnemonic(userInputPassphrase)) {
        mnemonic = userInputPassphrase;
        secondStepDiv.style.display = "none";
        thirdStepDiv.style.display = "block";
    } else {
        secondStepErrorMsg.style.opacity = 1;
    }
});

thirdStepBtn.addEventListener("click", () => {
    const password1 = appPasswordInput.value;
    const password2 = repeatAppPasswordInput.value;

    store.delete('usingAppPassword');

    if (password1?.length != 0) {

        if (password1.length < 6) {
            thirdStepErrorMsg.innerText = "Password must be at least 6 characters long.";
            thirdStepErrorMsg.style.opacity = "1";
            return;
        }

        if (password1 != password2) {
            thirdStepErrorMsg.innerText = "Passwords are not the same.";
            thirdStepErrorMsg.style.opacity = "1";
            return;
        }

        appPassword = password1;
        store.set('usingAppPassword', 'true');
    }

    thirdStepDiv.style.display = "none";
    fourthStepDiv.style.display = "block";

    generateKeysAsync();
});

const generateKeysAsync = async () => {
    if (!bip39.validateMnemonic(mnemonic)) {
        fourthStepErrorMsg.style.opacity = '1';
        fourthStepErrorMsg.innerText = 'Error. Could not generate keys.';
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
    privateKeyTmp = privateKey;

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

    fourthStepSpinner.style.opacity = '0';
    fourthStepBtn.disabled = false;
};

fourthStepBtn.addEventListener("click", async () => {

    const username = usernameInput.value.trim();

    if (username.length < 4 || username.length > 32) {
        fourthStepErrorMsg.innerText = "Username must be 4-32 characters long.";
        fourthStepErrorMsg.style.opacity = "1";
        return;
    }

    if (!/^[a-zA-Z0-9]*$/.test(username)) {
        fourthStepErrorMsg.innerText = "Only Letters and Numbers allowed in username.";
        fourthStepErrorMsg.style.opacity = "1";
        return;
    }

    fourthStepSpinner.style.opacity = '1';
    fourthStepErrorMsg.style.opacity = "0";
    fourthStepBtn.disabled = true;

    const challenge = await getChallenge(username);

    const md = forge.md.sha256.create();
    md.update(challenge, 'utf8');
    const signature = privateKeyTmp.sign(md);
    const signatureBase64 = forge.util.encode64(signature);

    fetch(url + "api/auth/login", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            signature: signatureBase64
        })
    })
    .then(res => {
        if(res.status == 200) {
            res.json().then(res => {
                if(res.token) {
                    fourthStepDiv.style.display = "none";
                    fifthStepDiv.style.display = "block";
                    h1.innerText = "App restored"
    
                    store.set('username', username);
                    store.set('appReady', "true");
                } else {
                    throw Error("Server did not return a token.");
                }
            });
        } else {
            fourthStepErrorMsg.innerText = "Username and passphrase doesn't mach.";
            fourthStepSpinner.style.opacity = '0';
            fourthStepBtn.disabled = false;
            fourthStepErrorMsg.style.opacity = "1";
        }
    }).catch(e => {
        fourthStepErrorMsg.innerText = "Unknown error.";
        fourthStepErrorMsg.style.opacity = "1";
        console.log(e);
    });
});

//Hide error on input focus
passphraseInput.addEventListener('focus', () => { secondStepErrorMsg.style.opacity = "0"; });
appPasswordInput.addEventListener('focus', () => { thirdStepErrorMsg.style.opacity = "0"; });
repeatAppPasswordInput.addEventListener('focus', () => { thirdStepErrorMsg.style.opacity = "0"; });
usernameInput.addEventListener('focus', () => { fourthStepErrorMsg.style.opacity = "0"; });
