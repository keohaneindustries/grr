'use strict';

goog.provide('grrUi.core.utils.camelCaseToDashDelimited');
goog.provide('grrUi.core.utils.stringToList');
goog.provide('grrUi.core.utils.stripAff4Prefix');


/**
 * Converts camelCaseStrings to dash-delimited-strings.
 *
 * Examples:
 * "someTestInput" -> "some-test-input"
 * "some string with spaces" -> "some-string-with-spaces"
 * "some string with $ symbols" -> "some-string-with-symbols"
 * "someDDirectiveName" -> "some-d-directive-name"
 * "someDDDirectiveName" -> "some-d-d-directive-name"
 * "SOMEUppercaseString" -> "s-o-m-e-uppercase-string"
 *
 * @param {string} input String to be converted.
 * @return {string} Converted string.
 */
grrUi.core.utils.camelCaseToDashDelimited = function(input) {
    return input.replace(/\W+/g, '-')
        .replace(/([A-Z])/g, '-$1')
        .replace(/^-+/, '') // Removing leading '-'.
        .replace(/-+$/, '') // Removing trailing '-'.
        .toLowerCase();
};


/**
 * Splits comma-separated string into a list of strings. Trims every string
 * along the way.
 *
 * @param {string} input Comma-separated string.
 * @return {Array<string>} List of trimmed strings.
 */
grrUi.core.utils.stringToList = function(input) {
  var result = [];

  angular.forEach((input || '').split(','), function(item) {
    item = item.trim();
    if (item) {
      result.push(item);
    }
  });

  return result;
};


/**
 * Strips 'aff4:/' prefix from the string.
 *
 * @param {string} input
 * @return {string} String without 'aff4:/' prefix.
 */
grrUi.core.utils.stripAff4Prefix = function(input) {
  var aff4Prefix = 'aff4:/';
  if (input.toLowerCase().indexOf(aff4Prefix) == 0) {
    return input.substr(aff4Prefix.length);
  } else {
    return input;
  }
};
