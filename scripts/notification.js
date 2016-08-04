﻿var url = require('url');
//TODO REFACTOR
var token = sessionStorage["token"];
(function () {

    var baseUserList = {
        "Lucky Cherrylee": "186765205",
        "Self Destroy": "354027455",
        "Алекс Легдижн": "196992111",
        "Александр Антонов": "33455771",
        "Александр Курсиков": "268217601",
        "Алексей Андрианов": "29091975",
        "Ангелина Киселева": "206609238",
        "Аня Ступина": "32086426",
        "Борис Борисович": "27576319",
        "Валентин Минаев": "26226426",
        "Дмитрий Шорников": "17891728",
        "Евгений Ктитарев": "32042249",
        "Евгения Деревесникова": "27794871",
        "Екатерина Карлова": "84887066",
        "Екатерина Россер": "64342674",
        "Илья Карасёв": "76058639",
        "Инессик Юдина": "138676124",
        "Константин Попов": "6768833",
        "Лиза Лосева": "5905046",
        "Любовь Шериф": "19262364",
        "Максим Михайлов": "19039652",
        "Максим Романов": "9789195",
        "Маргарита Иванушкина": "20510898",
        "Марина Красовицкая": "149153788",
        "Надежда Хохич": "202893287",
        "Наденька Симоненко": "325459996",
        "Настенька Минаева": "106592179",
        "Никита Качура": "45901220",
        "Никита Митаков": "48305024",
        "Никитос Семенюк": "34579829",
        "Ольга Черкас": "9424158",
        "Юлия Архипова": "152779535"
    };

//start user
    var User = function (id, name) {
        this.name = name;
        this.id = id;
        this.Initialize();
    };

    User.prototype = {
        Initialize: function () {
        },
        isInitialIdNumeric: function () {
            return typeof this.id == "number";
        },
/*
        receiveNumericIdIfNeeded: function () {
            if (this.isInitialIdNumeric())
                return;
            var request = "https://api.vk.com/method/users.get?user_ids=" + this.id + "&access_token=" + token;
            Utils.sendRequest(request, function (msg) {
                if (msg.response && msg.response[0])
                    this.id = msg.response[0].uid;
                else {
                    console.log("error");
                    console.log(msg);
                }
            }.bind(this));
        },
*/

        /**
         * @param {Object} user
         * @returns {Boolean}
         */
        IsEqualTo: function (user) {
            return this.id == user.id;
        }
    };

//end user///


    var PollDataSource = function (postId) {
        this.postId = postId;
        this.getPollCommand = "https://api.vk.com/method/wall.getById?posts=" + this.postId
            + "&extended=1&copy_history_depth=2&v=5.52&access_token=" + token;
        this.answerIds = [];
        this.answers = [];
        this.votingMembers = [];
        this.votedUsers = [];
        this.notVotedUses = [];
        this.Initialize();
    };
    PollDataSource.prototype = {
        Initialize: function () {
            this.fillVotingMembers();
        },
        fillVotingMembers: function () {
            for (var userName in baseUserList) {
                var user = new User(baseUserList[userName], userName);
                this.votingMembers.push(user);
            }
        },
        LoadData: function (onDataLoaded) {
            Utils.sendRequest(this.getPollCommand, function (msg) {
                if (!msg || !msg.response) {
                    console.log(msg);
                    return alert("error by answers request");
                }
                //noinspection JSUnresolvedVariable
                var poll = msg.response.items[0].attachments[0].poll;
                this.fillAnswers(poll.answers);

                Utils.sendRequest(this.getVotersCommand(poll.id), function (msg) {
                    this.fillVotedUsers(msg.response);
                    this.fillNotVotedUsers();
                    if (Utils.IsExists(onDataLoaded) && Utils.isFunction(onDataLoaded))
                        onDataLoaded();
                }.bind(this));

            }.bind(this));
        },
        fillAnswers: function (answers) {
            for (var i = 0; i < answers.length; i++) {
                this.answers.push(answers[i]);
            }
        },
        fillVotedUsers: function (response) {
            var result = [];
            for (var j = 0; j < response.length; j++) {
                //noinspection JSUnresolvedVariable
                var users = response[j].users.items;
                for (var i = 0; i < users.length; i++) {
                    //noinspection JSUnresolvedVariable
                    var userObj = new User(users[i].id, users[i].first_name + " " + users[i].last_name);
                    this.votedUsers.push(userObj);
                }
            }
            return result;
        },
        fillNotVotedUsers: function () {
            this.notVotedUses = [];
            this.votingMembers.forEach(function (user) {
                if (!Utils.ContainsObject(this.votedUsers, user)) {
                    this.notVotedUses.push(user);
                }
            }.bind(this));
        },
        getVotersCommand: function (pollId) {
            return "https://api.vk.com/method/polls.getVoters?owner_id=" + this.postId.split("_")[0] +
                "&poll_id=" + pollId + "&answer_ids=" + this.getAnswerIdsAsString() +
                "&fields=nickname&name_case=nom&v=5.52&access_token=" + token;
        },
        getAnswerIdsAsString: function () {
            return this.getAnswerIds().toString();
        },
        //setters getters
        getAnswerIds: function () {
            if (!this.answerIds || this.answerIds.length < 1)
                this.answerIds = this.answers.map(function (answer) {
                    return answer.id
                });
            return this.answerIds;
        },
        GetVotedUsers: function () {
            return this.votedUsers;
        },
        GetNotVotedUsers: function () {
            return this.notVotedUses;
        }
    };


    var NotificationPageController = function () {
        this.token = "";
        //<gui elements>
        this.infoStatusElement = null;
        this.votingLinkInputElement = null;
        this.prepareUsersInfoButton = null;
        this.sendWarningButton = null;
        this.logListTable = null;
        //</gui elements>
        this.votedUsers = [];
        this.notVotedUses = [];
        this.linkSplitter = "w=poll";
        this.poll = null;
        this.Initialize();
    };

    NotificationPageController.prototype = {
        Initialize: function () {
            //events
            Utils.AddEveventHandlerToElement(this.PrepareUsersInfoButton(), "click", this.OnPrepareUsersInfoButtonClick.bind(this));
            Utils.AddEveventHandlerToElement(this.SendWarningButton(), "click", this.OnSendNotificationButtonClick.bind(this));
        },
        getPostId: function () {
            var postUrlInput = this.GetPostUrlInputElement();
            if (!Utils.IsExists(postUrlInput) || this.GetPostURLValue() == "")
                return "-83223612_893";
            return this.GetPostURLValue().split(this.linkSplitter)[1];
        },
        getCreatePoll: function () {
            return new PollDataSource(this.getPostId());
        },
        //event handlers
        OnPrepareUsersInfoButtonClick: function () {
            Utils.ToggleLoadingPanel();
            this.poll = this.getCreatePoll();
            this.poll.LoadData(function () {
                this.SetInfoStatusText(this.poll.GetVotedUsers().length);
                Utils.ToggleLoadingPanel();
            }.bind(this));
        },
        OnSendNotificationButtonClick: function () {
            Utils.ToggleLoadingPanel();
            var sender = new MessageSender();
            var warningMessage = "Vote please";
            this.poll.GetNotVotedUsers().forEach(function (user) {
                sender.AddMessageToQuene(user, warningMessage);
            }.bind(this));

            sender.AddEventListener(sender.AllMessagesSendEventName, function () {
                Utils.ToggleLoadingPanel();
            });
            sender.AddEventListener(sender.OneMessageSendEventName, this.AddRecordToInfoTable.bind(this));
            sender.SendMessagesFromQuene();
        },
        AddRecordToInfoTable: function (message) {
            var date = new Date();
            this.addRecordToInfoTableCore([
                message.receiver.id,
                message.receiver.name,
                "Message send on " + date.toLocaleDateString() + " " +
                date.toLocaleTimeString()
            ]);
        },
        addRecordToInfoTableCore: function (cellValues) {
            var record = this.LogList().insertRow();
            for (var i = 0; i < cellValues.length; i++) {
                var recordCell = record.insertCell(-1);
                recordCell.innerHTML = cellValues[i];
            }
        },

        //GUI

        //<pollInfo>
        InfoStatus: function () {
            if (!Utils.IsExists(this.infoStatusElement))
                this.infoStatusElement = document.getElementById("infoStatus");
            return this.infoStatusElement;
        },
        SetInfoStatusText: function (text) {
            this.InfoStatus().innerHTML = text;
        },

        GetPostUrlInputElement: function () {
            if (!Utils.IsExists(this.votingLinkInputElement))
                this.votingLinkInputElement = document.getElementById("votingLink");
            return this.votingLinkInputElement;
        },
        GetPostURLValue: function () {
            return this.GetPostUrlInputElement().value;
        },
        PrepareUsersInfoButton: function () {
            if (!Utils.IsExists(this.prepareUsersInfoButton))
                this.prepareUsersInfoButton = document.getElementById("prepareUsersInfo");
            return this.prepareUsersInfoButton;
        },
        //</pollInfo>

        SendWarningButton: function () {
            if (!Utils.IsExists(this.sendWarningButton))
                this.sendWarningButton = document.getElementById("sendWarning");
            return this.sendWarningButton;
        },
        LogList: function () {
            if (!this.logListTable)
                this.logListTable = document.getElementById("logList");
            return this.logListTable;
        }
    };

    var MessageSender = function () {
        this.messages = [];
        this.logListTable = null;
        //events
        this.OneMessageSendEventName = "OneMessageSend";
        this.AllMessagesSendEventName = "AllMessagesSend";

        this.OneMessageSend = null;
        this.AllMessagesSend = null;
    };
    MessageSender.prototype = {
        AddMessageToQuene: function (receiver, text) {
            this.messages.push({receiver: receiver, text: text});
        },
        SendMessagesFromQuene: function () {
            var messageSendIntervalId = setInterval(function () {
                var message = this.messages.pop();
                if (!message) {
                    clearInterval(messageSendIntervalId);
                    this.RaiseAllMessagesSend();
                    return;
                }
                Utils.sendRequest(this.getMessageSendRequestString(message), function (msg) {
                    if (!msg.response)
                        this.messages.push(message);
                    else this.RaiseOneMessageSend(message);
                }.bind(this));
            }.bind(this), 2000);
        },
        getMessageSendRequestString: function (message) {
            return "https://api.vk.com/method/messages.send?user_id=" + message.receiver.id//"29091975"
                + "&message=" + message.receiver.name + ", " + message.text + "&access_token=" + token;
        },
        RaiseAllMessagesSend: function () {
            if (this.AllMessagesSend)
                this.AllMessagesSend();
        },
        RaiseOneMessageSend: function (message) {
            if (this.OneMessageSend)
                this.OneMessageSend(message);
        },
        AddEventListener: function (evtName, handler) {
            if (Utils.isFunction(handler))
                this[evtName] = handler;
            else throw this.constructor.name +
            " add event listener exception " + evtName + handler.toString();
        }
    };

    Controllers.NotificationPageController = NotificationPageController;
}());