const inviteForm = document.getElementById("invite-form");
const inviteUsernameInput = document.getElementById("invite-username");
const inviteError = document.getElementById("invite-error");
const inviteSpinner = document.getElementById("invite-spinner");

//Storage
const invites = [];

const readInvites = () => {
    try {
        const encryptedInvitesJSON = store.get('invites');
        if(encryptedInvitesJSON == "" || encryptedInvitesJSON == undefined) return;
        const invitesJSON = aes256.decrypt(symmetricKey, encryptedInvitesJSON);
        const obj = JSON.parse(invitesJSON);

        obj.forEach(inv => {
            invites.push(new Invite(inv.address, inv.accessKey));
        });
    }
    catch(e) {
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
        appendRowToTable(table, invite);
    });

};

const appendRowToTable = (table, invite) => {

    const row = document.createElement('tr');

    const addressCell = document.createElement('td');
    addressCell.textContent = invite.address;

    const timeCell = document.createElement('td');
    timeCell.textContent = invite.time;

    const statusCell = document.createElement('td');
    statusCell.textContent = 'Pending';

    const buttonCell = document.createElement('td');
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-outline-danger';
    cancelButton.textContent = 'Cancel';
    buttonCell.appendChild(cancelButton);

    row.appendChild(addressCell);
    row.appendChild(timeCell);
    row.appendChild(statusCell);
    row.appendChild(buttonCell);

    table.querySelector('tbody').appendChild(row);
};


const addInvite = (userAddress, accessKey) => {
    invites.push(new Invite(userAddress, accessKey));

    updateInvitesOverlay();

    const invitesJSON = JSON.stringify(invites);
    const encryptedInvitesJSON = aes256.encrypt(symmetricKey, invitesJSON);
    store.set('invites', encryptedInvitesJSON);
};

//Invite form
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

    if (username == myUsername && serverAddress == url) {
        inviteError.innerText = "You cannot invite yourself.";
        inviteError.classList.remove("display-none");
        inviteSpinner.classList.add("display-none");
        return;
    }

    fetch(serverAddress + "api/auth/server-info", {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    }).then(response => {
        if (response.status == 200) {
            response.json().then(res => {
                if (!res.encryptedChatServer) new Error();
                else {
                    sendInvite(serverAddress, username, userAddress);
                }
            });

        } else throw new Error();
    }).catch(e => {
        inviteError.innerText = "Server did not respond correctly. Please check if address is correct.";
        inviteError.classList.remove("display-none");
        inviteSpinner.classList.add("display-none");
        console.log(e);
        return;
    });

});

const sendInvite = (serverAddress, username, userAddress) => {
    fetch(serverAddress + "api/invite", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            content: "supersecretcontent"
        })
    }).then(res => {
        if (res.status == 200) {
            res.json().then(res => {
                if (res.accessKey) {
                    inviteSpinner.classList.add("display-none");
                    addInvite(userAddress, res.accessKey);
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

//Hide errors on input focus
inviteUsernameInput.addEventListener("focus", () => {
    inviteError.classList.add("display-none");
});