let activeChannel;

const messagesBox = document.getElementById("messages-box");

const switchToChannel = async (channel) => {
    if (loading) return;
    loading = true; //Set loading true until messages are displayed

    activeChannel = channel;
    messagesBox.innerHTML = '';

    const encryptedMessagesRes = await getEncryptedChannelMessages(activeChannel);
    const messages = await decryptChannelMessages(encryptedMessagesRes.messages);
    displayMessages(messages);

    sendMessageInput.disabled = false;
    loading = false;
}

const sendTextMessage = (messageText) => {
    const message = new Message(messageText, "text", me, undefined, undefined);

    sendMessage(message);
}

const sendMessage = (message) => {
    if (!activeChannel) return;
    if (!activeChannel.accessKey) return;

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

    appendMessage(message);
}

const getEncryptedChannelMessages = (channel) => {
    return new Promise(resolve => {
        fetch(channel.serverAddress + "api/message?" + new URLSearchParams({
            accessKey: channel.accessKey,
            number: 50
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

const decryptChannelMessages = (encryptedMessages) => {
    return new Promise(resolve => {
        let messages = [];

        try {
            encryptedMessages.forEach(m => {
                const decryptedJSON = aes256.decrypt(activeChannel.encryptionKey, m.content);
                const decryptedObj = JSON.parse(decryptedJSON)

                const message = new Message(
                    decryptedObj.content,
                    decryptedObj.type,
                    toUser(decryptedObj.user),
                    m.uuid,
                    new Date(m.date)
                );

                messages.push(message);
            });

        } catch (e) {
            console.log(e);
            messages.push(new Message(
                "Error. Could not decrypt messages.",
                "error",
                null,
                null,
                new Date()
            ));
        }

        resolve(messages);
    });
}

//Displaying messages
let messageContainerHeader;
let isLastMessageMine;
let lastDate;

const displayMessages = (messages) => {
    messages.reverse().forEach(m => {
        appendMessage(m);
    });
}

const appendMessage = (message) => {
    const forceScroll = messagesBox.scrollHeight - messagesBox.clientHeight - messagesBox.scrollTop <= 50;

    const isMessageMine = message.isMine();

    if(message.date == undefined) message.date = new Date();
    if(lastDate == null || !sameDay(message.date, lastDate)) {
        isLastMessageMine = undefined;
        appendDayInfo(message.date);
    }
    lastDate = message.date;

    if (isLastMessageMine == undefined) createMessageContainer(isMessageMine);
    else if (isLastMessageMine != isMessageMine) createMessageContainer(isMessageMine);

    isLastMessageMine = isMessageMine;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    if (messageContainerHeader.childElementCount === 0 && !isMessageMine) {
        const messageContainerUsername = document.createElement('div');
        messageContainerUsername.className = 'message-container-header';
        messageContainerUsername.textContent = message.user.username;
        messageDiv.appendChild(messageContainerUsername);
    }

    const p = document.createElement('p');
    p.textContent = message.content;

    const span = document.createElement('span');
    span.className = 'date';
    span.textContent = formatDateToTime(message.date)

    messageDiv.appendChild(p);
    messageDiv.appendChild(span);

    messageContainerHeader.appendChild(messageDiv);
    if(forceScroll) scrollToBottom();
}

const createMessageContainer = (isMine) => {
    const article = document.createElement('article');
    const messageContainer = document.createElement('div');

    if (isMine) {
        article.className = 'row message-container';

        messageContainer.className = 'offset-xl-5 col-xl-7 offset-lg-4 col-lg-8 offset-2 col-10 my-message-col';
    } else {
        article.className = 'row message-container align-items-end';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'col icon-col';

        const chatImg = document.createElement('div');
        chatImg.className = 'chat-img-sm bg-gradient-1';
        chatImg.textContent = 'A';

        iconDiv.appendChild(chatImg);

        messageContainer.className = 'col-xl-7 col-lg-8 col-10 message-col';

        article.appendChild(iconDiv);
    }

    article.appendChild(messageContainer);
    messagesBox.appendChild(article);
    messageContainerHeader = messageContainer;
}

const appendDayInfo = (date) => {
    const article = document.createElement('article');
    article.className = 'row message-container date-info';

    const dateInfoSpan = document.createElement('span');
    dateInfoSpan.textContent = formatDateToLocalDate(date);
    article.appendChild(dateInfoSpan);

    messagesBox.appendChild(article);
}

const scrollToBottom = () => {
    messagesBox.scroll(0, messagesBox.scrollHeight);
}