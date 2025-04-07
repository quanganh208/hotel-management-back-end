"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResetToken = exports.comparePasswords = exports.hashPassword = void 0;
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const saltRounds = 10;
const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(plainPassword, salt);
};
exports.hashPassword = hashPassword;
const comparePasswords = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};
exports.comparePasswords = comparePasswords;
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
exports.generateResetToken = generateResetToken;
//# sourceMappingURL=util.js.map