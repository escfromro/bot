const TimeAgoLocaleEn = require('javascript-time-ago/locale/en');
const TimeAgo = require('javascript-time-ago');
const Discord = require('discord.js');
const _ = require('lodash');

class DiscordWrapper {
    constructor(log, events) {
        this.log = log;
        this.client = new Discord.Client();
        _.forEach(events, (event, type) => this.client.on(type, event));

        TimeAgo.addLocale(TimeAgoLocaleEn);
        this.time = new TimeAgo();
    }

    async initialize() {
        this.log.info('Initializing Discord...');
        await this.client.login(process.env.DISCORD_TOKEN);
    }

    async setActivity(memberCount) {
        const presence = await this.client.user.setActivity(process.env.BOT_PRESENCE.replace('%d', memberCount), {
            type: process.env.BOT_PRESENCE_TYPE,
        });

        this.log.verbose(`Activity set to "${_.capitalize(process.env.BOT_PRESENCE_TYPE.toLowerCase())} ${presence.game ? presence.game.name : 'none'}"`);
    }

    static filterGuildMembers(Guild, Role) {
        if (_.isNil(Role)) return [];

        return Guild.members.filter((GuildMember) => {
            const streamer = GuildMember.roles.has(Role.id);
            const live = GuildMember.presence.activities.some((Game) => Game.streaming);

            return streamer && live; // has partner role && is streaming
        }).map((GuildMember) => {
            const member = GuildMember;
            member.stream = member.presence.activities.filter((Game) => Game.streaming).shift();

            return member;
        });
    }

    createRefreshEmbed(GuildMember) {
        return new Discord.RichEmbed()
            .setColor('#9013FE')
            .setImage(GuildMember.twitch.live.thumbnailUrl.replace('{width}', '192').replace('{height}', '108'))
            .setAuthor(GuildMember.twitch.user.displayName,
                GuildMember.twitch.user.profilePictureUrl,
                GuildMember.stream.url)
            .setFooter(`${GuildMember.twitch.live.viewers} viewers • started ${this.time.format(GuildMember.twitch.live.startDate)}`);
    }
}

module.exports = DiscordWrapper;
