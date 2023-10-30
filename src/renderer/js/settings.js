const settingsBtn = document.getElementById("settings-btn");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsName = document.getElementById("account-name");
const settingsId = document.getElementById("account-id");
const settingsAcceptsInvitesCheckbox = document.getElementById("accepts-invites-checkbox");

let settings;

settingsBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    overlay.classList.remove("display-none");
    settingsOverlay.classList.remove("display-none");

    if (settings) return;
    settings = await getSettings();

    displaySettings();
});

const displaySettings = () => {
    settingsName.innerText = settings.username;
    settingsId.innerText = settings.uuid;
    settingsAcceptsInvitesCheckbox.checked = settings.acceptsInvites;
    settingsAcceptsInvitesCheckbox.disabled = false;
}

const getSettings = () => {
    return new Promise(resolve => {
        fetch(url + "api/settings", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'bearer ' + jwt
            }
        }).then(response => {
            if (response.status != 200) resolve(null);
            else {
                response.json().then(res => {
                    resolve(res);
                });
            }
        }).catch(e => {
            console.log(e);
            resolve(null);
        });
    });
}

settingsAcceptsInvitesCheckbox.addEventListener("change", function () {
    
    fetch(url + "api/settings/accepts-invites", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'bearer ' + jwt
        },
        body: JSON.stringify({ value: settingsAcceptsInvitesCheckbox.checked })

    }).then(response => {
        if (response.status != 200) {
            throw new Error("Could not change settings");
        }
    }).catch(e => {
        console.log(e);
    });
});