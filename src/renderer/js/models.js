class Invite {
    constructor(address, accessKey) {
        this.address = address;
        this.accessKey = accessKey;
        this.time = Date.now();
    }
}