(function () {
    var NotificationPageController = function () {
        //<gui elements>
        this.getPollDataButtonElement = null;
        this.pollDataModalClose_htmlElement = document.getElementById("pollDataModalClose");
        this.pollDataModal_htmlElement = document.getElementById("pollDataModal");
        this.notifyNotVoted_htmlElement = document.getElementById("notifyNotVoted");
        this.clarifyUndecided_htmlElement = document.getElementById("clarifyUndecided");
        this.clarifyNegativeVoted_htmlElement = document.getElementById("clarifyNegativeVoted");
        this.notVotedCount_htmlElement = document.getElementById("notVotedCount");
        this.undecidedVotersCount_htmlElement = document.getElementById("undecidedVotersCount");
        this.negativeVotedCount_htmlElement = document.getElementById("negativeVotedCount");
        this.usersToNotifyCount_htmlElement = document.getElementById("usersToNotifyCount");
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
        Initialize: function () {
            //events
            this.GetPollPublishedDateElement().onchange = function (evt) {
                this.OnPollDateSelected(evt.target.value);
            }.bind(this);

            Utils.AddEveventHandlerToElement(this.GetPollDataButtonElement(), "click", this.OnGetPollDataButtonClick.bind(this));

            Utils.AddEveventHandlerToElement(this.notifyNotVoted_htmlElement, "click", this.OnNotifyNotVotedButtonClick.bind(this));
        },
        //event handlers
        OnNotifyNotVotedButtonClick: function () {
            Utils.ToggleLoadingPanel();
            var messages = Utils.GetCreateMessages(this.pollData.GetNotVotedUsers(), this.AddRecordToInfoTable.bind(this));
            var queue = Utils.GetCreateMessageQueue(messages);
            queue.ProcessQueue();
        },

        CloseGetPollDataModal: function () {
            var body = document.getElementsByTagName("body");
            this.pollDataModal_htmlElement.style.display = "none";
            var overlay = document.getElementById("modalBackdrop");
            overlay.style.display = "none";
            body.className = "";
        },
        OnGetPollDataButtonClick: function () {
            Utils.ToggleLoadingPanel();
            this.OnPollSelected(this.GetPollListElement().selectedIndex);
            if (!this.selectedPoll) {
                alert("пожалуйста выберите нужное голосование снова");
                Utils.ToggleLoadingPanel();
                return;
            }
            this.pollData = DataSources.GetCreatePollDatasource(this.selectedPoll);
            this.pollData.LoadData(function () {
                try {
                    Utils.ToggleLoadingPanel();
                    this.FillInfoTable();
                }
                catch (exception) {
                    alert("Загрузка данных не удалась, пожалуйста попробуйте снова");
                }
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
        FillPollList: function (polls) {
            var i;
            var option;
            for (i = 0; i < polls.length; i++) {
                option = document.createElement("option");
                option.text = polls[i].question;
                this.GetPollListElement().options.add(option);
                this.polls.push(polls[i]);
            }
            Utils.ToggleLoadingPanel();
            if (polls.length == 0)
                alert("Не найдено голосований в этот день");
        },
        GetInfoTableHeaderCellValues: function (answers) {
            var i;
            var cellValues = [];
            cellValues.push("#");
            for (i = 0; i < answers.length; i++) {
                cellValues.push(answers[i].text);
            }
            return cellValues;
        },
        GetVotesCountForEachAnswer: function (answers) {
            var i;
            var cellValues = [];
            for (i = 0; i < answers.length; i++) {
                //noinspection JSUnresolvedVariable
                cellValues.push(answers[i].votes);
            }
            return cellValues;
        },
        FillInfoTable: function () {
            var answers = this.pollData.GetAnswers();
            //fix insertion order
            //not voted
            var notVotedUsersCount = this.pollData.GetNotVotedUsers().length;
            var votesCountForEachAnswer = this.GetVotesCountForEachAnswer(answers);
            this.notVotedCount_htmlElement.innerHTML = notVotedUsersCount;
            this.undecidedVotersCount_htmlElement.innerHTML = votesCountForEachAnswer[1];
            this.negativeVotedCount_htmlElement.innerHTML = votesCountForEachAnswer[2];
            this.usersToNotifyCount_htmlElement.innerHTML = notVotedUsersCount + votesCountForEachAnswer[1] + votesCountForEachAnswer[2];

            // <last row>
            var lastRowCellValues = ["Не проголосовало", notVotedUsersCount];
            var lastRowRecord = this.addRecordToInfoTableCore(lastRowCellValues, false);
            lastRowRecord.cells[lastRowRecord.cells.length - 1].setAttribute("colspan", (answers.length).toString());
            //</last row>

            //<first row> voters
            this.addRecordToInfoTableCore(["Количество проголосовавших"].concat(votesCountForEachAnswer), false);
            //</first row>

            //<header  row>
            this.addRecordToInfoTableCore(this.GetInfoTableHeaderCellValues(answers), true);
            var expectedPeopleCount = document.getElementById("expectedPeopleCount");
            //</header row>

            expectedPeopleCount.innerHTML = " " + answers[0].votes + " ";
        },
        GetCreateRow: function (isHeaderRow) {
            var rowParent = !isHeaderRow ? this.GetNotVotedUsersTableElement() :
                this.GetNotVotedUsersTableElement().createTHead();
            return rowParent.insertRow(0);
        },
        addRecordToInfoTableCore: function (cellValues, isHeaderRecord) {
            var record = this.GetCreateRow(isHeaderRecord);
            for (var i = 0; i < cellValues.length; i++) {
                var recordCell = record.insertCell(-1);
                recordCell.innerHTML = cellValues[i];
            }
            return record;
        },

        //GUI
        GetPollDataButtonElement: function () {
            if (!this.getPollDataButtonElement)
                this.getPollDataButtonElement = document.getElementById("getPollDataButton");
            return this.getPollDataButtonElement;
        },
        GetPollPublishedDateElement: function () {
            if (!this.pollPublishedDateElement)
                this.pollPublishedDateElement = document.getElementById("pollPublishedDate");
            return this.pollPublishedDateElement;
        },
        GetPollListElement: function () {
            if (!this.pollListElement)
                this.pollListElement = document.getElementById("pollList");
            return this.pollListElement;
        },
        GetSendWarningButtonElement: function () {
            if (!Utils.IsExists(this.sendWarningButton))
                this.sendWarningButton = document.getElementById("sendWarning");
            return this.sendWarningButton;
        },
        GetNotVotedUsersTableElement: function () {
            if (!this.votingGlobalInfoTableElement)
                this.votingGlobalInfoTableElement = document.getElementById("votingGlobalInfo");
            return this.votingGlobalInfoTableElement;
        },

    };
    Controllers.NotificationPageController = NotificationPageController;
}());