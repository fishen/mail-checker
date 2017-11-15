function FileSelector(accept) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    this.dispose = function () {
        delete input;
    };
    this.readAsJSON = function () {
        input.value = '';
        var reader = new FileReader();
        var promise = new Promise((resolve, reject) => {
            reader.addEventListener("loadend", function (result) {
                resolve(reader.result);
            });
            reader.addEventListener('error', function (err) {
                reject(err);
            });
        });
        input.addEventListener('change', function (e) {
            if (e.target.files.length == 0) return false;
            reader.readAsText(e.target.files[0]);
        });
        input.click();
        return promise.then(text => JSON.parse(text));
    }
}