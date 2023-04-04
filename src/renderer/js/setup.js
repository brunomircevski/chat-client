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
        errorMsg.style.opacity = "1";
        return;
    }

    if(url.slice(-1) != "/") url += "/";

    spinner.style.opacity = "1";
    errorMsg.style.opacity = "0";

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
            spinner.style.opacity = "0";
            errorMsg.style.opacity = "1";
            console.log(err);
        });
}

serverAddressInput.addEventListener('focus', () => {
    errorMsg.style.opacity = "0";
});

serverAddressInput.value = store.get('serverAddress') || "";