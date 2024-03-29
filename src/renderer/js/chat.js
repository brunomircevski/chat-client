let activeChannel;
const messages = [];

const messagesBox = document.getElementById("messages-box");
const chatTitle = document.getElementById("chat-title");
const chatSubTitle = document.getElementById("chat-subtitle");

let channelLastMessageTimeUpdated = false;
let removeNoMessagesInfo = false;

const switchToChannel = async (channel) => {
    if (loading || channel === activeChannel) return;
    loading = true;

    chathub.disconnect();

    activeChannel = channel;
    chatTitle.innerText = channel.getName();
    chatSubTitle.innerText = channel.getInfo();

    channelReset();

    const selectedChannelArticle = document.getElementsByClassName("channel-active")[0];
    if (selectedChannelArticle) selectedChannelArticle.classList.remove("channel-active");
    document.getElementById("channel-" + channel.uuid).classList.add("channel-active");

    const encryptedMessagesRes = await getEncryptedChannelMessages(activeChannel);
    if (encryptedMessagesRes == 404) {
        channelNotFound();
        loading = false;
        return;
    }
    const decryptedMessages = await decryptChannelMessages(encryptedMessagesRes.messages);
    displayMessages(decryptedMessages);

    sendMessageInput.disabled = false;
    openEmojisBtn.disabled = false;
    sendMessageBtn.disabled = false;

    if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];

        if (activeChannel.lastMessageDate?.getTime() != lastMessage.date.getTime()) {
            activeChannel.lastMessageDate = lastMessage.date;
            updateChannelLastMessage(lastMessage);
        }
    }

    chathub.connect(channel.serverAddress, channel.accessKey);

    if (messages.length == 0) showNoMessagesInfo()

    loading = false;
}

const channelReset = () => {
    messagesBox.innerHTML = '';
    messageContainerHeader = undefined;
    isLastMessageMine = undefined;
    lastDate = undefined;
    messageContainerHeaderBack = undefined;
    isLastMessageMineBack = undefined;
    lastDateBack = undefined;
    messages.length = 0;
    noOlderMessages = false;
    loadingOlderMessages = false;
};

const sendTextMessage = (messageText) => {
    const message = new Message(messageText, "text", me, undefined, undefined);

    sendMessage(message);
}

const sendEmoji = (emoji) => {
    const message = new Message(emoji, "emoji", me, undefined, undefined);

    sendMessage(message);
}

const sendMessage = (message) => {
    if (!activeChannel) return;
    if (!activeChannel.accessKey) return;

    const messageJSON = JSON.stringify(message);

    const encryptedJSON = aes256.encrypt(activeChannel.encryptionKey, messageJSON);

    fetch(activeChannel.serverAddress + "api/message", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: encryptedJSON, channelAccessKey: activeChannel.accessKey })

    }).then(response => {
        if (response.status != 200) {
            throw new Error("Could not send the message");
        }
    }).catch(e => {
        console.log(e);
    });

    //appendMessage(message);
}

