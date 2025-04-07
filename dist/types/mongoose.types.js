"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMongoId = void 0;
const mongoose_1 = require("mongoose");
const hasMongoId = (doc) => {
    return (typeof doc === 'object' &&
        doc !== null &&
        '_id' in doc &&
        doc._id instanceof mongoose_1.Types.ObjectId);
};
exports.hasMongoId = hasMongoId;
//# sourceMappingURL=mongoose.types.js.map