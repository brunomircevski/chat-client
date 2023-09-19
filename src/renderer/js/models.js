class Invite {
    constructor(user, accessKey, channelAccessKey, time, channel) {
        this.user = user;
        this.accessKey = accessKey;
        this.channelAccessKey = channelAccessKey;
        this.time = time;
        this.channel = channel;

        if(channelAccessKey == "" || channelAccessKey == null) {
            this.channelAccessKey = channel.accessKey;
        }
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

    getName = () => {
        let name = "";
        this.users.forEach(user => {
            if(!userIsMe(user)) name += user.username + ", ";
        });
        
        return name.slice(0, -2);
    };
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

//Convert to class object
const toChannel = (obj) => {
    try {
        const users = [];

        obj.users.forEach(usr => {
            users.push(toUser(usr));
        });

        const channel = new Channel(
            obj.accessKey, 
            obj.encryptionKey, 
            users, 
            obj.serverAddress, 
            obj.active
        );

        return channel;
    } catch (e) {
        console.log("Could not convert object to Channel");
        console.log(e);
    }
    return null;
}

const toUser = (obj) => {
    try {
        const user = new User(
            obj.username, 
            obj.serverAddress, 
        );

        return user;
    } catch (e) {
        console.log("Could not convert object to User");
        console.log(e);
    }
    return null;
}

const toInvite = (obj) => {
    try {
        const invite = new Invite(
            toUser(obj.user), 
            obj.accessKey, 
            obj.channelAccessKey, 
            obj.time, 
            toChannel(obj.channel)
        );

        return invite;
    } catch (e) {
        console.log("Could not convert object to Channel");
        console.log(e);
    }
    return null;
}