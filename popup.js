chrome.storage.local.get('mails', function (obj) {
    var mails = Array.isArray(obj.mails) ? obj.mails : [];
    mails = mails.map(m => new Mail(m));
    var model = new EmailListViewModel();
    model.mails(mails);
    ko.applyBindings(model);
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        var oldItem = model.mails().find(m => m.user() === message.user);
        var newItem = new Mail(message);
        model.mails.replace(oldItem, newItem);
    });
    document.querySelector('#fileSelector').addEventListener('change', function (e) {
        if (e.target.files.length == 0) return false;
        var reader = new FileReader();
        reader.addEventListener("loadend", function (result) {
            var mails;
            try {
                mails = JSON.parse(reader.result);
                if (!Array.isArray(mails)) throw new Error();
            } catch (e) {
                alert('invalid json file!');
            }
            e.target.value = '';
            if (!mails) return false;
            mails.forEach(mail => {
                if (!mail || !mail.user) return false;
                var oldItem = model.mails().find(m => m.user() === mail.user);
                mail.unseen = 0;
                var newItem = new Mail(mail);
                if (oldItem) {
                    model.mails.replace(oldItem, newItem);
                } else {
                    model.mails.push(newItem);
                }
            });
            model.updateStorage();
            model.showTab(Tabs.list);
        });
        reader.readAsText(e.target.files[0]);
    });
});

const Tabs = {
    list: 'list',
    add: 'add',
    settings: 'settings',
    edit: 'edit'
}

function Mail(data) {
    data = data || {};
    this.user = ko.observable(data.user);
    this.password = ko.observable(data.password);
    this.host = ko.observable(data.host);
    this.port = ko.observable(data.port);
    this.name = ko.observable(data.name || '');
    this.tls = ko.observable(data.tls);
    this.unseen = ko.observable(data.unseen);
    this.displayName = ko.computed(() => {
        return this.name() || this.user();
    }, this);
}

function EmailListViewModel() {
    this.mails = ko.observableArray([]);
    this.newMail = ko.observable(new Mail());
    this.editMail = ko.observable();
    this.currentHover = ko.observable();
    this.active = (mail, e) => {
        var mail = e.type === 'mouseover' ? mail : null;
        this.currentHover(mail);
    }
    this.add = () => {
        var mail = this.newMail();
        if (!mail) return;
        this.mails.push(mail);
        this.newMail(new Mail());
        this.showTab(Tabs.list);
        this.updateStorage();
    };
    this.edit = (mail) => {
        this.editMail(mail);
        this.showTab(Tabs.edit);
    };
    this.update = (form) => {
        this.showTab(Tabs.list);
        this.editMail(null);
        this.updateStorage();
    };
    this.remove = (mail) => {
        this.mails.remove(mail);
        this.updateStorage();
    };
    this.visitWeb = (mail) => {
        var mail = mail.user();
        if (!mail) return;
        var index = mail.lastIndexOf('@');
        if (!~index) return;
        var domain = mail.substring(index + 1).toLowerCase();
        chrome.tabs.create({ url: `https://mail.${domain}` });
    };
    this.updateStorage = () => {
        chrome.storage.local.set({ 'mails': ko.toJS(this.mails()) });
    };
    this.export = () => {
        var json = ko.toJSON(this.mails, null, 2);
        var file = new File([json], "mail-checker.json", { type: "application/json;charset=utf-8" });
        saveAs(file);
    };
    this.import = () => {
        document.querySelector('#fileSelector').click();
    };
    this.showTab = (tab) => {
        $(`#navs a[href="#${tab}"]`).tab('show');
    };
}

ko.bindingHandlers.showOperations = {
    init: (ele) => {
        $(ele).hover(() => $(".operations", ele).toggleClass('invisible'));
    }
}