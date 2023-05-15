const { sha256 } = require("node-forge");

const inviteForm = document.getElementById("invite-form");
const inviteUsernameInput = document.getElementById("invite-username");
const inviteError = document.getElementById("invite-error");
const inviteSpinner = document.getElementById("invite-spinner");
const inviteListSpinner = document.getElementById("invite-list-spinner");

//Storage
const invites = [];

const readInvites = () => {
    try {
        const encryptedInvitesJSON = store.get('invites');
        if (encryptedInvitesJSON == "" || encryptedInvitesJSON == undefined) return;
        const invitesJSON = aes256.decrypt(symmetricKey, encryptedInvitesJSON);
        const obj = JSON.parse(invitesJSON);

        obj.forEach(inv => {
            invites.push(new Invite(new User(inv.user.username, inv.user.serverAddress), inv.accessKey, inv.channelAccessKey, new Date(inv.time)));
        });
    }
    catch (e) {
        console.log("Error while reading and decrypting invites.");
        console.log(e);
    }
};

const updateInvitesOverlay = () => {
    const table = document.querySelector('#invites-table');

    //Clean table
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        row.parentNode.removeChild(row);
    });

    //Repopulate table
    invites.forEach(invite => {
        appendRowToInvitesTable(table, invite);
    });

};

const updateInvitesStatus = async () => {

    inviteListSpinner.classList.remove("display-none");

    for (i = invites.length - 1; i >= 0; i--) {
        const status = await getInviteStatus(invites[i].user.serverAddress, invites[i].accessKey);
        if (!status) invites.splice(i, 1)
    }

    inviteListSpinner.classList.add("display-none");
    updateInvitesOverlay();
}

const getInviteStatus = (address, accessKey) => {
    return new Promise(resolve => {
        fetch(address + "api/invite?" + new URLSearchParams({
            accessKey: accessKey
        }), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.status == 200) {
                resolve(true);
            } else resolve(false);
        }).catch(e => {
            console.log(e);
            resolve(false);
        });
    });
};

const appendRowToInvitesTable = (table, invite) => {

    const row = document.createElement('tr');

    const addressCell = document.createElement('td');
    addressCell.textContent = invite.user.toAddress();

    const timeCell = document.createElement('td');
    timeCell.textContent = invite.time.toLocaleString("pl-PL", { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const statusCell = document.createElement('td');
    statusCell.textContent = 'Pending';

    const buttonCell = document.createElement('td');
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-outline-danger';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
        cancelInvite(invite.accessKey).then(() => {
            updateInvitesOverlay();
            saveInvites();
        });
    };
    buttonCell.appendChild(cancelButton);

    row.appendChild(addressCell);
    row.appendChild(timeCell);
    row.appendChild(statusCell);
    row.appendChild(buttonCell);

    table.querySelector('tbody').appendChild(row);
};


const addInvite = (user, accessKey, channelAccessKey) => {
    invites.push(new Invite(user, accessKey, channelAccessKey, new Date()));

    updateInvitesOverlay();
    saveInvites();
};

const saveInvites = () => {
    const invitesJSON = JSON.stringify(invites);
    const encryptedInvitesJSON = aes256.encrypt(symmetricKey, invitesJSON);
    store.set('invites', encryptedInvitesJSON);

    if (invites.length == 0)
        uploadInvitesData(null);
    else
        uploadInvitesData(encryptedInvitesJSON);
}

inviteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    inviteSpinner.classList.remove("display-none");

    const userAddress = String(inviteUsernameInput.value.trim());
    let username, serverAddress;

    if (userAddress.includes("@")) {
        const arr = userAddress.split("@");
        if (arr.length != 2) {
            inviteError.innerText = "User address is not valid. Format: user@example.com";
            inviteError.classList.remove("display-none");
            return;
        }
        username = arr[0];
        serverAddress = 'http://' + arr[1] + '/';

    } else {
        username = userAddress;
        serverAddress = url;
    }

    if (username == me.username && serverAddress == url) {
        inviteError.innerText = "You cannot invite yourself.";
        inviteError.classList.remove("display-none");
        inviteSpinner.classList.add("display-none");
        return;
    }

    //Check if user is already invited
    const sameUsernameInvites = invites.filter(x => x.user.username == username)
    for (i = 0; i < sameUsernameInvites.length; i++) {
        if (sameUsernameInvites[i].user.serverAddress == serverAddress) {
            inviteError.innerText = "User is already invited. Wait for their response.";
            inviteError.classList.remove("display-none");
            inviteSpinner.classList.add("display-none");
            return;
        }
    }

    getPublicKeyAndSendInvite(serverAddress, username, userAddress);
});

