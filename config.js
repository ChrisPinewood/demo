var config = {};
config.folder = {};
config.git = {};
config.file = {};
config.user = {};

//config.folder.watch = '/home/researcher/Dropbox/ResearchWell/';
config.folder.watch = '/home/researcher/Dropbox/DemoDev/';
config.folder.working = '/home/researcher/Working/';
config.folder.repo = '/home/researcher/Repo/';
config.folder.scripts = '/home/researcher/Code/scripts/';
config.folder.client = '/home/researcher/Code/watcher/static/data/';

config.git.protocol = 'https://';
config.git.url = 'github.com/researcher-rwell/research';
config.git.ext = '.git';
config.git.cred = 'researcher-rwell:r3s3arch@';
config.git.remote = config.git.protocol + config.git.url + config.git.ext;
config.git.remoteFull = config.git.protocol + config.git.cred + config.git.url + config.git.ext;
config.git.historyUrl = config.git.protocol + config.git.url + '/blob/master/';

config.file.markdown = '.md';
config.file.docx = '.docx';
config.file.status = '.status';
config.file.suggested = '.suggested';
config.file.documentStatus = config.folder.client + 'funds.json';

config.user.name = 'Researcher RWell';
config.user.email = 'reseacher.rwell@gmail.com';
config.user.git = 'researcher.rwell';

module.exports = config;

