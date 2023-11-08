const settingsBtn = document.getElementById("settings-btn");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsUserName = document.getElementById("account-name");
const settingsUserId = document.getElementById("account-id");
const settingsAcceptsInvitesCheckbox = document.getElementById("accepts-invites-checkbox");

const settingsChatBox = document.getElementById("chat-settings");
const settingsChatName = document.getElementById("settings-chat-name");
const settingsChatId = document.getElementById("settings-chat-id");
const settingsChatServer = document.getElementById("settings-chat-server");

const leaveChatBtn = document.getElementById("leave-chat-btn");
const leaveChatText = document.getElementById("leave-chat-text");

let settings;
let leaveChatConfirm = false;

settingsBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    overlay.classList.remove("display-none");
    settingsOverlay.classList.remove("display-none");

    if(activeChannel) {
        settingsChatBox.classList.remove("display-none");
        settingsChatName.innerText = activeChannel.getName();
        settingsChatId.innerText = activeChannel.uuid;
        settingsChatServer.innerText = activeChannel.serverAddress;
    }
    else settingsChatBox.classList.add("display-none");

    leaveChatText.classList.remove("display-none");
    leaveChatBtn.value = "Leave";
    leaveChatConfirm = false;

    if (settings) return;
    settings = await getSettings();

    displayUserSettings();
});

const displayUserSettings = () => {
    settingsUserName.innerText = settings.username;
    settingsUserId.innerText = settings.uuid;
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

settingsAcceptsInvitesCheckbox.addEventListener("change", () => {
    
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

leaveChatBtn.addEventListener("click", () => {
    if(!leaveChatConfirm) {
        leaveChatBtn.value = "Click after 5 seconds to confirm";
        leaveChatText.classList.add("display-none");
        leaveChatBtn.disabled = true;
        leaveChatConfirm = true;
        setTimeout(() => {
            leaveChatBtn.disabled = false;
            leaveChatBtn.value = "Click to leave this chat";
        }, 5000);
    } else {
        hideOverlays();
        leaveActiveChannel();
    }
})