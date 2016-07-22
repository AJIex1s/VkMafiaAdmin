var url = require('url');
var token = url.parse(window.location.href, true).query["access_token"];
var setVotedUsersCount = function (count) {
    var votedUsersLabel = document.getElementById("infoStatus");
    votedUsersLabel.innerText = count;
}
var initApp = function () {
    var helper = new PollHelper(token, "");
}
document.addEventListener('DOMContentLoaded', function() {
    var prepareUsersInfoBtn = document.getElementById("prepareUsersInfo");
    prepareUsersInfoBtn.onclick = function (e) {
        var postUrl = document.getElementById("votingLink").value;
        var postId = postUrl.split("w=poll")[1];
        if(!Utils.IsExists(postId) || postId == "")
            postId = "-83223612_893"; // return alert("enter post address");
        var poll = new Poll(postId);
        poll.receiveVotedUsers(function () {
            for (var i = 0; i < poll.votedUsers.length; i++) {
               console.log(poll.votedUsers[i].name);
            }
        });
        window.poll = poll;
    }

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
        } else this.getNumericId();
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
    this.pollId = -1;
    this.votedUsers = [];
    this.loading = null;
    this.Initialize();
}
Poll.prototype = {
    Initialize: function () {
        this.receiveVotedUsers();
    },
    ReceivePollData: function () {
        this.receiveAnswers();
    },
    createLoadingPanel: function () {
        var userTable = document.getElementById();
        var panel = document.createElement("DIV");
        var panelImg = document.createElement("IMG");
        panel.id = "lpInternal";
        panelImg.setAttribute("src", "../img/loading.gif");
        panel.appendChild(panelImg);
        return panel;
    },
    GetCreateLoadingPanel: function () {
        if(!this.loading)
            this.loading = this.createLoadingPanel();
    },
    GetPostId: function () {
        return this.postId || -1;
    },
    receiveAnswers: function (callback) {
        var pollObj = this;
        Utils.sendRequest(pollObj.answersRequest, function (msg) {
            if (!msg || !msg.response) {
                console.log(msg);
                return alert("error by answers request");
            }

            var poll = msg.response.items[0].attachments[0].poll;
            var answers = poll.answers;
            pollObj.SetPollId(poll.id);
            for (var i = 0; i < answers.length; i++) {
                pollObj.answerIds.push(answers[i].id);
            }
            if (Utils.IsExists(callback) && Utils.isFunction(callback))
                callback();
        });
    },
    getCreateVotedUsers: function (msg) {
        var all_users = [];
        for (var j = 0; j < msg.response.length; j++) {
            var users = msg.response[j].users.items;
            all_users = all_users.concat(users.slice());
        }
        return function (votedUsers, callback) {
            var userCreateIntervalId = setInterval(function () {
                var user = all_users.pop();
                if(!user){
                    if (Utils.IsExists(callback) && Utils.isFunction(callback))
                        callback();
                    clearInterval(userCreateIntervalId);
                    return;
                }
                var userObj = new User(user.id, user.first_name + " " + user.last_name);
                votedUsers.push(userObj);
            }, 500);
        };
    },
    receiveVotedUsers: function (callback) {
        var pollObj = this;
        this.receiveAnswers(function () {
            Utils.sendRequest(pollObj.getCreateVotingRequestUrl(), function (msg) {
                pollObj.getCreateVotedUsers(msg)(pollObj.votedUsers, callback);
            });
        });
    },
    getCreateVotingRequestUrl: function () {
        return "https://api.vk.com/method/polls.getVoters?owner_id=" + this.ownerId +
            "&poll_id=" + this.GetPollId() + "&answer_ids=" + this.getAnswerIdsAsString() +
            "&fields=nickname&name_case=nom&v=5.52&access_token=" + token;
    },
    //setters getters
    getAnswerIdsAsString: function () {
        return this.answerIds.toString();
    },
    SetPollId: function (pollId) {
        this.pollId = pollId;
    },
    GetPollId: function () {
        return this.pollId;
    }
}


var PollHelper = function (token, pollURL) {
    this.token = token;
    this.votedUserNames = [];
    this.notVotedUses = {};
    this.linkSplitter = "w=poll";
    this.infoStatusElement = null;
    this.votingLinkInputElement = null;
    this.defaultVotingLink = "https://vk.com/corleone_cat?w=poll-83223612_891";
    this.poll = new Poll(pollURL);
    this.users = [];
    //evt
}
PollHelper.prototype = {
    Initialize: function () {
        this.generateUserList();

    },
    getInfoStatusElement: function () {
        if(!Utils.IsExists(this.infoStatusElement))
            this.infoStatusElement = document.getElementById("infoStatus");
        return this.infoStatusElement;
    },
    getVotingLinkInputElement: function () {
        if(!Utils.IsExists(this.votingLinkInputElement))
            this.votingLinkInputElement = document.getElementById("votingLinkInput");
        return this.votingLinkInputElement;
    },
    getInfoStatusElement: function () {
        if(!Utils.IsExists(this.infoStatusElement))
            this.infoStatusElement = document.getElementById("infoStatus");
        return this.infoStatusElement;
    },
    generateUserList: function () {
        for (var userName in baseUserList) {
            var user = new User(baseUserList[userName], userName);
            this.users.push(user);
        }
    },
    GetUsers: function () {
        if (!Utils.IsExists(this.users))
            this.generateUserList();
        return this.users;
    }
};

// }());