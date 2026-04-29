/**
 * @file auth.controller.js
 * @description Controlador de autenticación.
 */

'use strict';

const AuthService = require('../services/auth.service');
const { AppError } = require('../middlewares/error.middleware');

exports.register = async (req, res, next) => {
    try {
        const result = await AuthService.register(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const result = await AuthService.login({ ...req.body, ip: req.ip });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const token = req.body.refreshToken || req.headers['x-refresh-token'];
        const result = await AuthService.refreshTokens(token);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        // Al no tener Redis para blacklisting, el logout en JWT stateless
        // se maneja del lado del cliente borrando el token.
        // Aquí solo respondemos OK.
        res.status(200).json({ success: true, message: 'Logout exitoso' });
    } catch (error) {
        next(error);
    }
};

exports.me = async (req, res, next) => {
    try {
        const result = await AuthService.getProfile(req.user.userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};