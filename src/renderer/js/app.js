const Store = require('electron-store');
const forge = require('node-forge');

const store = new Store();

const url = store.get('serverAddress');
const username = store.get('username');

const SendMessageInput = document.getElementById("message-input");
const sendMessageBtn = document.getElementById("message-send");
const sendMessageForm = document.getElementById("message-form");


window.addEventListener("load", () => {
    //jwtBox.innerText = window.sessionStorage.getItem('jwt');
});

SendMessageInput.addEventListener("input", () => {
    SendMessageInput.style.height = "1px";
    let h = 2 + SendMessageInput.scrollHeight;
    if (h > 200) h = 200;
    SendMessageInput.style.height = h + "px";
});

SendMessageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessageBtn.click();
    }
});

sendMessageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = SendMessageInput.value.trim();

    if(message == "") return;

    console.log(message);
    SendMessageInput.style.height = "36px";
    SendMessageInput.value = "";
});