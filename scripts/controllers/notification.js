(function() {
    var NotificationPageController = function() {
        //<gui elements>
        this.getPollDataButtonElement = null;
        this.pollDataModalClose = document.getElementById("pollDataModalClose");
        this.pollDataModal = document.getElementById("pollDataModal");
        this.sendWarningButton = null;
        this.votingGlobalInfoTableElement = null;
        this.pollPublishedDateElement = null;
        this.pollListElement = null;
        //</gui elements>
        this.votedUsers = [];
        this.notVotedUses = [];
        this.linkSplitter = "w=selectedPoll";
        this.selectedPoll = null;
        this.pollData = null;
        this.polls = [];
        this.Initialize();
    };

    NotificationPageController.prototype = {
        Initialize: function() {
            //events
            this.GetPollPublishedDateElement().onchange = function (evt) {
                alert(evt.target.value);
                this.OnPollDateSelected(evt.target.value);
            }.bind(this);

            Utils.AddEveventHandlerToElement(this.GetPollDataButtonElement(), "click", this.OnGetPollDataButtonClick.bind(this));


            //Utils.AddEveventHandlerToElement(this.GetSendWarningButtonElement(), "click", this.OnSendNotificationButtonClick.bind(this));
        },
        //event handlers
/*
        OnSendNotificationButtonClick: function() {
            Utils.ToggleLoadingPanel();
            var messages = Utils.GetCreateMessages(this.pollData.GetNotVotedUsers(), this.AddRecordToInfoTable.bind(this));
            var queue = Utils.GetCreateMessageQueue(messages);
            queue.ProcessQueue();
        },*/

        CloseGetPollDataModal: function () {
            var body = document.getElementsByTagName("body");
            this.pollDataModal.style.display = "none";
            var overlay = document.getElementById("modalBackdrop");
            overlay.style.display = "none";
            body.className = "";
        },
        OnGetPollDataButtonClick: function() {
            Utils.ToggleLoadingPanel();
            this.OnPollSelected(this.GetPollListElement().selectedIndex);
            this.pollData = DataSources.GetCreatePollDatasource(this.selectedPoll);
            this.pollData.LoadData(function() {
                Utils.ToggleLoadingPanel();
                this.FillInfoTable();
                this.CloseGetPollDataModal();
            }.bind(this));
        },
        OnPollDateSelected: function (value) {
            Utils.ToggleLoadingPanel();
            var wallData = DataSources.GetCreateWallData("-126602918");
            var selectedDate = new Date(value);
            wallData.LoadPollsByDate(selectedDate, this.FillPollList.bind(this));
        },
        OnPollSelected: function (itemNumber) {
            this.selectedPoll = this.polls[itemNumber];
        },
        // end
        FillPollList: function(polls) {
            var i;
            var option;
            for(i = 0; i < polls.length; i++) {
                option = document.createElement("option");
                option.text = polls[i].question;
                this.GetPollListElement().options.add(option);
                this.polls.push(polls[i]);
            }
            Utils.ToggleLoadingPanel();
        },
        GetInfoTableHeaderCellValues: function (answers) {
            var i;
            var cellValues = [];
            cellValues.push("#");
            for(i = 0; i < answers.length; i++) {
                cellValues.push(answers[i].text);
            }
            return cellValues;
        },
        GetInfoTableRowCellValues: function (answers) {
            var i;
            var cellValues = [];
            cellValues.push("Количество проголосовавших");
            for(i = 0; i < answers.length; i++) {
                //noinspection JSUnresolvedVariable
                cellValues.push(answers[i].votes);
            }
            return cellValues;
        },
        FillInfoTable: function() {
            var answers = this.pollData.GetAnswers();
            //fix insertion order
            //not voted
            var lastRowCellValues = ["Не проголосовало", this.pollData.GetNotVotedUsers().length];
            var lastRowRecord = this.addRecordToInfoTableCore(lastRowCellValues, false);
            lastRowRecord.cells[lastRowRecord.cells.length - 1].setAttribute("colspan", (answers.length).toString());
            //voters
            this.addRecordToInfoTableCore(this.GetInfoTableRowCellValues(answers), false);
            //header
            this.addRecordToInfoTableCore(this.GetInfoTableHeaderCellValues(answers), true);
        },
        GetCreateRow: function (isHeaderRow) {
            var rowParent = !isHeaderRow ? this.GetNotVotedUsersTableElement() :
                this.GetNotVotedUsersTableElement().createTHead();
            return rowParent.insertRow(0);
        },
        addRecordToInfoTableCore: function(cellValues, isHeaderRecord) {
            var record = this.GetCreateRow(isHeaderRecord);
            for(var i = 0; i < cellValues.length; i++) {
                var recordCell = record.insertCell(-1);
                recordCell.innerHTML = cellValues[i];
            }
            return record;
        },

        //GUI
        GetPollDataButtonElement: function () {
            if(!this.getPollDataButtonElement)
                this.getPollDataButtonElement = document.getElementById("getPollDataButton");
            return this.getPollDataButtonElement;
        },
        GetPollPublishedDateElement: function () {
            if(!this.pollPublishedDateElement)
                this.pollPublishedDateElement = document.getElementById("pollPublishedDate");
            return this.pollPublishedDateElement;
        },
        GetPollListElement: function () {
            if(!this.pollListElement)
                this.pollListElement = document.getElementById("pollList");
            return this.pollListElement;
        },
        GetSendWarningButtonElement: function() {
            if(!Utils.IsExists(this.sendWarningButton))
                this.sendWarningButton = document.getElementById("sendWarning");
            return this.sendWarningButton;
        },
        GetNotVotedUsersTableElement: function() {
            if(!this.votingGlobalInfoTableElement)
                this.votingGlobalInfoTableElement = document.getElementById("votingGlobalInfo");
            return this.votingGlobalInfoTableElement;
        },

    };
    Controllers.NotificationPageController = NotificationPageController;
}());