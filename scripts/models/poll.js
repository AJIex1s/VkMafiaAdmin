var url = require("url");
var baseUserList = {};
var onScripStartLoading = function() {
    if(!Utils.IsExists(Controllers)) {
        throw "route.js is not included";
    }
};

(function() {
    onScripStartLoading();

    var User = function(id, name) {
        this.name = name;
        this.id = id;
    };

    User.prototype = {
        IsEqualTo: function(user) {
            return this.id === user.id;
        }
    };
    var ChatDataSource = function() { // TODO extract functionality

    };
    ChatDataSource.prototype = {};

    //TODO Extract
    var votingMembers = [];
    Utils.ToggleLoadingPanel();
    var getChatUsersRequest = "https://api.vk.com/method/messages.getChatUsers?"+
        "chat_id=31&fields=screen_name&v=5.52&access_token=" + sessionStorage.token;
    Utils.SendRequest(getChatUsersRequest, function(msg) {
        var i = 0, userName, user;
        var response = msg.response;
        if(response) {
            for(i = 0; i < response.length; i++) {
                user = response[i];
                userName = user.first_name + " " + user.last_name;
                votingMembers.push(new  User(user.id, userName));
            }
            Utils.ToggleLoadingPanel();
        }
    });
    // end TODO


    var PollVotersData = function(poll) {
        this.poll = poll;
        this.answerIds = [];
        this.answers = [];
        this.votingMembers = [];
        this.votedUsers = [];
        this.notVotedUsers = [];
        this.undecidedVoters = [];
        this.negativeVotedUsers = [];
        this.Initialize();
    };
    PollVotersData.prototype = {
        Initialize: function() {
            this.fillVotingMembers();
        },
        fillVotingMembers: function() {
            this.votingMembers = votingMembers.slice();
        },
        LoadData: function(onDataLoaded) {
            if(this.poll)
                this.fillAnswers(this.poll.answers);
            else throw "poll not loaded";

            Utils.SendRequest(this.getVotersCommand(), function(msg) {
                this.fillVotedUsers(msg.response);
                this.fillNotVotedUsers();
                if(Utils.IsExists(onDataLoaded) && Utils.IsFunction(onDataLoaded)) {
                    onDataLoaded();
                }
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
                var users = this.getUserCollection(response[j].users.items);
                this.votedUsers = this.votedUsers.concat(users);
                // define undecided & negative voters only by indirect sign
                // TODO check possibility to define it by direct sign
                if(j == 1)
                    this.undecidedVoters = this.undecidedVoters.concat(users);
                else if(j == 2)
                    this.negativeVotedUsers = this.negativeVotedUsers.concat(users);
            }
        },
        fillNotVotedUsers: function() {
            this.notVotedUsers = [];
            this.votingMembers.forEach(function(user) {
                if(!Utils.ContainsObject(this.votedUsers, user)) {
                    this.notVotedUsers.push(user);
                }
            }.bind(this));
        },
        getUserCollection: function (users) {
            var result = [];
            for(var i = 0; i < users.length; i++) {
                //noinspection JSUnresolvedVariable
                var userObj = new User(users[i].id, users[i].first_name + " " + users[i].last_name);
                if(Utils.ContainsObject(this.votingMembers, userObj)) {
                    result.push(userObj);
                }
            }
            return result;
        },
        getVotersCommand: function() {
            return "https://api.vk.com/method/polls.getVoters?owner_id=-126602918" +
                "&poll_id=" + this.poll.id + "&answer_ids=" + this.getAnswerIdsAsString() +
                "&fields=nickname&name_case=nom&v=5.52&access_token=" + sessionStorage.token;
        },
        getAnswerIdsAsString: function() {
            return this.getAnswerIds().toString();
        },
        GetAnswers: function () {
            return this.answers;
        },
        GetNotVotedUsers: function () {
            return this.notVotedUsers;
        },
        GetUndecidedVoters: function () {
            return this.undecidedVoters;
        },
        GetNegativeVotedUsers: function () {
            return this.negativeVotedUsers;
        },
        //setters getters
        getAnswerIds: function() {
            if(!this.answerIds || this.answerIds.length < 1)
                this.answerIds = this.answers.map(function(answer) {
                    return answer.id
                });
            return this.answerIds;
        },
    };
    var GetCreatePollVotersData = function(poll) {
        return new PollVotersData(poll);
    };
    DataSources.PollVotersData = PollVotersData;
    DataSources.GetCreatePollVotersData = GetCreatePollVotersData;
}());