////////////////////////////////////
//We define Category name, Command name, Description
//Permission level and full explanation here
////////////////////////////////////
module.exports = {
  category: "music",
  name: "queue",
  description: "queue",
  permission: "0",
  explain: "queue",

  ////////////////////////////////////
  //We pass trough some predefined things
  //Within this command we can work with Client, raw content and a config file
  ////////////////////////////////////
  async execute(msg, client, CONFIG, npm, mmbr) {
    ////////////////////////////////////
    //We fetch the channel here
    //We can easely send with this const
    ////////////////////////////////////
    const snd = await client.channels.cache.get(msg.channel_id);

    ////////////////////////////////////
    //Defining the arguments here
    //Splits can happen later if needed
    ////////////////////////////////////
    const prefix = await CONFIG.PREFIX("PREFIX", msg.guild_id);
    const comName = module.exports.name;
    const arguments = await msg.content.slice(
      prefix.length + comName.length + 1
    );

    ////////////////////////////////////
    //Main command starts here
    //Comments might get smaller here
    ////////////////////////////////////
    const gld = await client.guilds.cache.get(msg.guild_id); //Get guild
    if (!gld) return;

    const voiceChannel = mmbr.voice.channel;
    if (!voiceChannel)
      return snd.send("You need to be in a voice channel to play music!");
    const permissions = voiceChannel.permissionsFor(client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return snd.send(
        "I need the permissions to join and speak in your voice channel!"
      );
    }

    const queue = client.queue;
    const serverQueue = queue.get(gld.id);

    if (!serverQueue) return snd.send("There is nothing playing right now.");

    if (serverQueue.songs) {
      counter = 0;

      let queueSong = new Discord.MessageEmbed()
        .setThumbnail(serverQueue.songs[0].thumb)
        .setColor("GREEN")
        .setAuthor(
          "Artemis Music Player",
          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/YouTube_play_buttom_icon_(2013-2017).svg/512px-YouTube_play_buttom_icon_(2013-2017).svg.png"
        )
        .setFooter(
          `${serverQueue.volume}% | Queue`,
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Speaker_Icon.svg/500px-Speaker_Icon.svg.png"
        );

      serverQueue.songs.forEach((S) => {
        counter++;
        if (counter >= 10) return;
        queueSong.addField(
          `[${counter}] ${S.title}`,
          `Requested by: ${S.req}\nDuration: ${S.dur}`
        );
      });

      return snd.send({ embed: queueSong });
    }
  },
};
