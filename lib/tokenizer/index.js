/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');
var Token = require('./token');
var KeyEvent = require('../keyevent');
var Typeahead = require('../typeahead');
var classNames = require('classnames');

function _arraysAreDifferent(array1, array2) {
  if (array1.length != array2.length) {
    return true;
  }
  for (var i = array2.length - 1; i >= 0; i--) {
    if (array2[i] !== array1[i]) {
      return true;
    }
  }
}

/**
 * A typeahead that, when an option is selected, instead of simply filling
 * the text entry widget, prepends a renderable "token", that may be deleted
 * by pressing backspace on the beginning of the line with the keyboard.
 */
var TypeaheadTokenizer = React.createClass({
  displayName: 'TypeaheadTokenizer',

  propTypes: {
    name: React.PropTypes.string,
    options: React.PropTypes.array,
    customClasses: React.PropTypes.object,
    allowCustomValues: React.PropTypes.number,
    defaultSelected: React.PropTypes.array,
    defaultValue: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    inputProps: React.PropTypes.object,
    onTokenRemove: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onKeyUp: React.PropTypes.func,
    onTokenAdd: React.PropTypes.func,
    filterOption: React.PropTypes.func,
    maxVisible: React.PropTypes.number
  },

  getInitialState: function getInitialState() {
    return {
      // We need to copy this to avoid incorrect sharing
      // of state across instances (e.g., via getDefaultProps())
      selected: this.props.defaultSelected.slice(0)
    };
  },

  getDefaultProps: function getDefaultProps() {
    return {
      options: [],
      defaultSelected: [],
      customClasses: {},
      allowCustomValues: 0,
      defaultValue: '',
      placeholder: '',
      inputProps: {},
      onKeyDown: function onKeyDown(event) {},
      onKeyUp: function onKeyUp(event) {},
      onTokenAdd: function onTokenAdd() {},
      onTokenRemove: function onTokenRemove() {}
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    // if we get new defaultProps, update selected
    if (_arraysAreDifferent(this.props.defaultSelected, nextProps.defaultSelected)) {
      this.setState({ selected: nextProps.defaultSelected.slice(0) });
    }
  },

  focus: function focus() {
    this.refs.typeahead.focus();
  },

  getSelectedTokens: function getSelectedTokens() {
    return this.state.selected;
  },

  // TODO: Support initialized tokens
  //
  _renderTokens: function _renderTokens() {
    var tokenClasses = {};
    tokenClasses[this.props.customClasses.token] = !!this.props.customClasses.token;
    var classList = classNames(tokenClasses);
    var result = this.state.selected.map(function (selected) {
      return React.createElement(
        Token,
        { key: selected, className: classList,
          onRemove: this._removeTokenForValue,
          name: this.props.name },
        selected
      );
    }, this);
    return result;
  },

  _getOptionsForTypeahead: function _getOptionsForTypeahead() {
    // return this.props.options without this.selected
    return this.props.options;
  },

  _onKeyDown: function _onKeyDown(event) {
    // We only care about intercepting backspaces
    if (event.keyCode === KeyEvent.DOM_VK_BACK_SPACE) {
      return this._handleBackspace(event);
    }
    this.props.onKeyDown(event);
  },

  _handleBackspace: function _handleBackspace(event) {
    // No tokens
    if (!this.state.selected.length) {
      return;
    }

    // Remove token ONLY when bksp pressed at beginning of line
    // without a selection
    var entry = this.refs.typeahead.refs.entry.getDOMNode();
    if (entry.selectionStart == entry.selectionEnd && entry.selectionStart == 0) {
      this._removeTokenForValue(this.state.selected[this.state.selected.length - 1]);
      event.preventDefault();
    }
  },

  _removeTokenForValue: function _removeTokenForValue(value) {
    var index = this.state.selected.indexOf(value);
    if (index == -1) {
      return;
    }

    this.state.selected.splice(index, 1);
    this.setState({ selected: this.state.selected });
    this.props.onTokenRemove(value);
    return;
  },

  _addTokenForValue: function _addTokenForValue(value) {
    if (this.state.selected.indexOf(value) != -1) {
      return;
    }
    this.state.selected.push(value);
    this.setState({ selected: this.state.selected });
    this.refs.typeahead.setEntryText('');
    this.props.onTokenAdd(value);
  },

  render: function render() {
    var classes = {};
    classes[this.props.customClasses.typeahead] = !!this.props.customClasses.typeahead;
    var classList = classNames(classes);
    return React.createElement(
      'div',
      { className: 'typeahead-tokenizer' },
      this._renderTokens(),
      React.createElement(Typeahead, { ref: 'typeahead',
        className: classList,
        placeholder: this.props.placeholder,
        inputProps: this.props.inputProps,
        allowCustomValues: this.props.allowCustomValues,
        customClasses: this.props.customClasses,
        options: this._getOptionsForTypeahead(),
        defaultValue: this.props.defaultValue,
        maxVisible: this.props.maxVisible,
        onOptionSelected: this._addTokenForValue,
        onKeyDown: this._onKeyDown,
        onKeyUp: this.props.onKeyUp,
        filterOption: this.props.filterOption })
    );
  }
});

module.exports = TypeaheadTokenizer;