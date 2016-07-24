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
    "Дмитрий Шорников": "fil0sof",
    "Константин Попов": "gistrion",
    "Ольга Черкас": "olechka_cherkas",
    "Максим Романов": "romanovma",
    "Максим Михайлов": "id19039652",
    "Любовь Шериф": "id19262364",
    "Маргарита Иванушкина": "id20510898",
    "Валентин Минаев": "devilleed",
    "Евгения Деревесникова": "evgeniya_derevesnikova",
    "Алексей Андрианов": "ajiex1s",
    "Никитос Семенюк": "id34579829",
    "Никита Качура": "heartless_71",
    "Никита Митаков": "id48305024",
    "Екатерина Россер": "id64342674",
    "Илья Карасёв": "id76058639",
    "Настенька Минаева": "id106592179",
    "Марина Красовицкая": "xxxx_yyyy",
    "Lucky Cherrylee": "lucky.cherry",
    "Алекс Легдижн": "id196992111",
    "Александр Курсиков": "id268217601",
    "Александр Антонов": "zalexandrz",
    "Инессик Юдина": "id138676124",
    "Лиза Лосева": "ms.mustique",
    "Self Destroy": "id354027455",
    "Наденька Симоненко": "sunny_girl_n",
    "Евгений Ктитарев": "ktitarev_eugene",
    "Екатерина Карлова": "id84887066",
    "Юлия Архипова": "id_yuliach",
    "Надежда Хохич": "id202893287",
    "Ангелина Киселева": "id206609238",
    "Аня Ступина": "dadsgun",
    "Борис Борисович": "sbb0609"
};
//start user
var User = function (initialID, name) {
    this.name = name;
    this.initialID = initialID;
    this.numericID = null;
    this.Initialize();
}

User.prototype = {
    Initialize: function () {
        if (this.isInitialIdNumeric()) {
            this.numericID = this.ID;
        }
    },
    isInitialIdNumeric: function () {
        return this.initialID[0] == 'i' && this.initialID[1] == 'd';
    },
    getNumericId: function () {
        var request = "https://api.vk.com/method/users.get?user_ids=" + this.initialID + "&access_token=" + token;
        Utils.sendRequest(request, function (msg) {
            if(msg.response && msg.response[0])
                this.numericID = "id" + msg.response[0].uid;
            else {console.log("error");
            console.log(msg);}
        });
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

    GetPostId: function () {
        return this.postId || -1;
    },
    fillAnswers: function (answers) {
        for (var i = 0; i < answers.length; i++) {
            this.answers.push(answers[i]);
        }
    },
    receivePollData: function (callback) {
        var pollObj = this;
        Utils.sendRequest(this.answersRequest, function (msg) {
            if (!msg || !msg.response) {
                console.log(msg);
                return alert("error by answers request");
            }
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
        var result = []
        for(var j = 0; j < msg.response.length; j++){
            var users = msg.response[j].users.items;
            for(var i = 0; i < users.length; i++) {
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
    this.votedUserNames = [];
    this.notVotedUses = {};
    this.linkSplitter = "w=poll";
    this.infoStatusElement = null;
    this.votingLinkInputElement = null;
    this.sendWarningButton = null;
    this.prepareUsersInfoButton = null;
    this.defaultVotingLink = "https://vk.com/corleone_cat?w=poll-83223612_891";
    this.poll = null;
    this.users = [];
    this.loadingPanelElment = null;
    this.loadingOverlayElment = null;
    //evt
    this.Initialize();
};
PollHelper.prototype = {
    Initialize: function () {
        //this.generateUserList();
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
    generateUserList: function () {
        this.toggleLoadingPanel();
        var tempUserNames = Object.keys(baseUserList);
        var helperObj = this;
        var userCreateIntervalId = setInterval(function () {
            var userName = tempUserNames.pop();
            if(!userName) {
                helperObj.toggleLoadingPanel();
                clearInterval(userCreateIntervalId);
                return;
            }
            var user = new User(baseUserList[userName], userName);
            helperObj.users.push(user);
        }, 200);
    },
    GetUsers: function () {
        if (!Utils.IsExists(this.users) || this.users.length < 1)
            this.generateUserList();
        return this.users;
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
        return postURL.value.split("w=poll")[1];
    },
    getPoll: function () {
        return new Poll(this.getPollId());
    },

    //event handlers123
    OnPrepareUsersInfoButtonClick: function () {
        var poll = this.getPoll();
        this.toggleLoadingPanel();
        poll.receivePollData(function () {
            this.getInfoStatusElement().innerText = poll.votedUsers.length;
            this.toggleLoadingPanel();
        }.bind(this));
    },
    OnSendWarningButtonClick: function () {

    }
};

// }());