const getPublicKeyAndSendInvite = (serverAddress, username, userAddress) => {
    fetch(serverAddress + "api/invite/public-key?" + new URLSearchParams({
        username: username
    }), {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    }).then(response => {
        if (response.status == 200) {
            response.json().then(res => {
                if (!res.publicKey) new Error("No public key returned");
                else {
                    sendInvite(serverAddress, username, userAddress, res.publicKey);
                }
            });

        } else throw new Error("User not found");
    }).catch(e => {
        inviteError.innerText = "User not found. Please check if address and username are correct.";
        inviteError.classList.remove("display-none");
        inviteSpinner.classList.add("display-none");
        console.log(e);
        return;
    });
};


const sendInvite = async (serverAddress, username, userAddress, usersPublicKeyPem) => {

    const channelAccessKey = await getNewChannel();
    if (!channelAccessKey) {
        inviteError.innerText = "Could not create a new channel";
        inviteError.classList.remove("display-none");
        inviteSpinner.classList.add("display-none");
        return;
    }

    const channelEncryptionKey = getNewAesKey();
    const user = getUserFromAddress(userAddress);
    const users = [me, user];

    const channel = new Channel(channelAccessKey, channelEncryptionKey, users, url, false);
    const inviteContent = JSON.stringify(channel);

    const encryptedInviteContent = aes256.encrypt(channelEncryptionKey, inviteContent)

    const key = publicKeyEncrypt64(channelEncryptionKey, usersPublicKeyPem);

    fetch(serverAddress + "api/invite", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            content: encryptedInviteContent,
            encryptedKey: key,
        })
    }).then(res => {
        if (res.status == 200) {
            res.json().then(res => {
                if (res.accessKey) {
                    inviteSpinner.classList.add("display-none");
                    inviteError.classList.add("display-none");
                    addInvite(user, res.accessKey, channelAccessKey);
                    inviteUsernameInput.value = '';
                } else {
                    throw Error("No invite access key returned");
                }
            });
        } else {
            res.json().then(res => {
                inviteError.innerText = res.message || "User not found.";
                inviteSpinner.classList.add("display-none");
                inviteError.classList.remove("display-none");
            });
        }
    }).catch(e => {
        inviteError.innerText = "Server did not respond correctly.";
        inviteError.classList.remove("display-none");
        inviteSpinner.classList.add("display-none");
        console.log(e);
    });
}

const getNewChannel = () => {
    return new Promise(resolve => {
        fetch(url + "api/channel", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'bearer ' + jwt
            }
        }).then(response => {
            if (response.status == 200) {
                response.json().then(res => {
                    if (!res.accessKey) new Error("No access key returned");
                    else {
                        resolve(res.accessKey);
                    }
                });

            } else throw new Error();
        }).catch(e => {
            console.log(e);
            resolve(false);
        });
    });
};

const cancelInvite = (accessKey) => {
    const invite = invites.filter(x => x.accessKey == accessKey);
    if(invite.length != 1) return new Promise(resolve => { resolve(false) });

    const channelAccessKey = invite[0].channelAccessKey;

    const index = invites.indexOf(invite[0]);
    invites.splice(index, 1);

    return new Promise(resolve => {
        fetch(url + "api/invite?" + new URLSearchParams({
            inviteAccessKey: accessKey,
            channelAccessKey: channelAccessKey
        }), {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            }
        }).then(response => {
            if (response.status == 200) {
                resolve(true);
            } else resolve(false);
        }).catch(e => {
            console.log(e);
            resolve(false);
        });
    });
};

//Hide errors on input focus
inviteUsernameInput.addEventListener("focus", () => {
    inviteError.classList.add("display-none");
});

//Upload data to server
const uploadInvitesData = (data) => {
    fetch(url + "api/data/invites", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'bearer ' + jwt
        },
        body: JSON.stringify({ data: data })

    }).then(response => {
        if (response.status != 200) {
            throw new Error("Invites data not uploaded");
        }
    }).catch(e => {
        console.log(e);
    });
}