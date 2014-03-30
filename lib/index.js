module.exports = function (options) {

  //before calling start(), next(), or end, make sure to call setRouter()

  var flowName = options.flowName
    , steps = options.steps
    , route = options.route

  var currentStep = localStorage.getItem(flowName + '::currentStep') ? +localStorage.getItem(flowName + '::currentStep') : undefined
  , originalRoute = localStorage.getItem(flowName + '::originalRoute') ? localStorage.getItem(flowName + '::originalRoute') : undefined
  , router = undefined
  , state = localStorage.getItem(flowName + '::state') ? localStorage.getItem(flowName + '::state') : 'not-started'


  function skipOrGoWithoutReplace(step) {
    if (step.skipWhen && step.skipWhen()) {
      next()
    }
    else {
      router.goWithoutReplace(step.route)
    }
  }


  function resume() {
    if (state === 'not-started') {
      throw 'gotta call start() before resume()'
    }


    var step = steps[currentStep]

    _processStep({
      step : step,
      flowState : {
        method : 'resume'
      }
    })
  }

  //probably need some code to make sure that while waiting for waitFor, next() isnt called (outside of this component [ calls to next() from skipOrGoWithoutReplace() are cool]) / calls to next() are queued up

  function next() {
    if (state === 'not-started') {
      throw 'gotta call start() before next()'
    }

    var step


    if (currentStep + 1 < steps.length) {
      currentStep++
      localStorage.setItem(flowName + '::currentStep', currentStep)

      var step = steps[currentStep]

      console.log('flow', 'routing to', step.route)

      _processStep({
        step : step,
        flowState : {
          method : 'next'
        }
      })

    }
    else {
      console.log('flow', 'routing to', originalRoute)
      router.go(originalRoute)
    }
  }

  function _processStep(options) {

    var step = options.step
      , flowState = options.flowState

    if (step.waitFor) {

      step
        .waitFor
        .then(function () {
          //console.log(step.precondition, step.precondition && step.precondition())

          if (step.exitFlowWhen && step.exitFlowWhen(flowState)) {
            endAndGo(originalRoute)
          }
          else {
            skipOrGoWithoutReplace(step)
          }
        })
    }
    else {

      if (step.exitFlowWhen && step.exitFlowWhen(flowState)) {
        endAndGo(originalRoute)
      }
      else {
        skipOrGoWithoutReplace(step)
      }
    }
  }

  function start(options) {

    options = options || {}

    state = 'started'
    localStorage.setItem(flowName + '::state', state)

    if (options.replaceState) {
      router.replaceState(route)
    }
    else {
      router.pushState(route)
    }


    originalRoute = options.originalRoute //maybe should just be document.location.pathname?
    localStorage.setItem(flowName + '::originalRoute', originalRoute)
    currentStep = -1
    localStorage.setItem(flowName + '::currentStep', currentStep)

    next()
  }

  function setRouter(_router) {
    router = _router
  }

  function end() {
    localStorage.removeItem(flowName + '::originalRoute')
    localStorage.removeItem(flowName + '::currentStep')
    localStorage.removeItem(flowName + '::state')
    originalRoute = undefined
    currentStep = undefined
    state = undefined
  }

  function endAndGo(path) {

    end()
    router.go(path)
  }

  return {
    next : next,
    start : start,
    resume : resume,
    end : end,
    setRouter : setRouter,
    endAndGo : endAndGo,
    route : route
  }


}
