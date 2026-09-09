"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationRiskLevel = exports.AdminRole = exports.MessageStatus = exports.ModerationStatus = void 0;
var ModerationStatus;
(function (ModerationStatus) {
    ModerationStatus["PENDING"] = "PENDING";
    ModerationStatus["APPROVED"] = "APPROVED";
    ModerationStatus["SOFT_BLOCKED"] = "SOFT_BLOCKED";
    ModerationStatus["REJECTED"] = "REJECTED";
    ModerationStatus["ESCALATED"] = "ESCALATED";
})(ModerationStatus || (exports.ModerationStatus = ModerationStatus = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["PENDING_MODERATION"] = "PENDING_MODERATION";
    MessageStatus["APPROVED"] = "APPROVED";
    MessageStatus["SOFT_BLOCKED"] = "SOFT_BLOCKED";
    MessageStatus["REJECTED"] = "REJECTED";
    MessageStatus["ESCALATED"] = "ESCALATED";
    MessageStatus["DELIVERED"] = "DELIVERED";
    MessageStatus["READ"] = "READ";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var AdminRole;
(function (AdminRole) {
    AdminRole["SUPPORT"] = "SUPPORT";
    AdminRole["MODERATOR"] = "MODERATOR";
    AdminRole["ADMIN"] = "ADMIN";
    AdminRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    AdminRole["AUDITOR"] = "AUDITOR";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
var ModerationRiskLevel;
(function (ModerationRiskLevel) {
    ModerationRiskLevel["LOW"] = "LOW";
    ModerationRiskLevel["MEDIUM"] = "MEDIUM";
    ModerationRiskLevel["HIGH"] = "HIGH";
    ModerationRiskLevel["CRITICAL"] = "CRITICAL";
})(ModerationRiskLevel || (exports.ModerationRiskLevel = ModerationRiskLevel = {}));
//# sourceMappingURL=index.js.map