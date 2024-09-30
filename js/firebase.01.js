var Firebase = {
    sendToken: function(token, userId, callId) {
        var data = {
            token: token,
            user_id: userId,
            call_id: callId,
            version: 4
        };

        $.post("/token.php", data, function(res) {
            console.log(res);
        });
    },

    trackToken: function(event) {
        var self = this;
        var userId = self.get('user_id');
        var callId = self.get('call_id');
        var ts = Date.now() - window.permissionShowTs;
        console.log(ts);

        var url = '/trackevents.php';
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.send(JSON.stringify({event: event, user_id:userId, call_id:callId, ts: ts}));
    },

    get: function(name) {
        if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search)) {
            return decodeURIComponent(name[1]);
        }
    },

    init: function() {
        if (!firebase) {
            conole.log("no firebase");
        }

        var config = {
            apiKey: "AIzaSyCn_7c5dyilasdCcdbkXhn_mx27Ng3ykp8",
            messagingSenderId: "1041850479028"
        };

        firebase.initializeApp(config);

        var messaging = firebase.messaging();
        var self = this;
        var userId = self.get('user_id');

        messaging.onTokenRefresh(function() {
            messaging.getToken()
                .then(function(refreshedToken) {
                    self.sendToken(refreshedToken, userId);
                })
                .catch(function(err) {
                    console.log('Unable to retrieve refreshed token ', err);
                });
        });

        window.permissionShowTs = Date.now();
        self.trackToken('messaging/permission-show');
        messaging.requestPermission()
            .then(function() {
                messaging.getToken()
                    .then(function(currentToken) {
                        if (currentToken) {
                            var callId = self.get('call_id');
                            self.sendToken(currentToken, userId, callId);
                            self.trackToken('messaging/permission-allow');
                        } else {
                            self.trackToken('messaging/permission-fail-id');
                            console.log('No Instance ID token available. Request permission to generate one.');
                        }
                    })
                    .catch(function(err) {
                        self.trackToken('messaging/permission-error-retrieving');
                        console.log('An error occurred while retrieving token. ', err);
                    });
            })
            .catch(function(err) {
                let blockTs = Date.now();
                if (blockTs - window.permissionShowTs > 500) {
                    self.trackToken(err.code);
                } else {
                    self.trackToken('messaging/permission-autoblocked');
                }
                console.log('Unable to get permission to notify.', err);
            });
    }
};

Firebase.init();
