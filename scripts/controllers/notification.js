(function () {
    var NotificationPageController = function () {
        //<gui elements>
        this.pollDataModal_htmlElement = document.getElementById("pollDataModal");
        this.notVotedCount_htmlElement = document.getElementById("notVotedCount");
        this.undecidedVotersCount_htmlElement = document.getElementById("undecidedVotersCount");
        this.negativeVotedCount_htmlElement = document.getElementById("negativeVotedCount");
        this.usersToNotifyCount_htmlElement = document.getElementById("usersToNotifyCount");
        this.votingGlobalInfoTableElement = null;
        this.pollListElement = null;
        //</gui elements>
        this.selectedPoll = null;
        this.pollVotersData = null;
        this.polls = [];
        this.Initialize();
    };

    NotificationPageController.prototype = {
        Initialize: function () {
            //events
            var pollVotersDataButton_htmlElement = document.getElementById("pollVotersDataButton");
            var notifyNotVoted_htmlElement = document.getElementById("notifyNotVoted");
            var clarifyNegativeVoted_htmlElement = document.getElementById("clarifyNegativeVoted");
            var clarifyUndecided_htmlElement = document.getElementById("clarifyUndecided");
            var pollPublishDatePicker_htmlElement = document.getElementById("pollPublishDatePicker");

            pollPublishDatePicker_htmlElement.onchange = function (evt) {
                this.OnPollDateSelected(evt.target.value);
            }.bind(this);

            Utils.AddEveventHandlerToElement(pollVotersDataButton_htmlElement, "click", this.OnGetPollVotersDataButtonClick.bind(this));

            Utils.AddEveventHandlerToElement(notifyNotVoted_htmlElement, "click", this.OnNotifyNotVotedButtonClick.bind(this));
            Utils.AddEveventHandlerToElement(clarifyNegativeVoted_htmlElement, "click", this.OnClarifyNegativeVotedButtonClick.bind(this));
            Utils.AddEveventHandlerToElement(clarifyUndecided_htmlElement, "click", this.OnClarifyUndecidedButtonClick.bind(this));
        },
        reduceUndecidedVotersCount: function () {
            var undecidedVotersCount = parseInt(this.undecidedVotersCount_htmlElement.innerHTML);
            undecidedVotersCount -= 1;
            this.undecidedVotersCount_htmlElement.innerHTML = undecidedVotersCount;
        },
        reduceNegativeVotedCount: function () {
            var negativeVotedCount = parseInt(this.negativeVotedCount_htmlElement.innerHTML);
            negativeVotedCount -= 1;
            this.negativeVotedCount_htmlElement.innerHTML = negativeVotedCount;
        },
        reduceNotVotedCount: function () {
            var notVotedCount = parseInt(this.notVotedCount_htmlElement.innerHTML);
            notVotedCount -= 1;
            this.notVotedCount_htmlElement.innerHTML = notVotedCount;
        },
        //event handlers
        OnNotifyNotVotedButtonClick: function () {
            Utils.ToggleLoadingPanel();
            var messages = Utils.GetCreateMessages(this.pollVotersData.GetNotVotedUsers(), this.reduceNotVotedCount.bind(this));
            var queue = Utils.GetCreateMessageQueue(messages);
            queue.ProcessQueue();
        },
        OnClarifyUndecidedButtonClick: function () {
            Utils.ToggleLoadingPanel();
            var messages = Utils.GetCreateMessages(this.pollVotersData.GetAnswers()[1], this.reduceUndecidedVotersCount.bind(this));
            var queue = Utils.GetCreateMessageQueue(messages);
            queue.ProcessQueue();
        },
        OnClarifyNegativeVotedButtonClick: function () {
            Utils.ToggleLoadingPanel();
            var messages = Utils.GetCreateMessages(this.pollVotersData.GetNotVotedUsers(), this.reduceNegativeVotedCount.bind(this));
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
        OnGetPollVotersDataButtonClick: function () {
            Utils.ToggleLoadingPanel();
            this.OnPollSelected(this.GetPollListElement().selectedIndex);
            if (!this.selectedPoll) {
                alert("пожалуйста выберите нужное голосование снова");
                Utils.ToggleLoadingPanel();
                return;
            }
            this.pollVotersData = DataSources.GetCreatePollVotersData(this.selectedPoll);
            this.pollVotersData.LoadData(function () {
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
                //noinspection JSUnresolvedVariable
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
            var answers = this.pollVotersData.GetAnswers();
            //fix insertion order
            //not voted
            var notVotedUsersCount = this.pollVotersData.GetNotVotedUsers().length;
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

            //noinspection JSUnresolvedVariable
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
        GetPollListElement: function () {
            if (!this.pollListElement)
                this.pollListElement = document.getElementById("pollList");
            return this.pollListElement;
        },
        GetNotVotedUsersTableElement: function () {
            if (!this.votingGlobalInfoTableElement)
                this.votingGlobalInfoTableElement = document.getElementById("votingGlobalInfo");
            return this.votingGlobalInfoTableElement;
        },

    };
    Controllers.NotificationPageController = NotificationPageController;
}());