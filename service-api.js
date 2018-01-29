var Sequence = require('sequence').Sequence;
var unirest = require("unirest");


module.exports = function (config) {
    var githubApp = require("./github-app")(config);

    var createApiToken = function(installationId, done) {
        unirest.post(config.github.base + "/installations/" + installationId + "/access_tokens")
            .headers({
                'User-Agent': 'thelemic',
                'Accept': 'application/vnd.github.machine-man-preview+json',
                'Authorization': 'Bearer ' + githubApp.createJWT()
            })
            .end(function (res) {
                if(res.ok) {
                    done(res.body.token); // error handling
                } else {
                    console.log("error retrieving api token")
                }
            }
        );
    }

    var createHeaders = function(apiToken) {
        return {
            'User-Agent': 'thelemic',
            'Accept': 'application/vnd.github.machine-man-preview+json',
            'Authorization': 'token ' + apiToken
        };
    }
    
    function createRepositoryByTemplate(req, res) {
        var err = false;
        
        var orgName = req.body.orgName;
        var repoName = req.body.repoName;
        var repoTemplateName = req.body.repoTemplate;
        var branchTemplateName = req.body.branchTemplate;    
        
        var repoTemplate = config.template.repo[repoTemplateName]
        var branchTemplate = config.template.branch[branchTemplateName]
        
        repoTemplate.config.name = repoName
        
        if (!repoName.match(new RegExp(repoTemplate.pattern))) {
            res.status(400)
            res.send("repository name does not match template pattern")
            return;
        }

        if (!req.user.installations[orgName]) {
            res.status(400)
            res.send("repository is not accessible")
            return;
        }

        var installationId = req.user.installations[orgName];
        
        createApiToken(installationId, function(apiToken) {
            var sequence = Sequence.create();
            sequence
                .then(function (next) {
                    createRepository(apiToken, orgName, repoTemplate.config, function (response) {
                        if(response.ok) {
                            next();
                        } else {
                            res.status(400)
                            res.send("failed to create repository")
                        }
                    })
                })
                .then(function (next) {
                    if (!branchTemplate.config || !branchTemplate.branch) {
                        next();
                    } else {
                        configureBranch(apiToken, orgName, repoName, branchTemplate.branch, branchTemplate.config, function (response) {
                            if(response.ok) {
                                next();
                            } else {
                                res.status(400)
                                res.send("failed to create repository")
                            }
                        })
                    }
                })
                .then(function(next) {
                    addIssueLabels(apiToken, orgName, repoName, repoTemplate.label, function () {
                        next(); // TODO: error handling
                    })
                })
                .then(function () {
                    res.status(200);
                    res.send();
                });
            }
        );
    }

    function listOrganizations(req, res) {
        res.send(req.user.orgs)
    }

    function listTemplates(req, res) {
        res.send(config.template)
    }
    

    function createRepository(apiToken, orgName, repositoryConfig, end) {
        unirest.post(config.github.base + "/orgs/"+orgName+"/repos")
            .headers(createHeaders(apiToken))
            .type('json')
            .send(repositoryConfig)
            .end(end);
    }


    function configureBranch(apiToken, orgName, repoName, branchName, templateConfig, end) {
        unirest.put(config.github.base + "/repos/"+orgName+"/"+repoName+"/branches/"+branchName+"/protection")
            .headers(createHeaders(apiToken))
            .type('json')
            .send(templateConfig)
            .end(end);
    }

    function addIssueLabels(apiToken, orgName, repoName, labels, end) {

        if(!labels) {
            console.log("no extra labels specified.")
            end();
            return;
        }

        var sequence = Sequence.create();
        
        for(var i = 0; i < labels.length; i++) {
            sequence.then(function(next) {
                unirest.post(config.github.base + "/repos/"+orgName+"/"+repoName+"/labels")
                    .headers(createHeaders(apiToken))
                    .type('json')
                    .send(labels[i])
                    .end(next())
            });
        }
        
        sequence.then(function() {
            end();
        })
    }

    return {
        createRepositoryByTemplate: createRepositoryByTemplate,
        listOrganizations: listOrganizations,
        listTemplates: listTemplates
    };
};