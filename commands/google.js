// clear messages

exports.run = (client, message, args, level) => {
    var google = require('google')
    let links = []
    let search = args.join(" ")
    if (search === undefined) {
        message.channel.send("Please send something to search!")
        return;
    }
    google(search, async (err, res) => {
        if (!res.links[0].href) {
            message.channel.send("There were no search results.")
            return
        } else {
            message.channel.send(res.links[0].href)
        }
    })

}

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ["g"],
    permLevel: "User"
};

exports.help = {
    name: "google",
    category: "Fun",
    description: "Googles your search query! This command is very basic right now, and returns the first link Google provides.",
    usage: "google [...search]"
};


