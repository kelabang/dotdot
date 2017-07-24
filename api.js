/*
* @Author: d4r
* @Date:   2017-07-23 00:16:58
* @Last Modified by:   d4r
* @Last Modified time: 2017-07-23 00:30:19
*/

'use strict';

const SteamApi = require('steam-api')
const webapikey = require('./config.js').webapikey
const steamid_me = '76561198285611703'

const user = new SteamApi.User(webapikey, steamid_me)

user.ResolveVanityUrl('_ma4m_').done(function(result){
  console.log(result);
});
