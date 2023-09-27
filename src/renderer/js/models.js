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

    #name
    #letter
    #number

    getName = () => {
        if(this.#name) return this.#name;

        let name = "";
        this.users.forEach(user => {
            if(!userIsMe(user)) name += user.username + ", ";
        });
        
        this.#name = name.slice(0, -2)
        return this.#name;
    };

    getFirstLetter = () => {
        if(this.#letter) return this.#letter;
        this.#letter = this.getName().slice(0, 1).toUpperCase();
        return this.#letter;
    }

    getNumber = () => {
        if(this.#number) return this.#number;
        this.#number =  Number(this.getFirstLetter().charCodeAt(0)%5+1);
        return this.#number;
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

class Message {
    constructor(content, type, user, uuid, date) {
        this.content = content;
        this.type = type;
        this.user = user;
        this.date = date;
        this.uuid = uuid;
    }

    isMine = () => {
        return userIsMe(this.user);
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