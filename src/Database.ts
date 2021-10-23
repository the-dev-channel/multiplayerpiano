import chalk = require('chalk');
import { Collection, Db, MongoClient, ObjectId, Document } from 'mongodb';
import { Crypto } from './Crypto';
import { User } from './models/User';
import { Server } from './Server';
import { readFileSync } from 'fs';

const MPP_DEFAULT_USERNAME = process.env.MPP_DEFAULT_USERNAME || 'Anonymous';
const MPP_MONGO_URI = process.env.MPP_MONGO_URI;

class Database {
    static server: Server;
    static client: MongoClient = new MongoClient(MPP_MONGO_URI);
    static db: Db;
    static userCollection: Collection;
    static ready: boolean = false;

    static async setup(server: Server) {
        this.server = server;

        await this.client.connect();
        console.log('database connected');

        this.db = this.client.db('multiplayerpiano');
        this.userCollection = this.db.collection('users');

        this.ready = true;
    }

    static async getUser(_id: string) {
        if (!this.ready) return {
            color: '#ffffff',
            name: MPP_DEFAULT_USERNAME
        }
        if (await this.userExists(_id) == false) {
            await this.createUser(_id);
        }

        let user = (await this.userCollection.findOne({_id: _id})) as User;
        return user;
    }

    static async getPublicUser(_id: string) {
        let user = (await this.getUser(_id)) as any;
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
}

export {
    Database,
    User
}