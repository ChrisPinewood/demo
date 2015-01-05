var types = require('./types');

var sections = [
	{
		name: 'Title and abstract',
		type: types.title1
	},
	{
		name: 'Introduction',
		type: types.heading1
	},
	{
		name: 'Background/rationale',
		type: types.heading2
	},
	{
		name: 'Objectives',
		type: types.heading2
	},
	{
		name: 'Methods',
		type: types.heading1,
	},
	{
		name: 'Study design',
		type: types.heading2
	},
	{
		name: 'Setting',
		type: types.heading2
	},
	{
		name: 'Participants',
		type: types.heading2
	},
	{
		name: 'Variables',
		type: types.heading2
	},
	{
		name: 'Data sources/measurement',
		type: types.heading2
	},
	{
		name: 'Bias',
		type: types.heading2
	},
	{
		name: 'Study size',
		type: types.heading2
	},
	{
		name: 'Quantitative variables',
		type: types.heading2
	},
	{
		name: 'Statistical methods',
		type: types.heading2
	},
	{
		name: 'Results',
		type: types.heading1,
	},
	{
		name: 'Participants',
		type: types.heading2
	},
	{
		name: 'Descriptive data',
		type: types.heading2
	},
	{
		name: 'Outcome data',
		type: types.heading2
	},
	{
		name: 'Main results',
		type: types.heading2
	},
	{
		name: 'Other analyses',
		type: types.heading2
	},
	{
		name: 'Discussion',
		type: types.heading1
	},
	{
		name: 'Key results',
		type: types.heading2
	},
	{
		name: 'Limitations',
		type: types.heading2
	},
	{
		name: 'Interpretation',
		type: types.heading2
	},
	{
		name: 'Generalisability',
		type: types.heading2
	},
	{
		name: 'Other information',
		type: types.heading1
	},
	{
		name: 'Funding',
		type: types.heading2
	}
];

module.exports = {
	name: 'STROBE',
	sections: sections,
	keyword: 'epidemiology'
}
