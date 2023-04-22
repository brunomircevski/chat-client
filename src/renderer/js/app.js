const Store = require('electron-store');
const forge = require('node-forge');

const store = new Store();

const url = store.get('serverAddress');
const username = store.get('username');

const jwtBox = document.getElementById("jwt");

window.addEventListener('load', () => {
    jwtBox.innerText = window.sessionStorage.getItem('jwt');
});