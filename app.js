const POP3Client = require("poplib");
const http = require("http");

const host = "pop-173712.m12.wedos.net";
const port = 995;
const username = "fake@damto.cz";
const password = "51s9;,eNt6mAK,[D9";

function zpracujMaily() {
    let client = new POP3Client(port, host, {

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
        client.login(username, password);

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
            let i = data.indexOf("http://localhost:8080/");
            if (i) {
                let url = data.substr(i);
                i = url.indexOf(">");
                url = url.substr(0,i);
                console.log("###"+url);

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
            }
            //client.dele(msgnumber);
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

    });

}

zpracujMaily();