'use strict';

goog.provide('grrUi.client.virtualFileSystem.recursiveListButtonDirective.RecursiveListButtonController');
goog.provide('grrUi.client.virtualFileSystem.recursiveListButtonDirective.RecursiveListButtonDirective');

goog.require('grrUi.client.virtualFileSystem.events');

goog.require('grrUi.client.virtualFileSystem.utils.ensurePathIsFolder');
goog.require('grrUi.client.virtualFileSystem.utils.getFolderFromPath');


goog.scope(function() {


var REFRESH_FOLDER_EVENT =
    grrUi.client.virtualFileSystem.events.REFRESH_FOLDER_EVENT;


var ensurePathIsFolder = grrUi.client.virtualFileSystem.utils.ensurePathIsFolder;

var getFolderFromPath = grrUi.client.virtualFileSystem.utils.getFolderFromPath;


/**
 * Controller for RecursiveListButtonDirective.
 *
 * @constructor
 * @param {!angular.Scope} $rootScope
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @param {!angularUi.$modal} $modal Bootstrap UI modal service.
 * @param {!grrUi.core.apiService.ApiService} grrApiService
 * @param {!grrUi.core.reflectionService.ReflectionService} grrReflectionService
 * @ngInject
 */
grrUi.client.virtualFileSystem.recursiveListButtonDirective
    .RecursiveListButtonController = function(
    $rootScope, $scope, $timeout, $modal, grrApiService, grrReflectionService) {
  /** @private {!angular.Scope} */
  this.rootScope_ = $rootScope;

  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @private {!angular.$timeout} */
  this.timeout_ = $timeout;

  /** @private {!angularUi.$modal} */
  this.modal_ = $modal;

  /** @private {!grrUi.core.apiService.ApiService} */
  this.grrApiService_ = grrApiService;

  /** @private {!grrUi.core.reflectionService.ReflectionService} */
  this.grrReflectionService_ = grrReflectionService;

  /** @type {?string} */
  this.lastOperationId;

  /** @type {Object} */
  this.refreshOperation;

  /** @type {?boolean} */
  this.done;

  /** @type {?string} */
  this.error;

  /** @private {angularUi.$modalInstance} */
  this.modalInstance;

  this.scope_.$watchGroup(['clientId', 'filePath'],
                          this.onClientOrPathChange_.bind(this));
};
var RecursiveListButtonController =
    grrUi.client.virtualFileSystem.recursiveListButtonDirective
    .RecursiveListButtonController;


/**
 * @const {number}
 */
RecursiveListButtonController.MAX_DEPTH = 5;


/**
 * Handles changes in clientId and filePath bindings.
 *
 * @private
 */
RecursiveListButtonController.prototype.onClientOrPathChange_ = function() {
  this.lastOperationId = null;
};


/**
 * Handles mouse clicks on itself.
 *
 * @export
 */
RecursiveListButtonController.prototype.onClick = function() {
  this.isDisabled = true;
  this.done = false;
  this.error = null;

  this.grrReflectionService_.getRDFValueDescriptor(
      'ApiCreateVfsRefreshOperationArgs', true).then(function(descriptors) {
    this.refreshOperation = angular.copy(
        descriptors['ApiCreateVfsRefreshOperationArgs']['default']);

    var filePath = angular.copy(descriptors['RDFString']['default']);
    filePath['value'] = getFolderFromPath(this.scope_['filePath']);
    this.refreshOperation['value']['file_path'] = filePath;

    var maxDepth = angular.copy(descriptors['RDFInteger']['default']);
    maxDepth['value'] = RecursiveListButtonController.MAX_DEPTH;
    this.refreshOperation['value']['max_depth'] = maxDepth;

    this.refreshOperation['value']['notify_user'] = true;

    this.modalInstance = this.modal_.open({
      templateUrl: '/static/angular-components/client/virtual-file-system/' +
          'recursive-list-button-modal.html',
      scope: this.scope_
    });
  }.bind(this));
};


/**
 * Sends current settings value to the server and reloads the page after as
 * soon as server acknowledges the request afer a small delay. The delay is
 * needed so that the user can see the success message.
 *
 * @export
 */
RecursiveListButtonController.prototype.createRefreshOperation = function() {
  var aff4Prefix = 'aff4:/';
  var clientId = this.scope_['clientId'];
  if (clientId.toLowerCase().indexOf(aff4Prefix) == 0) {
    clientId = clientId.substr(aff4Prefix.length);
  }

  var url = 'clients/' + clientId + '/vfs-refresh-operations';
  var refreshOperation = angular.copy(this.refreshOperation);

  // Setting this.lastOperationId means that the update button will get
  // disabled immediately.
  var operationId = this.lastOperationId = 'unknown';
  this.grrApiService_.post(url, refreshOperation, true)
      .then(
          function success(response) {
            this.done = true;
            // Make modal dialog go away in 1 second.
            this.timeout_(function() {
              this.modalInstance.close();
            }.bind(this), 1000);

            operationId = this.lastOperationId =
                response['data']['operation_id'];

            var pollPromise = this.grrApiService_.poll(url + '/' + operationId);
            this.scope_.$on('$destroy', function() {
              this.grrApiService_.cancelPoll(pollPromise);
            }.bind(this));

            return pollPromise;
          }.bind(this),
          function failure(response) {
            this.done = true;
            this.error = response['data']['message'] || 'Unknown error.';
          }.bind(this))
      .then(
          function success() {
            var path = refreshOperation['value']['file_path']['value'];
            this.rootScope_.$broadcast(
                REFRESH_FOLDER_EVENT, ensurePathIsFolder(path));
          }.bind(this))
      .finally(function() {
        if (this.lastOperationId == operationId) {
          this.lastOperationId = null;
        }
      }.bind(this));
};

/**
 * RecursiveListButtonDirective renders a button that shows a dialog that allows
 * users to change their personal settings.
 *
 * @return {!angular.Directive} Directive definition object.
 */
grrUi.client.virtualFileSystem.recursiveListButtonDirective
    .RecursiveListButtonDirective = function() {
  return {
    scope: {
      clientId: '=',
      filePath: '='
    },
    restrict: 'E',
    templateUrl: '/static/angular-components/client/virtual-file-system/' +
        'recursive-list-button.html',
    controller: RecursiveListButtonController,
    controllerAs: 'controller'
  };
};


/**
 * Name of the directive in Angular.
 *
 * @const
 * @export
 */
grrUi.client.virtualFileSystem.recursiveListButtonDirective.RecursiveListButtonDirective
    .directive_name = 'grrRecursiveListButton';

});  // goog.scope
