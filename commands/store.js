// server shop!
const discord = require('discord.js')

function getArgsPastIndex(index, array) {
		let x;
		let args = []
		for (x in array) {
				if (x >= index) {
						args.push(array[x])
				}
		}
	return args
}

function convertArray(json) {
		let array = []
		for (var i in json) {
				array.push(json[i])
		}
		return array
}

function shopToEmbed(shop, channel, client) {
		let items = shop.items
		let settings = shop.settings
		let embed = new discord.RichEmbed()
		let itemsArray = convertArray(items)

		embed.setTitle(settings.name)
		embed.setDescription(settings.description)
		embed.setThumbnail(settings.icon)
		embed.setFooter("jesse has the ultra fats", client.user.avatarURL)
		embed.setColor(process.env.green)
		embed.setTimestamp()
		if (itemsArray.length > 0) {


				for (var x in items) {
						let item = items[x]
						let price = item.price
						let desc = item.description
						embed.addField(item.name, `**Cost: ${price} coins**\n${desc}`)
				}

				channel.send({embed})
		} else {
				embed.addField("It's quiet...", "A little too quiet? Try adding some items!\nUse `store help` for config commands!")
				channel.send({embed})
		}
}



exports.run = (client, message, args, level) => {
		let guild = message.guild
		let guildKey = guild.id + '-DATA'
		let playerCoins = message.author.id + "-" + guild.id + "-coins"
		let filter = m => m.author.id === message.author.id
		let def = {
				'items': {

				},
				'settings' : {
						name: guild.name + "'s Shop",
						description: 'No description set.',
						icon : 'https://cdn.discordapp.com/attachments/414573970374000640/493501939816988673/vanessa_shop_icon.png'
				}
		}
		let acceptableTypes = {
				"Role" : true,
		}

		client.redisClient.get(guildKey, function(err, response) {
				if (response) {
						let shopData = JSON.parse(response)
						let action = args[0]
						if (!action) {
								shopToEmbed(shopData, message.channel, client)
								return
						}
						if (action == 'reset') {
								if (level >= 4) {
										client.redisClient.set(guildKey, JSON.stringify(def))
										message.channel.send("Shop successfully reset!")
								}
								return
						}


						// shop configuration
						if (action == 'buy') {
							let itemName = getArgsPastIndex(1, args)
							itemName = itemName.join(" ")
							if (shopData.items[itemName.toProperCase()]) {
								let item = shopData.items[itemName.toProperCase()]
								client.redisClient.get(playerCoins, function(err, coins) {
									if (coins) {
										if (parseInt(coins - item.price) > 0) {
											if (item.type == 'Role') {
												let roleID = item.roleID
												if (client.checkPerm(message.channel.guild.members.get(client.user.id), "MANAGE_ROLES")) {
														if (message.member.roles.get(roleID)) {
																return message.channel.send("It seems you have already purchased this role!")
														} else {
																client.redisClient.decrby(playerCoins, parseInt(item.price), function(err, newCoins) {
																	message.member.addRole(roleID)
																	.then(r => {
																			return message.channel.send("Role successfully purchased!")
																	})
																	.catch(error => {
																			return message.channel.send("There was an error adding your role!")
																	})
																})
														}
												} else {
														return message.channel.send("I don't have the `Manage Roles` permission! Please check and try this again.")
												}
											}
										} else {
											return message.channel.send("You need more coins for that!")
										}
									}
								})
							} else {
								return message.channel.send("Couldn't find that item!")
							}
						}

						if (action == 'help') {
							if (level < 4) return;
								let embed = new discord.RichEmbed()
								embed.setTitle("Store Configuration Commands")
								embed.setDescription("These commands will help you manage your server shop!")

								embed.addField("reset", "Resets your store to default settings.\n`store reset`")
								embed.addField("additem", "Adds an item to the store. This is an interactive setup.\nVanessa can only add roles as of now.\n`store additem`")
								embed.addField("addrole", "Used to specifically add roles to the store. The role added will be the first role pinged in your message.\n`store addrole @Owners`")
								embed.addField("delitem", "Deletes an item by name from the store.\ns`tore delitem Red Role`")
								embed.addField('setname', "Sets the shop name!\n`store setname Black Market`")
								embed.addField("seticon", "Sets the icon for your shop!\n`store seticon [image file]`")
								embed.addField('setdesc', 'Sets the description for your shop!\n`store setdesc Buy everything you have ever wanted here.`')
								embed.addField('buy', 'Buy an item from the shop!\n`store buy Yellow Role`')
								embed.addField('help', "you're literally using it")

								embed.setColor(process.env.purple)
								embed.setTimestamp()
								embed.setFooter("bunnye is ultra n00b")
								message.channel.send({embed})
						}
						if (action == 'addrole') {

							let role = message.mentions.roles.first()
							if (role) {
									let id = role.id
									message.channel.send("What will the price be?")
									message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ['time']})
									.then(collected => {
											let price = parseInt(collected.first().content)
											if (!price) {
												return message.channel.send("That doesn't seem like a number...")
											}
											message.channel.send("Set the description for this role, and it will be added to the shop!")
											message.channel.awaitMessages(filter, {max: 1, time: 120000, errors: ['time']})
											.then(collected => {
												let description = collected.first().content
												if (!shopData.items[role.name.toProperCase()]) {
													shopData.items[role.name.toProperCase()] = {
														'name' : role.name,
														'description' : description,
														'type' : 'Role',
														'roleID' : id,
														'price' : price
													}
													client.redisClient.set(guildKey, JSON.stringify(shopData), function(err, reply) {
														if (reply) {
															message.channel.send(`Added role ${role.name} to the shop!`)
														}
													})
												}
											})
										})
							} else {
								return message.channel.send("Please mention a role!")
							}
						}

						if (action == 'additem') {
							if (level < 4) return;
							let filter = m => m.author.id === message.author.id
							message.channel.send("**This currently only supports roles!**")
							message.channel.send("What will this role's name be?")
							message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ['time']})
							.then(collected => {
								let name = collected.first().content
								if (shopData[name.toProperCase()]) {
									return message.channel.send("This item already exists!")
								}
								message.channel.send("What will the price be?")
								message.channel.awaitMessages(filter, {max: 1, time: 60000, errors: ['time']})
								.then(collected => {
										let price = parseInt(collected.first().content)
										if (!price) {
											return message.channel.send("That doesn't seem like a number...")
										}
										message.channel.send("Set the description for this role, and it will be finished!")
										message.channel.awaitMessages(filter, {max: 1, time: 120000, errors: ['time']})
										.then(collected => {
											let description = collected.first().content
											if (client.checkPerm(message.channel.guild.members.get(client.user.id), "MANAGE_ROLES")) {
													guild.createRole({name: name})
													.then(newrole => {
														if (newrole) {
															shopData.items[name.toProperCase()] = {
																'name' : name,
																'description' : description,
																'type' : 'Role',
																'roleID' : newrole.id,
																'price' : price
															}
															client.redisClient.set(guildKey, JSON.stringify(shopData), function(err, reply) {
																if (reply) {
																	message.channel.send(`Added role ${newrole.name} to the shop!`)
																}
															})
														}
													}).catch(err => {
														let stringErr = err.toString()
														if (stringErr.toLowerCase().match('permissions')) {
															return message.channel.send("I have need the `MANAGE_ROLES` permission! Please check and try again.")
														}
													})
											} else {
												return message.channel.send("I have need the `MANAGE_ROLES` permission! Please check and try again.")
											}
										})
								})
							})
						}

						if (action == 'delitem') {
							if (level < 4) return;
							let itemName = getArgsPastIndex(1, args)
							itemName = itemName.join(" ")
							if (shopData.items[itemName.toProperCase()]) {
								delete shopData.items[itemName.toProperCase()]
								client.redisClient.set(guildKey, JSON.stringify(shopData), function(err, reply) {
									if (reply) {
										message.channel.send(`${itemName} was deleted from the shop!`)
									}
								})
							} else {
								return message.channel.send("Item not found!")
							}
						}

						if (action == 'seticon') {
								if (level >= 4) {
										let pictures = message.attachments.array()
										if (pictures.length == 0) {
												return message.channel.send("Please upload an icon to the message!")
										} else {
												let picture = pictures[0]
												shopData.settings.icon = picture.url
												client.redisClient.set(guildKey, JSON.stringify(shopData), function(err, response) {
														message.channel.send("Shop icon was successfully updated!")
												})
										}
								}
						}
						if (action == 'setdesc') {
								 if (level >= 4) {
										 let desc = getArgsPastIndex(1, args)
										 desc = desc.join(" ")
										 if (desc.length == 0) {
												 return message.channel.send("Please send a description for your shop!")
										 } else {
												 shopData.settings.description = desc
												 client.redisClient.set(guildKey, JSON.stringify(shopData), function(err, response) {
														message.channel.send("Shop description was successfully updated!")
												 })
										 }
								 }
						}
						if (action == 'setname') {
								 if (level >= 4) {
										 let name = getArgsPastIndex(1, args)
										 name = name.join(" ")
										 if (name.length == 0) {
												 shopData.settings.name = guild.name + "'s Shop"
												 client.redisClient.set(guildKey, JSON.stringify(shopData), function(err, response) {
														message.channel.send("Shop name was set to the default naming.")
												 })
										 } else {
												 shopData.settings.name = name
												 client.redisClient.set(guildKey, JSON.stringify(shopData), function(err, response) {
														message.channel.send("Shop name was successfully updated!")
												 })
										 }
								 }
						}
				} else {
						client.redisClient.set(guildKey, JSON.stringify(def), function(err, response) {
								message.channel.send("Hold on, I've just set the basic settings for your server shop!")
						})
				}
		})
}

exports.conf = {
		enabled: false,
		guildOnly: true,
		aliases: ["shop"],
		permLevel: "User"
};

exports.help = {
		name: "store",
		category: "Vault",
		description: "This command is under development!",
		usage: "store [action, ..name]"
};
