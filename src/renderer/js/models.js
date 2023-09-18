class Invite {
    constructor(user, accessKey, channelAccessKey, time, channel) {
        this.user = user;
        this.accessKey = accessKey;
        this.channelAccessKey = channelAccessKey;
        this.time = time;
        this.channel = channel;
    }
}

class Channel {
    constructor(accessKey, encryptionKey, users, serverAddress, active) {
        this.encryptionKey = encryptionKey;
        this.accessKey = accessKey;
        this.users = users;
        this.serverAddress = serverAddress;
        this.active = active;
    }
}

class User {
    constructor(username, serverAddress) {
        this.username = username;
        this.serverAddress = serverAddress;
    }

    toAddress = () => {
        return this.username + "@" + this.rawServerAddress();
    };

    rawServerAddress = () => {
        return this.serverAddress.replace('http://','').replace('https://','').replace('/','');
    };
}