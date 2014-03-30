flow-manager
============

A tool for managing flows within your single page app

Example
============

```
module.exports = (function() { //singleton

  var route = '/auth-flow'

  var steps = [
    {
      route : '/signin'
    },
    {
      route : '/redirect-to-twitter-auth',
      waitFor : CurrentUser.loaded,
      skipWhen : function () {
        return CurrentUser.get('isLoggedIn')
      },
      exitFlowWhen : function (flowState) {
        return !CurrentUser.get('isLoggedIn') && flowState && flowState.method === 'resume' //i.e. when user cancels twitter login on Add To Homescreen. We never recieve an OAuth fail event on add to homescreen (the fail only shows up in the popup safari window), so we need some way of knowing that the user canceled
      }
    },
    {
      route: '/email-capture',

      waitFor : CurrentUser.loaded,
      exitFlowWhen : function () {
        return !CurrentUser.get('isLoggedIn') //perhaps twitter auth was canceled or failed
      },
      skipWhen : function () { //skipWhen will only be evaluated when the waitFor promise has been resolved
        return CurrentUser.get('email')
      }
    }

  ]

  var authFlowManager = FlowManager({
    flowName : 'auth-flow',
    steps : steps,
    route : route
  })


  return authFlowManager

})()
```
