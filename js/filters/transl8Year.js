'use strict';

// language-specific notation of dates (so far only years):
// year 1 to the present: 1950 becomes 1950 CE
// year -9999 to year -1: -776 becomes 776 BCE
// before year -10000: -12.000 becomes 12.000 BCE or 12,000 BCE etc. 
//
// CE / BCE is acceptable both in English and German
// CE is acceptable even for recent dates
// a year 0 in the data is always wrong; however, the system 
//    would simply display it as 0 CE
// we make no case distinction for dates bigger than 10.000, 
//    i.e. at least than 8000 years into the future


angular.module('chronontology.filters')

	.filter('transl8Year', ['language',function(language){

        var filterFunction = function(nu) {

            if (typeof nu == 'undefined') return undefined;

			if (typeof nu === 'string' && isNaN(nu)) return nu;

			var num = (typeof nu === 'string' && !isNaN(nu)) ? +nu : nu;

			if (num >= 0) {
				return num.toString()+" CE";
			}
			
			num = Math.abs(num);

			if (num < 10000) {
				return num.toString()+" BCE";
			}
			if (language.currentLanguage()==COMPONENTS_GERMAN_LANG) {
                return num.toLocaleString(COMPONENTS_GERMAN_LANG+"-DE")+" BCE";
            } else {
                return num.toLocaleString(COMPONENTS_ENGLISH_LANG+"-US")+" BCE";
            }
        };
        filterFunction.$stateful=true;
        return filterFunction;
    }]);
