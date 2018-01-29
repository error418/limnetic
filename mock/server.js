var express = require('express')
var app = express()


var unirest = require("unirest")

var yaml = require("yamljs")
var config = yaml.load('config.yml')

var serviceApi = require('./service-api')(config)


app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

app.use('/css/', express.static('node_modules/font-awesome/css'));
app.use('/js/', express.static('node_modules/bootstrap/dist/js'));

app.use('/lib/', express.static('node_modules/angular-ui-bootstrap/dist'));

app.use('/js/', express.static('node_modules/jquery/dist'));
app.use('/js/', express.static('node_modules/angular'));
app.use('/js/', express.static('node_modules/angular-animate'));
app.use('/js/', express.static('node_modules/angular-resource'));
app.use('/js/', express.static('node_modules/angular-route'));

app.use('/fonts/', express.static('node_modules/font-awesome/fonts'));

app.use('/', express.static('dist'));



app.get('/api/auth', function (req, res) {
    var result = {
        success: true,
        login: "john"
    };

    res.send(result)
});


function ensureAuthenticated(req, res, next) {
    return next();
}

app.get('/api/orgs', ensureAuthenticated, serviceApi.listOrganizations);
app.get('/api/template', ensureAuthenticated, serviceApi.listTemplates);
app.post('/api/repo', ensureAuthenticated, serviceApi.createRepositoryByTemplate);

console.log("Listening on http://localhost:" + config.endpoint.port);
app.listen(config.endpoint.port)