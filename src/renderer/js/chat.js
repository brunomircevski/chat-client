let activeChannel;

const switchToChannel = async (channel) => {
    if(loading) return; 
    loading = true; //Set loading true until messages are displayed

    activeChannel = channel;
    
    const encryptedMessagesRes = await getEncryptedChannelMessages(activeChannel);
    const messages = await decryptChannelMessages(encryptedMessagesRes.messages);
    console.log(messages);

    sendMessageInput.disabled = false;
    loading = false;
}

const sendTextMessage = (messageText) => {
    const message = new Message(messageText, "text", me, undefined, undefined);

    sendMessage(message);
}

const sendMessage = (message) => {
    if(!activeChannel) return;
    if(!activeChannel.accessKey) return;

    const messageJSON = JSON.stringify(message);
    const encryptedJSON = aes256.encrypt(activeChannel.encryptionKey, messageJSON);

    fetch(url + "api/message", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'bearer ' + jwt
        },
        body: JSON.stringify({ content: encryptedJSON, channelAccessKey: activeChannel.accessKey })

    }).then(response => {
        if (response.status != 200) {
            throw new Error("Could not send the message");
        }
    }).catch(e => {
        console.log(e);
    });
}

const getEncryptedChannelMessages = (channel) => {
    return new Promise(resolve => {
        fetch(channel.serverAddress + "api/message?" + new URLSearchParams({
            accessKey: channel.accessKey,
            number: 100
        }), {
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

const decryptChannelMessages = (messages) => {
    return new Promise(resolve => {
        resolve(res); //TODO
    });
}