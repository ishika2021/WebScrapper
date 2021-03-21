let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let path = require("path");
let url = "https://github.com/topics";
let PDFDocument = require('pdfkit');
let dirpath = __dirname;
request(url, cb);
function cb(error, response, html) {
    if (error) {
        console.log(error);
    } else {
        extractData(html);
    }
}

function extractData(html) {
    let stool = cheerio.load(html);
    let topicnameele = stool(".topic-box.position-relative a");
    for (let i = 0; i < topicnameele.length; i++) {
        //let name=stool(topicnameele[i]).find(".f3");
        let link = "https://github.com" + stool(topicnameele[i]).attr("href");
        //let link=stool(linkanchor).attr("href");
        //console.log(stool(name).text().trim());
        //console.log(link);
        processRepoPage(link);
    }
}
function processRepoPage(url) {
    request(url, cb);
    function cb(err, resp, data) {
        if (err) {
            console.log(err);
        } else {
            extractRepoPageData(data);
        }
    }
}
function makeTopicFolder(name) {
    if (fs.existsSync(name) == false) {
        let fullPath = path.join(dirpath, name)
        fs.mkdirSync(fullPath);
        return fullPath;
    }
}
function makeJsonFile(repoName, topicName) {
    let pathoffile = path.join(dirpath, topicName, repoName + ".json");
    if (fs.existsSync(pathoffile) == false) {
        let createStream = fs.createWriteStream(pathoffile);
        createStream.end();
    }
}

function extractRepoPageData(html) {
    let stool = cheerio.load(html);
    let repoName = stool(".h1-mktg");
    let topicname = stool(repoName).text().trim()
    //console.log(name);
    makeTopicFolder(topicname);
    // console.log();
    let arr = stool("a.text-bold");
    for (let a = 0; a < 8; a++) {
        let link = "https://github.com" + stool(arr[a]).attr("href");
        let linkArr = link.split("/")
        let reponame = linkArr.pop();
        // makeJsonFile(reponame, topicname);
        //console.log(linkname);
        let fullRepoLink = link + "/issues";
        getIssues(reponame, topicname, fullRepoLink);
    }

}
function getIssues(reponame, topicname, link) {
    request(link, cb);
    function cb(err, resp, data) {
        if (err) {
            if (resp.statusCode == 404) {
                console.log("No issues page found");
            } else {
                console.log(err);
            }
        } else {
            //console.log(link);
            extractIssues(data, reponame, topicname);
        }
    }
}
function extractIssues(html, reponame, topicname) {
    let stool = cheerio.load(html);
    let IssuesAnchor = stool(".Link--primary.v-align-middle.no-underline");
    //console.log(IssuesAnchor.length);
    let arr = [];
    for (let i = 0; i < IssuesAnchor.length; i++) {
        let name = stool(IssuesAnchor[i]).text();
        let link = stool(IssuesAnchor[i]).attr("href");
        //console.log(name +" "+link);
        arr.push({
            "name": name,
            "link": "https://github.com" + link
        })
    }
    let filePath = path.join(dirpath, topicname, reponame + ".pdf");
    let pdfDoc = new PDFDocument;
    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.text(JSON.stringify(arr));
    pdfDoc.end();
    //fs.writeFileSync(filePath,JSON.stringify(arr));
    // console.table(arr);

}