const channels = [];

const readChannels = () => {
    try {
        const encryptedJSON = store.get('userdata');
        if (encryptedJSON == "" || encryptedJSON == undefined) return;
        const decryptedJSON = aes256.decrypt(symmetricKey, encryptedJSON);
        const obj = JSON.parse(decryptedJSON);

        obj.channels.forEach(ch => {
            ch.active = true;
            channels.push(toChannel(ch));
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
    displayChannels();
}

const saveUserdata = () => {
    const channelsToSave = channels.map(channel => {
        return new Channel(channel.uuid ,channel.accessKey, channel.encryptionKey, channel.users, channel.serverAddress, undefined, channel.lastMessageDate, channel.lastWords);
    });

    let userdata = {
        channels: channelsToSave,
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

//Displaying channels

const channelBox = document.getElementById("chat-container");

const displayChannels = () => {
    while (channelBox.firstChild) {
        channelBox.removeChild(channelBox.firstChild);
    }

    channels.forEach(channel => {

        const channelName = channel.getName();

        // Create the elements
        const article = document.createElement("article");
        article.classList.add("row", "chat");
        article.id = "channel-"+channel.uuid;
        article.onclick = () => {
            switchToChannel(channel)
        };

        const imgBox = document.createElement("div");
        imgBox.classList.add("col", "chat-img-box");

        const img = document.createElement("div");
        img.classList.add("chat-img", "bg-gradient-" + channel.getNumber());
        img.textContent = channel.getFirstLetter();

        const textBox = document.createElement("div");
        textBox.classList.add("col", "chat-text-box");

        const chatName = document.createElement("h5");
        chatName.classList.add("h5");
        chatName.textContent = channelName;

        const lastMessageTime = document.createElement("span");
        lastMessageTime.classList.add("chat-last-message-time");
        lastMessageTime.textContent = channel.lastMessageDate ? formatDateToLocalDateTime(channel.lastMessageDate) : "NEW";

        const lastMessage = document.createElement("span");
        lastMessage.classList.add("chat-last-message");
        lastMessage.innerHTML = channel.lastWords ? channel.lastWords : "No messages yet";

        // Append elements to the structure
        imgBox.appendChild(img);
        textBox.appendChild(chatName);
        textBox.appendChild(lastMessageTime);
        textBox.appendChild(lastMessage);

        article.appendChild(imgBox);
        article.appendChild(textBox);

        // Append the structure to the channelBox
        channelBox.appendChild(article);
    });
}

//Leaving channel

const leaveActiveChannel = () => {
    console.log("Leaving channel") // TODO
}