(function () {
    var WallData = function (ownerId) {
        this.ownerId = ownerId;
        this.polls = [];
        this.getCommand = "https://api.vk.com/method/wall.get?ownerId=" + ownerId +
            "&domain=tula_mafia&count=100&v=5.53&access_token=" + sessionStorage.token;
    };
    WallData.prototype = {
        GetPollAttachment: function(attachments) {
            var i, count = attachments.length;
            for(i = 0; i < count; i++) {
                if(attachments[i].type == "poll")
                    return attachments[i].poll;
            }
            throw "poll not found in attachments";
        },
        IsDateWithoutTimeEqual: function (date1, date2) {
            return date1.getDate() == date2.getDate() &&
                    date1.getMonth() == date2.getMonth() &&
                    date1.getFullYear() == date2.getFullYear();
        },
        LoadPollsByDate: function (date, success) {
            Utils.SendRequest(this.getCommand, function (result) {
                var i;
                var items;
                var postWithPollData;
                var postPuplishDate;
                if(!result.response)
                    throw "error during post receiving - " + result.error.toString();
                else {
                    items = result.response.items;
                    for (i = 0; i < items.length; i++) {
                        postPuplishDate = new Date(items[i].date*1000);
                        if(this.IsDateWithoutTimeEqual(postPuplishDate, date) && items[i].attachments)
                            this.polls.push(this.GetPollAttachment(items[i].attachments));
                    }
                    success(this.polls);
                }
            }.bind(this));
        }
    };
    var GetCreateWallData = function (ownerId) {
        return new WallData(ownerId);
    };
    DataSources.GetCreateWallData = GetCreateWallData;
}());