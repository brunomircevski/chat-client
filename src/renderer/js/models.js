class Invite {
    constructor(address, accessKey) {
        this.address = address;
        this.accessKey = accessKey;
        this.time = Date.now();
    }
}

class Channel {
    constructor(accessKey, encryptionKey, users, serverAddress, hidden) {
        this.encryptionKey = encryptionKey;
        this.accessKey = accessKey;
        this.users = users;
        this.serverAddress = serverAddress;
        this.hidden = hidden;
    }
}

class User {
    constructor(username, serverAddress) {
        this.username = username;
        this.serverAddress = serverAddress;
    }
}