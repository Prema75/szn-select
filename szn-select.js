'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  const CSS_STYLES = `
%{CSS_STYLES}%
  `
  const CSS_STYLES_TAG = 'data-styles--szn-select'

  const MIN_BOTTOM_SPACE = 160 // px

  let stylesInjected = false

  SznElements['szn-select'] = class SznSelect {
    constructor(rootElement, uiContainer) {
      if (!rootElement.hasOwnProperty('minBottomSpace')) {
        Object.defineProperty(rootElement, 'minBottomSpace', {
          get: () => rootElement._broker._minBottomSpace,
          set: value => {
            rootElement._broker._minBottomSpace = value
            if (rootElement._broker._ui && rootElement._broker._ui._broker) {
              rootElement._broker._ui.minBottomSpace = value
            }
          },
        })
      }

      this.isOpen = false

      this._root = rootElement
      this._select = rootElement.querySelector('select')
      this._uiContainer = uiContainer
      this._ui = document.createElement('szn-select-ui')
      this._minBottomSpace = MIN_BOTTOM_SPACE
      this._accessiblityBroker = null
      this._mounted = false

      this._onUiClicked = onUiClicked.bind(null, this)
      this._onChange = onChange.bind(null, this)

      if (!stylesInjected) {
        const stylesContainer = document.createElement('style')
        stylesContainer.innerHTML = CSS_STYLES
        stylesContainer.setAttribute(CSS_STYLES_TAG, '')
        document.head.appendChild(stylesContainer)
        stylesInjected = true
      }

      this._ui.onUiInteracted = () => {
        if (this._accessiblityBroker) {
          this._accessiblityBroker.onUiClicked()
        }
      }
      if (this._uiContainer) {
        this._uiContainer.appendChild(this._ui)
      }
    }

    onMount() {
      this._mounted = true
      if (!this._uiContainer) {
        this._uiContainer = this._root.querySelector('[data-szn-select-ui]')
        this._uiContainer.appendChild(this._ui)
      }

      if (!this._select) {
        this._select = this._root.querySelector('select')
      }

      SznElements.awaitElementReady(this._ui, () => {
        if (!this._mounted) {
          return
        }

        this._ui.minBottomSpace = this._minBottomSpace
        this._ui.setSelectElement(this._select)

        let implementation = null
        for (const possibleImplementation of AccessibilityBroker.implementations) {
          if (possibleImplementation.compatibilityTest(this._select)) {
            implementation = possibleImplementation
            break
          }
        }
        this._accessiblityBroker = new implementation(this._select, this._ui, this)
        this._accessiblityBroker.onMount()

        addEventListeners(this)
        finishInitialization(this)
      })
    }

    onUnmount() {
      this._mounted = false

      if (this._accessiblityBroker) {
        this._accessiblityBroker.onUnmount()
      }

      removeEventListeners(this)
    }
  }

  function addEventListeners(instance) {
    instance._uiContainer.addEventListener('click', instance._onUiClicked)
    instance._uiContainer.addEventListener('change', instance._onChange)
  }

  function removeEventListeners(instance) {
    instance._uiContainer.removeEventListener('click', instance._onUiClicked)
    instance._uiContainer.removeEventListener('change', instance._onChange)
  }

  function onUiClicked(instance, event) {
    instance._accessiblityBroker.onUiClicked(event)
  }

  function onChange(instance) {
    instance._accessiblityBroker.onChange()
  }

  function finishInitialization(instance) {
    const rootAttributes = {
      'data-szn-select-ready': '',
    }
    rootAttributes['data-szn-select-single'] = instance._select.multiple ? null : ''

    if (instance._root.hasAttribute('data-szn-select-standalone')) {
      setAttributes(instance._root, rootAttributes)
    } else {
      instance._root.dispatchEvent(new CustomEvent('szn-select:ready', {
        bubbles: true,
        cancelable: true,
        detail: {
          attributes: rootAttributes,
        },
      }))
    }
  }

  function setAttributes(element, attributes) {
    for (const attributeName of Object.keys(attributes)) {
      if (attributes[attributeName] === null) {
        element.removeAttribute(attributeName)
      } else {
        element.setAttribute(attributeName, attributes[attributeName])
      }
    }
  }

  // %{A11Y_IMPLEMENTATIONS}%

  AccessibilityBroker.implementations = [
    RichNativeSelect,
  ]

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
