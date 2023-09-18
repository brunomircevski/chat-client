const channels = [];

const readChannels = () => {
    try {
        const encryptedJSON = store.get('userdata');
        if (encryptedJSON == "" || encryptedJSON == undefined) return;
        const decryptedJSON = aes256.decrypt(symmetricKey, encryptedJSON);
        const obj = JSON.parse(decryptedJSON);

        obj.channels.forEach(ch => {
            channels.push(new Channel(
                ch.accessKey,
                ch.encryptionKey, 
                [new User(ch.users[0].username, ch.users[0].serverAddress), new User(ch.users[1].username, ch.users[1].serverAddress)],
                ch.serverAddress,
                true));
        });
    }
    catch (e) {
        console.log("Error while reading and decrypting channel data.");
        console.log(e);
    }
};

const addChannel = (channel) => {
    channel.active = true;
    channels.push(channel);
    saveUserdata();
}

const saveUserdata = () => {
    let userdata = { 
        channels: channels,
    };

    const userdataJSON = JSON.stringify(userdata);
    const encryptedJSON = aes256.encrypt(symmetricKey, userdataJSON);
    store.set('userdata', encryptedJSON);

    uploadUserdata(encryptedJSON);
} 

//Upload userdata to server
const uploadUserdata = (data) => {
    fetch(url + "api/data/user", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'bearer ' + jwt
        },
        body: JSON.stringify({ data: data })

    }).then(response => {
        if (response.status != 200) {
            throw new Error("Userdata data not uploaded");
        }
    }).catch(e => {
        console.log(e);
    });
}