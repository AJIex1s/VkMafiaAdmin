(function() {
    var NotificationPageController = function() {
        //<gui elements>
        this.infoStatusElement = null;
        this.votingLinkInputElement = null;
        this.prepareUsersInfoButton = null;
        this.sendWarningButton = null;
        this.notVotedUsersElement = null;
        this.notVotedUsersELement = null;
        //</gui elements>
        this.votedUsers = [];
        this.notVotedUses = [];
        this.linkSplitter = "w=poll";
        this.poll = null;
        this.Initialize();
    };

    NotificationPageController.prototype = {
        Initialize: function() {
            //events
            Utils.AddEveventHandlerToElement(this.GetPrepareUsersInfoButtonElement(), "click", this.OnPrepareUsersInfoButtonClick.bind(this));
            Utils.AddEveventHandlerToElement(this.GetSendWarningButtonElement(), "click", this.OnSendNotificationButtonClick.bind(this));
        },
        getPostId: function() {
            var postUrlInput = this.GetPostUrlInputElement();
            if(!Utils.IsExists(postUrlInput) || this.GetPostURLValue() == "")
                return "-83223612_893";
            return this.GetPostURLValue().split(this.linkSplitter)[1];
        },
        //event handlers
        OnPrepareUsersInfoButtonClick: function() {
            Utils.ToggleLoadingPanel();
            this.poll = DataSources.GetCreatePollDatasource(this.getPostId());
            this.poll.LoadData(function() {
                this.SetInfoStatusText(this.poll.GetVotedUsers().length);
                Utils.ToggleElement(this.GetNotVotedUsersElement());
                Utils.ToggleLoadingPanel();
            }.bind(this));
        },
        OnSendNotificationButtonClick: function() {
            Utils.ToggleLoadingPanel();
            var messages = Utils.GetCreateMessages(this.poll.GetNotVotedUsers(), this.AddRecordToInfoTable.bind(this));
            var queue = Utils.GetCreateMessageQueue(messages);
            queue.ProcessQueue();
        },
        AddRecordToInfoTable: function(receiver) {
            var date = new Date();
            this.addRecordToInfoTableCore([
                receiver.id,
                receiver.name,
                "Message send on " + date.toLocaleDateString() + " " +
                date.toLocaleTimeString()
            ]);
        },
        addRecordToInfoTableCore: function(cellValues) {
            var record = this.GetNotVotedUsersTableElement().insertRow();
            for(var i = 0; i < cellValues.length; i++) {
                var recordCell = record.insertCell(-1);
                recordCell.innerHTML = cellValues[i];
            }
        },

        //GUI

        //<pollInfo>
        InfoStatus: function() {
            if(!Utils.IsExists(this.infoStatusElement))
                this.infoStatusElement = document.getElementById("infoStatus");
            return this.infoStatusElement;
        },
        SetInfoStatusText: function(text) {
            this.InfoStatus().innerHTML = text;
        },

        GetPostUrlInputElement: function() {
            if(!Utils.IsExists(this.votingLinkInputElement))
                this.votingLinkInputElement = document.getElementById("votingLink");
            return this.votingLinkInputElement;
        },
        GetPostURLValue: function() {
            return this.GetPostUrlInputElement().value;
        },
        GetPrepareUsersInfoButtonElement: function() {
            if(!Utils.IsExists(this.prepareUsersInfoButton))
                this.prepareUsersInfoButton = document.getElementById("prepareUsersInfo");
            return this.prepareUsersInfoButton;
        },
        //</pollInfo>

        GetSendWarningButtonElement: function() {
            if(!Utils.IsExists(this.sendWarningButton))
                this.sendWarningButton = document.getElementById("sendWarning");
            return this.sendWarningButton;
        },
        GetNotVotedUsersTableElement: function() {
            if(!this.notVotedUsersElement)
                this.notVotedUsersElement = document.getElementById("notVotedUsers");
            return this.notVotedUsersElement;
        },
        GetNotVotedUsersElement: function() {
            if(!this.notVotedUsersELement)
                this.notVotedUsersELement = document.querySelector(".notVotedUsers");
            return this.notVotedUsersELement;
        },

    };
    Controllers.NotificationPageController = NotificationPageController;
}());