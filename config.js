var config = {};
config.folder = {};
config.git = {};
config.file = {};
config.user = {};
config.placeholder = {};

config.folder.watch = '/home/researcher/Dropbox/ResearchWell/';
//config.folder.watch = '/home/researcher/Dropbox/DemoDev/';
config.folder.working = '/home/researcher/Working/';
config.folder.repo = '/home/researcher/Repo/';
config.folder.scripts = '/home/researcher/Code/scripts/';
config.folder.client = '/home/researcher/Code/watcher/static/data/';
config.folder.resources = '/home/researcher/Code/watcher/resources/';

config.git.protocol = 'https://';
config.git.url = 'github.com/researcher-rwell/research';
config.git.ext = '.git';
config.git.cred = 'researcher-rwell:r3s3arch@';
config.git.remote = config.git.protocol + config.git.url + config.git.ext;
config.git.remoteFull = config.git.protocol + config.git.cred + config.git.url + config.git.ext;
config.git.historyUrl = config.git.protocol + config.git.url + '/blob/master/';
config.git.blobUrl = config.git.protocol + config.git.url + '/blob/';

config.file.markdown = '.md';
config.file.docx = '.docx';
config.file.dmp = '.dmp';
config.file.detail = '.detail';
config.file.status = '.status';
config.file.suggested = '.suggested';
config.file.documentStatus = config.folder.client + 'funds.json';
config.file.detailsTemplate = config.folder.resources + 'meta_template.md';
config.file.dmpTemplate = config.folder.resources + 'dmp_template.md';

config.user.name = 'Researcher RWell';
config.user.email = 'reseacher.rwell@gmail.com';
config.user.git = 'researcher.rwell';

config.placeholder.reportname = '<reportname>';

config.locations = {
	dropbox : {
		folder : config.folder.watch,
		files : {
			manuscript : config.folder.watch + config.placeholder.reportname + config.file.docx,
			dmp : config.folder.watch + config.placeholder.reportname + config.file.dmp + config.file.docx,
			detail : config.folder.watch + config.placeholder.reportname + config.file.detail + config.file.docx,
			status : config.folder.watch + config.placeholder.reportname + config.file.status + config.file.docx,
			suggested : config.folder.watch + config.placeholder.reportname + config.file.suggested + config.file.docx
		}
	},
	working : {
		folder : config.folder.working,
		files : {
			status : config.folder.working + config.placeholder.reportname + config.file.status + config.file.markdown,
			suggested : config.folder.working + config.placeholder.reportname + config.file.suggested + config.file.markdown
		}
	},
	repo : {
		folder : config.folder.repo,
		files : {
			manuscript : config.folder.repo + config.placeholder.reportname + config.file.markdown,
			dmp : config.folder.repo + config.placeholder.reportname + config.file.dmp + config.file.markdown,
			detail : config.folder.repo + config.placeholder.reportname + config.file.detail + config.file.markdown
		}
	}
};

module.exports = config;

