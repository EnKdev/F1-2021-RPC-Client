const RpcConfig = require("./config/RpcConfig.json");

const Client = require("discord-rich-presence")(`${RpcConfig.ClientId}`);
const {F1TelemetryClient} = require("f1-2021-udp");
const {app, BrowserWindow} = require("electron");

const Tracks = require("./config/TrackList.json");
const Session = require("./config/SessionType.json");
const LargeImage = require("./config/ImageKeys.json");
const Teams = require("./config/TeamType.json");

const f1Client = new F1TelemetryClient();

let date = Date.now();
let interval;

f1Client.start();

let teamId = 0;
let raceCompletion = 0.0;
let lapNumber = 0;

resetStatus = () => {
    Client.updatePresence({
        state: "In the paddocks",
        largeImageKey: "backcover",
        startTimestamp: date
    });
};

f1Client.on("participants", (pData) => {
    pData.m_participants.some(function (index) {
        if (index.m_aiControlled === 0) {
            teamId = index.m_teamId;
            return teamId;
        }
    });

    console.log(pData);
});

f1Client.on("lapData",  (lData) => {
    lapNumber = lData.m_lapData[19].m_currentLapNum;
    console.log(lData);
});

f1Client.on("session", (sData) => {
    if (interval) {
        clearInterval(interval);
    }

    raceCompletion = (100.0 / sData.m_totalLaps) * lapNumber;
    raceCompletion = raceCompletion.toFixed(2);

    Client.updatePresence({
        details: `${Session[sData.m_sessionType].Type} - ${
            Tracks[sData.m_trackId].Name
        } - [${raceCompletion}% done]`,
        state: `Driving for ${Teams[teamId].Team} - Lap ${lapNumber}/${sData.m_totalLaps}`,
        smallImageKey: "backcover",
        smallImageText: "F1 2021",
        largeImageKey: `${LargeImage[sData.m_trackId].imageKey}`,
        largeImageText: `Racing on ${Tracks[sData.m_trackId].Name}`
    });

    console.log(sData);

    interval = setInterval(() => {
        resetStatus();
    }, 5000);
});

Client.updatePresence({
    state: "In the paddocks",
    largeImageKey: "backcover",
    startTimestamp: date
});

// Electron
function createWindow() {
    const win = new BrowserWindow({
        width: 300,
        height: 150,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true,
        icon: "./assets/icon/win/icon.ico"
    });

    win.loadFile("index.html");
}

app.whenReady().then(createWindow);
