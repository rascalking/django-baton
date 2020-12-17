import $ from 'jquery'
import Translator from './i18n'
import Modal from './Modal'
import breakpoints from './Breakpoints'

let ChangeList = {
  /**
   * ChangeList component
   *
   * Filtering stuff
   */
  init: function (opts) {
    this._filtersDiv = $('#changelist-filter')
    this.t = new Translator($('html').attr('lang'))
    this.filtersInModal = opts.changelistFiltersInModal
    this.filtersAlwaysOpen = opts.changelistFiltersAlwaysOpen
    this.initTemplates()
    if (this._filtersDiv.length) {
      this.activate()
    }
  },
  activate: function () {
    if ($('.changelist-form-container').length) { // django >= 3.1
      $('#changelist-filter').appendTo($('.changelist-form-container'))
    }
    if (this.filtersAlwaysOpen) {
      $(document.body).addClass('changelist-filter-active changelist-filter-always-open')
    } else {
      // filters active?
      let _activeFilters = /__[^=]+=/.test(location.search)
      // actions ?
      let _activeActions = $('#changelist-form > .actions').length !== 0
      let _changelistForm = $('#changelist-form')
      let _filtersToggler = $('<a />', {
        class:
          'changelist-filter-toggler' +
          (_activeFilters ? ' active' : '') + (_activeActions ? ' with-actions' : '')
      })
        .html('<i class="fa fa-filter"></i> <span>' + this.t.get('filter') + '</span>')

      if (this.filtersInModal || parseInt($(window).width()) < breakpoints.lg) {
        $('#changelist-filter').prop('id', 'changelist-filter-modal')
        let titleEl = $('#changelist-filter-modal > h2')
        let title = titleEl.html()
        titleEl.remove()
        let content = $('#changelist-filter-modal')[0].outerHTML
        // remove from dom
        $('#changelist-filter-modal').remove()
        this.modal = new Modal({
          title,
          content,
          size: 'md',
          hideFooter: true,
        })
        _filtersToggler
          .click(() => {
            this.modal.toggle()
          })
      } else {
        _filtersToggler
          .click(() => {
            $(document.body).toggleClass('changelist-filter-active')
            if (parseInt(this._filtersDiv.css('max-width')) === 100) { // diff between mobile and lg
              $('html,body').animate({ scrollTop: this._filtersDiv.offset().top })
            }
          })
      }
      _changelistForm.prepend(_filtersToggler)
    }
    if (/_popup=1/.test(location.href)) {
      $('#changelist-form .results').css('padding-top', '78px')
    }
  },
  initTemplates: function () {
    const positionMap = {
      above: 'before',
      below: 'after',
      top: 'prepend',
      bottom: 'append',
    }

    $('template[data-type=include]').each(function (index, template) {
      let position = positionMap[$(template).attr('data-position')]
      if (position !== undefined) {
        let el = $('#changelist-form')
        el[position]($(template).html())
      } else {
        console.error('Baton: wrong changelist include position detected')
      }
    })

    $('template[data-type=filters-include]').each(function (index, template) {
      let position = positionMap[$(template).attr('data-position')]
      if (position !== undefined && position !== 'before' && position !== 'after') {
        if (position === 'prepend' && $('#changelist-filter-clear').length) {
          $('#changelist-filter-clear').after($(template).html())
        } else if (position === 'prepend' && $('#changelist-filter > h2').length) {
          $('#changelist-filter > h2').after($(template).html())
        } else {
          let el = $('#changelist-filter')
          el[position]($(template).html())
        }
      } else {
        console.error('Baton: wrong changelist filters include position detected')
      }
    })

    $('template[data-type=attributes]').each(function (index, template) {
      try {
        let data = JSON.parse($(template).html())

        for (let key in data) {
          if (data.hasOwnProperty(key)) {
            let selector
            let getParent = 'tr'
            if (data[key]['selector']) {
              selector = data[key]['selector']
              delete data[key]['selector']
            } else {
              selector = '#result_list tr input[name=_selected_action][value=' + key + ']'
            }
            if (data[key]['getParent'] !== undefined) {
              getParent = data[key]['getParent']
              delete data[key]['getParent']
            }

            let el = getParent ? $(selector).parents(getParent) : $(selector)
            el.attr(data[key])
          }
        }
      } catch (e) {
        console.error(e)
      }
    })
  }
}

export default ChangeList
