/**
 * Multiplayer Piano Server
 * Copyright (c) The Dev Channel 2020-2022
 * Licensed under the GPL v3.0 license
 * 
 * MongoDB database connection module
 */

import { Collection, Db, MongoClient, ObjectId, Document } from 'mongodb';
import { Crypto } from './Crypto';
import { User } from './models/User';
import { Server } from './Server';
import { Color } from './Color';
import { RateLimit, RateLimitChain } from './RateLimit';

const MPP_DEFAULT_USERNAME = process.env.MPP_DEFAULT_USERNAME || 'Anonymous';
const MPP_MONGO_URI = process.env.MPP_MONGO_URI;
const MPP_ADMIN_PASSWORD = process.env.MPP_ADMIN_PASSWORD;

class Database {
    static server: Server;
    static client: MongoClient = new MongoClient(MPP_MONGO_URI);
    static db: Db;
    static userCollection: Collection;
    static ready: boolean = false;
    static changeStream: any;
    static adminPassword: string = MPP_ADMIN_PASSWORD;

    static async setup(server: Server) {
        this.server = server;

        await this.client.connect();
        // console.log('database connected');

        this.db = this.client.db('multiplayerpiano');
        this.userCollection = this.db.collection('users');

        // this.changeStream = this.userCollection.watch({
        //     fullDocument: 'updateLookup'
        // } as any);

        // this.changeStream.on('change', next => {
        //     if (next.operationType == 'update') {
        //         this.server.emit('receive_userset', next.updateDescription.updatedFields);
        //     }
        // });

        this.ready = true;
    }

    static async getUser(_id: string) {
        if (!this.ready) return {
            color: '#ffffff',
            name: MPP_DEFAULT_USERNAME,
            _id: _id,
            flags: {

            }
        }
        if (await this.userExists(_id) == false) {
            await this.createUser(_id);
        }

        let user: User = (await this.userCollection.findOne({_id: _id})) as any;
        // console.log(user);
        return user;
    }

    static async getPublicUser(_id: string) {
        let user = (await this.getUser(_id)) as any;
        // console.log(user);
        return {
            name: user.name,
            _id: user._id,
            color: user.color
        }
    }

    static async userExists(_id: string) {
        let exists = (await this.userCollection.findOne({_id: _id})) !== null
        return exists;
    }

    static async createUser(_id: string) {
        let color = Crypto.getColorFromID(_id);
        
        let user: Document & any = {
            _id: _id,
            name: MPP_DEFAULT_USERNAME,
            color: color,
            flags: {
                "no chat rate limit": false
            }
        }

        this.userCollection.insertOne(user);
    }

    static async updateUser(_id: string, data: any) {
        this.userCollection.updateOne({_id: _id}, {
            $set: data
        });

        this.server.emit('receive_userset', data);
    }

    static async userset(_id: string, set: any) {
        this.updateUser(_id, {
            name: set.name,
            // color: set.color,
            // _id: set._id
        });
    }

    static getDefaultUser() {
        return {
            name: MPP_DEFAULT_USERNAME,
            color: "#777"
        }
    }

    static getMOTD() {
        // let motd = "test";
        // return motd;
    }

    static getDefaultChannelSettings() {
        let color = new Color(59, 80, 84);
        let color2 = new Color(color.toHexa());
        color2.add(-64, -64, -64);
        return {
            crownsolo: false,
            lobby: false,
            visible: true,
            color: color.toHexa(),
            // color2: color2.toHexa(),
            chat: true
        } as any;
    }

    static getDefaultLobbySettings() {
        let set = this.getDefaultChannelSettings();
        set.lobby = true;
        set.color = '#73b3cc';
        // set.color = "#677586";
        // let color2 = new Color(set.color);
        // color2.add(-64, -64, -64);
        // set.color2 = color2.toHexa();
        set.color2 = "#273546";
        return set;
    }

    static getDefaultClientRateLimits() {
        return {
            nq: new RateLimitChain(8000, 24000),
            m: new RateLimit(1000 / 20),
            ch: new RateLimit(1000),
            chset: new RateLimit(1500),
            t: new RateLimit(20),
            a: new RateLimitChain(4, 6000)
        }
    }
}

export {
    Database,
    User
}
