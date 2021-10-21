class Channel {
    static CHANNELS: Map<string, Channel> = new Map<string, Channel>();

    _id: string;

    constructor () {
        Channel.CHANNELS.set(this._id, this);
    }
}

export {
    Channel
}
