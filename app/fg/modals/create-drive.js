/* globals customElements */
import { LitElement, html, css } from '../vendor/lit-element/lit-element'
import { repeat } from '../vendor/lit-element/lit-html/directives/repeat'
import * as bg from './bg-process-rpc'
import commonCSS from './common.css'
import inputsCSS from './inputs.css'
import buttonsCSS from './buttons2.css'
import spinnerCSS from './spinner.css'
import _groupBy from 'lodash.groupby'
import { BUILTIN_TYPES, BUILTIN_FRONTENDS, filterFrontendByType } from '../../lib/hyper'

class CreateDriveModal extends LitElement {
  static get properties () {
    return {
      title: {type: String},
      description: {type: String},
      type: {type: String},
      frontend: {type: String},
      errors: {type: Object}
    }
  }

  static get styles () {
    return [commonCSS, inputsCSS, buttonsCSS, spinnerCSS, css`
    .wrapper {
      padding: 0;
    }
    
    h1.title {
      padding: 14px 20px;
      margin: 0;
      border-color: #bbb;
    }
    
    form {
      padding: 14px 20px;
      margin: 0;
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 450px;
      margin-bottom: 10px;
    }

    form input {
      font-size: 14px;
      height: 34px;
      padding: 0 10px;
      border-color: #bbb;
      margin-top: 0;
    }

    select {
      width: 100%;
      display: block;
      height: 130px;
      border-radius: 4px;
      border: 1px solid #bbc;
      font-size: 13px;
      letter-spacing: 0.3px;
      padding: 10px 0 5px;
    }

    select:focus {
      outline: 0;
      border: 1px solid rgba(41, 95, 203, 0.8);
      box-shadow: 0 0 0 2px rgba(41, 95, 203, 0.2);
    }

    select option {
      padding: 5px;
    }

    select option:first-of-type {
      margin-top: 4px;
    }

    select option:last-of-type {
      margin-bottom: 8px;
    }
    
    hr {
      border: 0;
      border-top: 1px solid #ddd;
      margin: 20px 0;
    }

    img.preview {
      display: block;
      width: 450px;
      height: 100%;
      border: 1px solid #bbc;
      border-radius: 4px;
      object-fit: cover;
      box-sizing: border-box;
    }

    .ctrls {
      padding-right: 10px;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
    }
    
    .form-actions button {
      padding: 6px 12px;
      font-size: 12px;
    }
    `]
  }

  constructor () {
    super()
    this.cbs = undefined
    this.title = ''
    this.description = ''
    this.type = undefined
    this.links = undefined
    this.author = undefined
    this.errors = {}

    // export interface
    window.createDriveClickSubmit = () => this.shadowRoot.querySelector('button[type="submit"]').click()
    window.createDriveClickCancel = () => this.shadowRoot.querySelector('.cancel').click()
  }

  async init (params, cbs) {
    this.cbs = cbs
    this.title = params.title || ''
    this.description = params.description || ''
    this.type = params.type || ''
    this.links = params.links
    this.frontend = params.frontend
    this.author = undefined // this.author = params.author

    if (!this.frontend || !this.availableFrontends.find(fe => fe.url === this.frontend)) {
      if (this.type) {
        let fe = this.getMatchingFrontends(this.type)
        this.frontend = fe[0] ? fe[0].url : ''
      }
      if (!this.type) {
        this.frontend = this.availableFrontends[0].url
      }
    }

    await this.requestUpdate()
  }

  updated () {
    this.adjustHeight()
  }

  adjustHeight () {
    var height = this.shadowRoot.querySelector('div').clientHeight
    bg.modals.resizeSelf({height})
  }

  get availableFrontends () {
    return BUILTIN_FRONTENDS
  }

  getMatchingFrontends (type) {
    return this.availableFrontends.filter(t => filterFrontendByType(t.manifest, type))
  }

  // rendering
  // =

  render () {
    var currentFrontend = this.availableFrontends.find(fe => fe.url === this.frontend)
    var frontendImg = currentFrontend ? currentFrontend.img : 'none'
    const feopt = (id, label) => html`<option value=${id} ?selected=${id === this.frontend}>${label}</option>`
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="wrapper">
        <h1 class="title">
          Create New Hyperdrive
        </h1>
        <form @submit=${this.onSubmit}>
          <div class="layout">
            <div class="ctrls">
              <input autofocus name="title" tabindex="2" value=${this.title || ''} @change=${this.onChangeTitle} class="${this.errors.title ? 'has-error' : ''}" placeholder="Title" />
              ${this.errors.title ? html`<div class="error">${this.errors.title}</div>` : ''}

              <input name="desc" tabindex="3" @change=${this.onChangeDescription} value=${this.description || ''} placeholder="Description (optional)">
                
              <select name="frontend" multiple @change=${this.onChangeFrontend}>
                ${repeat(BUILTIN_TYPES, ({type, title}) => html`
                  <optgroup label="&nbsp;&nbsp;${title}">
                    ${repeat(this.getMatchingFrontends(type), fe => feopt(fe.url, fe.title))}
                  </optgroup>
                `)}
              </select>
            </div>

            <img class="preview" src="beaker://assets/img/frontends/${frontendImg}.png">
          </div>

          <div class="form-actions">
            <button type="button" @click=${this.onClickCancel} class="cancel" tabindex="5">Cancel</button>
            <button type="submit" class="primary" tabindex="4">Create</button>
          </div>
        </form>
      </div>
    `
  }

  // event handlers
  // =

  onChangeTitle (e) {
    this.title = e.target.value.trim()
  }

  onChangeDescription (e) {
    this.description = e.target.value.trim()
  }

  onChangeType (e) {
    this.type = e.target.value.trim()
    this.frontend = this.matchingFrontends[0].url
  }

  onChangeFrontend (e) {
    this.frontend = e.target.value.trim()
  }

  onFrontendImgError (e) {
    e.currentTarget.setAttribute('src', 'beaker://assets/default-frontend-thumb')
  }

  onClickCancel (e) {
    e.preventDefault()
    this.cbs.reject(new Error('Canceled'))
  }

  async onSubmit (e) {
    e.preventDefault()

    if (!this.title) {
      this.errors = {title: 'Required'}
      return
    }

    this.shadowRoot.querySelector('button[type="submit"]').innerHTML = `<div class="spinner"></div>`

    try {
      var frontend = this.availableFrontends.find(fe => fe.url === this.frontend)
      var info = {
        title: this.title,
        description: this.description,
        type: this.type !== '' ? this.type : undefined,
        author: this.author,
        links: this.links,
        frontend: frontend && !frontend.url.startsWith('null:') ? frontend.url : undefined,
        prompt: false
      }
      var url = await bg.hyperdrive.createDrive(info)
      if (frontend && frontend.scaffold) {
        for (let path in frontend.scaffold) {
          if (frontend.scaffold[path] === 'folder') {
            await bg.hyperdrive.mkdir(url, path)
          } else {
            await bg.hyperdrive.writeFile(url, path, frontend.scaffold[path](info))
          }
        }
      }
      this.cbs.resolve({url})
    } catch (e) {
      this.cbs.reject(e.message || e.toString())
    }
  }
}

customElements.define('create-drive-modal', CreateDriveModal)