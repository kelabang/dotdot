const dota2 = require('dota2')
// const steam = require('node-steam')
const steam = require('steam')
const fs = require('fs')
const crypto = require('crypto')

const localdb = require('./localdb.js')
const ld = localdb.getVars()

const steamClient = new steam.SteamClient()
const steamUser = new steam.SteamUser(steamClient)
const steamFriends = new steam.SteamFriends(steamClient)
const Dota2 = new dota2.Dota2Client(steamClient, true, false)
// const steamGameCoordinator = new Steam.steamGameCoordinator(steamClient, 570)
const authkey = 'XHYBT'
const use_sentry = 1
const steamid_me = '76561198285611703'
const steamid_toinvite = [
	'76561198083762482'
]

const dota_map_lobby = {
	id: { low: 219214461, high: 5862037, unsigned: true },
	members: 	[
		[
			'325345975'
		], // team 1
		[
			'123496754'
		], // team 2
		[], // ga tau
		[],// team coach
		[], // team que
	]

}

const users_collection = [
	{steamid: steamid_me, 
		vanity_url: '_ma4m_', 
		dotaign: 'n00ble', 
		dotaigid: { low: '325345975', high: '17825793', unsigned: true }},
	{steamid: '76561198083762482', 
		vanity_url: 'n00bish_', 
		dotaign: 'n00bish_', 
		// dotaigid: { low: '325345975', high: '17825793', unsigned: true }},
		dotaigid: { low: '123496754', high: '17825793', unsigned: true }},
]

const steamid_map_room = dota_map_lobby.members

const config = require('./config.js')

steamClient.connect()

steamUser.on('updateMachineAuth', function (sentry, callback) {
	console.log('update dulu nih')
	fs.writeFileSync('./sentryfile', sentry.bytes)
	callback({sha_file: getSHA1(sentry.bytes)})
})

function getSHA1(bytes) {
	const shasum = crypto.createHash('sha1')
	shasum.end(bytes)
	return shasum.read()
}

steamClient.on('connected', function (data) {
	console.log('connect')
	if(use_sentry){
		steamUser.logOn({
			account_name: config.user,
			password: config.password,
			sha_sentryfile: getSHA1(fs.readFileSync('./sentryfile'))
		})
	}else{
		steamUser.logOn({
			account_name: config.user,
			password: config.password,
			auth_code: authkey
		})
	}

})

steamClient.on('logOnResponse', function (resp) {
	console.log('onResponse', arguments)
	if(resp.eresult == steam.EResult.OK) {
		console.log('is connected', steamClient.connected)
		console.log('your steam id ', steamClient.steamID)
		console.log('your session id ', steamClient.sessionID)
		// console.log('your friends ', steamFriends.friends)
		const {steam_users} = ld
		const {vanity_url, ip_country_code, client_instance_id} = steamClient
		steam_users.insert({vanity_url, ip_country_code, client_instance_id})
		Dota2.launch()
	} else {
		console.log('error connect, try check ur email')
	}
})


steamClient.on('error', (err) => {
	console.log('error called')
	console.error(err)
	console.log('reconnecting in 3 seconds')
	setTimeout(() => {
		console.log('try reconnect')
		// steamClient.connect()
	}, 3000)
})

Dota2.on('ready', function () {
	console.log('GameCoordinator ready')
	console.log('check lobby ', Dota2.Lobby)
	if(!Dota2.Lobby) {
		const options = {
			game_name: 'test_coy',
			pass_key: '1234'
		}
		Dota2.createPracticeLobby(options, function (err, CMsgPracticeLobbyJoinResponse) {
			console.log('done create practice lobby ')
			if(err) console.error(err)

			const {dota_lobby, steam_users} = ld
			console.log('response created ', CMsgPracticeLobbyJoinResponse)
			const dota_lobby_exist = dota_lobby.findOne({'game_name':{'$eq':options.game_name}})
			if(!dota_lobby_exist) 
				dota_lobby.insert(options)
			// if(dota_lobby.find({'game_name':{'$eq':options.game_name}}))
			console.log('is dota lobby exist', dota_lobby_exist)

			steamid_toinvite.map((steamid) => {
				Dota2.inviteToLobby(steamid)
				console.log('invite executed')
			})
		})
		Dota2.requestFriendPracticeLobbyList(function (err, CMsgPracticeLobbyJoinResponse) {
			console.log('done request friends lobby ')
			if(err) console.error(err)
			console.log('response created ', CMsgPracticeLobbyJoinResponse)
		})
	}
})

Dota2.on('practiceLobbyUpdate', function (CSODOTALobby) {
	console.log('practice lobby updated')
	console.log('check lobby ', CSODOTALobby)
	if(!CSODOTALobby) return true
	const members = CSODOTALobby.members
	const radiant = steamid_map_room[0]
	const dire = steamid_map_room[1]
	const {dota_lobby, steam_users, dota_users} = ld
	members.map((member) => {
		console.log('info player ==')
		console.log('name: ', member.name)
		console.log('team: ', member.team)
		console.log('slot: ', member.slot)
		// console.log('member', member)
		console.log('id: ', member.id)
		console.log('lowerid: ', member.id.low)
		// Dota2.requestPlayerInfo(member.id)
		// Dota2.requestProfileCard(member.id.low, () => {
		// 	console.log('requestProfileCard', arguments)
		// })
		// const dota_users_exists = dota_users.findOne({name: {$eq:member.name}})
		// console.log('dota_users_exists', dota_users_exists)
		// if(!dota_users_exists) dota_users.insert(member)
		// const is_radiant = radiant.some(id => id == member.id.low)
		// const is_dire = dire.some(id => id == member.id.low)
		// console.log('is_radiant ', is_radiant)
		// console.log('is_dire ', is_dire)
		// if(is_radian)

		const map_members = dota_map_lobby.members

		const is_right_place = (!map_members[member.team])? false: map_members[member.team].some(id => id == member.id.low)
		console.log('is_right_place', is_right_place)
		if(!is_right_place) Dota2.practiceLobbyKickFromTeam(member.id.low)
	})
})

Dota2.on('profileCardData', function (account_id, profileCardResponse) {
	console.log('profileCardData')
	console.log(account_id)
	console.log(profileCardResponse)
})

Dota2.on('playerInfoData', function (player) {
	console.log('playerInfoData ', player)
	// console.log('player name ', player.player_infos.name)
})

