import sinon from 'sinon';
import chai, { expect } from 'chai';
chai.use(require('sinon-chai'));

import bulkFetch from '../bulk-fetch-records.js';

function generateData(startRecord, endRecord) {
    const arr = [];
    for (let i = startRecord; i < endRecord; i++) {
        arr.push({ id: i });
    }
    return arr;
}
function makeDataGenerator(totalRecords) {
    return function (startRecord, endRecord) {
        const arr = generateData(startRecord, endRecord);
        return Promise.resolve(arr.slice(0, totalRecords));
    };
}

function makeContentRangeParser(totalRecords) {
    return function parseContentRange(data) {
        return {
            start: data[0].id,
            end: data[data.length - 1].id,
            total: totalRecords
        };
    };
}

describe('Bulk Fetch records', ()=> {
    it('should call data generator with default start record and end record if not provided', ()=> {
        const dataSize = 10;
        const generateSpy = sinon.spy(makeDataGenerator(dataSize));
        return bulkFetch(generateSpy, { 
            contentRangeParser: makeContentRangeParser(dataSize),
        }).then((runs)=> {
            expect(generateSpy.callCount).to.equal(1);
            expect(generateSpy).to.have.been.calledWith(0, 100);
        });
    }); 
    it('should call data generator N times', ()=> {
        const dataSize = 100;
        const generateSpy = sinon.spy(makeDataGenerator(dataSize));
        return bulkFetch(generateSpy, { 
            recordsPerFetch: 10,
            contentRangeParser: makeContentRangeParser(dataSize),
        }).then((runs)=> {
            expect(generateSpy.callCount).to.equal(10);
            const lastCallArgs = generateSpy.lastCall.args;
            expect(lastCallArgs).to.eql([90, 100]);
        });
    }); 

    it('should not go beyond endrecord if start and endrecord provided', ()=> {
        const dataSize = 100;
        const generateSpy = sinon.spy(makeDataGenerator(dataSize));
        return bulkFetch(generateSpy, { 
            startRecord: 1,
            endRecord: 10,
            contentRangeParser: makeContentRangeParser(dataSize),
        }).then((runs)=> {
            expect(generateSpy.callCount).to.equal(1);
            expect(generateSpy).to.have.been.calledWith(1, 10);
        });
    }); 
    it('should not go beyond endrecord if ony endrecord provided', ()=> {
        const dataSize = 100;
        const generateSpy = sinon.spy(makeDataGenerator(dataSize));
        return bulkFetch(generateSpy, { 
            recordsPerFetch: 100,
            endRecord: 10,
            contentRangeParser: makeContentRangeParser(dataSize),
        }).then((runs)=> {
            expect(generateSpy.callCount).to.equal(1);
            expect(generateSpy).to.have.been.calledWith(0, 10);
            expect(runs.length).to.equal(10);
        });
    }); 
    it('should call onData N times', ()=> {
        const dataSize = 100;
        const generateSpy = sinon.spy(makeDataGenerator(dataSize));
        const onDataSpy = sinon.spy(()=> {});
        return bulkFetch(generateSpy, { 
            recordsPerFetch: 10,
            onData: onDataSpy,
            contentRangeParser: makeContentRangeParser(dataSize),
        }).then((runs)=> {
            expect(onDataSpy.callCount).to.equal(10);
            const lastCallArgs = onDataSpy.lastCall.args;
            const finalExpected = generateData(90, 100);
            expect(lastCallArgs[0]).to.eql(finalExpected);
            expect(runs.length).to.equal(dataSize);
        });
    });
});