
class User {
    constructor(id, name, email, passwordHash, role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    isAdmin() {
        return this.role === "admin";
    }
}

module.exports = User;
