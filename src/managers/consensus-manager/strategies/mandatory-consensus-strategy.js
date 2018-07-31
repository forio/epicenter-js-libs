
/**
 * 
 */

export default function mandatoryConsensusStrategy(consensusGroup, strategyOptions) {
    const options = $.extend({}, {
        maxRounds: 8,
        name: (list)=> {
            return `round-${list.length + 1}`;
        }
    }, strategyOptions);
    return consensusGroup.list().then((consensusList)=> {
        const lastConsensus = consensusList[consensusList.length - 1];
        const isLastPending = lastConsensus && !lastConsensus.closed;
        if (isLastPending) {
            return lastConsensus;
        }

        const allowCreateNew = options.maxRounds >= consensusList.length;
        if (!allowCreateNew) {
            throw new Error('CONSENSUS_LIMIT_REACHED');
        }
        const name = options.name(consensusList);
        const newConsensusPromise = consensusGroup.consensus(name).create({
            roles: options.roles,
            executeActionsImmediately: false
        }); 
        return newConsensusPromise;
    });
}