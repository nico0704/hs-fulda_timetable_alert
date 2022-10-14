// Author: Nico Schröder
// 13.10.2022

process.env.NODE_CONFIG_DIR = __dirname + "\\config";
const config = require("config");
var HTMLParser = require("node-html-parser");
var JSSoup = require("jssoup").default;
const superagent = require("superagent").agent();
const jsonfile = require("jsonfile");
const { EmbedBuilder, WebhookClient } = require("discord.js");
var moment = require("moment"); // require
const send_discord_message = new Boolean(config.get("webhook_url"));

// only for reading the testfile
const fs = require("fs");

// Init
const user = config.get("user");
const password = config.get("password");

// checking user input
if (!user || !password) {
    console.log("Password and/or username could not be extracted");
    console.log(
        "Please check if password and username (fd-Nr.) are set correctly in /config/default.json"
    );
    return;
}

const tt = async () => {
    console.log("logging in...");
    try {
        var login = await superagent
            .post(
                "https://horstl.hs-fulda.de/qisserver/rds?state=user&type=1&category=auth.login"
            )
            .send({ asdf: user, fdsa: password })
            .set("Content-Type", "application/x-www-form-urlencoded");
    } catch (error) {
        console.error(error);
        return;
    }
    try {
        var timetable1 = await superagent.get(
            "https://horstl.hs-fulda.de/qisserver/pages/plan/individualTimetable.xhtml?_flowId=individualTimetableSchedule-flow&_flowExecutionKey=e3s1"
        );
    } catch (error) {
        console.error(error);
        return;
    }
    let timetable1_parsed = HTMLParser.parse(timetable1.text);
    let data = timetable1_parsed.querySelectorAll(".bank_holiday");
    var now = moment();
    var i = now.weekday() * 2 - 2;
    console.log(data[i].attrs.title);
    var i = now.weekday() * 2 - 2;
    let classes = data[i].querySelectorAll(".singleblock");
    if (classes.length < 1) {
        console.log("No classes found...\nreturn...");
        return;
    }
    i = 0;
    while (classes[i]) {
        // build object
        let class_obj = {
            title: "",
            start: "",
            end: "",
            room_nr: "",
        };
        class_obj.title = classes[i].attrs.title;
        // get times, remove linebreaks & whitespaces and split into start and end times (class_times[0] -> start ... class_times[1] -> end)
        let class_times = classes[i]
            .querySelector(".scheduleTimes")
            .text.replaceAll(/(\r\n|\n|\r)/gm, "")
            .replaceAll(" ", "")
            .split("bis");
        class_obj.start = class_times[0];
        class_obj.end = class_times[1];
        if (classes[i].querySelector("a")) {
            let room_nr = classes[i]
                .querySelector("a")
                .text.replaceAll(/(\r\n|\n|\r)/gm, "") // remove linebreaks
                .replace(/ +(?= )/g, "") // replace multiple spaces with one space
                .trim();
            class_obj.room_nr = room_nr;
        }
        console.log(class_obj);
        let times = class_obj.start.split(":");
        let start_time = moment([2022, 09, 27])
            .set("hours", times[0])
            .set("minutes", times[1]);
        var diff = now.diff(start_time, "minutes");
        console.log(diff);
        if (diff < 0 && diff > -10) {
            var webhookClient = new WebhookClient({
                url: config.get("webhook_url"),
            });
            let message =
                class_obj.title +
                " " +
                class_obj.start +
                " bis " +
                class_obj.end +
                "\n";
            if (class_obj.room_nr) {
                message += class_obj.room_nr;
            }
            message += "\nin " + Math.abs(diff) + " Minuten!";
            // send the actual message
            try {
                webhookClient.send({
                    content: message,
                    username: "hs-fulda_timetable_alert",
                });
            } catch (error) {
                console.error(error);
                return;
            }
        }
        i++;
    }
};

tt();

/*
fs.readFile(
    "C:/Users/schro/Documents/Coding/hs-fulda_timetable_alert/test2.html",
    "utf8",
    (err, test_html) => {
        if (err) {
            console.error(err);
            return;
        }
        let timetable1_parsed = HTMLParser.parse(test_html);
        let data = timetable1_parsed.querySelectorAll(".bank_holiday");
        var now = moment([2022,09,27]).set("hour", 11).set("minute", 35);
        console.log(now.format());
        var i = now.weekday() * 2 - 2;
        //console.log(data[i].attrs.title);
        let classes = data[i].querySelectorAll(".singleblock");
        if (classes.length < 1) {
            console.log("No classes found...\nreturn...");
            return;
        }
        var classes_today;
        i = 0;
        while (classes[i]) {
            // build object
            let class_obj = {
                title: "",
                start: "",
                end: "",
                room_nr: "",
            };
            class_obj.title = classes[i].attrs.title;
            // get times, remove linebreaks & whitespaces and split into start and end times (class_times[0] -> start ... class_times[1] -> end)
            let class_times = classes[i]
                .querySelector(".scheduleTimes")
                .text.replaceAll(/(\r\n|\n|\r)/gm, "")
                .replaceAll(" ", "")
                .split("bis");
            class_obj.start = class_times[0];
            class_obj.end = class_times[1];
            if (classes[i].querySelector("a")) {
                let room_nr = classes[i]
                    .querySelector("a")
                    .text.replaceAll(/(\r\n|\n|\r)/gm, "") // remove linebreaks
                    .replace(/ +(?= )/g, "") // replace multiple spaces with one space
                    .trim();
                class_obj.room_nr = room_nr;
            }
            console.log(class_obj);
            let times = class_obj.start.split(":");
            let start_time = moment([2022,09,27]).set("hours", times[0]).set("minutes", times[1]);
            var diff = now.diff(start_time, "minutes");
            console.log(diff);
            if (diff < 0 && diff > -10) {
                var webhookClient = new WebhookClient({
                    url: config.get("webhook_url"),
                });
                let message = class_obj.title + " " + class_obj.start + " bis " + class_obj.end + "\n";
                if (class_obj.room_nr) {
                    message += class_obj.room_nr;
                }
                message += "\nin " + Math.abs(diff) + " Minuten!";
                // send the actual message
                try {
                    webhookClient.send({
                        content: message,
                        username: "hs-fulda_timetable_alert",
                    });
                } catch (error) {
                    console.error(error);
                    return;
                }
            }
            i++;
        }
    }
);
*/
