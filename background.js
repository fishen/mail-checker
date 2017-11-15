//region {variables and functions}
var alarmName = "MailCheckerAlarm";
var alarmInfo = {
    when: Date.now() + 6000,
    periodInMinutes: 0.1 //Repeatedly fire after every 1 minute
};
//compute total unseen count and update badage
function setBadgeText(mails) {
    mails = mails || [];
    var count = mails.reduce((pre, cur) => pre + (cur.unseen || 0), 0);
    chrome.browserAction.setBadgeText({ "text": `${count}` });
}
//send message to popup page for updating unseen count or error state
function sendMessage(mail, data, error) {
    var obj = { user: mail.user, unseen: data.unseen, error: error };
    chrome.runtime.sendMessage(obj);
}
//request unseen count by invoke api
function toPromise(mail) {
    const url = 'http://localhost:3000/mail/count';
    var headers = new Headers({ 'Content-Type': 'application/json' });
    var whitelist = ['user', 'password', 'host', 'port', 'tls'];
    var data = JSON.stringify(mail, whitelist);
    return fetch(url, { method: 'POST', body: data, headers: headers })
        .then(resp => resp.ok ? resp.json() : Promise.reject(resp.statusText));
}
//end-region
//region {calls}
chrome.alarms.clear(alarmName);
chrome.storage.local.get('mails', obj => this.setBadgeText(obj.mails));
//subscribe storage data changes event
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (!changes.mails) return;
    this.setBadgeText(changes.mails.newValue);//update badge

});
chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.local.get('mails', (obj) => {
        var mails = obj.mails || [];
        mails.forEach(mail => toPromise(mail)
            .then(data => {
                sendMessage(mail, data);//send the latest unseen count to popup page 
                mail.unseen = data.unseen;
                setBadgeText(mails);//update badage
                chrome.storage.local.set({ 'mails': mails });
            })
            .catch(err => {
                console.error(`${mail.user}:${err}`);
                sendMessage(mail, {}, err);//send error info to popup page
            }));
    });
});
chrome.alarms.create(alarmName, alarmInfo);
//end-region 