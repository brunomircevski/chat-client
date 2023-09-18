const receivedInvites = [];

const getReceivedInvites = async () => {

    let result;

    //Get invites for me
    await new Promise(resolve => {
        fetch(url + "api/data/received-invites", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'bearer ' + jwt
            }
        }).then(response => {
            if (response.status == 200) {
                response.json().then(res => {
                    result = res;
                    resolve();
                });
            } else if (response.status == 204) {
                resolve();
            } else {
                console.log("Could not get received invites data");
                resolve();
            }

        }).catch(e => {
            console.log(e);
            resolve();
        });
    });

    if (result == null || result == undefined || !Array.isArray(result)) {
        console.log("There are no new invites for me");
        return;
    }

    //Process response
    result.forEach(item => {
        try {
            const inviteAccessKey = item.accessKey;
            const key = privateKeyDecrypt64(item.encryptedKey);
            const contentJSON = aes256.decrypt(key, item.content);
            const channelObj = JSON.parse(contentJSON)

            let user;

            if (!userIsMe(channelObj.users[0].username, channelObj.users[0].serverAddress)) {
                user = new User(channelObj.users[0].username, channelObj.users[0].serverAddress);
            } else {
                user = new User(channelObj.users[1].username, channelObj.users[1].serverAddress);
            }

            const invite = new Invite(user, inviteAccessKey, channelObj.accessKey, undefined);

            const channel = new Channel(channelObj.accessKey, channelObj.encryptionKey, [user, me], channelObj.serverAddress, false)

            invite.channel = channel;

            receivedInvites.push(invite);

        } catch (e) {
            console.log("Could not parse invite");
            console.log(e);
        }

    });

    displayReceivedInvites()
}

const receivedInvitesBox = document.getElementById("received-invites-box");
const receivedInvitesH = document.getElementById("received-invites");
const numOfInvitesSpan = document.getElementById("num-of-invites");

const displayReceivedInvites = () => {
    if (receivedInvites.length < 1) {
        receivedInvitesH.classList.add("display-none");
        return;
    }

    receivedInvitesH.classList.remove("display-none");
    numOfInvitesSpan.innerText = receivedInvites.length;

    //Remove old invites if exists
    receivedInvitesBox.querySelectorAll("article").forEach((article) => {
        article.remove();
    });

    //Append new invites
    receivedInvites.forEach(inv => {
        appendReceivedInvite(inv);
    });
}

const appendReceivedInvite = (invite) => {

    const article = document.createElement("article");
    article.className = "row chat invite";

    const imgBoxDiv = document.createElement("div");
    imgBoxDiv.className = "col chat-img-box";

    const imgDiv = document.createElement("div");
    imgDiv.className = "chat-img bg-gradient-0";
    imgDiv.textContent = "?";
    imgBoxDiv.appendChild(imgDiv);

    const colDiv = document.createElement("div");
    colDiv.className = "col";

    const userAddressDiv = document.createElement("div");
    userAddressDiv.textContent = invite.user.toAddress();
    userAddressDiv.className = "user-address";
    colDiv.appendChild(userAddressDiv);

    const rejectButton = document.createElement("button");
    rejectButton.className = "btn btn-outline-danger";
    rejectButton.textContent = "Reject";
    rejectButton.onclick = () => {
        rejectInvite(invite).then(() => {
            const index = receivedInvites.indexOf(invite);
            receivedInvites.splice(index, 1);
            displayReceivedInvites();
        });
    };
    colDiv.appendChild(rejectButton);

    const acceptButton = document.createElement("button");
    acceptButton.className = "btn btn-outline-success";
    acceptButton.textContent = "Accept";
    acceptButton.onclick = () => {
        acceptInvite(invite).then((res) => {
            if(res) {
                addChannel(invite.channel);
                const index = receivedInvites.indexOf(invite);
                receivedInvites.splice(index, 1);
                displayReceivedInvites();
            }
        });
    };
    colDiv.appendChild(acceptButton);

    article.appendChild(imgBoxDiv);
    article.appendChild(colDiv);

    receivedInvitesBox.appendChild(article);

}

const rejectInvite = (invite) => {

    //Remove channel
    fetch(invite.user.serverAddress + "api/channel?" + new URLSearchParams({
        accessKey: invite.channelAccessKey
    }), {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        if (response.status != 200) throw new Error("Channel not removed");
    }).catch(e => {
        console.log(e);
    });

    //Remove invite
    return new Promise(resolve => {
        fetch(url + "api/invite?" + new URLSearchParams({
            inviteAccessKey: invite.accessKey,
        }), {
            method: 'DELETE',
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
}

const acceptInvite = (invite) => {

    let error = false;

    //Activate channel
    fetch(invite.user.serverAddress + "api/channel/activate?" + new URLSearchParams({
        accessKey: invite.channelAccessKey
    }), {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        if (response.status != 200) {
            throw new Error("Could not activate channel");
            error = true;
        }
    }).catch(e => {
        console.log(e);
    });

    if(error) return new Promise(resolve => {
        resolve(false);
    });

    //Remove invite
    return new Promise(resolve => {
        fetch(url + "api/invite?" + new URLSearchParams({
            inviteAccessKey: invite.accessKey,
        }), {
            method: 'DELETE',
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
}