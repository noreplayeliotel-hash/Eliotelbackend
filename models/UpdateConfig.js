const mongoose = require('mongoose');

const updateConfigSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        unique: true,
        default: 'bladigo'
    },
    minimumVersion: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    minimumbuildNumber: {
        type: String,
        required: true,
        default: '1'
    },
    iosminimumVersion: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    iosminimumbuildNumber: {
        type: String,
        required: true,
        default: '1'
    },
    playStoreUrl: {
        type: String,
        required: true,
        default: ''
    },
    appStoreUrl: {
        type: String,
        required: true,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UpdateConfig', updateConfigSchema);
