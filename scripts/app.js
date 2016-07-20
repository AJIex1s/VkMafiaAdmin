var url = require('url');
var token = url.parse(window.location.href,true).query["access_token"];
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
        "Аня Ступина": "dadsgun"
    };

    var Poll = function (postId) {
        this.postId = postId;
        this.ownerId = postId.split("_")[0];
        this.answersRequest = "https://api.vk.com/method/wall.getById?posts=" + this.postId
            + "&extended=1&copy_history_depth=2&v=5.52&access_token=" + token;
        this.answerIds = [];
        this.pollId = -1;

    }
    Poll.prototype = {
        Initialize: function () {
            this.ReceiveAnswers();
        },
        GetPostId: function () {
            return this.postId || -1;
        },
        ReceiveAnswers: function () {
            var pollObj = this;
            Utils.sendRequest(this.answersRequest, function (msg) {
                if(!msg || !msg.response) {
                    console.log(msg);
                    return alert("error by answers request");
                }

                var poll = msg.response.items[0].attachments[0].poll;
                var answers = poll.answers;
                pollObj.setPollId(poll.id);
                for(var i = 0; i < answers.length; i++){
                    pollObj.answerIds.push(answers[i].id);
                }
            });
        },
        GetVotedUsers: function(msg){
            var result = [];
            for(var j = 0; j < msg.response.length; j++){
                var users = msg.response[j].users.items;
                for(var i = 0; i < users.length; i++) {
                    result.push(users[i].first_name + " " + users[i].last_name);
                }
            }
            return result;
        },
        ReceiveVotedUsers: function () {
            var pollObj = this;
            Utils.sendRequest(this.getCreateVotingRequestUrl(), function (msg) {
                console.log(pollObj.GetVotedUsers(msg));
            });
        },
        getCreateVotingRequestUrl: function () {
            if(!Utils.IsExists(this.answerIds) || this.answerIds.length < 1 || this.pollId == -1)
                this.ReceiveAnswers();
            return "https://api.vk.com/method/polls.getVoters?owner_id=" + this.ownerId +
                "&poll_id=" + pollId + "&answer_ids=" + answerIds.toString() +
                "&fields=nickname&name_case=nom&v=5.52&access_token=" + token;
        },
        //setters getters

        setPollId: function (pollId) {
            this.pollId = pollId;
        },
        getPollId: function () {
            return this.pollId;
        },
        getAnswersId: function () {
            return this.answerIds;
        },
    }
    //start user
    var User = function (initialID, userName) {
        this.userName = userName;
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
        getNumberId: function () {
            if (!this.numericID)
                this.getNumericIdCore();
            return this.numericID;
        },
        getNumericIdCore: function () {
            var request = "https://api.vk.com/method/users.get?user_ids=" + this.initialID + "&access_token=" + token;
            Utils.sendRequest(request, function (msg) {
                this.numericID = msg.response[0].uid;
            });
        }
    };

    //end user///

    var VotingHelper = function (token) {
        this.token = token;
        this.votedUserNames = [];
        this.notVotedUses = {};
        this.linkSplitter = "w=poll";
        this.infoStatusElement = null;
        this.votingLinkInputElement = null;
        this.defaultVotingLink = "https://vk.com/corleone_cat?w=poll-83223612_891";
        this.pollHelper = null;
        this.users = [];
    }
    VotingHelper.prototype = {
        Initialize: function () {
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