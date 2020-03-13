import { LitElement, html } from '../../app-stdlib/vendor/lit-element/lit-element.js'
import { classMap } from '../../app-stdlib/vendor/lit-element/lit-html/directives/class-map.js'
import { pluralize, toNiceDomain } from '../../app-stdlib/js/strings.js'
import _get from 'lodash.get'
import * as beakerPermissions from '@beaker/permissions'
import mainCSS from '../css/main.css.js'
import './com/user-session.js'
import './com/requested-perms.js'

const isDatHashRegex = /^[a-z0-9]{64}/i

class SiteInfoApp extends LitElement {
  static get properties () {
    return {
      url: {type: String},
      user: {type: Object},
      isLoading: {type: Boolean},
      info: {type: Object},
      requestedPerms: {type: Object}
    }
  }

  static get styles () {
    return [mainCSS]
  }

  get isDrive () {
    return this.url && this.url.startsWith('hyper:')
  }

  get isHttps () {
    return this.url && this.url.startsWith('https:')
  }

  get isHttp () {
    return this.url && this.url.startsWith('http:')
  }

  get isBeaker () {
    return this.url && this.url.startsWith('beaker:')
  }

  get isRootDrive () {
    return this.origin === beaker.hyperdrive.drive('sys').url
  }

  get drive () {
    return beaker.hyperdrive.drive(this.url)
  }

  get origin () {
    let urlp = new URL(this.url)
    return urlp.origin
  }

  get hostname () {
    let urlp = new URL(this.url)
    return urlp.hostname
  }

  get pathname () {
    let urlp = new URL(this.url)
    return urlp.pathname
  }

  constructor () {
    super()
    this.reset()

    // global event listeners
    window.addEventListener('blur', e => {
      beaker.browser.toggleSiteInfo(false)
      this.reset()
    })
    window.addEventListener('contextmenu', e => e.preventDefault())
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        beaker.browser.toggleSiteInfo(false)
      }
    })
    const globalAnchorClickHandler = (isPopup) => e => {
      e.preventDefault()
      var a = e.path.reduce((acc, v) => acc || (v.tagName === 'A' ? v : undefined), undefined)
      if (a) {
        var href = a.getAttribute('href')
        if (href && href !== '#' && !href.startsWith('beaker://')) {
          if (isPopup || e.metaKey || a.getAttribute('target') === '_blank') {
            beaker.browser.openUrl(href, {setActive: true})
          } else {
            beaker.browser.gotoUrl(href)
          }
          beaker.browser.toggleSiteInfo(false)
        }
      }
    }
    document.body.addEventListener('auxclick', globalAnchorClickHandler(true))
    document.body.addEventListener('click', globalAnchorClickHandler(false))

    // export interface
    window.init = this.init.bind(this)
    window.reset = this.reset.bind(this)
  }

  init (params) {
    this.url = params.url
    this.load()
  }

  reset () {
    this.url = ''
    this.isLoading = true
    this.info = undefined
    this.requestedPerms = undefined
  }

  async load () {
    this.isLoading = true
    if (!this.url) return
    try {
      this.info = {}
      if (this.isDrive) {
        // get drive info
        let drive = this.drive
        this.info = await drive.getInfo()
      } else {
        this.info = {
          title: this.hostname,
          domain: this.isHttps ? this.hostname : undefined
        }
      }

      // all sites: get requested perms
      var perms = await beaker.sitedata.getPermissions(this.origin)
      this.requestedPerms = await Promise.all(Object.entries(perms).map(async ([perm, value]) => {
        var opts = {}
        var permParam = beakerPermissions.getPermParam(perm)
        if (isDatHashRegex.test(permParam)) {
          let driveInfo
          try { driveInfo = await beaker.beaker.hyperdrive.drive(permParam).getInfo() }
          catch (e) { /* ignore */ }
          opts.title = driveInfo && driveInfo.title ? driveInfo.title : toNiceDomain(permParam)
        }
        return {perm, value, opts}
      }))
    } catch (e) {
      console.error(e)
    }
    this.isLoading = false
  }

  // rendering
  // =

  render () {
    if (this.isLoading) {
      return html`<div class="loading"><span class="spinner"></span> Loading...</div>`
    }
    if (this.isDrive && this.info && this.info.version === 0) {
      return html`
        <div class="site-info">
          <div class="details">
            <h1>Site not found</h1>
            <p class="protocol">Make sure the address is correct and try again</p>
          </div>
        </div>
      `
    }
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div>
        ${this.renderSiteInfo()}
        ${this.renderView()}
      </div>
    `
  }

  renderSiteInfo () {
    var protocol = ''
    if (this.isHttps) protocol = html`<p class="protocol">Accessed using a secure connection</p>`
    if (this.isBeaker) protocol = html`<p class="protocol">This page is served by Beaker</p>`
    var isSaved = _get(this.driveCfg, 'saved')
    return html`
      <div class="site-info">
        <div class="details">
          <h1>${this.info.title}</h1>
          ${this.isDrive && this.info.description ? html`<p class="desc">${this.info.description}</p>` : ''}
          ${protocol}
        </div>
      </div>
    `
  }

  renderView () {
    return html`
      <div class="inner">
        ${this.isHttp ? html`
          <div class="notice">
            <p class="warning">
              <span class="fas fa-exclamation-triangle"></span> Your connection to this site is not secure.
            </p>
            <p>
              You should not enter any sensitive information on this site (for example, passwords or credit cards) because it could be stolen by attackers.
            </p>
          </div>
        ` : ''}

        <user-session
          origin=${this.origin}
        ></user-session>

        <requested-perms
          origin=${this.origin}
          .perms=${this.requestedPerms}
        ></requested-perms>
      </div>
    `
  }

  async updated () {
    setTimeout(() => {
      // adjust height based on rendering
      var height = this.shadowRoot.querySelector('div').clientHeight
      if (!height) return
      beaker.browser.resizeSiteInfo({height})
    }, 50)
  }

  // events
  // =

  onChangeUrl (e) {
    this.url = e.detail.url
    beaker.browser.gotoUrl(this.url)
    this.load()
  }
}

customElements.define('site-info-app', SiteInfoApp)
