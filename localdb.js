/*
* @Author: d4r
* @Date:   2017-07-21 22:20:03
* @Last Modified by:   d4r
* @Last Modified time: 2017-07-22 01:30:33
*/

'use strict';

const loki = require('lokijs')
const db = new loki('./db.json')
const users = db.addCollection('users')
const steam_users = db.addCollection('steam_users')
const dota_users = db.addCollection('dota_users')
const dota_lobby = db.addCollection('dota_lobby')

module.exports = {
	getVars: () => ({users, steam_users, dota_users, dota_lobby}),
	getInstance: () => db
}