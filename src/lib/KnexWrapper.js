const Knex = require('knex');
const _ = require('lodash');

class KnexWrapper {
    constructor(log) {
        this.log = log;
        this.client = Knex({
            client: 'mysql',
            connection: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASS,
                database: process.env.DB_NAME,
            },
        });
    }

    async initialize() {
        this.log.info('Initializing Knex...');
        const result = await this.client.raw('SELECT 4+2 AS solution');
        const { solution } = _.first(_.first(result));
        if (solution !== 6) {
            throw Error('Knex solution failed, is this real life?');
        } else this.log.debug(`Knex authenticated: ${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
    }

    async truncateLiveStreamers() {
        await this.client(process.env.DB_TABLE_LIVE_STREAMERS).truncate();
        this.log.debug(`Truncated ${process.env.DB_HOST}/${process.env.DB_NAME}/${process.env.DB_TABLE_LIVE_STREAMERS}`);
    }

    async saveLiveStreamers(members) {
        const results = members.map((GuildMember) => ({
            user_id: GuildMember.twitch.live.userId,
            stream_id: GuildMember.twitch.live.id,
            title: GuildMember.twitch.live.title,
            name: GuildMember.twitch.live.userDisplayName,
            url: GuildMember.stream.url,
            thumbnail: GuildMember.twitch.live.thumbnailUrl,
            viewers: GuildMember.twitch.live.viewers,
            started_at: KnexWrapper.now(GuildMember.twitch.live.startDate),
            created_at: KnexWrapper.now(),
        }));

        await this.client(process.env.DB_TABLE_LIVE_STREAMERS).insert(results);
    }

    static now(date) {
        return (date || new Date()).toISOString().slice(0, 19).replace('T', ' ');
    }
}

module.exports = KnexWrapper;
