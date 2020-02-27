const { default: Twitch } = require('twitch');
const _ = require('lodash');

class TwitchWrapper {
    constructor(log) {
        this.log = log;
        this.client = Twitch
            .withClientCredentials(process.env.TWITCH_CLIENT, process.env.TWITCH_SECRET)
            .helix;
    }

    async initialize() {
        this.log.info('Initializing Twitch...');
        this.game = await this.client.games.getGameByName(process.env.TWITCH_GAME);
        this.log.debug(`Twitch authenticated with token: ${process.env.TWITCH_CLIENT}.${process.env.TWITCH_SECRET}`);
    }

    async filterLiveStreamers(members) {
        let results = members;
        results = await Promise.all(results.map(async (GuildMember) => {
            const member = GuildMember;
            member.twitch = await this.isLive(GuildMember.stream.url);

            return member;
        }));

        return results.filter((GuildMember) => {
            if (!_.isNil(GuildMember.twitch)) {
                const live = GuildMember.twitch.live.type === 'live';
                const game = GuildMember.twitch.live.gameId === this.game.id;

                return live && game; // is live and streams correct game
            }

            return false;
        });
    }

    async isLive(url) {
        const username = TwitchWrapper.extractUserFromUrl(url);
        if (_.isNil(username) || username.type !== 'stream') return null;

        const user = await this.client.users.getUserByName(username.id);
        if (_.isNil(user)) return null;

        const live = await user.getStream();
        if (_.isNil(live)) return null;

        return { user, live };
    }

    static extractUserFromUrl(url) {
        const obj = {};
        obj.id = url.substr(url.lastIndexOf('/') + 1);

        if (url.includes('/videos/')) {
            obj.type = 'video';
            return obj;
        }

        if (!_.isEmpty(obj.id) && !obj.id.includes('twitch.tv')) {
            obj.type = 'stream';
            return obj;
        }

        return null;
    }
}

module.exports = TwitchWrapper;
