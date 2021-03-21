////////////////////////////////////
//We define Category name, Command name, Description
//Permission level and full explanation here
////////////////////////////////////
module.exports = {
  category: "music",
  name: "play",
  description: "Play a song.",
  permission: "0",
  explain: `Play a song.
You need to be in a voice channel to use this command.

Example usage: (PREFIX)play Never gonna give you up
Example usage: (PREFIX)play https://www.youtube.com/watch?v=dQw4w9WgXcQ`,

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

    if (!arguments) {
      return snd.send(`Play a song.
You need to be in a voice channel to use this command.

Example usage: ${prefix}play Never gonna give you up
Example usage: ${prefix}play https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
    }

    let num = (await Math.random()) * 1000;

    if (arguments.toLowerCase().startsWith("http")) {
      video = youtubedl(arguments, ["--format=18"], { cwd: __dirname });

      songInformation = [];
      await video.on("error", async function (info) {
        return snd.send("An error has occured!\nMaybe a wrong URL?");
      });

      await video.on("info", async function (info) {
        infoSong = {
          title: info.title,
          url: `./content/MUSIC/${gld.id}-${num}.mp4`,
          thumb: info.thumbnail,
          desc: info.description,
          dur: info._duration_hms,
        };

        await songInformation.push(await infoSong);

        video.pipe(
          fs.createWriteStream(`./content/MUSIC/${gld.id}-${num}.mp4`)
        );
      });

      video.on("end", async function () {
        try {
          const queue = client.queue;
          const serverQueue = client.queue.get(gld.id);

          const song = {
            title: songInformation[0].title,
            url: songInformation[0].url,
            thumb: songInformation[0].thumb,
            desc: songInformation[0].desc,
            req: `${mmbr.user.username}#${mmbr.user.discriminator}`,
            dur: songInformation[0].dur,
          };

          if (!serverQueue) {
            const queueContruct = {
              textChannel: snd,
              voiceChannel: voiceChannel,
              connection: null,
              songs: [],
              volume: 30,
              playing: true,
            };

            queue.set(gld.id, queueContruct);

            queueContruct.songs.push(song);

            try {
              var connection = await voiceChannel.join();
              queueContruct.connection = connection;
              PLAYER.eventTrigger(client, gld, queueContruct.songs[0]);
            } catch (err) {
              queue.delete(gld.id);
              return console.log(err);
              return snd.send("Something went wrong!");
            }
          } else {
            serverQueue.songs.push(song);

            let addSong = new Discord.MessageEmbed()
              .setThumbnail(song.thumb)
              .setColor("DARK_VIVID_PINK")
              .setAuthor(
                "Artemis Music Player",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/YouTube_play_buttom_icon_(2013-2017).svg/512px-YouTube_play_buttom_icon_(2013-2017).svg.png"
              )
              .addField("Title:", `${song.title}`)
              .addField("Duration:", `${song.dur}`)
              .addField("Requested by:", `${song.req}`)
              .setFooter("Song added to queue");
            return snd.send({ embed: addSong });
          }
        } catch (error) {
          snd.send("Something went wrong!");
        }
      });
    } else {
      var opts = {
        maxResults: 1,
        key: await CONFIG.CONFIG("ytkey"),
      };

      search(arguments, opts, async function (err, results) {
        if (err) return snd.send("Something went wrong!");
        video = youtubedl(await results[0].link, ["--format=18"], {
          cwd: __dirname,
        });

        songInformation = [];
        await video.on("error", async function (info) {
          return snd.send("An error has occured!\nMaybe a wrong URL?");
        });

        await video.on("info", async function (info) {
          if (info._duration_raw >= 1300)
            return snd.send("Songs may not be longer than 10 minutes!");
          infoSong = {
            title: info.title,
            url: `./content/MUSIC/${gld.id}-${num}.mp4`,
            thumb: info.thumbnail,
            desc: info.description,
            dur: info._duration_hms,
          };

          await songInformation.push(await infoSong);

          video.pipe(
            fs.createWriteStream(`./content/MUSIC/${gld.id}-${num}.mp4`)
          );
        });

        video.on("end", async function () {
          try {
            const queue = client.queue;
            const serverQueue = client.queue.get(gld.id);

            const song = {
              title: songInformation[0].title,
              url: songInformation[0].url,
              thumb: songInformation[0].thumb,
              desc: songInformation[0].desc,
              req: `${mmbr.user.username}#${mmbr.user.discriminator}`,
              dur: songInformation[0].dur,
            };

            if (!serverQueue) {
              const queueContruct = {
                textChannel: snd,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 30,
                playing: true,
              };

              queue.set(gld.id, queueContruct);

              queueContruct.songs.push(song);

              try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                PLAYER.eventTrigger(client, gld, queueContruct.songs[0]);
              } catch (err) {
                queue.delete(gld.id);
                return console.log(err);
                return snd.send("Something went wrong!");
              }
            } else {
              serverQueue.songs.push(song);

              let addSong = new Discord.MessageEmbed()
                .setThumbnail(song.thumb)
                .setColor("DARK_VIVID_PINK")
                .setAuthor(
                  "Artemis Music Player",
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/YouTube_play_buttom_icon_(2013-2017).svg/512px-YouTube_play_buttom_icon_(2013-2017).svg.png"
                )
                .addField("Title:", `${song.title}`)
                .addField("Duration:", `${song.dur}`)
                .addField("Requested by:", `${song.req}`)
                .setFooter("Song added to queue");
              return snd.send({ embed: addSong });
            }
          } catch (error) {
            snd.send("Something went wrong!");
          }
        });
      });
    }
  },
};
