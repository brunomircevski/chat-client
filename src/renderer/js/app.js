const Store = require('electron-store');
const forge = require('node-forge');
const aes256 = require('aes256');

const store = new Store();

const url = store.get('serverAddress');
const me = new User(store.get('username'), url);

const publicKeyPem = store.get('publicKey');
const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

const privateKeyPem = window.sessionStorage.getItem('privateKey');
const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
const symmetricKey = window.sessionStorage.getItem('symmetricKey');
const jwt = window.sessionStorage.getItem('jwt');

let loading = true;

//UI
const sendMessageInput = document.getElementById("message-input");
const sendMessageBtn = document.getElementById("message-send");
const sendMessageForm = document.getElementById("message-form");
const messagesOuterBox = document.getElementsByClassName("messages-outer-box")[0];

const overlay = document.getElementsByClassName("full-overlay")[0];
const closeOverlayBtn = document.getElementById("close-overlay-btn");

const allOverlays = document.getElementsByClassName("overlay-content");
const invitesOverlay = document.getElementById("invites-overlay");
const emojiOverlay = document.getElementById("emoji-overlay");

const addChatBtn = document.getElementById("add-chat-btn");
const openEmojisBtn = document.getElementById("emoji-btn");

sendMessageInput.addEventListener("input", () => {
    sendMessageInput.style.height = "1px";
    let h = 2 + sendMessageInput.scrollHeight;
    if (h > 200) h = 200;
    sendMessageInput.style.height = h + "px";
    h += 89;
    messagesOuterBox.style.height = "calc( 100vh - " + h + "px )";
});

sendMessageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessageBtn.click();
    }
});

sendMessageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = sendMessageInput.value.trim();

    if (message == "") return;

    //console.log(message)
    sendTextMessage(message);

    sendMessageInput.style.height = "36px";
    messagesOuterBox.style.height = "calc( 100vh - 125px )";
    sendMessageInput.value = "";
});

overlay.addEventListener("click", (e) => {
    if (e.target !== e.currentTarget) return;
    hideOverlays();
});

closeOverlayBtn.addEventListener("click", (e) => {
    e.preventDefault();
    hideOverlays();
});

addChatBtn.addEventListener("click", (e) => {
    e.preventDefault();
    overlay.classList.remove("display-none");
    invitesOverlay.classList.remove("display-none");

    updateInvitesStatus();
    updateReceivedInvitesLoop();
});

openEmojisBtn.addEventListener("click", (e) => {
    overlay.classList.remove("display-none");
    emojiOverlay.classList.remove("display-none");
});

const hideOverlays = () => {
    overlay.classList.add("display-none");
    for (i = 0; i < allOverlays.length; i++) {
        allOverlays[i].classList.add("display-none");
    }
};

//Generate emojis
const emojiContainer = document.getElementById("emoji-container");
const emojis = ["128512", "128516", "128525", "128151", "128513", "128514", "128517", "128518", "128526", "128564", "128528", "128557", "128539", "128544", "128546", "128551", "129321", "129392", "128054", "128049", "128176"];

const generateEmojis = () => {
    for (const emoji of emojis) {
        const emojiBtn = document.createElement("button");
        emojiBtn.classList.add("emoji-icon");
        emojiBtn.innerHTML = "&#" + emoji + ";";
        emojiBtn.onclick = () => {
            sendEmoji(emoji);
            hideOverlays();
        }

        emojiContainer.appendChild(emojiBtn);
    }
};

//OnLoad
window.addEventListener("load", () => {
    readChannels();
    readSentInvites();
    getReceivedInvites();
    displayChannels();
    updateInvitesStatus();
    generateEmojis();

    invitesInterval = setInterval(getReceivedInvites, 60000);

    loading = false;
});

//Check for invites every 1 minute
let invitesInterval;
const updateReceivedInvitesLoop = () => {
    clearInterval(invitesInterval);
    getReceivedInvites();
    invitesInterval = setInterval(getReceivedInvites, 60000);
}