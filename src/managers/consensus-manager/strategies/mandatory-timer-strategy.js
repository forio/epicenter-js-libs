//Need executeActionsImmediately true?
// have everyone patch their default actions on submit.
// Also submit to operations with executeFalse to indicate that you're done
// On timeout call force-close.

export default function mandatoryTimerStrategy(consensusGroup, strategyOptions) {
    const options = $.extend({}, {
        defaultActions: [],
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