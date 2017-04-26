/**
 * Created by Simon Hohl on 24.04.17.
 */

'use strict';

angular.module('chronontology.components')
    .component('login',{
        templateUrl: '../../partials/login-form.html',
        bindings: {
            modalInstance: "<",
            resolve: "<"
        },
        controller: function($timeout, authService) {
            var _this = this;

            _this.loginData = {};
            _this.loginerror = false;

            _this.login = function () {
                console.log("login clicked");
                authService.setCredentials(_this.loginData.user, _this.loginData.password, function (response) {
                    _this.loginerror = false;
                    var closeModal = function () {
                        _this.modalInstance.close(authService.getUser());
                    };
                    $timeout(closeModal, 500);
                }, function (response) {
                    _this.loginerror = true;
                });

            };

            _this.cancel = function () {
                console.log("cancel clicked");
                _this.modalInstance.dismiss();
            };
        }
    });