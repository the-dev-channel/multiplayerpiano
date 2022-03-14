/**
 * Multiplayer Piano Server
 * Copyright (c) The Dev Channel 2020-2022
 * Licensed under the GPL v3.0 license
 * 
 * MongoDB user data schema module
 */

interface User {
    _id: string;
    id: string;
    name: string;
    color?: string;
    flags: Object;
}

interface PublicUser {
    _id: string;
    id: string;
    name: string;
    color?: string;
}

export {
    User,
    PublicUser
}
