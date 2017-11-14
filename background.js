//region {variables and functions}
var alarmName = "MailCheckerAlarm";
var alarmInfo = {
    when: Date.now() + 6000,
    periodInMinutes: 0.1 //Repeatedly fire after every 1 minute
};
function setBadgeText(mails) {
    mails = mails || [];
    var count = mails.reduce((pre, cur) => pre + (cur.unseen || 0), 0);
    chrome.browserAction.setBadgeText({ "text": `${count}` });
}
chrome.storage.local.get('mails', obj => setBadgeText(obj.mails));
//end-region
//region {calls}
chrome.alarms.clear(alarmName);
function toPromise(mail) {
    const url = 'http://localhost:3000/mail/ping';
    var headers = new Headers({ 'Content-Type': 'application/json' });
    return fetch(url, { method: 'POST', body: JSON.stringify(mail), headers: headers })
        .then(resp => resp.ok ? resp.json() : Promise.reject(resp.statusText));
}
chrome.alarms.onAlarm.addListener(function (alarm) {
    chrome.storage.local.get('mails', function (obj) {
        var mails = obj.mails || [];
        mails.forEach(mail => toPromise(mail)
            .then(data => {
                Object.assign(mail, data);
                chrome.runtime.sendMessage(mail);
                setBadgeText(mails);
                chrome.storage.local.set({ 'mails': mails });
            })
            .catch(err => console.error(err)));
    });
});
chrome.alarms.create(alarmName, alarmInfo);
//end-region 