var url = require('url');

var token = url.parse(window.location.href, true).query["access_token"];
document.addEventListener('DOMContentLoaded', function() {
    var helper = new PollHelper(token);
    window.pollHelper = helper;
}, false);
// (function() {
var VotingNameSpace = {};
window.VotingNameSpace = VotingNameSpace;
var VotingHelper;

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
    receiveNumericIdIfNeeded: function () {
        if(this.isInitialIdNumeric())
            return;
        var request = "https://api.vk.com/method/users.get?user_ids=" + this.id + "&access_token=" + token;
        Utils.sendRequest(request, function (msg) {
            if(msg.response && msg.response[0])
                this.id = msg.response[0].uid;
            else {
                console.log("error");
                console.log(msg);
            }
        }.bind(this));
    },

    /**
     * @returns {Number}
     */
    GetId: function () {
        return this.id;
    },
    /**
     * @param {Object} user
     * @returns {Boolean}
     */
    IsEqualTo: function (user) {
        return this.id == user.id;
    }
};

//end user///


var Poll = function (postId) {
    this.postId = postId;
    this.ownerId = postId.split("_")[0];
    this.answersRequest = "https://api.vk.com/method/wall.getById?posts=" + this.postId
        + "&extended=1&copy_history_depth=2&v=5.52&access_token=" + token;
    this.answerIds = [];
    this.answers = [];
    this.pollId = -1;
    this.votedUsers = [];
    this.Initialize();
};
Poll.prototype = {
    Initialize: function () {
    },
    //<unused>
    GetPostId: function () {
        return this.postId || -1;
    },
    //</unused>
    fillAnswers: function (answers) {
        for (var i = 0; i < answers.length; i++) {
            this.answers.push(answers[i]);
        }
    },
    receivePollData: function (callback) {
        Utils.sendRequest(this.answersRequest, function (msg) {
            if (!msg || !msg.response) {
                console.log(msg);
                return alert("error by answers request");
            }
            //noinspection JSUnresolvedVariable
            var poll = msg.response.items[0].attachments[0].poll;
            this.SetPollId(poll.id);
            this.fillAnswers(poll.answers);
            Utils.sendRequest(this.getCreateVotingRequestUrl(), function (msg) {
                this.votedUsers = this.getCreateVotedUsers(msg);
                if (Utils.IsExists(callback) && Utils.isFunction(callback))
                    callback();
            }.bind(this));
        }.bind(this));
    },
    getCreateVotedUsers: function (msg) {
        var result = [];
        for(var j = 0; j < msg.response.length; j++){
            var users = msg.response[j].allUsers.items;
            for(var i = 0; i < users.length; i++) {
                //noinspection JSUnresolvedVariable
                var userObj = new User(users[i].id, users[i].first_name + " " + users[i].last_name);
                result.push(userObj);
            }
        }
        return result;
    },
    getCreateVotingRequestUrl: function () {
        return "https://api.vk.com/method/polls.getVoters?owner_id=" + this.ownerId +
            "&poll_id=" + this.GetPollId() + "&answer_ids=" + this.getAnswerIdsAsString() +
            "&fields=nickname&name_case=nom&v=5.52&access_token=" + token;
    },
    //setters getters
    getAnswerIds: function () {
        if(!this.answerIds || this.answerIds.length < 1)
            this.answerIds = this.answers.map(function(answer){return answer.id});
        return this.answerIds;
    },
    GetVotedUsers: function () {
        return this.votedUsers;
    },
    getAnswerIdsAsString: function () {
        return this.getAnswerIds().toString();
    },
    SetPollId: function (pollId) {
        this.pollId = pollId;
    },
    GetPollId: function () {
        return this.pollId;
    }
};


