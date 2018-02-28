var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');

var serviceApi = require("../../server/service-api")

describe('Mocking Service API', function() {
    var uut;

    var sandbox = sinon.createSandbox();
    
    beforeEach(function() {
        uut = require("../../mock/service-api")
    });

    afterEach(function() {
        sandbox.restore();
    })

    for (var field in serviceApi) {
        it('should mock ' + field + '() service api function', function() {
            if (serviceApi.hasOwnProperty(field)) {
                expect(uut[field]).to.exist
            }
        })
    }
})