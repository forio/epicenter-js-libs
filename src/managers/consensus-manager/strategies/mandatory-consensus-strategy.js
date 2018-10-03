export default function mandatoryConsensusStrategy(consensusGroup, strategyOptions) {
    const options = $.extend({}, {
        maxRounds: Infinity,
        name: (list)=> {
            return `round-${list.length + 1}`;
        }
    }, strategyOptions);
    return consensusGroup.list().then((consensusList)=> {
        const lastConsensus = consensusList[consensusList.length - 1];
        const isLastPending = lastConsensus && !lastConsensus.closed;
        const allowCreateNew = options.maxRounds >= consensusList.length;

        if (isLastPending || !allowCreateNew) {
            return lastConsensus;
        }

        const name = options.name(consensusList);
        const newConsensusPromise = consensusGroup.consensus(name).create({
            roles: options.roles,
            executeActionsImmediately: false
        }); 
        return newConsensusPromise;
    });
}