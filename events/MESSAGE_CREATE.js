////////////////////////////////////
//This event is triggered whenever Artemis receives a NEW message
//A lot gets set in motion.
////////////////////////////////////
module.exports = {
  eventTrigger: async function (c, client, CONFIG, npm) {
    ////////////////////////////////////
    //For safety reasons any and all bots after this line
    //may not go on, bots therefor cannot execute commands and such.
    ////////////////////////////////////
    if (c.d.author.bot == true) return;

    ////////////////////////////////////
    //We define some quicker ways to call info
    //Basically you never need to do this, but it's easier.
    ////////////////////////////////////
    const prefix = await CONFIG.PREFIX("PREFIX", c.d.guild_id);

    const snd = await client.channels.cache.get(c.d.channel_id);
    if (!snd) return;

    const gld = await client.guilds.cache.get(c.d.guild_id);
    if (!gld) return;

    const msg = c.d;

    const mmbr = await gld.members.cache.get(msg.author.id);
    if (!mmbr) return;

    const mntns = c.d.mentions;

    ////////////////////////////////////
    //This is exactly what you think
    //Big Brother is watching you
    ////////////////////////////////////
    privacyIsAJoke = {
      msgid: msg.id,
      userid: msg.author.id,
      content: `${moment().format("MMMM Do YYYY, HH:mm:ss")}:\n${msg.content}`,
      username: `${mmbr.user.username}#${mmbr.user.discriminator}`,
    };
    await setPrivacy.run(privacyIsAJoke);

    ////////////////////////////////////
    //Some functions now that we know
    //the user is real
    ////////////////////////////////////
    USERINFO = require("../modules/USERINFO");
    USERINFO.eventTrigger(c, client, CONFIG, npm, mmbr);

    POINTS = require("../modules/POINTS");
    POINTS.eventTrigger(c, client, CONFIG, npm, mmbr);

    ////////////////////////////////////
    //AutoMod Trigger
    //We check if it's enabled
    ////////////////////////////////////
    if (
      mmbr.permissions.has("KICK_MEMBERS") ||
      mmbr.permissions.has("BAN_MEMBERS")
    ) {
    } else {
      let autoModCheck = await getSettings.get(msg.guild_id);

      if (msg.content) {
        if (autoModCheck) {
          if (autoModCheck.autoMod) {
            if (autoModCheck.autoMod == "ON") {
              AUTO = require("../modules/AUTOMOD");
              AUTO.eventTrigger(client, CONFIG, npm, mmbr, msg, snd, gld);
            }
          }
        }
      }
    }
    ////////////////////////////////////
    //Embed message links
    //We check if the message contains a message link and then process it
    ////////////////////////////////////
    LINK = require("../modules/LINK");
    LINK.eventTrigger(client, CONFIG, npm, mmbr, msg, snd, gld);

    ////////////////////////////////////
    //Fake AI
    //Or maybe real I don't know, fuck you
    ////////////////////////////////////
    if (msg.content.toLowerCase().startsWith("artemis")) {
      let artSet = await getSettings.get(msg.guild_id);
      if (artSet) {
        if (artSet.artemisTalks == "ON") {
          let contextMsg = msg.content.slice(8);
          try {
            cleverbot(contextMsg).then(async (response) => {
              await snd.send(response);
            });
          } catch (err) {
            console.log("");
          }
        }
      }
    }

    ////////////////////////////////////
    //Bump triggers
    //Will have to be expanded upon
    ////////////////////////////////////
    let bumpArray = ["!bump", "!d bump", "dlm!bump", "!like", ".bump"];

    await bumpArray.forEach((b) => {
      if (msg.content.toLowerCase() == b) {
        BUMP = require("../modules/BUMP");
        BUMP.eventTrigger(client, CONFIG, npm, mmbr, msg, snd, gld);
      }
    });

    ////////////////////////////////////
    //Hello Artemis Module
    //Basically this is the verification stuff.
    ////////////////////////////////////
    let veriCall = await getGuild.get(msg.guild_id);
    if (veriCall) {
      if (veriCall.verificationChannel) {
        if (c.d.channel_id == veriCall.verificationChannel) {
          VERIFICATION = require("../modules/VERIFICATION");
          VERIFICATION.eventTrigger(client, CONFIG, npm, mmbr, msg, snd, gld);
        }
      }
    }

    ////////////////////////////////////
    //Checks if leveling is enabled!
    //If it is these 2 modules are triggered
    ////////////////////////////////////
    let pointGather = await getSettings.get(gld.id);

    if (pointGather) {
      if (pointGather.leveling == "ON") {
        ////////////////////////////////////
        //Thanking and congratulating module
        //Calls all mentions and rewards accordingly
        ////////////////////////////////////
        if (
          msg.content.toLowerCase().includes("thank") ||
          msg.content.toLowerCase().includes("congrat")
        ) {
          THANKS = require("../modules/THANKS");
          THANKS.eventTrigger(client, CONFIG, npm, mmbr, msg, snd, gld, mntns);
        }

        ////////////////////////////////////
        //Level up events/modules
        //Only happens on new messages period
        ////////////////////////////////////
        LEVEL_UP = require("../modules/LEVEL_UP");
        LEVEL_UP.eventTrigger(client, CONFIG, npm, mmbr, msg, snd, gld);
      }
    }

    ////////////////////////////////////
    //Custom commands gets parsed here!
    //We check everything
    ////////////////////////////////////
    let pullCC = await db
      .prepare("SELECT * FROM cc WHERE gldid = ?")
      .all(gld.id);

    if (pullCC[0]) {
      for (let i of pullCC) {
        if (msg.content.includes(i.ccname)) {
          if (i.cclocation == "START") {
            if (msg.content.startsWith(i.ccname)) {
              actionParse = i.ccaction.replace(/\[author]/g, mmbr);
              if (mntns[0]) {
                actionParse = actionParse.replace(
                  /\[mention]/g,
                  `<@${mntns[0].id}>`
                );
              } else {
                actionParse = actionParse.replace(/\[mention]/g, mmbr);
              }

              await snd.send(actionParse);
            }
          } else {
            actionParse = i.ccaction.replace(/\[author]/g, mmbr);
            if (mntns[0]) {
              actionParse = actionParse.replace(
                /\[mention]/g,
                `<@${mntns[0].id}>`
              );
            } else {
              actionParse = actionParse.replace(/\[mention]/g, mmbr);
            }

            await snd.send(actionParse);
          }
        }
      }
    }

    ////////////////////////////////////
    //Commands get executed here
    //We pass trough information to the command file.
    ////////////////////////////////////
    if (!msg.content.startsWith(prefix)) return;

    try {
      const comExec = await client.commands.get(
        msg.content.slice(prefix.length).split(/ +/).shift().toLowerCase()
      );
      if (!comExec) return;

      ////////////////////////////////////
      //Permission check system
      //Goes from 0 to 4
      ////////////////////////////////////
      let perm = "NO";
      let permitCheck = await getScore.get(mmbr.id, gld.id);

      switch (comExec.permission) {
        case "0": //Regular Members
          perm = "YES";
          if (permitCheck.permit >= 0) perm = "YES";
          break;
        case "1": //Mute permissions
          if (mmbr.permissions.has("MUTE_MEMBERS")) perm = "YES";
          if (mmbr.permissions.has("KICK_MEMBERS")) perm = "YES";
          if (mmbr.permissions.has("BAN_MEMBERS")) perm = "YES";
          if (mmbr.id == (await CONFIG.CONFIG("OWNER"))) perm = "YES";
          if (permitCheck.permit >= 1) {
            perm = "YES";
            permitCheck.permit = 0;
            await setScore.run(permitCheck);
          }
          break;
        case "2": //Kick permissions
          if (mmbr.permissions.has("KICK_MEMBERS")) perm = "YES";
          if (mmbr.permissions.has("BAN_MEMBERS")) perm = "YES";
          if (mmbr.id == (await CONFIG.CONFIG("OWNER"))) perm = "YES";
          if (permitCheck.permit >= 2) {
            perm = "YES";
            permitCheck.permit = 0;
            await setScore.run(permitCheck);
          }
          break;
        case "3": //Ban permissions
          if (mmbr.permissions.has("BAN_MEMBERS")) perm = "YES";
          if (mmbr.id == (await CONFIG.CONFIG("OWNER"))) perm = "YES";
          if (permitCheck.permit >= 3) {
            perm = "YES";
            permitCheck.permit = 0;
            await setScore.run(permitCheck);
          }
          break;
        case "4": //Bot Owner
          if (mmbr.id == (await CONFIG.CONFIG("OWNER"))) perm = "YES";
          if (permitCheck.permit >= 4) {
            perm = "YES";
            permitCheck.permit = 0;
            await setScore.run(permitCheck);
          }
          break;
      }

      if (perm == "YES") {
        let usage = await getUsage.get(comExec.name);
        usage.number++;
        setUsage.run(usage);

        comExec.execute(msg, client, CONFIG, npm, mmbr);
      }

      if (perm == "NO")
        snd.send(
          `${mmbr}, You are lacking permissions to use this command!\n You need permission level: ${comExec.permission}!`
        );
    } catch (error) {
      console.error(error);
    }
  },
};
