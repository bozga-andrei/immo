'use strict';

angular.module('myApp.investment', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/investment', {
            templateUrl: 'investment/investment.html',
            controller: 'InvestCtrl',
            controllerAs: 'InvestCtrl'
        });
    }])

    .controller('InvestCtrl', ['$scope', '$log',
        function ($scope, $log) {
            var ctrl = this;

            var TVA = 1.21;

            //Immo
            $scope.immo = {};
            $scope.fin = {};
            $scope.immo.total = 0;
            $scope.immo.renovationPrice = 0;
            $scope.immo.taxAllowanceSum = 0;
            $scope.immo.variousFees = 1100;


            //Funding
            $scope.fin.personalContribution = 20000;
            $scope.fin.loanAmount = 0;
            $scope.fin.taxLoanAmount = 0;
            $scope.fin.interestRateYear = 1.85;
            $scope.fin.loanDurationOnYears = 20;
            $scope.fin.insuranceLoan = 0.36;
            $scope.fin.loanRegistrationTax = 0;
            $scope.fin.loanVariousFees = 1100;
            $scope.fin.loanNotaryFees = 0;
            $scope.fin.monthlyPaymentsWithInsurance = 0;
            $scope.fin.totalLoanInterest = 0;
            $scope.fin.totalLoanInsurance = 0;
            $scope.fin.totalLoanIterest = 0;



                // Watch when immo price is changing
            $scope.$watchCollection('immo',
                function (newVal, oldVal) {
                    $log.debug("Immo.total is set to : [" + $scope.immo.total + "]");
                    if (newVal.price >= $scope.immo.taxAllowanceSum) {
                        $scope.immo.registrationTax = (newVal.price - $scope.immo.taxAllowanceSum) * 0.125;
                    } else {
                        $scope.immo.registrationTax = 0;
                    }

                    var honorHTVA = getImmoNotaryHonorary(newVal.price);
                    $scope.immo.honorTTC = parseInt(honorHTVA * TVA);

                    $scope.immo.total = getTotalImmoAmount();
                    $scope.fin.loanAmount = $scope.immo.total - $scope.fin.personalContribution;
                    $scope.fin.taxLoanAmount = getTaxLoanAmount();
                    $log.debug("Immo.total is set to : [" + $scope.immo.total + "]");
                    $log.debug("Immo.loanAmount is set to : [" + $scope.fin.loanAmount + "]");

                },
                true
            );


            // Watch when personalContribution is changing
            $scope.$watchCollection('fin',
                function (newVal, oldVal) {
                    if ($scope.immo.total > 0 && $scope.immo.total >= $scope.fin.personalContribution) {
                        $scope.fin.loanAmount = ($scope.immo.total - $scope.fin.personalContribution);
                    } else {
                        $scope.fin.loanAmount = 0;
                    }

                    //Get monthly payments amount
                    $scope.fin.monthlyPayments = getMonthlyRate($scope.fin.loanAmount, $scope.fin.interestRateYear, $scope.fin.loanDurationOnYears);
                    //calculate the insurance
                    $scope.fin.totalLoanInsurance = (($scope.fin.insuranceLoan/100) / 12 * $scope.fin.loanAmount);
                    //calculate insurance + payments monthly
                    $scope.fin.monthlyPaymentsWithInsurance = $scope.fin.monthlyPayments + $scope.fin.totalLoanInsurance;
                    //calculate total interests + insurance 
                    $scope.fin.totalLoanInterestAndInsurance = $scope.fin.totalLoanInsurance + $scope.fin.totalLoanInterest;
                },
                true
            );

            $scope.$watch(
                function () {
                    return $scope.invest.isActive;
                },
                function (newVal, oldVal) {
                    if(newVal == true){
                        $log.debug("Navigate to invest section");
                        //TODO navigate to invest section
                    }
                },
                true
            );
            

            
            ctrl.calculate = function () {


            };


            function getTotalImmoAmount() {

                var total = $scope.immo.price + $scope.immo.registrationTax + $scope.immo.honorTTC + $scope.immo.variousFees + $scope.immo.renovationPrice;

                return total;
            }

            function getTaxLoanAmount() {
                $log.debug("Calculate total tax for the loan amount");
                //Tax on loan amount is calculated on the loan amount + 10% accessories fees
                var loanAmountWithAccessoriesFess = $scope.fin.loanAmount * 1.10;
                var taxLoanAmount = getLoanRegistrationTax(loanAmountWithAccessoriesFess) + getNotaryFeesForLoanTVAC(loanAmountWithAccessoriesFess);

                $log.debug("Return: " + taxLoanAmount);
                return taxLoanAmount;
            }

            function getMonthlyRate(loanAmount, interestRateYear, loanDurationOnYears) {
                $log.debug("Calculate monthly rate: loanAmount[" + loanAmount + "] interestRateYear["+interestRateYear+"] loanDurationOnYears["+loanDurationOnYears+"]");
                /*
                 * m : mensualité
                 * K : loanAmount
                 * t : interestRateYear
                 * n : nbrOfMonths
                 *
                 * m = [(K*t)/12] / [1-(1+(t/12))^-n]
                 */

                var interest = interestRateYear / 100 / 12;
                var payments = loanDurationOnYears * 12;
                var x = Math.pow(1 + interest, payments);
                var monthly = (loanAmount*x*interest)/(x-1);

                $scope.fin.totalLoanInterest = ((monthly * payments) - loanAmount);


                $log.debug("Return: " + monthly);
                return monthly;

            }

            function getImmoNotaryHonorary(immoPrice) {

                var honorary;
                honorary = Math.min(immoPrice, 7500.00) * 4.56 / 100;

                if (immoPrice > 7500.00) {
                    honorary = honorary + (Math.min(immoPrice, 17500.00) - 7500.00) * 2.85 / 100;
                }
                if (immoPrice > 17500.00) {
                    honorary = honorary + (Math.min(immoPrice, 30000.00) - 17500.00) * 2.28 / 100;
                }
                if (immoPrice > 30000.00) {
                    honorary = honorary + (Math.min(immoPrice, 45495.00) - 30000.00) * 1.71 / 100;
                }
                if (immoPrice > 45495.00) {
                    honorary = honorary + (Math.min(immoPrice, 64095.00) - 45495.00) * 1.14 / 100;
                }
                if (immoPrice > 64095.00) {
                    honorary = honorary + (Math.min(immoPrice, 250095.00) - 64095.00) * 0.57 / 100;
                }
                if (immoPrice > 250095.00) {
                    honorary = honorary + (immoPrice - 250095.00) * 0.057 / 100;
                }

                honorary = Math.max(honorary, 8.48);

                return parseInt((honorary + 0.005) * 100) / 100;
            }

            function getLoanRegistrationTax(loanAmount) {

                var loanRegistrationTax = Math.min(loanAmount, 5000.00) * 2.865 / 100;

                if (loanAmount > 5000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 12000.00) - 5000.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 12000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 12249.00) - 12000.00 ) * 11.70 / 1000;
                }

                if (loanAmount > 12249.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 22500.00) - 12249.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 22500.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 22749.00) - 22500.00 ) * 84.58 / 1000;
                }

                if (loanAmount > 22749.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 45250.00) - 22749.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 45250.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 45494.00) - 45250.00 ) * 86.00 / 1000;
                }

                if (loanAmount > 45494.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 68000.00) - 45494.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 68000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 68499.00) - 68000.00 ) * 49.38 / 1000;
                }

                if (loanAmount > 68499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 90500.00) - 68499.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 90500.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 90999.00) - 90500.00 ) * 49.36 / 1000;
                }

                if (loanAmount > 90999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 113500.00) - 90999.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 113500.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 113999.00) - 113500.00 ) * 49.38 / 1000;
                }

                if (loanAmount > 113999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 136000.00) - 113999.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 136000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 136999.00) - 136000.00 ) * 31.82 / 1000;
                }

                if (loanAmount > 136999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 159000.00) - 136999.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 159000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 159999.00) - 159000.00 ) * 31.81 / 1000;
                }

                if (loanAmount > 159999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 181000.00) - 159999.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 181000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 181999.00) - 181000.00 ) * 31.82 / 1000;
                }

                if (loanAmount > 181999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 200000.00) - 181999.00 ) * 14.30 / 1000;
                }

                if (loanAmount > 200000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 205000.00) - 200000.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 205000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 205999.00) - 205000.00 ) * 30.52 / 1000;
                }

                if (loanAmount > 205999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 230000.00) - 205999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 230000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 230999.00) - 230000.00 ) * 30.52 / 1000;
                }

                if (loanAmount > 230999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 255000.00) - 230999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 255000.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 257499.00) - 255000.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 257499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 279999.00) - 257499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 279999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 282499.00) - 279999.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 282499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 304999.00) - 282499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 304999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 307499.00) - 304999.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 307499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 329999.00) - 307499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 329999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 332499.00) - 329999.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 332499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 354999.00) - 332499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 354999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 357499.00) - 354999.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 357499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 379999.00) - 357499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 379999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 382499.00) - 379999.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 382499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 404999.00) - 382499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 404999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 407499.00) - 404999.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 407499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 429999.00) - 407499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 429999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 432499.00) - 429999.00 ) * 20.00 / 1000;
                }

                if (loanAmount > 432499.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 449999.00) - 432499.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 449999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 459999.00) - 449999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 459999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 479999.00) - 459999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 479999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 489999.00) - 479999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 489999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 499999.00) - 489999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 499999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 509999.00) - 499999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 509999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 529999.00) - 509999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 529999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 539999.00) - 529999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 539999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 549999.00) - 539999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 549999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 559999.00) - 549999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 559999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 579999.00) - 559999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 579999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 589999.00) - 579999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 589999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 599999.00) - 589999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 599999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 609999.00) - 599999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 609999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 629999.00) - 609999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 629999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 639999.00) - 629999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 639999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 649999.00) - 639999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 649999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 659999.00) - 649999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 659999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 679999.00) - 659999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 679999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 689999.00) - 679999.00 ) * 14.75 / 1000;
                }

                if (loanAmount > 689999.00) {
                    loanRegistrationTax = loanRegistrationTax + (Math.min(loanAmount, 700000.00) - 689999.00 ) * 13.00 / 1000;
                }

                if (loanAmount > 700000.00) {
                    loanRegistrationTax = loanRegistrationTax + (loanAmount - 700000.00 ) * 13.70 / 1000;
                }

                $scope.fin.loanRegistrationTax = loanRegistrationTax;
                return loanRegistrationTax;

            }

            function getNotaryFeesForLoanTVAC(loan) {

                $log.debug("Get Notary fees TVAC for " + loan);
                var notaryFees = Math.min(loan, 7500.00) * 1.425 / 100;

                if (loan > 7500.00) {
                    notaryFees = notaryFees + (Math.min(loan, 17500.00) - 7500.00 ) * 1.14 / 100;
                }

                if (loan > 17500.00) {
                    notaryFees = notaryFees + (Math.min(loan, 30000.00) - 17500.00 ) * 0.684 / 100;
                }

                if (loan > 30000.00) {
                    notaryFees = notaryFees + (Math.min(loan, 45495.00) - 30000.00 ) * 0.57 / 100;
                }

                if (loan > 45495.00) {
                    notaryFees = notaryFees + (Math.min(loan, 64095.00) - 45495.00 ) * 0.456 / 100;
                }

                if (loan > 64095.00) {
                    notaryFees = notaryFees + (Math.min(loan, 250095.00) - 64095.00 ) * 0.228 / 100;
                }

                if (loan > 250095.00) {
                    notaryFees = notaryFees + (loan - 250095.00 ) * 0.0456 / 100;
                }

                notaryFees = notaryFees * TVA;
                $scope.fin.loanNotaryFees = notaryFees;

                $log.debug("Return  " + notaryFees);

                return parseInt(notaryFees);
            }

        }]);