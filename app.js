const POP3Client = require("poplib"); // https://www.npmjs.com/package/poplib
const simpleParser = require('mailparser').simpleParser; //https://nodemailer.com/extras/mailparser/
const http = require("http");
const fs = require("fs");

const cfg = JSON.parse(fs.readFileSync("app-config.json"));

/**
 * Zpracuje a vymaze(!!!) vzdy jednu zpravu
 */
function zpracujMaily() {
    let client = new POP3Client(cfg.port, cfg.host, {

        tlserrs: false,
        enabletls: true,
        debug: true

    });

    client.on("error", function(err) {

        if (err.errno === 111) console.log("Unable to connect to server");
        else console.log("Server error occurred");

        console.log(err);

    });

    client.on("connect", function() {

        console.log("CONNECT success");
        client.login(cfg.user, cfg.pass);

    });

    client.on("invalid-state", function(cmd) {
        console.log("Invalid state. You tried calling " + cmd);
    });

    client.on("locked", function(cmd) {
        console.log("Current command has not finished yet. You tried calling " + cmd);
    });

    client.on("login", function(status, rawdata) {

        if (status) {

            console.log("LOGIN/PASS success");
            client.list();

        } else {

            console.log("LOGIN/PASS failed");
            client.quit();

        }
    });

// Data is a 1-based index of messages, if there are any messages
    client.on("list", function(status, msgcount, msgnumber, data, rawdata) {

        if (status === false) {

            console.log("LIST failed");
            client.quit();

        } else {

            console.log("LIST success with " + msgcount + " element(s)");

            if (msgcount > 0)
                client.retr(1);
            else
                client.quit();

        }
    });

    client.on("retr", function(status, msgnumber, data, rawdata) {

        if (status === true) {

            console.log("RETR success for msgnumber " + msgnumber);

            //const findStr = "http://localhost:8080/";
            const findStr = "http://univ2020031-4027.";

            let mailBody = data;
            simpleParser(data, {}, (err, parsed) => {
                console.log(parsed);
                let mailBody = parsed.html;
                let i = mailBody.indexOf(findStr);
                if (i && parsed.from.text.endsWith("@damto.cz") && parsed.subject.startsWith("Overeni")) {
                    let url = mailBody.substr(i);
                    i = url.indexOf("\"");
                    url = url.substr(0,i);
                    console.log("###"+url);

                    try {
                        http.get(url, (resp) => {
                            let data = '';

                            // A chunk of data has been recieved.
                            resp.on('data', (chunk) => {
                                data += chunk;
                            });

                            // The whole response has been received. Print out the result.
                            resp.on('end', () => {
                                console.log("###"+data);
                            });

                        }).on("error", (err) => {
                            console.log("Error: " + err.message);
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }
            })

/*
            let i = mailBody.indexOf(findStr);
            if (i) {
                let url = mailBody.substr(i);
                i = url.indexOf(">");
                url = url.substr(0,i).replace(/=\r\n/g,"");
                url = url.replace("?token=3D","?token=");
                if (url.endsWith("\"")) {
                    url = url.substr(0,url.length-1);
                }
                console.log("###"+url);

                try {
                    http.get(url, (resp) => {
                        let data = '';

                        // A chunk of data has been recieved.
                        resp.on('data', (chunk) => {
                            data += chunk;
                        });

                        // The whole response has been received. Print out the result.
                        resp.on('end', () => {
                            console.log("###"+data);
                        });

                    }).on("error", (err) => {
                        console.log("Error: " + err.message);
                    });
                } catch (e) {
                    console.error(e);
                }
            }
 */
            // client.dele(msgnumber); //vymazani zpravy
            client.quit();


        } else {

            console.log("RETR failed for msgnumber " + msgnumber);
            client.quit();

        }
    });

    client.on("dele", function(status, msgnumber, data, rawdata) {

        if (status === true) {

            console.log("DELE success for msgnumber " + msgnumber);
            client.quit();

        } else {

            console.log("DELE failed for msgnumber " + msgnumber);
            client.quit();

        }
    });

    client.on("quit", function(status, rawdata) {

        if (status === true) console.log("QUIT success");
        else console.log("QUIT failed");

        setTimeout(zpracujMaily, 10000); //opakona kontrola mailu

    });

}

zpracujMaily();