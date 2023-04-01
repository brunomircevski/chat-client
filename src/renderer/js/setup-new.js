const Store = require('electron-store');
const bip39 = require('bip39');

const store = new Store();

const firstStepBtn = document.getElementById("firstStepBtn");
const secondStepBtn = document.getElementById("secondStepBtn");
const thirdStepBtn = document.getElementById("thirdStepBtn");
const fourthStepBtn = document.getElementById("fourthStepBtn");
const fifthStepBtn = document.getElementById("fifthStepBtn");

const firstStepDiv = document.getElementById("firstStepDiv");
const secondStepDiv = document.getElementById("secondStepDiv");
const thirdStepDiv = document.getElementById("thirdStepDiv");
const fourthStepDiv = document.getElementById("fourthStepDiv");
const fifthStepDiv = document.getElementById("fifthStepDiv");

const passphraseBox = document.getElementById("passphraseBox");
const passphraseCheckInput = document.getElementById("passphraseCheckInput");

const thirdStepErrorMsg = document.getElementById("thirdStepErrorMsg");
const fourthStepErrorMsg = document.getElementById("fourthStepErrorMsg");

const usernameInput = document.getElementById("username");
const appPasswordInput = document.getElementById("appPassword");
const repeatAppPasswordInput = document.getElementById("repeatAppPassword");

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

    if(userInput == mnemonic) {
        thirdStepDiv.style.display = "none";
        fourthStepDiv.style.display = "block";
    } else {
        thirdStepErrorMsg.style.display = "block";
    }
});

fourthStepBtn.addEventListener("click", () => {
    const password1 = appPasswordInput.value;
    const password2 = repeatAppPasswordInput.value;

    if(password1?.length != 0) {

        if(password1.length < 6) {
            fourthStepErrorMsg.innerText = "Password must be at least 6 characters long.";
            fourthStepErrorMsg.style.display = "inline";
            return;
        } 
    
        if(password1 != password2) {
            fourthStepErrorMsg.innerText = "Passwords are not the same.";
            fourthStepErrorMsg.style.display = "inline";
            return;
        }

        appPassword = password1;
    }

    fourthStepDiv.style.display = "none";
    fifthStepDiv.style.display = "block";
});

//Hide error on input focus
passphraseCheckInput.addEventListener('focus', () => { thirdStepErrorMsg.style.display = "none"; });
usernameInput.addEventListener('focus', () => { fourthStepErrorMsg.style.display = "none"; });
appPasswordInput.addEventListener('focus', () => { fourthStepErrorMsg.style.display = "none"; });
repeatAppPasswordInput.addEventListener('focus', () => { fourthStepErrorMsg.style.display = "none"; });