const getEncryptedChannelMessages = (channel, olderThanUuid = "") => {
    return new Promise(resolve => {
        fetch(channel.serverAddress + "api/message?" + new URLSearchParams({
            accessKey: channel.accessKey,
            number: 50,
            olderThan: olderThanUuid
        }), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'bearer ' + jwt
            }
        }).then(response => {
            if (response.status == 404) resolve(404);
            else if (response.status == 200) {
                response.json().then(res => {
                    resolve(res);
                });
            } else resolve(null);
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

const decryptMessage = (encryptedMessage) => {
    try {
        const decryptedJSON = aes256.decrypt(activeChannel.encryptionKey, encryptedMessage.content);
        const decryptedObj = JSON.parse(decryptedJSON)

        const message = new Message(
            decryptedObj.content,
            decryptedObj.type,
            toUser(decryptedObj.user),
            encryptedMessage.uuid,
            new Date(encryptedMessage.date)
        );

        return message;

    } catch (e) {
        console.log(e);
    }

    return null;
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
    const forceScroll = messagesBox.scrollHeight - messagesBox.clientHeight - messagesBox.scrollTop <= 300;

    const isMessageMine = message.isMine();

    if (message.date == undefined) message.date = new Date();
    if (lastDate == null || !sameDay(message.date, lastDate)) {
        isLastMessageMine = undefined;
        appendDayInfo(message.date, messagesBox);
    }
    lastDate = message.date;

    if (isLastMessageMine == undefined) createMessageContainer(isMessageMine);
    else if (isLastMessageMine != isMessageMine) createMessageContainer(isMessageMine);

    isLastMessageMine = isMessageMine;

    const messageDiv = document.createElement('div');

    messageDiv.id = 'message-' + message.uuid;

    if (isMessageMine) {
        messageDiv.addEventListener('click', (ev) => {
            ev.preventDefault();
            handleMessageClick(message);
        });
    }

    if (message.type == "text") {

        messageDiv.className = 'message';

        if (messageContainerHeader.childElementCount === 0 && !isMessageMine) {
            const messageContainerUsername = document.createElement('div');
            messageContainerUsername.className = 'message-container-header';
            messageContainerUsername.textContent = message.user.username;
            messageDiv.appendChild(messageContainerUsername);
        }

        const p = document.createElement('p');

        const lines = message.content.split('\n');
        lines.forEach((line, index) => {
            p.appendChild(document.createTextNode(line));
            if (index < lines.length - 1) {
                const lineBreak = document.createElement('br');
                p.appendChild(lineBreak);
            }
        });

        const span = document.createElement('span');
        span.className = 'date';
        span.textContent = formatDateToTime(message.date)

        messageDiv.appendChild(p);
        messageDiv.appendChild(span);

    } else if (message.type == "emoji") {

        messageDiv.className = 'message emoji-message';

        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'emoji';
        emojiDiv.innerHTML = "&#" + message.content + ";";

        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = formatDateToTime(message.date)

        messageDiv.appendChild(emojiDiv);
        messageDiv.appendChild(dateSpan);

    }

    messageContainerHeader.appendChild(messageDiv);
    if (forceScroll) scrollToBottom();

    messages.push(message)

    if (removeNoMessagesInfo) document.getElementById("no-messages-h2")?.remove();
}

const updateChannelLastMessage = (message) => {
    activeChannel.lastMessageDate = message.date;
    document.querySelector("#channel-" + activeChannel.uuid + " .chat-last-message-time").innerText = formatDateToLocalDateTime(message.date);

    channelLastMessageTimeUpdated = true;

    let lastWordsText = "";
    let username = userIsMe(message.user) ? "<span style='opacity: 0.5'>You:</span>" : "";
    if (message.type == "text") lastWordsText = username + " " + message.content.slice(0, 30).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    else if (message.type == "emoji") lastWordsText = username + " &#" + message.content + ";";
    else return;

    document.querySelector("#channel-" + activeChannel.uuid + " .chat-last-message").innerHTML = lastWordsText;
    activeChannel.lastWords = lastWordsText;
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
        chatImg.className = 'chat-img-sm bg-gradient-' + activeChannel.getNumber();
        chatImg.textContent = activeChannel.getFirstLetter();

        iconDiv.appendChild(chatImg);

        messageContainer.className = 'col-xl-7 col-lg-8 col-10 message-col';

        article.appendChild(iconDiv);
    }

    article.appendChild(messageContainer);
    messagesBox.appendChild(article);
    messageContainerHeader = messageContainer;
}

const appendDayInfo = (date, root) => {
    const article = document.createElement('article');
    article.className = 'row message-container date-info';
    article.id = "date-article-" + formatDateToDDMMYYYY(date);

    const dateInfoSpan = document.createElement('span');
    dateInfoSpan.textContent = formatDateToLocalDate(date);
    article.appendChild(dateInfoSpan);

    root.appendChild(article);
}

const scrollToBottom = () => {
    messagesBox.scroll(0, messagesBox.scrollHeight);
}

//
// Getting older messages on scroll top
//

let loadingOlderMessages = false;
let noOlderMessages = false;

messagesBox.addEventListener("scroll", function () {
    if (messagesBox.scrollTop > 100) return;
    if (loadingOlderMessages || noOlderMessages) return;
    if (messages.length < 50) return;

    loadingOlderMessages = true;
    getOlderMessages();
});

const getOlderMessages = async () => {
    const encryptedMessagesRes = await getEncryptedChannelMessages(activeChannel, messages[0].uuid);
    const decryptedMessages = await decryptChannelMessages(encryptedMessagesRes.messages);

    if (decryptedMessages.length === 0) return;

    messagesBoxBack = document.createElement("div");

    const articleIdToRemove = "date-article-" + formatDateToDDMMYYYY(decryptedMessages[0].date);
    const timeArticleToRemove = document.getElementById(articleIdToRemove);
    if (timeArticleToRemove) timeArticleToRemove.remove();

    decryptedMessages.reverse().forEach(m => {
        prependMessage(m);
    });

    const l = decryptedMessages.length;
    if (l < 20) noOlderMessages = true;

    for (i = 0; i < l; i++)
        messages.unshift(decryptedMessages.pop());

    messagesBox.prepend(messagesBoxBack);

    loadingOlderMessages = false;
}

let messageContainerHeaderBack;
let isLastMessageMineBack;
let lastDateBack;
let messagesBoxBack;

const prependMessage = (message) => {
    const isMessageMine = message.isMine();

    if (message.date == undefined) message.date = new Date();
    if (lastDateBack == null || !sameDay(message.date, lastDateBack)) {
        isLastMessageMineBack = undefined;
        appendDayInfo(message.date, messagesBoxBack);
    }
    lastDateBack = message.date;

    if (isLastMessageMineBack == undefined) createMessageContainerBack(isMessageMine);
    else if (isLastMessageMineBack != isMessageMine) createMessageContainerBack(isMessageMine);

    isLastMessageMineBack = isMessageMine;

    const messageDiv = document.createElement('div');
    messageDiv.id = 'message-' + message.uuid;

    if (message.type == "text") {

        messageDiv.className = 'message';

        if (messageContainerHeaderBack.childElementCount === 0 && !isMessageMine) {
            const messageContainerUsername = document.createElement('div');
            messageContainerUsername.className = 'message-container-header';
            messageContainerUsername.textContent = message.user.username;
            messageDiv.appendChild(messageContainerUsername);
        }

        const p = document.createElement('p');

        const lines = message.content.split('\n');
        lines.forEach((line, index) => {
            p.appendChild(document.createTextNode(line));
            if (index < lines.length - 1) {
                const lineBreak = document.createElement('br');
                p.appendChild(lineBreak);
            }
        });

        const span = document.createElement('span');
        span.className = 'date';
        span.textContent = formatDateToTime(message.date)

        messageDiv.appendChild(p);
        messageDiv.appendChild(span);

    } else if (message.type == "emoji") {

        messageDiv.className = 'message emoji-message';

        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'emoji';
        emojiDiv.innerHTML = "&#" + message.content + ";";

        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = formatDateToTime(message.date)

        messageDiv.appendChild(emojiDiv);
        messageDiv.appendChild(dateSpan);

    }

    messageContainerHeaderBack.appendChild(messageDiv);
}

const createMessageContainerBack = (isMine) => {
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
        chatImg.className = 'chat-img-sm bg-gradient-' + activeChannel.getNumber();
        chatImg.textContent = activeChannel.getFirstLetter();

        iconDiv.appendChild(chatImg);

        messageContainer.className = 'col-xl-7 col-lg-8 col-10 message-col';

        article.appendChild(iconDiv);
    }

    article.appendChild(messageContainer);
    messagesBoxBack.appendChild(article);
    messageContainerHeaderBack = messageContainer;
}

// Display errors

const showNoMessagesInfo = () => {
    const h2 = document.createElement("h2");
    h2.id = "no-messages-h";
    h2.innerText = "There are no messages yet";
    messagesBox.appendChild(h2);

    removeNoMessagesInfo = true;
}

const channelNotFound = () => {
    const h2 = document.createElement("h2");
    h2.id = "no-messages-h";
    h2.innerText = "Chat not found :(";

    const h5 = document.createElement("h5");
    h5.id = "no-messages-h";
    h5.innerText = "It might have been deleted. To leave it go to settings.";

    messagesBox.appendChild(h2);
    messagesBox.appendChild(h5);

    removeNoMessagesInfo = true;
}

//Delete message
let lastClicked;
let deleteTimeout;

const handleMessageClick = (message) => {
    clearTimeout(deleteTimeout);
    if (lastClicked == message.uuid) deleteMessage(message.uuid);
    else lastClicked = message.uuid;
    deleteTimeout = setTimeout(() => { lastClicked = null }, 200);
}

const deleteMessage = (uuid) => {
    fetch(activeChannel.serverAddress + "api/message?" + new URLSearchParams({
        accessKey: activeChannel.accessKey,
        uuid: uuid
    }), {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status != 200) console.log("Could not delete message");
    }).catch(e => {
        console.log(e);
    });
}

const deleteMessageDiv = (uuid) => {
    const messageDiv = document.getElementById("message-" + uuid);
    if(messageDiv) messageDiv.remove();
}