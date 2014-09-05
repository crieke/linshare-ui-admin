'use strict';

// Holds the list of modules which the injector will load before the current module is loaded
angular.module('linshareAdminApp', [
    'ui.bootstrap',
    'ui.router',
    'ngLocale',
    'ngSanitize',
    'ngResource',
    'ngRoute',
    'ngCookies',
    'ui.select',
    'ngTable',
    'http-auth-interceptor',
    'chieffancypants.loadingBar',
    'pascalprecht.translate',
    'tmh.dynamicLocale',
    'restangular',
    'checklist-model'
])

// Register work which needs to be performed on module loading
.config(['$provide', '$logProvider', '$translateProvider', 'RestangularProvider', 'uiSelectConfig', 'cfpLoadingBarProvider', 'tmhDynamicLocaleProvider', 'lsAppConfig',
  function($provide, $logProvider, $translateProvider, RestangularProvider, uiSelectConfig, cfpLoadingBarProvider, tmhDynamicLocaleProvider, lsAppConfig) {
    var debug = document.cookie.linshareDebug || lsAppConfig.debug;
    $logProvider.debugEnabled(debug);

    $translateProvider.useStaticFilesLoader({
      prefix: 'i18n/locale-',
      suffix: '.json'
    });
    $translateProvider.preferredLanguage('en');
    $translateProvider.addInterpolation('$translateMessageFormatInterpolation');
    $translateProvider.useMissingTranslationHandlerLog();
    $translateProvider.useCookieStorage();

    tmhDynamicLocaleProvider.localeLocationPattern('i18n/angular/angular-locale_{{locale}}.js');

    RestangularProvider.setBaseUrl(lsAppConfig.backendURL);
    RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});
    RestangularProvider.addResponseInterceptor(function(data) {
      var newResponse = data;
      if (angular.isArray(data)) {
        angular.forEach(newResponse, function(value, key) {
          newResponse[key].originalElement = angular.copy(value);
        });
      } else {
        newResponse.originalElement = angular.copy(data);
      }

      return newResponse;
    });
    RestangularProvider.addFullRequestInterceptor(function (element, operation, route, url, headers) {
      // Bypass basic authentication
      headers['WWW-No-Authenticate'] = 'linshare';
      if (element) {
        delete element.originalElement;
      }
      return element;
    });

    uiSelectConfig.theme = 'bootstrap';
    cfpLoadingBarProvider.includeSpinner = false;

    // Force reloading controller (https://github.com/angular-ui/ui-router/issues/582)
    $provide.decorator('$state', function($delegate) {
      $delegate.reinit = function() {
        this.go('.', {}, {reload: true});
      };
      return $delegate;
    });
}])

// Register work which should be performed when the injector is done loading all modules 
.run(['$rootScope', '$log', 'Restangular', 'Notification', 'lsAppConfig',
  function($rootScope, $log, Restangular, Notification, lsAppConfig) {
    Restangular.setErrorInterceptor(function(response) {
      $log.error(response);
      if (response.status !== 401) {
        Notification.addError(response.data);
      }
      return true;
    });
    if (lsAppConfig.debug) {
      $rootScope.$on('$stateChangeStart',function(event, toState, toParams){
        console.log('$stateChangeStart to '+toState.to+'- fired when the transition begins. toState,toParams : \n',toState, toParams);
      });
      $rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams){
        console.log('$stateChangeError - fired when an error occurs during transition.');
        console.log([event, toState, toParams, fromState, fromParams].join('\n'));
      });
      $rootScope.$on('$stateChangeSuccess',function(event, toState){
        console.log('$stateChangeSuccess to '+toState.name+'- fired once the state transition is complete.');
      });
      // $rootScope.$on('$viewContentLoading',function(event, viewConfig){
      //   // runs on individual scopes, so putting it in "run" doesn't work.
      //   console.log('$viewContentLoading - view begins loading - dom not rendered',viewConfig);
      // });
      $rootScope.$on('$viewContentLoaded',function(event){
        console.log('$viewContentLoaded - fired after dom rendered',event);
      });
      $rootScope.$on('$stateNotFound',function(event, unfoundState, fromState, fromParams){
        console.log('$stateNotFound '+unfoundState.to+'  - fired when a state cannot be found by its name.');
        console.log(unfoundState, fromState, fromParams);
      });
    }
  }
]);
