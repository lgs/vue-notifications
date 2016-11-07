const PLUGIN_NAME = 'VueNotifications'
const PACKAGE_NAME = 'vue-notifications'
const PROPERTY_NAME = 'notifications'

const TYPE = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  success: 'success'
}

const VUE_VERSION = {
  evangelion: 1,
  ghostInTheShell: 2
}

const MESSAGES = {
  alreadyInstalled: `${PLUGIN_NAME}: plugin already installed`,
  methodNameConflict: `${PLUGIN_NAME}: names conflict - `
}

/**
 * @param  {Object} Vue
 * @return {Object}
 */
function getVersion (Vue) {
  const version = Vue.version.match(/(\d+)/g)
  return {
    major: +version[0],
    regular: +version[1],
    minor: +version[2]
  }
}

/**
 * @param  {String} type
 * @param  {String} message
 * @param  {String} title
 * @param  {String} debugMsg
 * @return  {String}
 */
function showDefaultMessage ({ type, message, title, debugMsg }) {
  let msg = `Title: ${title}, Message: ${message}, DebugMsg: ${debugMsg}, type: ${type}`

  if (type === TYPE.error) console.error(msg)
  else if (type === TYPE.warn) console.warn(msg)
  else if (type === TYPE.success) console.info(msg)
  else console.log(msg)

  return msg
}

/**
 * @param  {Object} vueApp
 * @param  {Object} config
 * @return {Object}
 */
function getValues (vueApp, config) {
  // TODO (S.Panfilov) test it!!! CurWorkPoint
  const result = {}

  Object.keys(config).forEach(field => {
    if (field !== 'cb') {
      // console.info(`---${field}---`)
      // if (typeof config[field] === 'function') {
      //   console.log(config[field]())
      // } else {
      //   console.log(config[field])
      // }
      // console.info(`---END_${field}---`)

      // console.info('THIS')
      // console.log(this)
      // console.info('THIS')

      result[field] = (typeof config[field] === 'function') ? config[field].call(vueApp) : config[field]
    }
  })

  return result
}

/**
 * @param  {Object} config
 * @param  {Object} options
 * @param  {Object} vueApp
 */
function showMessage (config, options, vueApp) {
  const valuesObj = getValues(vueApp, config)
  const method = (options && options[valuesObj.type]) ? options[valuesObj.type] : showDefaultMessage
  method(valuesObj)

  if (config.cb) return config.cb()
}

/**
 * @param {Object} targetObj
 * @param {Object} typesObj
 * @param {Object} options
 * @return {undefined}
 * */
function addMethods (targetObj, typesObj, options) {
  Object.keys(typesObj).forEach(v => {
    targetObj[typesObj[v]] = function (config) {
      config.type = typesObj[v]
      // TODO (S.Panfilov)fix 'vueApp' in param
      return showMessage(config, options)
    }
  })
}

/**
 * @param  {Object} vueApp
 * @param  {String} name
 * @param  {Object} options
 * @param  {Object} pluginOptions
 */
function setMethod (vueApp, name, options, pluginOptions) {
  if (!options.methods) options.methods = {}

  if (options.methods[name]) {
    // TODO (S.Panfilov) not sure - throw error here or just warn
    // if (options.methods[name]) throw console.error(MESSAGES.methodNameConflict + name)
    console.error(MESSAGES.methodNameConflict + name)
  } else {
    options.methods[name] = makeMethod(vueApp, name, options, pluginOptions)
  }
}

/**
 * @param  {Object} vueApp
 * @param  {String} configName
 * @param  {Object} options
 * @param  {Object} pluginOptions
 * @return {Function}
 */
function makeMethod (vueApp, configName, options, pluginOptions) {
  return function (config) {
    const newConfig = {}
    Object.assign(newConfig, VueNotifications.config)
    Object.assign(newConfig, options[VueNotifications.propertyName][configName])
    Object.assign(newConfig, config)

    return showMessage(newConfig, pluginOptions, vueApp)
  }
}

/**
 * @param  {Object} vueApp
 * @param  {Object} notifications
 * @param  {Object} pluginOptions
 */
function initVueNotificationPlugin (vueApp, notifications, pluginOptions) {
  if (!notifications) return
  Object.keys(notifications).forEach(name => {
    setMethod(vueApp, name, vueApp.$options, pluginOptions)
  })

  vueApp.$emit(`${PACKAGE_NAME}-initiated`)
}

const VueNotifications = {
  type: TYPE,
  propertyName: PROPERTY_NAME,
  config: {
    type: TYPE.info,
    timeout: 3000
  },
  installed: false,
  /**
   * Plugin | vue-notifications
   * @param  {Function} Vue
   * @param  {Object} pluginOptions
   * @this VueNotifications
   */
  install (Vue, pluginOptions = {}) {
    const mixin = {}
    let hook

    if (this.installed) throw console.error(MESSAGES.alreadyInstalled)
    if (getVersion(Vue).major === VUE_VERSION.evangelion) hook = 'init'
    if (getVersion(Vue).major === VUE_VERSION.ghostInTheShell) hook = 'beforeCreate'

    mixin[hook] = function () {
      const vueApp = this
      const vueAppOptions = this.$options
      const notificationsField = vueAppOptions[VueNotifications.propertyName]

      initVueNotificationPlugin(vueApp, notificationsField, pluginOptions)
    }

    Vue.mixin(mixin)
    addMethods(this, this.type, pluginOptions)

    this.installed = true
  }
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VueNotifications)
}
