/*global yeoball:false, test:false, ok:false */

(function () {
  'use strict';

  test('Library answer questions with YO!', function () {
    ok(revealjs('Should I tickle this unicorn?') === 'YO!', 'Passed!');
  });

}());
