const Store = require('electron-store');
const forge = require('node-forge');

const store = new Store();

const url = store.get('serverAddress');
const username = store.get('username');

const firstStepDiv = document.getElementById("firstStepDiv");
const secondStepDiv = document.getElementById("secondStepDiv");

const firstStepBtn = document.getElementById("firstStepBtn");
const appPasswordInput = document.getElementById("appPassword");
const errorMsg = document.getElementById("errorMsg");

const resetBtn = document.getElementById("resetBtn");
const confirmResetBtn = document.getElementById("confirmResetBtn");

const usingAppPassword = store.get("usingAppPassword");

let jwt;

window.addEventListener('load', () => {
    if (usingAppPassword) firstStepDiv.style.display = "block";
    else {
        secondStepDiv.style.display = "block";

        window.sessionStorage.setItem('privateKey', store.get('privateKey'));
        getToken();
    }
});

firstStepBtn.addEventListener("click", async () => {
    const password = appPasswordInput.value;

    if (password.length < 6 || password.length > 32) {
        errorMsg.innerText = "Wrong password (6-32 characters). Try again.";
        errorMsg.style.opacity = "1";
        return;
    }

    let error = false;
    let privateKeyPem;

    try {
        const derivedKey = await new Promise(resolve => {
            forge.pkcs5.pbkdf2(password, '', 10000, 32, (err, key) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(key)
                }
            })
        })

        const decryptedPrivateKey = forge.pki.decryptRsaPrivateKey(store.get("privateKey"), derivedKey);

        if (!decryptedPrivateKey) {
            throw Error('Decryption failed.');
        }

        privateKeyPem = forge.pki.privateKeyToPem(decryptedPrivateKey);

    } catch (e) {
        error = true;
        console.log(e);
    }

    if(error) {
        errorMsg.innerText = "Wrong password. Try again.";
        errorMsg.style.opacity = "1";
        return;
    }

    window.sessionStorage.setItem('privateKey', privateKeyPem);
    secondStepDiv.style.display = "block";
    firstStepDiv.style.display = "none";

    getToken();
});

const getToken = () => {
    const privateKeyPem = window.sessionStorage.getItem('privateKey');
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    deriveSymmetricKey(privateKey);

    const md = forge.md.sha256.create();
    md.update(username, 'utf8');
    const signature = privateKey.sign(md);
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
    }).then(res => {
        if(res.status == 200) {
            res.json().then(res => {
                if(res.token) {
                    jwt = res.token;
                    window.sessionStorage.setItem('jwt', res.token);
                    getUserData();
                } else {
                    throw Error("No JWT returned.");
                }
            });
        } else {
            errorMsg.innerText = "Could not login with saved information."
            errorMsg.style.opacity = "1";
        }
    }).catch(e => {
        errorMsg.innerText = "Could not login. Server did not respond.";
        errorMsg.style.opacity = "1";
        console.log(e);
    });
}

const deriveSymmetricKey = (privateKey) => {

    const privateKeyDer = forge.asn1.toDer(forge.pki.privateKeyToAsn1(privateKey)).getBytes();
    const hkdf = forge.pkcs5.pbkdf2(privateKeyDer, '', 1, 32, 'sha256');

    window.sessionStorage.setItem('symmetricKey', hkdf);
}

const getUserData = async () => {

    await new Promise(resolve => {
        fetch(url + "api/data/invites", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'bearer ' + jwt
            }
        }).then(response => {
            if (response.status == 200) {
                response.json().then(res => {
                    store.set('invites', res.data)
                    console.log("Updated invites data");
                    resolve();
                });
            } else {
                console.log("Could not get invites data");
                resolve();
            }
            
        }).catch(e => {
            console.log(e);
            resolve();
        });
    });

    window.location.href = 'app.html';
};

resetBtn.addEventListener("click", async () => {
    resetBtn.disabled = true;
    resetBtn.innerText = "Are you sure?";
    confirmResetBtn.style.display = "inline";
});

confirmResetBtn.addEventListener("click", async () => {
    store.clear();
    window.sessionStorage.clear();
    window.location.href = "setup.html"
});

//Hide error on input focus
appPasswordInput.addEventListener('focus', () => { errorMsg.style.opacity = "0"; });
