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
