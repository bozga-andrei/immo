'use strict';

angular.module('myApp.investment', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/investment', {
            templateUrl: 'investment/investment.html',
            controller: 'InvestCtrl',
            controllerAs: 'InvestCtrl'
        });
    }])

    .controller('InvestCtrl', ['$scope','$log',
        function($scope, $log) {
            var ctrl = this;

            $scope.immo = {};
            $scope.fin = {};
            $scope.immo.total = 0;
            $scope.fin.loanAmount = 0;
            $scope.immo.taxAllowanceSum = 0;

            //Defaults values
            $scope.immo.variousFees = 1100;
            $scope.fin.interestRateYear = 1.85;
            $scope.fin.termLoanYears = 20;
            $scope.fin.assuranceLoan = 0.36;
            $scope.fin.personalContribution = 20000;

            // Watch when immo price is changing
            $scope.$watchCollection('immo',
                function (newVal, oldVal) {
                    $log.debug("Watch: newValues is: [" + newVal.price + "]");

                    if (newVal.price >= $scope.immo.taxAllowanceSum) {
                        $log.debug("The new value is bigger than taxAllowanceSum["+$scope.immo.taxAllowanceSum+"]");
                        $scope.immo.registrationTax = (newVal.price - $scope.immo.taxAllowanceSum)* 0.125;
                    } else {
                        $scope.immo.registrationTax = 0;
                    }

                    var honorHTVA = getNotaryHonorary(newVal.price);
                    $scope.immo.honorTTC = parseInt(honorHTVA * 1.21);

                    $scope.immo.total = $scope.immo.price + $scope.immo.registrationTax + $scope.immo.honorTTC + $scope.immo.variousFees;
                    $scope.fin.loanAmount = $scope.immo.total;
                    $log.debug("Immo.total is set to : ["+$scope.immo.total+"]");
                    $log.debug("Immo.loanAmount is set to : ["+$scope.fin.loanAmount+"]");

                },
                true
            );


            // Watch when personalContribution is changing
            $scope.$watchCollection('fin',
                function (newVal, oldVal) {
                    $log.debug("Watch personalContribution");
                    if($scope.immo.total > 0 && $scope.immo.total > $scope.fin.personalContribution){
                        $scope.fin.loanAmount = ($scope.immo.total - $scope.fin.personalContribution);
                    }
                    var interest_rate = $scope.fin.interestRateYear;
                    var months = $scope.fin.termLoanYears * 12;
                    var interest = ($scope.fin.loanAmount * (interest_rate * .01)) / months;
                    $scope.fin.monthlyPayments = parseInt((($scope.fin.loanAmount / months) + interest).toFixed(2));
                },
                true
            );

            ctrl.calculate = function () {
                

            };



            function getNotaryHonorary(immoPrice) {

                var honorary;
                honorary = Math.min(immoPrice,  7500.00)            * 4.56 / 100;

                if (immoPrice > 7500.00)    {honorary=honorary+(Math.min(immoPrice, 17500.00)- 7500.00)  * 2.85 / 100;}
                if (immoPrice > 17500.00)   {honorary=honorary+(Math.min(immoPrice, 30000.00)-17500.00)  * 2.28 / 100;}
                if (immoPrice > 30000.00)   {honorary=honorary+(Math.min(immoPrice, 45495.00)-30000.00)  * 1.71 / 100;}
                if (immoPrice > 45495.00)   {honorary=honorary+(Math.min(immoPrice, 64095.00)-45495.00)  * 1.14 / 100;}
                if (immoPrice > 64095.00)   {honorary=honorary+(Math.min(immoPrice,250095.00)-64095.00)  * 0.57 / 100;}
                if (immoPrice > 250095.00)  {honorary=honorary+(immoPrice-250095.00)                    * 0.057 / 100;}

                honorary=Math.max(honorary,8.48);

                return parseInt((honorary+0.005)*100)/100;
            }

    }]);