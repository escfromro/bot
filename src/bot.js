const _ = require('lodash');
const LogWrapper = require('./lib/LogWrapper');
const KnexWrapper = require('./lib/KnexWrapper');
const TwitchWrapper = require('./lib/TwitchWrapper');
const DiscordWrapper = require('./lib/DiscordWrapper');

class Bot {
    constructor() {
        this.log = LogWrapper;
        this.knex = new KnexWrapper(this.log);
        this.twitch = new TwitchWrapper(this.log);
        this.discord = new DiscordWrapper(this.log, this.events());
    }

    async initialize() {
        try {
            await this.knex.initialize();
            await this.twitch.initialize();
            await this.discord.initialize();
        } catch (error) {
            this.exit(error);
        }
    }

    events() {
        return {
            error: (msg) => this.log.error(msg),
            debug: (msg) => this.log.debug(msg),
            warn: (msg) => this.log.warn(msg),
            ready: () => {
                this.guild = this.discord.client.guilds.resolve(process.env.DISCORD_GUILD);
                if (_.isNil(this.guild)) this.exit(`${this.discord.client.user.tag} not on guild# ${process.env.DISCORD_GUILD}`);
                else this.log.info(`${this.discord.client.user.tag} logged in on ${this.guild.name}`);

                this.admin = this.guild.roles.resolve(process.env.DISCORD_ROLE_ADMIN);
                if (_.isNil(this.admin)) this.abort('Admin rank not found');
                this.streamer_std = this.guild.roles.resolve(process.env.DISCORD_ROLE_STREAMER_STD);
                if (_.isNil(this.streamer_std)) this.abort('Streamer standard rank not found');
                this.streamer_pro = this.guild.roles.resolve(process.env.DISCORD_ROLE_STREAMER_PRO);
                if (_.isNil(this.streamer_pro)) this.abort('Streamer promoted rank not found');
                this.streamer_vip = this.guild.roles.resolve(process.env.DISCORD_ROLE_STREAMER_VIP);
                if (_.isNil(this.streamer_vip)) this.abort('Streamer vip rank not found');

                this.discord.setActivity(this.guild.memberCount);

                // this.discord.client.setTimeout(() => this.refresh(), 1 * 1000);
                // this.discord.client.setInterval(() => this.refresh(),
                //     process.env.BOT_REFRESH * 60 * 1000);
            },
            guildMemberAdd: (GuildMember) => {
                this.log.verbose(`${GuildMember.user.tag} has joined ${this.guild.name}`);
                if (GuildMember.guild.available) this.discord.setActivity(GuildMember.guild.memberCount);
            },
            guildMemberRemove: (GuildMember) => {
                this.log.verbose(`${GuildMember.user.tag} has left ${this.guild.name}`);
                if (GuildMember.guild.available) this.discord.setActivity(GuildMember.guild.memberCount);
            },
            message: async (msg) => {
                const prefix = process.env.BOT_PREFIX.replace('%s', ' '); // ignore messages without prefix or other bots
                if (!msg.content.startsWith(prefix) || msg.author.bot) return;

                const args = msg.content.slice(prefix.length).trim().split('/ +/g');
                const cmd = args.shift().toLowerCase();

                if (cmd === 'ping') {
                    const reply = await msg.channel.send('Loading...');
                    reply.edit(`Pong! Latency is ${reply.createdTimestamp - msg.createdTimestamp}ms.`);
                }

                // if (cmd === 'refresh') {
                //     if (msg.author.id !== process.env.DISCORD_OWNER) { // super-admin
                //         if (_.isNil(msg.member)) { // is DM?
                //             msg.reply('The refresh command is not available on DM');
                //             return;
                //         }

                //         const admin = !_.isNil(this.admin)
                //             && msg.member.roles.has(this.admin.id);
                //         if (!(admin)) { // not admin?
                //             msg.reply('Forbidden, security clearance required');
                //             return;
                //         }
                //     }

                //     const reply = await msg.channel.send('Refreshing...');
                //     const members = await this.refresh();
                //     if (members.length) {
                //         reply.edit(`Refreshed ${members.length} ${Bot.lex(members.length)}`);
                //         _.forEach(members, (member) => {
                //             msg.channel.send(this.discord.createRefreshEmbed(member));
                //         });
                //     } else reply.edit('No live streamers found');
                // }
            },
        };
    }

    // async refresh() {
    //     let members = DiscordWrapper.filterGuildMembers(this.guild, this.streamer);
    //     if (members.length) {
    //         this.log.info(`Found ${members.length} potential ${Bot.lex(members.length)}: ${_.map(members, 'user.tag').join(', ')}`);

    //         members = await this.twitch.filterLiveStreamers(members);
    //         if (members.length) {
    //             this.log.info(`Filtered down to ${members.length} valid ${Bot.lex(members.length)}: ${_.map(members, 'user.tag').join(', ')}`);

    //             await this.knex.truncateLiveStreamers();
    //             await this.knex.saveLiveStreamers(members);
    //             this.log.info(`Saved ${members.length} live ${Bot.lex(members.length)} in db: ${_.map(members, 'user.tag').join(', ')}`);
    //             return members;
    //         }

    //         await this.knex.truncateLiveStreamers();
    //         this.log.warn('Filtering down resulted in no valid streamers');
    //         return members;
    //     }

    //     await this.knex.truncateLiveStreamers();
    //     this.log.warn('No potential streamers were found');
    //     return members;
    // }

    // static lex(count) {
    //     return count === 1 ? 'streamer' : 'streamers';
    // }

    abort(msg) {
        this.log.warn(msg);
    }

    exit(msg, code) {
        this.log.error(msg);
        process.exit(code || 1);
    }
}

module.exports = Bot;
