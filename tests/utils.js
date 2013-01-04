var utils = require('../lib/util/utils');

var date1 = new Date('Jan 03 2013 14:26:38 GMT');
var octal1 = 12071312436;
var dos1 = 1109607251;

var date2 = new Date('Jan 03 2013 12:24:36 GMT-0400');
var octal2 = 12071330304;
var dos2 = 1109611282;

module.exports = {
  octalDateTime: function(test) {
    test.expect(2);

    var actual = utils.octalDateTime(date1);
    var expected = octal1;
    test.equal(actual, expected);

    actual = utils.octalDateTime(date2);
    expected = octal2;
    test.equal(actual, expected);

    test.done();
  },

  convertDateTimeOctal: function(test) {
    test.expect(2);

    var actual = utils.convertDateTimeOctal(octal1).toUTCString();
    var expected = date1.toUTCString();
    test.equal(actual, expected);

    actual = utils.convertDateTimeOctal(octal2).toUTCString();
    expected = date2.toUTCString();
    test.equal(actual, expected);

    test.done();
  },

  dosDateTime: function(test) {
    test.expect(2);

    var actual = utils.dosDateTime(date1);
    var expected = dos1;
    test.equal(actual, expected);

    actual = utils.dosDateTime(date2);
    expected = dos2;
    test.equal(actual, expected);

    test.done();
  },

  convertDateTimeDos: function(test) {
    test.expect(2);

    var actual = utils.convertDateTimeDos(dos1).toUTCString();
    var expected = date1.toUTCString();
    test.equal(actual, expected);

    actual = utils.convertDateTimeDos(dos2).toUTCString();
    expected = date2.toUTCString();
    test.equal(actual, expected);

    test.done();
  }
};