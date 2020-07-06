const Discord = require("discord.js"),
      client = new Discord.Client(),
      mongoose = require("mongoose"),
      Clans = require("./models/clan"),
      {token, version, PREFIX, MONGODB_URI} = require("./config.json"),
      spawn = require("child_process").spawn,
      Readable = require("stream").Readable,
      toString = require("stream-to-string");

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true});

client.on("ready", () => {
    console.log("Bot Online!");
    client.user.setActivity("Minecraft 2");
});
client.login(token);

client.on("message", async msg => {
    if(msg.content.startsWith(PREFIX)) {
        let args = msg.content.substring(PREFIX.length).split(" ");
        switch(args[0].toLowerCase()) {
            case "ping":
                msg.channel.send("pong!");
                break;
            case "info":
                if(!args[1]) return msg.reply("Must provide a second argument!");
                if(args[1] === "version") msg.channel.send(version);
                else msg.reply(`Error: No such argument: ${args[1]}`);
                break;
            case "userinfo":
                if(!args[1]) return msg.reply("Must provide a second argument (the user)!");
                var userInfoUser = msg.mentions.users.first();
                var dbUser = await Clans.find({members: {$elemMatch: {member: userInfoUser.id}}});
                var userClan = "my guy, something went wrong :/";
                var clanLogo = clanLogo = userInfoUser.avatarURL();
                if(dbUser.length === 0) userClan = "No Clan";
                else {
                    userClan = dbUser[0]["name"];
                    clanLogo = dbUser[0]["logo"];
                }
                var userInfoEmbed = new Discord.MessageEmbed()
                .setTitle(userInfoUser.tag)
                .setThumbnail(clanLogo)
                .setColor(0x1cff77)
                .addField("Clan", userClan, true)
                .addField("Money", "420", true)
                .setFooter("This is a footer, congrats");
                msg.channel.send(userInfoEmbed);
                break;
            case "joinclan":
                if(!args[1]) return msg.reply("Must supply a second argument; the clan you'd like to join!");
                var joinClan = await Clans.find({name: args[1]});
                if(joinClan.length !== 0) {
                    var inClanAlready = false
                    joinClan[0]["members"].forEach(i => {
                        if(i.member === msg.author.id) {
                            inClanAlready = true;
                        }
                    })
                    if(!inClanAlready) {
                        var oldMembers = joinClan[0]["members"];
                        var newMembers = [...oldMembers, {member: msg.author.id}]
                        await Clans.findOneAndUpdate({name: args[1]}, {members: newMembers});
                        console.log(joinClan);
                        msg.reply(`Succesfully added you to the ${args[1]} clan!`);
                    } else msg.reply("You're already in that clan!")
                } else msg.reply("That clan does not exist. use g!createclan to make it!");
                break;
            case "leaveclan":
                if(!args[1]) return msg.reply("Must supply a second argument; the clan you'd like to leave!");
                var leaveClan = await Clans.find({name: args[1]});
                leaveClan[0]["members"].forEach(async member => {
                    console.log(member)
                    if(member.member === msg.author.id) {
                        var oldMembersLeave = leaveClan[0]["members"];
                        var newMembersLeave = [...oldMembersLeave].filter(item => item === msg.author.id);
                        console.log(oldMembersLeave, newMembersLeave)
                        await Clans.findOneAndUpdate({name: args[1]}, {members: newMembersLeave});
                        console.log(leaveClan);
                        msg.reply(`Succesfully removed you from the ${args[1]} clan!`);
                    }
                });
                break;
            case "clanlist":
                if(!args[1]) return msg.reply("Not enough args, please specify a clan");
                let clan = await Clans.find({name: args[1]});
                if(clan.length !== 0) {
                    var finalStr = "";
                    await clan[0]["members"].forEach(async item => {
                        finalStr += "@"+(await msg.guild.members.fetch(clan[0]["members"][0].member)).user.username;
                    });
                    msg.reply(`The members of the ${args[1]} clan are:\n${finalStr}`)
                } else msg.reply("That clan does not exist!");
                break;
            case "createclan":
                if(!args[1]) return msg.reply("Must provide a name of the new clan");
                var logo = ""
                if(!args[2]) logo = "https://bread.io/bread.jpg";
                else logo = args[2];
                try {
                    oldClan = await Clans.find({members: {$elemMatch: {member: msg.author.id}}});
                    var oldMembersCreate = oldClan[0]["members"];
                    var newMembersCreate = [...oldMembersCreate].filter(memberRemove => memberRemove === oldClan[0]["name"]);
                    await Clans.findOneAndUpdate({name: oldClan[0]["name"]}, {members: newMembersCreate});
                } catch(err) {}
                await Clans.create({
                    name: args[1],
                    members: [{member: msg.author.id}],
                    logo: logo
                });
                try {
                    var name = oldClan[0]["name"]
                } catch(err) {var name = "No old clan"}
                msg.reply(`Succesfully created the ${args[1]} clan! You were removed from your old clan: ${name}.`);
                break;
        }
    }
});

client.on("guildMemberAdd", member => {
    var channel = member.guild.channels.cache.find(channel => channel.name === "welcome");
    channel.send(`Welcome to the server ${member}`);
});