const Store = require('electron-store');
const store = new Store();

const serverAddressInput = document.getElementById("serverAddress");
const createNewAccountBtn = document.getElementById("createNewAccountBtn");
const restoreYourAccountBtn = document.getElementById("restoreYourAccountBtn");
const spinner = document.getElementById("spinner");
const errorMsg = document.getElementById("errorMsg");

createNewAccountBtn.addEventListener("click", () => {
    checkServerAndRedirect("setup-new.html");
});

restoreYourAccountBtn.addEventListener("click", () => {
    checkServerAndRedirect("setup-restore.html");
});

const checkServerAndRedirect = path => {
    let url = serverAddressInput.value;

    if(url.length < 8) {
        errorMsg.style.display = "block";
        return;
    }

    if(url.slice(-1) != "/") url += "/";

    spinner.style.display = "block";
    errorMsg.style.display = "none";

    fetch(url + "api/auth/server-info")
        .then(response => {
            if (response.status == 200) {
                store.set('serverAddress', url);
                window.location.href = path;
            } else {
                throw new Error('Server error');
            }
        })
        .catch(err => {
            spinner.style.display = "none";
            errorMsg.style.display = "block";
            console.log(err);
        });
}

serverAddressInput.addEventListener('focus', () => {
    errorMsg.style.display = "none";
});

serverAddressInput.value = store.get('serverAddress');