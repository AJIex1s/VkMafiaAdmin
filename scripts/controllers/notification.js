var url = require("url");
//TODO REFACTOR

var baseUserList = {};
var token = sessionStorage.token;

var onScripStartLoading = function() {
    if(!Utils.IsExists(Controllers)) {
        throw "route.js is not included";
    }
    Utils.ToggleLoadingPanel();
    Utils.SendRequest("https://api.vk.com/method/messages.getChatUsers?chat_id=31&fields=screen_name&v=5.52&access_token=" + token, function(msg) {
        var i = 0;
        var response = msg.response;
        var userName;
        var user;
        if(response) {
            for(i = 0; i < response.length; i++) {
                user = response[i];
                //noinspection JSUnresolvedVariable
                userName = user.first_name + " " + user.last_name;
                baseUserList[userName] = user.id;
            }
            Utils.ToggleLoadingPanel();
        }
    });
};
(function() {
    onScripStartLoading();
//start user
    var User = function(id, name) {
        this.name = name;
        this.id = id;
        this.Initialize();
    };

    User.prototype = {
        Initialize: function() {
        },
        /*isInitialIdNumeric: function() {
         return typeof this.id == "number";
         },*/
        /*
         receiveNumericIdIfNeeded: function () {
         if (this.isInitialIdNumeric())
         return;
         var request = "https://api.vk.com/method/users.get?user_ids=" + this.id + "&access_token=" + token;
         Utils.SendRequest(request, function (msg) {
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
        IsEqualTo: function(user) {
            return this.id === user.id;
        }
    };

//end user///


    var PollDataSource = function(postId) {
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
        Initialize: function() {
            this.fillVotingMembers();
        },
        fillVotingMembers: function() {
            var userNames = Object.keys(baseUserList);
            var userHandler;
            var i;

            for(i = 0; i < userNames.length; i++) {
                userHandler = new User(baseUserList[userNames[i]], userNames[i]);
                this.votingMembers.push(userHandler);
            }
        },
        tryGetPollAttachment: function(attachments) {
            var i, count = attachments.length;
            for(i = 0; i < count; i++) {
                if(attachments[i].type == "poll")
                    return attachments[i].poll;
            }
            throw "poll not found in attachments";
        },
        LoadData: function(onDataLoaded) {
            Utils.SendRequest(this.getPollCommand, function(msg) {
                var postAttachments, poll;
                if(!msg || !msg.response) {
                    console.log(msg);
                    return alert("error by answers request");
                }

                //noinspection JSUnresolvedVariable
                postAttachments = msg.response.items[0].attachments;
                poll = this.tryGetPollAttachment(postAttachments);
                this.fillAnswers(poll.answers);

                Utils.SendRequest(this.getVotersCommand(poll.id), function(msg) {
                    this.fillVotedUsers(msg.response);
                    this.fillNotVotedUsers();
                    if(Utils.IsExists(onDataLoaded) && Utils.IsFunction(onDataLoaded)) {
                        onDataLoaded();
                    }
                }.bind(this));
            }.bind(this));
        },
        fillAnswers: function(answers) {
            for(var i = 0; i < answers.length; i++) {
                this.answers.push(answers[i]);
            }
        },
        fillVotedUsers: function(response) {
            var result = [];
            for(var j = 0; j < response.length; j++) {
                //noinspection JSUnresolvedVariable
                var users = response[j].users.items;
                for(var i = 0; i < users.length; i++) {
                    //noinspection JSUnresolvedVariable
                    var userObj = new User(users[i].id, users[i].first_name + " " + users[i].last_name);
                    if(Utils.ContainsObject(this.votingMembers, userObj))
                        this.votedUsers.push(userObj);
                }
            }
            return result;
        },
        fillNotVotedUsers: function() {
            this.notVotedUses = [];
            this.votingMembers.forEach(function(user) {
                if(!Utils.ContainsObject(this.votedUsers, user)) {
                    this.notVotedUses.push(user);
                }
            }.bind(this));
        },
        getVotersCommand: function(pollId) {
            return "https://api.vk.com/method/polls.getVoters?owner_id=" + this.postId.split("_")[0] +
                "&poll_id=" + pollId + "&answer_ids=" + this.getAnswerIdsAsString() +
                "&fields=nickname&name_case=nom&v=5.52&access_token=" + token;
        },
        getAnswerIdsAsString: function() {
            return this.getAnswerIds().toString();
        },
        //setters getters
        getAnswerIds: function() {
            if(!this.answerIds || this.answerIds.length < 1)
                this.answerIds = this.answers.map(function(answer) {
                    return answer.id
                });
            return this.answerIds;
        },
        GetVotedUsers: function() {
            return this.votedUsers;
        },
        GetNotVotedUsers: function() {
            return this.notVotedUses;
        }
    };


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
        getCreatePoll: function() {
            return new PollDataSource(this.getPostId());
        },
        //event handlers
        OnPrepareUsersInfoButtonClick: function() {
            Utils.ToggleLoadingPanel();
            this.poll = this.getCreatePoll();
            this.poll.LoadData(function() {
                this.SetInfoStatusText(this.poll.GetVotedUsers().length);
                Utils.ToggleElement(this.GetNotVotedUsersElement());
                Utils.ToggleLoadingPanel();
            }.bind(this));
        },
        SendNotificationMessage: function(message, onEndResponse, delay) {
            var request = this.getMessageSendRequestString(message);
            var context = this;
            setTimeout(function() {
                Utils.SendRequest(request, function(result) {
                    var state = Utils.IsExists(result.response);
                    if(state)
                        context.AddRecordToInfoTable(message);
                    onEndResponse(state);
                });
            }, delay);
        },
        OnSendNotificationButtonClick: function() {
            Utils.ToggleLoadingPanel();
            var warningMessage = "Vote please";
            var notificationController = this;
            var messages = this.poll.GetNotVotedUsers().map(function(user) {
                return {
                    receiver: user,
                    text: warningMessage,
                    OnProcessed: function () { notificationController.AddRecordToInfoTable(this.receiver); }
                };
            });
            var queue = Utils.GetCreateMessageQueue(messages);
            queue.ProcessQueue();
        },

        getMessageSendRequestString: function(message) {
            return "https://api.vk.com/method/messages.send?user_id=" + /*message.receiver.id*/"29091975"
                + "&message=" + message.receiver.name + ", " + message.text + "&access_token=" + token;
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
    var Queue = function(itemProcessor, onQueueProcessed) {
        this.items = [];
        this.itemProcessor = itemProcessor;
        this.onQueueProcessed = onQueueProcessed;
        this.promises = [];
    };
    Queue.prototype = {
        IsEmpty: function() {
            return this.items.length === 0;
        },
        AddItem: function(item) {
            this.items.push(item);
        },
        createPromiseForItem: function(item, delay) {
            var queue = this;
            var promise = new Promise(function(resolve, reject) {
                queue.itemProcessor(item, resolve, delay);
            });
            promise.then(function(success) {
                if(!success)
                    queue.promises.push(promise);
            });
            this.promises.push(promise);
        },
        ProcessQueue: function() {
            var delay = 2000;
            var item = null;
            while(!this.IsEmpty()) {
                item = this.items.shift();
                this.createPromiseForItem(item, delay);
                delay += 2000;
            }
            Promise.all(this.promises).then(this.onQueueProcessed);
        },

    };
    Controllers.NotificationPageController = NotificationPageController;
}());