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


    var PollDataSource = function(postId) {
        this.postId = postId;
        this.getPollCommand = "https://api.vk.com/method/wall.getById?posts=" + this.postId
            + "&extended=1&copy_history_depth=2&v=5.52&access_token=" + sessionStorage.token;
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
            this.votingMembers = votingMembers.slice();
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
                "&fields=nickname&name_case=nom&v=5.52&access_token=" + sessionStorage.token;
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
    var GetCreatePollDatasource = function(postId) {
        return new PollDataSource(postId);
    };
    DataSources.PollDataSource = PollDataSource;
    DataSources.GetCreatePollDatasource = GetCreatePollDatasource;
}());