var PollHelper = function (token) {
    this.token = token;
    this.votedUsers = [];
    this.notVotedUses = {};
    this.linkSplitter = "w=poll";
    this.infoStatusElement = null;
    this.votingLinkInputElement = null;
    this.sendWarningButton = null;
    this.prepareUsersInfoButton = null;
    this.poll = null;
    this.allUsers = [];
    this.loadingPanelElment = null;
    this.loadingOverlayElment = null;
    //evt
    this.Initialize();
};
PollHelper.prototype = {
    Initialize: function () {
        this.generateAllUsersList();
        //events
        Utils.AddEveventHandlerToElement(this.getPrepareUsersInfoBtn(), "click", this.OnPrepareUsersInfoButtonClick.bind(this));
        Utils.AddEveventHandlerToElement(this.getSendWarningButton(), "click", this.OnSendWarningButtonClick.bind(this));
    },
    getLoadingOverlayElement: function () {
        if(!this.loadingOverlayElment)
            this.loadingOverlayElment = document.getElementById("loadingOverlay");
        return this.loadingOverlayElment;
    },
    getLoadingPanelElement: function () {
        if(!this.loadingPanelElment)
            this.loadingPanelElment = document.getElementById("loadingPanel");
        return this.loadingPanelElment;
    },
    toggleLoadingPanel: function () {
        Utils.toggleElement(this.getLoadingOverlayElement());
        Utils.toggleElement(this.getLoadingPanelElement());
    },
    generateAllUsersList: function () {
        for(var userName in baseUserList){
            var user = new User(baseUserList[userName], userName);
            this.allUsers.push(user);
        }
    },
    getInfoStatusElement: function () {
        if(!Utils.IsExists(this.infoStatusElement))
            this.infoStatusElement = document.getElementById("infoStatus");
        return this.infoStatusElement;
    },
    getPostURLElement: function () {
        if(!Utils.IsExists(this.votingLinkInputElement))
            this.votingLinkInputElement = document.getElementById("votingLink");
        return this.votingLinkInputElement;
    },
    getPrepareUsersInfoBtn: function () {
        if(!Utils.IsExists(this.prepareUsersInfoButton))
            this.prepareUsersInfoButton = document.getElementById("prepareUsersInfo");
        return this.prepareUsersInfoButton;
    },
    getSendWarningButton: function () {
        if(!Utils.IsExists(this.sendWarningButton))
            this.sendWarningButton = document.getElementById("sendWarning");
        return this.sendWarningButton;
    },
    getPollId: function () {
        var postURL = this.getPostURLElement();
        if(!Utils.IsExists(postURL) || postURL.value == "")
            return "-83223612_893";
        return postURL.value.split(this.linkSplitter)[1];
    },
    getCreatePoll: function () {
        return new Poll(this.getPollId());
    },
    //event handlers1
    OnPrepareUsersInfoButtonClick: function () {
        var poll = this.getCreatePoll();
        this.toggleLoadingPanel();
        poll.receivePollData(function () {
            this.getInfoStatusElement().innerText = poll.votedUsers.length;
            this.votedUsers = poll.GetVotedUsers().slice();
            this.toggleLoadingPanel();
        }.bind(this));
    },
    OnSendWarningButtonClick: function () {
        this.toggleLoadingPanel();
        this.fillNotVotedUsers();
        var messageHelper = new MessageHelper();
        var warningMessage = "Vote please";
        this.notVotedUses.forEach(function (user) {
            messageHelper.addMessage(user.GetId(), warningMessage);
        }.bind(this));
        messageHelper.sendMessages();
    },
    votedUsersContains: function (user) {
      return this.votedUsers.some(function (u) {
        return u.IsEqualTo(user);
      });
    },
    fillNotVotedUsers: function () {
        this.allUsers.forEach(function (user) {
            if(this.votedUsersContains(user)) {
                this.notVotedUses.push(user);
            }
        }.bind(this));
    },
    //<unused>
    GetAllUsers: function () {
        if (!Utils.IsExists(this.allUsers) || this.allUsers.length < 1)
            this.generateAllUsersList();
        return this.allUsers;
    }
    //</unused>
};
var MessageHelper = function () {
    this.messages = [];
    this.logListTable = null;
};
MessageHelper.prototype = {
    addMessage: function (receiver, text) {
      this.messages.push({receiver: receiver, text: text});
    },
    sendMessages: function () {
        var temp_messages = this.messages.slice();
        var messageSendIntervalId = setInterval(function () {
            var message = temp_messages.pop();
            if(!message){
                clearInterval(messageSendIntervalId);
                return;
            }
            Utils.sendRequest(this.getSendMessageRequestString(message), function (msg) {
                if(!msg.response)
                    temp_messages.push(message);
                else
                    this.addRecordToInfoTable(message, status);
            }.bind(this));
        }.bind(this), 1000);
    },
    getSendMessageRequestString: function (message) {
        return "https://api.vk.com/method/messages.send?user_id=" + message.receiver.id
            + "&message=" + message.text + "&access_token=" + token;
    },
    getLogListTable: function () {
        if(!this.logListTable)
            this.logListTable = document.getElementById("logList");
        return this.logListTable;
    },
    addRecordToInfoTable: function (message) {
        var date = new Date();
        this.addRecordToInfoTableCore([
            message.receiver.id,
            message.receiver.name,
            "Message send on " + date.toLocaleDateString() + " " +
            date.toLocaleTimeString()
        ]);
    },
    addRecordToInfoTableCore: function (cellValues) {
        var record = this.getLogListTable().insertRow();
        for(var i = 0; i < cellValues.length; i++){
            var recordCell = record.insertCell(-1);
            recordCell.innerHTML = cellValues[i];
        }
    }
};

// }());