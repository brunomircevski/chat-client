class Chathub {
    #connection
    #connectionGood

    connect = (url, channelAccessKey) => {
        this.#connection = new signalR.HubConnectionBuilder()
        .withUrl(url + "chathub")
        .build();

        this.addListeners();

        this.#connection.start().then(async () =>
            await this.#connection.invoke("JoinRoom", channelAccessKey)
        );

        this.#connection.onclose((error) => {
            this.#connectionGood = false;
            if (error) handleConnectionError(error); 
        });
    }

    disconnect = async () => {
        if (this.#connection && this.#connection.state === signalR.HubConnectionState.Connected) {
            await this.#connection.stop();
        }
        this.#connectionGood = false;
    }

    isConnected = () => {
        if (this.#connection && this.#connection.state === signalR.HubConnectionState.Connected) { 
            if(this.#connectionGood === true) return true;
        }
        return false;
    }

    handleConnectionError = (error) => {
        console.error("Connection closed with error: " + error);
    }

    addListeners = () => {
        this.#connection.on("JoinRoomError", data => {
            console.log(data);
            this.#connectionGood = false;
        });

        this.#connection.on("JoinRoomOk", data => {
            this.#connectionGood = true;
        });

        this.#connection.on("ReceivedMessage", data => {
            const message = decryptMessage(data);
            if(message != null) appendMessage(message);
            updateChannelLastMessage(message);
        });
    }
}

const chathub = new Chathub();