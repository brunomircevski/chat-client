const { access } = require("original-fs");

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
const numOfInvitesSpan = document.getElementById("num-of-invites");

const displayReceivedInvites = () => {
    if(receivedInvites.length < 1) return;

    receivedInvitesBox.classList.remove("display-none");
    numOfInvitesSpan.innerText = receivedInvites.length;

    //display
}