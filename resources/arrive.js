var types = require('./types');

var sections = [
	{
		name: 'Title and abstract',
		type: types.title2
	},
	{
		name: 'Abstract',
		type: types.heading1
	},
	{
		name: 'Background',
		type: types.heading1
	},
	{
		name: 'Objectives',
		type: types.heading1
	},
	{
		name: 'Ethical statement',
		type: types.heading1
	},
	{
		name: 'Study design',
		type: types.heading1
	},
	{
		name: 'Experimental procedures',
		type: types.heading1
	},
	{
		name: 'Experimental animals',
		type: types.heading1
	},
	{
		name: 'Housing and husbandry',
		type: types.heading1
	},
	{
		name: 'Sample size',
		type: types.heading1,
		requires: 'power calculation'
	},
	{
		name: 'Allocating animals to experimental groups',
		type: types.heading1
	},
	{
		name: 'Experimental outcomes',
		type: types.heading1
	},
	{
		name: 'Statistical methods',
		type: types.heading1
	},
	{
		name: 'Baseline data',
		type: types.heading1
	},
	{
		name: 'Numbers analysed',
		type: types.heading1
	},
	{
		name: 'Outcomes estimation',
		type: types.heading1
	},
	{
		name: 'Adverse events',
		type: types.heading1
	},
	{
		name: 'Interpretation/scientific implications',
		type: types.heading1
	},
	{
		name: 'Generalisability/translation',
		type: types.heading1
	},
	{
		name: 'Funding',
		type: types.heading1
	}
];

module.exports = {
	name: 'ARRIVE',
	sections: sections,
	keyword: 'mice'
}
