/*const Store = require('electron-store');
const forge = require('node-forge');

const store = new Store();

const url = store.get('serverAddress');
const username = store.get('username');
*/
const sendMessageInput = document.getElementById("message-input");
const sendMessageBtn = document.getElementById("message-send");
const sendMessageForm = document.getElementById("message-form");
const messagesOuterBox = document.getElementsByClassName("messages-outer-box")[0];


window.addEventListener("load", () => {
    //jwtBox.innerText = window.sessionStorage.getItem('jwt');
});

sendMessageInput.addEventListener("input", () => {
    sendMessageInput.style.height = "1px";
    let h = 2 + sendMessageInput.scrollHeight;
    if (h > 200) h = 200;
    sendMessageInput.style.height = h + "px";
    h+=104;
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

    if(message == "") return;

    console.log(message);
    sendMessageInput.style.height = "36px";
    messagesOuterBox.style.height = "calc( 100vh - 140px )";
    sendMessageInput.value = "";
});